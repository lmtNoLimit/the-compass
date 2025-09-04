# Frontend Architecture

## Component Architecture

### Component Organization
```
app/
├── routes/                    # Remix routes (file-based routing)
│   ├── _index.tsx             # Dashboard/home
│   ├── briefs/
│   │   ├── new.tsx            # Create new brief
│   │   ├── $id.tsx            # View brief
│   │   └── $id.edit.tsx       # Edit brief
│   ├── validations/
│   │   ├── $id.tsx            # View validation
│   │   └── $id.export.tsx     # Export handler
│   ├── history.tsx            # Search history
│   └── api/                   # API routes
│       └── webhooks/
│           └── clerk.tsx       # Clerk webhooks
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
import { Form, useSubmit, useNavigation } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { TextField } from "~/components/ui/text-field";
import type { FeatureBrief } from "~/types";

interface BriefFormProps {
  brief?: Partial<FeatureBrief>;
  mode: 'create' | 'edit';
}

export function BriefForm({ brief, mode }: BriefFormProps) {
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <Form method="post" className="space-y-6">
      <TextField
        name="title"
        label="Feature Title"
        defaultValue={brief?.title}
        required
        disabled={isSubmitting}
      />
      <Button 
        type="submit" 
        disabled={isSubmitting}
      >
        {mode === 'create' ? 'Create Brief' : 'Update Brief'}
      </Button>
    </Form>
  );
}
```

## State Management Architecture

### State Structure
```typescript
// Server state via loaders/actions
export const loader = async ({ params }: LoaderArgs) => {
  const job = await getJobStatus(params.jobId);
  return json({ 
    status: job.status,
    progress: job.progress,
    result: job.result 
  });
};

// Component consumption
const { status, progress } = useLoaderData<typeof loader>();
const revalidator = useRevalidator();

useEffect(() => {
  if (status === 'processing') {
    const interval = setInterval(() => {
      revalidator.revalidate();
    }, 2000);
    return () => clearInterval(interval);
  }
}, [status, revalidator]);
```

### State Management Patterns
- Remix loaders for server state
- Remix actions for mutations
- useLoaderData for consuming data
- useFetcher for non-navigation mutations
- useState for local UI state

## Routing Architecture

### Route Organization
```
routes/
├── _index.tsx                 # / (dashboard)
├── briefs.tsx                 # /briefs (layout)
├── briefs._index.tsx          # /briefs (list)
├── briefs.new.tsx             # /briefs/new
├── briefs.$id.tsx             # /briefs/:id
├── validations.$id.tsx        # /validations/:id
└── history.tsx                # /history
```

### Protected Route Pattern
```typescript
import { Outlet } from "@remix-run/react";
import { LoaderArgs, redirect } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";

export const loader = async (args: LoaderArgs) => {
  const { userId } = await getAuth(args);
  
  if (!userId) {
    return redirect("/sign-in");
  }
  
  return null;
};

export default function BriefsLayout() {
  return <Outlet />;
}
```

## Frontend Services Layer

### API Client Setup
```typescript
class ApiClient {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.API_URL || 'http://localhost:3001/api/v1';
  }
  
  async request<T>(
    path: string, 
    options?: RequestInit,
    token?: string
  ): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };
    
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  }
}

export const api = new ApiClient();
```

### Service Example
```typescript
export class BriefsService {
  static async create(
    data: FeatureBriefInput, 
    token: string
  ): Promise<FeatureBrief> {
    return api.request('/feature-briefs', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }
  
  static async validate(
    briefId: string,
    personaId: string,
    token: string
  ): Promise<{ validationId: string }> {
    return api.request(`/feature-briefs/${briefId}/validate`, {
      method: 'POST',
      body: JSON.stringify({ personaId }),
    }, token);
  }
}
```
