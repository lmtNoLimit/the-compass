export interface User {
    id: string;
    email: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface FeatureBrief {
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'active' | 'completed' | 'archived';
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
//# sourceMappingURL=index.d.ts.map