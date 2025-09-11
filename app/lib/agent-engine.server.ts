/**
 * Agent Engine Server Module
 *
 * This module provides server-side utilities for communicating with deployed
 * Vertex AI Agent Engines (Reasoning Engines) with session management.
 */

// This library is needed to get an authentication token for API calls
import { GoogleAuth } from 'google-auth-library';
import type { AgentInfo, AgentListResponse, AgentListCache } from '~/types';
import { AgentStatus } from '~/types';
import { validateAgentMetadata, type AgentMetadataConfig } from './agent-metadata-validator';
import * as fs from 'fs';
import * as path from 'path';

// Request type for querying a session
export interface AgentQueryRequest {
  sessionId: string;
  prompt: string;
  userId?: string;
  agentId?: string;
}

// Agent configuration interface
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  endpoint?: string;
  projectId?: string;
  location?: string;
  capabilities: string[];
}

export class AgentEngineService {
  private projectId: string;
  private location: string;
  private defaultAgentId: string;
  private auth: GoogleAuth;
  private initialized: boolean = false;
  private agents: Map<string, AgentInfo> = new Map();
  private agentCache: AgentListCache | null = null;
  private metadataConfig: AgentMetadataConfig | null = null;

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
    this.location = process.env.GOOGLE_CLOUD_REGION || 'us-central1';
    this.defaultAgentId = process.env.VERTEX_AGENT_ID || '';

    if (!this.projectId || !this.defaultAgentId) {
      throw new Error(
        'Both GOOGLE_CLOUD_PROJECT_ID and VERTEX_AGENT_ID environment variables are required.'
      );
    }

