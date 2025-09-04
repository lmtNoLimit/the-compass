# Clerk Authentication Setup

## Dashboard Setup

1. Create a Clerk account at https://clerk.com
2. Create a new application
3. Choose your authentication methods (Email, Google, etc.)
4. Copy your API keys from the Clerk Dashboard

## Environment Variables

Add these to your `.env` file (copy from `.env.example`):

```env
VITE_CLERK_PUBLISHABLE_KEY=<your_publishable_key>
CLERK_SECRET_KEY=<your_secret_key>
```

## Integration

The Clerk provider needs to be added to the root component in `apps/web/app/root.tsx`:

```tsx
import { ClerkProvider } from '@clerk/clerk-react';

// In your root component
<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  {/* Your app */}
</ClerkProvider>
```

## Protected Routes

Use Clerk's authentication components and hooks for protected routes:

```tsx
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

// In your protected route component
<SignedIn>
  {/* Protected content */}
</SignedIn>
<SignedOut>
  <RedirectToSignIn />
</SignedOut>
```