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
   * Queries the deployed Reasoning Engine through the session.
   * Since the agent doesn't have direct query methods, we'll use the session approach.
   */
  async streamQuery(request: AgentQueryRequest): Promise<any> {
    if (!this.initialized) {
      throw new Error('Vertex AI service not initialized');
    }

    // Use the streaming endpoint with ADK format
    // ADK agents use async_stream_query for streaming responses
    let apiUrl = '';
    if (process.env.VERTEX_AGENT_ENDPOINT) {
      apiUrl = `${process.env.VERTEX_AGENT_ENDPOINT}:streamQuery?alt=sse`;
    } else {
      apiUrl = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/reasoningEngines/${this.agentId}:streamQuery?alt=sse`;
    }
    
    console.log('Using streaming endpoint:', apiUrl);

    try {
      const token = await this.getAccessToken();

      // Use ADK format with async_stream_query for streaming
      const requestPayload = {
        class_method: 'async_stream_query',
        input: {
          user_id: request.userId || 'default_user',
          session_id: request.sessionId,
          message: request.prompt,
        },
      };

      console.log(`Querying Agent Engine with:
  - userId: ${request.userId}
  - sessionId: ${request.sessionId}
  - prompt: ${request.prompt}
      `);
      console.log(`Full payload:`, JSON.stringify(requestPayload, null, 2));
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

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response type:', response.type);
      console.log('Content-Type:', response.headers.get('content-type'));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);

        // Try to parse error for better debugging
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            throw new Error(
              `API error (${response.status}): ${errorJson.error.message || errorJson.error}`
            );
          }
        } catch {
          // If not JSON, use raw text
        }

        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      // Check if we're actually getting SSE or JSON response
      const contentType = response.headers.get('content-type') || '';
      console.log('Actual Content-Type received:', contentType);

      // If response is JSON instead of SSE, handle it differently
      if (contentType.includes('application/json')) {
        console.log('Received JSON response instead of SSE, parsing as JSON...');
        
        try {
          const responseText = await response.text();
          console.log('Raw response text length:', responseText.length);
          console.log('First 1500 chars of raw response:', responseText.substring(0, 1500));
          
          if (!responseText || responseText.trim() === '') {
            console.error('Empty response body received');
            return {
              response: 'Agent returned an empty response. Please check the agent configuration.',
              sessionId: request.sessionId,
            };
          }
          
          // Check if response contains multiple JSON objects (common with streaming)
          // Try to extract just the first complete JSON object
          let jsonResponse;
          
          // First, try to parse as-is
          try {
            jsonResponse = JSON.parse(responseText);
          } catch (firstError) {
            console.log('Direct parse failed, checking for multiple JSON objects...');
            
            // If direct parse fails, it might be multiple JSON objects
            // Try to find the first complete JSON object
            const lines = responseText.split('\n');
            let parsedSuccessfully = false;
            
            for (const line of lines) {
              if (line.trim()) {
                try {
                  jsonResponse = JSON.parse(line);
                  console.log('Successfully parsed line as JSON');
                  parsedSuccessfully = true;
                  break;
                } catch (lineError) {
                  // Continue to next line
                }
              }
            }
            
            if (!parsedSuccessfully) {
              // Try to extract up to the first complete JSON object
              // Look for a pattern that ends a JSON object
              const match = responseText.match(/^(\{.*?\})\s*$/ms);
              if (match) {
                try {
                  jsonResponse = JSON.parse(match[1]);
                  console.log('Extracted and parsed first JSON object');
                } catch (extractError) {
                  console.error('Failed to parse extracted JSON:', extractError);
                  throw firstError; // Re-throw original error
                }
              } else {
                throw firstError; // Re-throw original error
              }
            }
          }
          
          console.log('Parsed JSON response:', JSON.stringify(jsonResponse, null, 2).substring(0, 500));
          
          // Extract response from JSON format
          let extractedResponse = '';
          if (typeof jsonResponse === 'string') {
            extractedResponse = jsonResponse;
          } else if (jsonResponse.output) {
            extractedResponse = typeof jsonResponse.output === 'string' 
              ? jsonResponse.output 
              : JSON.stringify(jsonResponse.output);
          } else if (jsonResponse.response) {
            extractedResponse = typeof jsonResponse.response === 'string'
              ? jsonResponse.response
              : JSON.stringify(jsonResponse.response);
          } else {
            extractedResponse = JSON.stringify(jsonResponse);
          }
          
          return {
            response: extractedResponse || 'No response in JSON',
            sessionId: request.sessionId,
          };
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          // Don't try to read again - body was already consumed
          return {
            response: 'Failed to parse agent response. Check server logs for details.',
            sessionId: request.sessionId,
          };
        }
      }

      // Handle SSE streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      const events: any[] = [];
      let buffer = '';
      let finalResponse = '';
      let totalBytesRead = 0;
      const isDevelopment = process.env.NODE_ENV === 'development';

      try {
        console.log('Starting to read SSE stream...');
        let chunkCount = 0;
        
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('Stream reading complete. Total chunks:', chunkCount);
            console.log('Final buffer content:', buffer);
            break;
          }

          chunkCount++;
          const chunkSize = value ? value.length : 0;
          totalBytesRead += chunkSize;
          
          // Decode the chunk and add to buffer
          const decodedChunk = decoder.decode(value, { stream: true });
          buffer += decodedChunk;
          
          console.log(`Chunk ${chunkCount}: ${chunkSize} bytes, Total read: ${totalBytesRead} bytes`);
          console.log(`Decoded chunk content:`, decodedChunk.substring(0, 500));

          // In development, log raw buffer chunks for debugging
          if (isDevelopment) {
            console.log('Current buffer length:', buffer.length);
            console.log('Buffer contains "data:"?', buffer.includes('data:'));
            console.log('Buffer contains newlines?', buffer.includes('\n'));
            console.log('Raw buffer (first 1000 chars):', buffer.substring(0, 1000));
          }

          // Process SSE events - they are separated by double newlines
          const eventBlocks = buffer.split('\n\n');

          // Keep the last incomplete block in the buffer
          buffer = eventBlocks.pop() || '';

          // Process complete event blocks
          for (const block of eventBlocks) {
            if (!block.trim()) continue;

            // Each block may contain multiple lines (event, data, etc.)
            const lines = block.split('\n');
            let eventData = null;

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.substring(6).trim();

                // Skip [DONE] marker
                if (dataStr === '[DONE]') {
                  continue;
                }

                try {
                  eventData = JSON.parse(dataStr);
                  events.push(eventData);

                  // Log full event structure in development for debugging
                  if (isDevelopment) {
                    console.log('Full SSE event structure:', JSON.stringify(eventData, null, 2));
                  }

                  // Immediately extract text from the event
                  if (eventData) {
                    // Direct text response
                    if (typeof eventData === 'string') {
                      console.log('Found direct string response');
                      finalResponse += eventData;
                    }
                    // Check if this is the ADK agent response format with content.parts
                    else if (eventData.content && eventData.content.parts && Array.isArray(eventData.content.parts)) {
                      console.log('Found ADK content.parts structure');
                      for (const part of eventData.content.parts) {
                        if (part.text) {
                          console.log('Extracted text from part:', part.text.substring(0, 100));
                          finalResponse += part.text;
                        }
                      }
                    }
                    // ADK format: Check if the entire eventData is the output
                    else if (eventData.output !== undefined) {
                      // Handle when output is directly the response string (ADK common pattern)
                      if (typeof eventData.output === 'string') {
                        console.log('Found string in output field');
                        finalResponse += eventData.output;
                      }
                      // Handle when output is a number or boolean (convert to string)
                      else if (
                        typeof eventData.output === 'number' ||
                        typeof eventData.output === 'boolean'
                      ) {
                        console.log('Found primitive in output field:', eventData.output);
                        finalResponse += String(eventData.output);
                      }
                      // Handle structured output
                      else if (typeof eventData.output === 'object' && eventData.output !== null) {
                        // First check if it's an agent response object
                        if (eventData.output.agent && eventData.output.response) {
                          console.log('Found agent response structure');
                          finalResponse +=
                            typeof eventData.output.response === 'string'
                              ? eventData.output.response
                              : JSON.stringify(eventData.output.response);
                        }
                        // Check for text field
                        else if (eventData.output.text) {
                          console.log('Found text in output object');
                          finalResponse += eventData.output.text;
                        }
                        // Check for message field
                        else if (eventData.output.message) {
                          console.log('Found message in output object');
                          finalResponse += eventData.output.message;
                        }
                        // Check for response field
                        else if (eventData.output.response) {
                          console.log('Found response in output object');
                          finalResponse +=
                            typeof eventData.output.response === 'string'
                              ? eventData.output.response
                              : JSON.stringify(eventData.output.response);
                        }
                        // If output is an object but doesn't have expected fields,
                        // it might be the entire response as an object (like health check response)
                        else {
                          const outputStr = JSON.stringify(eventData.output);
                          if (outputStr !== '{}') {
                            console.log('Using entire output object as response');
                            finalResponse += outputStr;
                          }
                        }
                      }
                    }
                    // Check for other common fields
                    else if (eventData.response) {
                      console.log('Found response field');
                      finalResponse +=
                        typeof eventData.response === 'string'
                          ? eventData.response
                          : JSON.stringify(eventData.response);
                    } else if (eventData.text) {
                      console.log('Found text field');
                      finalResponse += eventData.text;
                    } else if (eventData.message) {
                      console.log('Found message field');
                      finalResponse += eventData.message;
                    } else if (eventData.content) {
                      console.log('Found content field');
                      if (typeof eventData.content === 'string') {
                        finalResponse += eventData.content;
                      } else if (eventData.content.text) {
                        finalResponse += eventData.content.text;
                      } else if (eventData.content.message) {
                        finalResponse += eventData.content.message;
                      }
                    }
                    // If no known fields, log the entire event for debugging
                    else if (isDevelopment) {
                      console.log('Unknown event structure, full event:', eventData);
                    }
                  }

                  if (isDevelopment) {
                    console.log(
                      'Processed SSE event (first 200 chars):',
                      JSON.stringify(eventData, null, 2).substring(0, 200)
                    );
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', dataStr.substring(0, 100));
                  if (isDevelopment) {
                    console.error('Parse error:', parseError);
                  }
                }
              }
            }
          }
        }

        // Process any remaining data in buffer
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6).trim();
              if (dataStr !== '[DONE]' && dataStr !== '') {
                try {
                  const eventData = JSON.parse(dataStr);
                  events.push(eventData);

                  // Extract text from final event
                  if (typeof eventData === 'string') {
                    finalResponse += eventData;
                  } else if (eventData.output) {
                    if (typeof eventData.output === 'string') {
                      finalResponse += eventData.output;
                    } else if (eventData.output.text) {
                      finalResponse += eventData.output.text;
                    } else if (eventData.output.message) {
                      finalResponse += eventData.output.message;
                    }
                  }
                } catch {
                  console.warn('Failed to parse final SSE data');
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      console.log(`Parsed ${events.length} SSE events`);
      if (events.length > 0) {
        console.log('All parsed events:', JSON.stringify(events, null, 2));
      }
      console.log(`Final response length: ${finalResponse.length}`);
      console.log(`Final response preview: ${finalResponse.substring(0, 500)}`);

      // If we still don't have a response, try to extract from events differently
      if (!finalResponse && events.length > 0) {
        // Try to find any text content in the events
        for (const event of events) {
          if (event && typeof event === 'object') {
            // Deep search for text content
            const findText = (obj: any): string => {
              if (typeof obj === 'string') return obj;
              if (typeof obj === 'object' && obj !== null) {
                for (const key of ['text', 'message', 'response', 'content', 'output']) {
                  if (obj[key]) {
                    const result = findText(obj[key]);
                    if (result) return result;
                  }
                }
              }
              return '';
            };

            const text = findText(event);
            if (text) {
              finalResponse += text;
            }
          }
        }
      }

      // Final fallback - return a meaningful message
      if (!finalResponse) {
        console.warn('No text response extracted from SSE events');
        if (events.length > 0) {
          console.log('Last event structure:', JSON.stringify(events[events.length - 1], null, 2));
        }
        finalResponse =
          'The agent processed your request but did not return a text response. Please check the agent configuration.';
      }

      console.log(`Successfully queried Agent Engine for session ${request.sessionId}`);
      console.log(`Final response length: ${finalResponse.length} characters`);

      return {
        response: finalResponse,
        events: events.length > 0 ? events : undefined, // Only include events if present
        sessionId: request.sessionId,
      };
    } catch (error) {
      console.error('Failed to query Agent Engine:', error);
      throw new Error(
        `Could not query agent session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
