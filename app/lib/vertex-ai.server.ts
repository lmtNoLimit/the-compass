/**
 * Vertex AI Server Configuration Module
 *
 * This module provides server-side utilities for communicating with deployed
 * Vertex AI Reasoning Engines (Agent Engine).
 */

// This library is needed to get an authentication token for API calls
import { GoogleAuth } from 'google-auth-library';

// Request type for querying a session
export interface AgentQueryRequest {
  sessionId: string;
  prompt: string;
  userId?: string;
}

export class VertexAIService {
  private projectId: string;
  private location: string;
  private agentId: string;
  private auth: GoogleAuth;
  private initialized: boolean = false;

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
    this.location = process.env.GOOGLE_CLOUD_REGION || 'us-central1';
    this.agentId = process.env.VERTEX_AGENT_ID || '';

    if (!this.projectId || !this.agentId) {
      throw new Error(
        'Both GOOGLE_CLOUD_PROJECT_ID and VERTEX_AGENT_ID environment variables are required.'
      );
    }

    // Initialize Google Auth
    try {
      // Check if we have service account credentials in environment
      const keyJson = process.env.GOOGLE_CLOUD_KEY_JSON;
      if (keyJson) {
        // Parse and use the service account key
        const credentials = JSON.parse(keyJson);
        this.auth = new GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
      } else {
        // Use default credentials (ADC)
        this.auth = new GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
      }
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      // Fallback to default auth
      this.auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    }

