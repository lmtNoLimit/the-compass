// Type definitions for the web app
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureBrief {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'review' | 'approved' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// Vertex AI Agent Types
export interface AIAgentRequest {
  prompt: string;
  context?: Record<string, any>;
  agentName?: string;
  parameters?: Record<string, any>;
}

export interface AIAgentResponse {
  agent: string;
  version: string;
  timestamp: string;
  response: string;
  status: 'success' | 'error';
  metadata?: Record<string, any>;
  error?: string;
}

export interface VertexAIHealthCheck {
  success: boolean;
  message: string;
  details?: {
    projectId: string;
    location: string;
    testResponse?: string;
    error?: string;
  };
}

// Multi-Agent Support Types
export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error'
}

export interface AgentMetadata {
  modelType?: string;
  maxTokens?: number;
  responseTime?: number;
  supportedLanguages?: string[];
  customConfig?: Record<string, any>;
  category?: 'general' | 'specialized' | 'enterprise' | 'demo' | 'experimental';
  priority?: number;
  icon?: string;
  enabled?: boolean;
}

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  endpoint?: string;
  capabilities: string[];
  projectId?: string;
  location?: string;
  version?: string;
  lastUpdated?: Date;
  metadata?: AgentMetadata;
}

export interface AgentListResponse {
  agents: AgentInfo[];
  timestamp: Date;
  cached: boolean;
  totalCount: number;
}

export interface SelectionContext {
  source: 'chat' | 'agents-page' | 'quick-switch';
  sessionId?: string;
  preserveHistory: boolean;
}

export interface AgentSelectionEvent {
  agentId: string;
  previousAgentId?: string;
  userId: string;
  timestamp: Date;
  context?: SelectionContext;
}

export interface AgentSelectionRequest {
  agentId: string;
  context?: SelectionContext;
}

export interface AgentSelectionResponse {
  success: boolean;
  agent: AgentInfo;
  previousAgent?: AgentInfo;
  timestamp: Date;
}

export interface RefreshResponse {
  success: boolean;
  totalAgents: number;
  newAgents: number;
  timestamp: Date;
  cached: boolean;
}

export interface AgentListCache {
  data: AgentInfo[];
  timestamp: Date;
  ttl: number;
  hash: string;
}

export interface ChatSession {
  sessionId: string;
  userId: string;
  agentId: string;
  title?: string;
  createdAt: Date;
  lastMessageAt: Date;
  messageCount: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    agentId: string;
    processingTime?: number;
    tokenCount?: number;
  };
}