    // Load agent metadata configuration
    this.loadAgentMetadata();

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
    console.log('AgentEngineService initialized successfully.');
    console.log(`Registered ${this.agents.size} agents`);
  }

  /**
   * Load agent metadata configuration from file
   */
  private loadAgentMetadata(): void {
    try {
      const metadataPath = path.join(process.cwd(), 'app', 'config', 'agent-metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
        const rawConfig = JSON.parse(metadataContent);
        this.metadataConfig = validateAgentMetadata(rawConfig);
        console.log(`Loaded metadata for ${Object.keys(this.metadataConfig.agents).length} agents`);
      } else {
        console.warn('Agent metadata configuration not found, using defaults');
        this.metadataConfig = {
          agents: {},
          defaults: {
            fallbackName: 'Vertex AI Agent',
            fallbackDescription: 'An AI agent deployed in Vertex AI Agent Engine',
            fallbackCapabilities: ['general-purpose'],
          },
        };
      }
    } catch (error) {
      console.error('Failed to load agent metadata:', error);
      this.metadataConfig = {
        agents: {},
        defaults: {
          fallbackName: 'Vertex AI Agent',
          fallbackDescription: 'An AI agent deployed in Vertex AI Agent Engine',
          fallbackCapabilities: ['general-purpose'],
        },
      };
    }
  }

  /**
   * Discover agents dynamically from Vertex AI Agent Engine
   */
  private async discoverAgentsFromVertexAI(): Promise<AgentConfig[]> {
    try {
      const token = await this.getAccessToken();

      // Use Vertex AI Agent Engine API to list deployed agents
      const listUrl = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/reasoningEngines`;

      const response = await fetch(listUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Failed to list agents from Vertex AI: ${response.status}`);
        return this.getFallbackAgents();
      }

      const data = await response.json();
      console.log('agents', data)
      const agents: AgentConfig[] = [];

      if (data.reasoningEngines && Array.isArray(data.reasoningEngines)) {
        for (const engine of data.reasoningEngines) {
          // Extract agent ID from the name (format: projects/{project}/locations/{location}/reasoningEngines/{id})
          const nameParts = engine.name?.split('/') || [];
          const agentId = nameParts[nameParts.length - 1];

          if (agentId) {
            agents.push({
              id: agentId,
              name: engine.displayName || `Agent ${agentId}`,
              description: engine.description || 'Vertex AI Reasoning Engine',
              projectId: this.projectId,
              location: this.location,
              capabilities: ['reasoning', 'query'],
              endpoint: this.constructAgentEndpoint(agentId),
            });
          }
        }
      }

      return agents.length > 0 ? agents : this.getFallbackAgents();
    } catch (error) {
      console.error('Error discovering agents from Vertex AI:', error);
      return this.getFallbackAgents();
    }
  }

  /**
   * Get fallback agents when Vertex AI discovery fails
   */
  private getFallbackAgents(): AgentConfig[] {
    const fallbackAgents: AgentConfig[] = [];

    // Include default agent if configured
    if (this.defaultAgentId) {
      fallbackAgents.push({
        id: this.defaultAgentId,
        name: 'Demo Agent',
        description: 'Demo health check agent for testing',
        endpoint: process.env.VERTEX_AGENT_ENDPOINT,
        projectId: this.projectId,
        location: this.location,
        capabilities: ['health-check', 'basic-query'],
      });
    }

    return fallbackAgents;
  }

  /**
   * Construct agent endpoint URL
   */
  private constructAgentEndpoint(agentId: string): string {
    return `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/reasoningEngines/${agentId}`;
  }

  /**
   * Merge Vertex AI agents with metadata configuration
   */
  private mergeAgentsWithMetadata(vertexAgents: AgentConfig[]): AgentInfo[] {
    const mergedAgents: AgentInfo[] = [];
    const processedIds = new Set<string>();

    // Process agents from Vertex AI first
    for (const vertexAgent of vertexAgents) {
      const metadata = this.metadataConfig?.agents[vertexAgent.id];
      const defaults = this.metadataConfig?.defaults;

      const agentInfo: AgentInfo = {
        id: vertexAgent.id,
        name: metadata?.name || vertexAgent.name || defaults?.fallbackName || 'Unnamed Agent',
        description:
          metadata?.description ||
          vertexAgent.description ||
          defaults?.fallbackDescription ||
          'AI Agent',
        status: AgentStatus.ACTIVE, // Will be validated by health check
        capabilities: metadata?.capabilities ||
          vertexAgent.capabilities ||
          defaults?.fallbackCapabilities || ['general'],
        endpoint: vertexAgent.endpoint,
        projectId: vertexAgent.projectId,
        location: vertexAgent.location,
        lastUpdated: new Date(),
        metadata: {
          category: metadata?.category || 'general',
          priority: metadata?.priority || 999,
          icon: metadata?.icon,
          enabled: metadata?.enabled !== false,
          ...metadata,
        },
      };

      if (agentInfo.metadata?.enabled !== false) {
        mergedAgents.push(agentInfo);
        processedIds.add(vertexAgent.id);
      }
    }

    // Add metadata-only agents that weren't found in Vertex AI
    if (this.metadataConfig?.agents) {
      for (const [agentId, metadata] of Object.entries(this.metadataConfig.agents)) {
        if (!processedIds.has(agentId) && metadata.enabled !== false) {
          const agentInfo: AgentInfo = {
            id: agentId,
            name: metadata.name,
            description: metadata.description,
            status: AgentStatus.INACTIVE, // Not deployed in Vertex AI
            capabilities: metadata.capabilities,
            endpoint: this.constructAgentEndpoint(agentId),
            projectId: this.projectId,
            location: this.location,
            lastUpdated: new Date(),
            metadata: {
              category: metadata.category || 'general',
              priority: metadata.priority || 999,
              icon: metadata.icon,
              ...metadata,
              enabled: metadata.enabled !== false,
            },
          };

          mergedAgents.push(agentInfo);
        }
      }
    }

    // Sort by priority (lower numbers first)
    mergedAgents.sort((a, b) => {
      const priorityA = a.metadata?.priority || 999;
      const priorityB = b.metadata?.priority || 999;
      return priorityA - priorityB;
    });

    return mergedAgents;
  }

  /**
   * Perform health check on agents
   */
  private async healthCheckAgents(agents: AgentInfo[]): Promise<AgentInfo[]> {
    const healthCheckedAgents = [...agents];

    for (let i = 0; i < healthCheckedAgents.length; i++) {
      const agent = healthCheckedAgents[i];

      if (agent.endpoint) {
        try {
          // Perform lightweight health check
          const token = await this.getAccessToken();
          const healthCheckPayload = {
            class_method: 'health_check',
            input: {},
          };

          const response = await fetch(`${agent.endpoint}:query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(healthCheckPayload),
          });

          healthCheckedAgents[i] = {
            ...agent,
            status: response.ok ? AgentStatus.ACTIVE : AgentStatus.ERROR,
            lastUpdated: new Date(),
          };
        } catch (error) {
          console.warn(`Health check failed for agent ${agent.id}:`, error);
          healthCheckedAgents[i] = {
            ...agent,
            status: AgentStatus.ERROR,
            lastUpdated: new Date(),
          };
        }
      }
    }

    return healthCheckedAgents;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.agentCache) return false;

    const now = Date.now();
    const cacheAge = now - this.agentCache.timestamp.getTime();
    const ttlMs = this.agentCache.ttl * 1000;

    return cacheAge < ttlMs;
  }

  /**
   * Update agent cache
   */
  private updateCache(agents: AgentInfo[]): void {
    const hash = this.generateCacheHash(agents);
    this.agentCache = {
      data: agents,
      timestamp: new Date(),
      ttl: 300, // 5 minutes
      hash,
    };
  }

  /**
   * Generate cache hash for invalidation
   */
  private generateCacheHash(agents: AgentInfo[]): string {
    const dataString = JSON.stringify(
      agents.map((a) => ({ id: a.id, name: a.name, status: a.status }))
    );
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Get list of available agents with dynamic discovery
   */
  async getAvailableAgents(forceRefresh: boolean = false): Promise<AgentListResponse> {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid() && this.agentCache) {
      return {
        agents: this.agentCache.data,
        timestamp: this.agentCache.timestamp,
        cached: true,
        totalCount: this.agentCache.data.length,
      };
    }

    try {
      console.log('Discovering agents dynamically...');

      // Step 1: Discover agents from Vertex AI
      const vertexAgents = await this.discoverAgentsFromVertexAI();
      console.log(`Discovered ${vertexAgents.length} agents from Vertex AI`);

      // Step 2: Merge with metadata configuration
      const mergedAgents = this.mergeAgentsWithMetadata(vertexAgents);
      console.log(`Merged ${mergedAgents.length} agents with metadata`);

      // Step 3: Perform health checks (in parallel for better performance)
      const healthCheckedAgents = await this.healthCheckAgents(mergedAgents);
      console.log(`Health checked ${healthCheckedAgents.length} agents`);

      // Step 4: Store agents in the agents map for retrieval
      this.agents.clear();
      for (const agent of healthCheckedAgents) {
        this.agents.set(agent.id, agent);
      }

      // Step 5: Update cache
      this.updateCache(healthCheckedAgents);

      return {
        agents: healthCheckedAgents,
        timestamp: new Date(),
        cached: false,
        totalCount: healthCheckedAgents.length,
      };
    } catch (error) {
      console.error('Failed to get available agents:', error);

      // Fallback to cached data if available
      if (this.agentCache) {
        console.log('Falling back to cached data');
        return {
          agents: this.agentCache.data,
          timestamp: this.agentCache.timestamp,
          cached: true,
          totalCount: this.agentCache.data.length,
        };
      }

      // Final fallback - return metadata-only agents
      const fallbackAgents = this.metadataConfig?.agents
        ? Object.entries(this.metadataConfig.agents)
            .filter(([_, metadata]) => metadata.enabled !== false)
            .map(([agentId, metadata]) => ({
              id: agentId,
              name: metadata.name,
              description: metadata.description,
              status: AgentStatus.INACTIVE,
              capabilities: metadata.capabilities,
              lastUpdated: new Date(),
              metadata: {
                category: metadata.category || 'general',
                priority: metadata.priority || 999,
                icon: metadata.icon,
                enabled: metadata.enabled !== false,
              },
            }))
        : [];

      return {
        agents: fallbackAgents,
        timestamp: new Date(),
        cached: false,
        totalCount: fallbackAgents.length,
      };
    }
  }

  /**
   * Get specific agent by ID
   */
  async getAgentById(agentId: string): Promise<AgentInfo | null> {
    const agentList = await this.getAvailableAgents();
    return agentList.agents.find((agent) => agent.id === agentId) || null;
  }

  /**
   * Refresh agent cache
   */
  async refreshAgents(): Promise<{
    success: boolean;
    totalAgents: number;
    newAgents: number;
    timestamp: Date;
    cached: boolean;
  }> {
    try {
      const previousCount = this.agentCache?.data.length || 0;
      const refreshedList = await this.getAvailableAgents(true);
      const newCount = refreshedList.totalCount;

      return {
        success: true,
        totalAgents: newCount,
        newAgents: Math.max(0, newCount - previousCount),
        timestamp: new Date(),
        cached: false,
      };
    } catch (error) {
      console.error('Failed to refresh agents:', error);
      return {
        success: false,
        totalAgents: 0,
        newAgents: 0,
        timestamp: new Date(),
        cached: false,
      };
    }
  }

  /**
   * Get agent configuration by ID
   */
  private getAgentConfig(agentId?: string): AgentInfo {
    const id = agentId || 'demo-agent';
    const config = this.agents.get(id);

    if (!config) {
      console.warn(`Agent ${id} not found, falling back to demo-agent`);
      return this.agents.get('demo-agent')!;
    }

    return config;
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
  async createSession(
    userId: string = 'default_user',
    agentId?: string
  ): Promise<{ sessionId: string }> {
    if (!this.initialized) {
      throw new Error('Agent Engine service not initialized');
    }

    // Get agent configuration
    const agentConfig = this.getAgentConfig(agentId);

    // For Agent Engines with AdkApp, create a remote session using create_session method
    try {
      const apiUrl = agentConfig.endpoint || process.env.VERTEX_AGENT_ENDPOINT;
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

      console.log(`Created Agent Engine session for ${agentConfig.name}: ${sessionId}`);
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
   * List all sessions for a user and optionally filter by agent
   */
  async listSessions(
    userId: string,
    agentId?: string
  ): Promise<{ sessions: Array<{ sessionId: string; agentId: string; createdAt: string }> }> {
    if (!this.initialized) {
      throw new Error('Agent Engine service not initialized');
    }

    const agentConfig = this.getAgentConfig(agentId);

    try {
      const apiUrl = agentConfig.endpoint || process.env.VERTEX_AGENT_ENDPOINT;
      const token = await this.getAccessToken();

      const listSessionsPayload = {
        class_method: 'async_list_sessions',
        input: {
          user_id: userId,
        },
      };

      console.log('Listing sessions with payload:', JSON.stringify(listSessionsPayload, null, 2));

      const response = await fetch(`${apiUrl}:query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(listSessionsPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to list sessions: ${response.status}: ${errorText}`);
        // Return empty list on error instead of throwing
        return { sessions: [] };
      }

      const result = await response.json();
      console.log('List sessions response:', JSON.stringify(result, null, 2));

      // Extract sessions from response
      let sessions = [];
      if (result.output && Array.isArray(result.output)) {
        sessions = result.output;
      } else if (result.output && result.output.sessions) {
        sessions = result.output.sessions;
      } else if (result.sessions) {
        sessions = result.sessions;
      }

      return { sessions };
    } catch (error) {
      console.error('Failed to list sessions:', error);
      // Return empty list on error
      return { sessions: [] };
    }
  }

  /**
   * Get details of a specific session
   */
  async getSession(
    sessionId: string,
    userId: string,
    agentId?: string
  ): Promise<{ session: any | null }> {
    if (!this.initialized) {
      throw new Error('Agent Engine service not initialized');
    }

    const agentConfig = this.getAgentConfig(agentId);

    try {
      const apiUrl = agentConfig.endpoint || process.env.VERTEX_AGENT_ENDPOINT;
      const token = await this.getAccessToken();

      const getSessionPayload = {
        class_method: 'async_get_session',
        input: {
          session_id: sessionId,
          user_id: userId,
        },
      };

      console.log('Getting session with payload:', JSON.stringify(getSessionPayload, null, 2));

      const response = await fetch(`${apiUrl}:query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(getSessionPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get session: ${response.status}: ${errorText}`);
        return { session: null };
      }

      const result = await response.json();
      console.log('Get session response:', JSON.stringify(result, null, 2));

      // Extract session from response
      let session = null;
      if (result.output) {
        session = result.output;
      } else if (result.session) {
        session = result.session;
      }

      return { session };
    } catch (error) {
      console.error('Failed to get session:', error);
      return { session: null };
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(
    sessionId: string,
    userId: string,
    agentId?: string
  ): Promise<{ success: boolean; message?: string }> {
    if (!this.initialized) {
      throw new Error('Agent Engine service not initialized');
    }

    const agentConfig = this.getAgentConfig(agentId);

    try {
      const apiUrl = agentConfig.endpoint || process.env.VERTEX_AGENT_ENDPOINT;
      const token = await this.getAccessToken();

      const deleteSessionPayload = {
        class_method: 'async_delete_session',
        input: {
          session_id: sessionId,
          user_id: userId,
        },
      };

      console.log('Deleting session with payload:', JSON.stringify(deleteSessionPayload, null, 2));

      const response = await fetch(`${apiUrl}:query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(deleteSessionPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to delete session: ${response.status}: ${errorText}`);
        return { success: false, message: `Failed to delete session: ${response.status}` };
      }

      const result = await response.json();
      console.log('Delete session response:', JSON.stringify(result, null, 2));

      // Check if deletion was successful
      const success = result.output?.success || result.success || true;
      const message = result.output?.message || result.message || 'Session deleted successfully';

      return { success, message };
    } catch (error) {
      console.error('Failed to delete session:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Queries the deployed Reasoning Engine through the session.
   * Since the agent doesn't have direct query methods, we'll use the session approach.
   */
  async streamQuery(request: AgentQueryRequest): Promise<any> {
    if (!this.initialized) {
      throw new Error('Agent Engine service not initialized');
    }

    // Get agent configuration
    const agentConfig = this.getAgentConfig(request.agentId);

    // Use the streaming endpoint with ADK format
    // ADK agents use async_stream_query for streaming responses
    let apiUrl = '';
    if (agentConfig.endpoint) {
      apiUrl = `${agentConfig.endpoint}:streamQuery?alt=sse`;
    } else if (process.env.VERTEX_AGENT_ENDPOINT) {
      apiUrl = `${process.env.VERTEX_AGENT_ENDPOINT}:streamQuery?alt=sse`;
    } else {
      apiUrl = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/reasoningEngines/${agentConfig.id}:streamQuery?alt=sse`;
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

      console.log(`Querying ${agentConfig.name} with:
  - userId: ${request.userId}
  - sessionId: ${request.sessionId}
  - agentId: ${agentConfig.id}
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
                  console.log(lineError);
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

          console.log(
            'Parsed JSON response:',
            JSON.stringify(jsonResponse, null, 2).substring(0, 500)
          );

          // Extract response from JSON format
          let extractedResponse = '';
          if (typeof jsonResponse === 'string') {
            extractedResponse = jsonResponse;
          } else if (jsonResponse.output) {
            extractedResponse =
              typeof jsonResponse.output === 'string'
                ? jsonResponse.output
                : JSON.stringify(jsonResponse.output);
          } else if (jsonResponse.response) {
            extractedResponse =
              typeof jsonResponse.response === 'string'
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

          console.log(
            `Chunk ${chunkCount}: ${chunkSize} bytes, Total read: ${totalBytesRead} bytes`
          );
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
                    else if (
                      eventData.content &&
                      eventData.content.parts &&
                      Array.isArray(eventData.content.parts)
                    ) {
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
let agentEngineInstance: AgentEngineService | null = null;

export function getAgentEngineService(): AgentEngineService {
  if (!agentEngineInstance) {
    agentEngineInstance = new AgentEngineService();
  }
  return agentEngineInstance;
}

// Backward compatibility export (deprecated)
export function getVertexAIService(): AgentEngineService {
  console.warn('getVertexAIService is deprecated. Use getAgentEngineService instead.');
  return getAgentEngineService();
}