    this.initialized = true;
    console.log('VertexAIService (Agent Engine) initialized successfully.');
  }

  /**
   * Helper function to get a valid OAuth 2.0 access token.
   */
  private async getAccessToken(): Promise<string> {
    const client = await this.auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) {
      throw new Error('Failed to retrieve access token.');
    }
    return token.token;
  }

  /**
   * Creates a session for the deployed Agent Engine.
   * For Agent Engines with AdkApp, we need to create remote sessions.
   */
  async createAgentSession(userId: string = 'default_user'): Promise<{ sessionId: string }> {
    if (!this.initialized) {
      throw new Error('Vertex AI service not initialized');
    }

    // For Agent Engines with AdkApp, create a remote session using create_session method
    try {
      const apiUrl = `${process.env.VERTEX_AGENT_ENDPOINT}`;
      const token = await this.getAccessToken();

      const createSessionPayload = {
        class_method: 'async_create_session',
        input: {
          user_id: userId,
        },
      };

      console.log(
        'Creating Agent Engine session with payload:',
        JSON.stringify(createSessionPayload, null, 2)
      );

      const response = await fetch(`${apiUrl}:query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createSessionPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to create session: ${response.status}: ${errorText}`);
        throw new Error(`Failed to create session: ${response.status}`);
      }

      const result = await response.json();
      console.log('Session creation response:', JSON.stringify(result, null, 2));

      // Extract session ID from the response
      let sessionId = '';
      if (result.output && result.output.id) {
        // Agent Engine returns session ID in output.id
        sessionId = String(result.output.id);
      } else if (result.output && result.output.session_id) {
        sessionId = String(result.output.session_id);
      } else if (result.session_id) {
        sessionId = String(result.session_id);
      } else if (result.id) {
        // Sometimes just 'id' at root level
        sessionId = String(result.id);
      } else if (result.output && typeof result.output === 'string') {
        // Sometimes the session ID might be in a string format
        sessionId = result.output;
      } else {
        // Fallback: generate client-side session ID
        sessionId = `session_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.warn('Could not extract session ID from response, using client-generated ID');
      }

      console.log(`Created Agent Engine session: ${sessionId}`);
      return { sessionId };
    } catch (error) {
      console.error('Failed to create Agent Engine session:', error);
      // Fallback to client-generated session ID
      const sessionId = `session_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`Falling back to client-generated session ID: ${sessionId}`);
      return { sessionId };
    }
  }

  /**
   * Streams a query to the deployed Reasoning Engine.
   * Uses the proper Vertex AI Reasoning Engines API format with async_stream_query.
   */
  async streamQuery(request: AgentQueryRequest): Promise<any> {
    if (!this.initialized) {
      throw new Error('Vertex AI service not initialized');
    }

    // Vertex AI Agent Engine query endpoint for ADK agents with SSE streaming
    const apiUrl = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/reasoningEngines/${this.agentId}:streamQuery?alt=sse`;

    try {
      const token = await this.getAccessToken();

      // Prepare the request payload matching the exact curl format
      const requestPayload = {
        class_method: 'async_stream_query',
        input: {
          user_id: request.userId || 'default_user',
          session_id: request.sessionId,
          message: request.prompt,
        },
      };

      console.log(`Querying Agent Engine with payload:`, JSON.stringify(requestPayload, null, 2));
      console.log(`API URL: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream', // Explicitly accept SSE
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      // Handle SSE streaming response using ReadableStream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      const events: any[] = [];
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Split buffer by newlines to process complete SSE events
          const lines = buffer.split('\n');
          
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';
          
          // Process complete lines
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.substring(6));
                events.push(eventData);
                console.log('Received SSE event:', JSON.stringify(eventData, null, 2));
              } catch (e) {
                // Check if it's [DONE] or other non-JSON data
                const dataContent = line.substring(6).trim();
                if (dataContent !== '[DONE]' && dataContent !== '') {
                  console.warn('Failed to parse SSE event:', line);
                }
              }
            }
          }
        }
        
        // Process any remaining data in buffer
        if (buffer.trim() && buffer.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(buffer.substring(6));
            events.push(eventData);
          } catch (e) {
            const dataContent = buffer.substring(6).trim();
            if (dataContent !== '[DONE]' && dataContent !== '') {
              console.warn('Failed to parse final SSE event:', buffer);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      console.log(`Parsed ${events.length} SSE events`);

      // Extract the final response from events
      let finalResponse = '';
      let fullOutput = {};

      // Process all events to build the complete response
      for (const event of events) {
        if (event.output) {
          if (typeof event.output === 'string') {
            finalResponse += event.output;
          } else if (event.output.text) {
            finalResponse += event.output.text;
          } else if (event.output.message) {
            finalResponse += event.output.message;
          } else if (event.output.response) {
            finalResponse += typeof event.output.response === 'string' 
              ? event.output.response 
              : JSON.stringify(event.output.response);
          } else {
            // Store structured output
            fullOutput = { ...fullOutput, ...event.output };
          }
        } else if (event.response) {
          finalResponse +=
            typeof event.response === 'string' ? event.response : JSON.stringify(event.response);
        } else if (event.text) {
          finalResponse += event.text;
        } else if (event.message) {
          finalResponse += event.message;
        } else if (event.content) {
          // Handle content field (common in SSE responses)
          if (typeof event.content === 'string') {
            finalResponse += event.content;
          } else if (event.content.text) {
            finalResponse += event.content.text;
          } else if (event.content.message) {
            finalResponse += event.content.message;
          }
        }
      }

      // If no text response was found, use the structured output
      if (!finalResponse && Object.keys(fullOutput).length > 0) {
        finalResponse = JSON.stringify(fullOutput, null, 2);
      }

      // If still no response, return the raw events for debugging
      if (!finalResponse && events.length > 0) {
        console.log('No text found in events, returning last event');
        finalResponse = JSON.stringify(events[events.length - 1], null, 2);
      }

      console.log(`Successfully queried Agent Engine for session ${request.sessionId}`);
      console.log(`Final response length: ${finalResponse.length} characters`);

      return {
        response: finalResponse || 'No response generated',
        events: events, // Include all events for debugging
        sessionId: request.sessionId,
      };
    } catch (error) {
      console.error('Failed to query Agent Engine:', error);
      throw new Error(`Could not query agent session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getMode(): string {
    return 'Agent Engine';
  }
}

// Export a singleton instance
let vertexAIInstance: VertexAIService | null = null;

export function getVertexAIService(): VertexAIService {
  if (!vertexAIInstance) {
    vertexAIInstance = new VertexAIService();
  }
  return vertexAIInstance;
}
