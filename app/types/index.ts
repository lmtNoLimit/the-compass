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
