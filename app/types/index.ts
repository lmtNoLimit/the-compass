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
