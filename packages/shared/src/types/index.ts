// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Feature Brief types (as per PRD)
export interface FeatureBrief {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Common API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}