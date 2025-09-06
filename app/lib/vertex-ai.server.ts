/**
 * Vertex AI Server Configuration Module
 * 
 * This module provides server-side configuration and utilities for
 * communicating with deployed AI agents on Google Vertex AI.
 */

import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';

// Define types for agent communication
export interface AgentRequest {
  prompt: string;
  context?: Record<string, any>;
  agentName?: string;
  parameters?: Record<string, any>;
}

export interface AgentResponse {
  agent: string;
  version: string;
  timestamp: string;
  response: string;
  status: 'success' | 'error';
  metadata?: Record<string, any>;
  error?: string;
}

export interface VertexAIConfig {
  projectId: string;
  location: string;
  credentials?: string;
}

/**
 * VertexAIService class for managing connections to deployed agents
 */
export class VertexAIService {
  private client: VertexAI;
  private projectId: string;
  private location: string;
  private initialized: boolean = false;

  constructor(config?: Partial<VertexAIConfig>) {
    this.projectId = config?.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID || '';
    this.location = config?.location || process.env.GOOGLE_CLOUD_REGION || 'us-central1';

    if (!this.projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID is required for Vertex AI');
    }

    // Initialize Vertex AI client
    this.initializeClient();
  }

  /**
   * Initialize the Vertex AI client with proper authentication
   */
  private initializeClient(): void {
    try {
      // Check for service account credentials
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const credentialsJson = process.env.GOOGLE_CLOUD_KEY_JSON;

      if (credentialsJson) {
        // Parse JSON credentials if provided directly
        const credentials = JSON.parse(credentialsJson);
        process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON.stringify(credentials);
      } else if (!credentialsPath) {
        console.warn('No Google Cloud credentials found. Using application default credentials.');
      }

      this.client = new VertexAI({
        project: this.projectId,
        location: this.location,
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Vertex AI client:', error);
      throw new Error(`Vertex AI initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test the connection to Vertex AI
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.initialized) {
      return {
        success: false,
        message: 'Vertex AI client not initialized',
      };
    }

    try {
      // Try to get a simple model to test connectivity
      const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Send a simple test prompt
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello, this is a connection test. Please respond with "Connection successful".' }] }],
      });

      const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

      return {
        success: true,
        message: 'Vertex AI connection successful',
        details: {
          projectId: this.projectId,
          location: this.location,
          testResponse: response,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          projectId: this.projectId,
          location: this.location,
          error: error instanceof Error ? error.toString() : 'Unknown error',
        },
      };
    }
  }

  /**
   * Call a deployed agent on Vertex AI
   * Note: This is a placeholder for actual agent communication
   * In production, this would call the deployed agent endpoint
   */
  async callAgent(request: AgentRequest): Promise<AgentResponse> {
    if (!this.initialized) {
      return {
        agent: request.agentName || 'unknown',
        version: '0.0.0',
        timestamp: new Date().toISOString(),
        response: '',
        status: 'error',
        error: 'Vertex AI client not initialized',
      };
    }

    try {
      // For now, we'll use a generative model as a placeholder
      // In production, this would call the actual deployed agent endpoint
      const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Acting as a test agent, please respond to this prompt: ${request.prompt}`;
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

      return {
        agent: request.agentName || 'test-agent',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        response: responseText,
        status: 'success',
        metadata: {
          projectId: this.projectId,
          location: this.location,
          context: request.context,
        },
      };
    } catch (error) {
      return {
        agent: request.agentName || 'unknown',
        version: '0.0.0',
        timestamp: new Date().toISOString(),
        response: '',
        status: 'error',
        error: `Agent call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): VertexAIConfig {
    return {
      projectId: this.projectId,
      location: this.location,
    };
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
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