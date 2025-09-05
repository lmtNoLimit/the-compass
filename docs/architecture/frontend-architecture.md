# Frontend Architecture

## Component Architecture

### Component Organization
```
app/
├── routes/                    # File-based routing (React Router v7)
│   ├── _index.tsx            # Home/Dashboard route
│   ├── briefs._index.tsx     # List briefs
│   ├── briefs.new.tsx        # Create new brief
│   ├── briefs.$id.tsx        # View brief detail
│   ├── briefs.$id.edit.tsx   # Edit brief
│   ├── validations.$id.tsx   # View validation
│   ├── history.tsx           # Search history
│   ├── sign-in.tsx           # Sign in page
│   └── sign-up.tsx           # Sign up page
├── components/
│   ├── ui/                    # Radix UI primitives
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── form.tsx
│   ├── features/              # Feature-specific components
│   │   ├── brief-form/
│   │   ├── validation-viewer/
│   │   └── persona-selector/
│   └── layouts/               # Layout components
│       ├── app-shell.tsx
│       └── auth-layout.tsx
├── hooks/                     # Custom React hooks
│   ├── use-validation.ts
│   └── use-export.ts
└── lib/                       # Utilities and services
    ├── api-client.ts
    └── utils.ts
```

### Component Template
```typescript
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { TextField } from "~/components/ui/text-field";
import { createBrief, updateBrief } from "~/services/briefs";
import type { FeatureBrief } from "~/types";

interface BriefFormProps {
  brief?: Partial<FeatureBrief>;
  mode: 'create' | 'edit';
}

export function BriefForm({ brief, mode }: BriefFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: mode === 'create' ? createBrief : updateBrief,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
      navigate(`/briefs/${data.id}`);
    },
  });
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate(Object.fromEntries(formData));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <TextField
        name="title"
        label="Feature Title"
        defaultValue={brief?.title}
        required
        disabled={mutation.isPending}
      />
      <Button 
        type="submit" 
        disabled={mutation.isPending}
      >
        {mode === 'create' ? 'Create Brief' : 'Update Brief'}
      </Button>
    </form>
  );
}
```

## State Management Architecture

### State Structure
```typescript
// Server state via React Query
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getJobStatus } from '~/services/jobs';

export function useJobStatus(jobId: string) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJobStatus(jobId),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'processing' ? 2000 : false;
    },
  });
}

// Global client state via Zustand
import { create } from 'zustand';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

### State Management Patterns
- React Query for server state (caching, synchronization, background updates)
- Zustand for global client state (user preferences, UI state)
- React Router loaders for initial data fetching
- React Router actions for form submissions
- useState/useReducer for local component state
- React Hook Form for complex form management

## Routing Architecture

### Route Configuration
```typescript
// app/routes.ts
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("root.tsx", [
    index("routes/_index.tsx"),
    route("briefs", "routes/briefs._index.tsx"),
    route("briefs/new", "routes/briefs.new.tsx"),
    route("briefs/:id", "routes/briefs.$id.tsx"),
    route("briefs/:id/edit", "routes/briefs.$id.edit.tsx"),
    route("validations/:id", "routes/validations.$id.tsx"),
    route("history", "routes/history.tsx"),
    route("sign-in", "routes/sign-in.tsx"),
    route("sign-up", "routes/sign-up.tsx"),
  ]),
] satisfies RouteConfig;
```

### Protected Route Pattern
```typescript
import { Navigate, Outlet } from "react-router";
import { useAuth } from "@clerk/react-router";

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }
  
  return <Outlet />;
}

// Alternative using Clerk components
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
```

## Frontend Services Layer

### API Client Setup
```typescript
import { useAuth } from '@clerk/react-router';
import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(async (config) => {
  // Get token from Clerk
  const token = await window.Clerk?.session?.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to sign in
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Service Example
```typescript
import apiClient from '~/lib/api-client';
import type { FeatureBrief, FeatureBriefInput } from '~/types';

// Briefs service with React Query integration
export const briefsService = {
  async create(data: FeatureBriefInput): Promise<FeatureBrief> {
    const response = await apiClient.post('/feature-briefs', data);
    return response.data;
  },
  
  async getById(id: string): Promise<FeatureBrief> {
    const response = await apiClient.get(`/feature-briefs/${id}`);
    return response.data;
  },
  
  async update(id: string, data: Partial<FeatureBriefInput>): Promise<FeatureBrief> {
    const response = await apiClient.put(`/feature-briefs/${id}`, data);
    return response.data;
  },
  
  async validate(briefId: string, personaId: string): Promise<{ validationId: string }> {
    const response = await apiClient.post(`/feature-briefs/${briefId}/validate`, { personaId });
    return response.data;
  },
};

// React Query hooks
export function useBrief(id: string) {
  return useQuery({
    queryKey: ['briefs', id],
    queryFn: () => briefsService.getById(id),
  });
}

export function useCreateBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: briefsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
    },
  });
}
```
