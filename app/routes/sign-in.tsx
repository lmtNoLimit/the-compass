import { SignIn } from '@clerk/react-router';
import { AuthErrorBoundary } from '~/components/features/AuthErrorBoundary';

export default function SignInRoute() {
  return (
    <AuthErrorBoundary>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Sign in to The Compass
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Access your validation tool with enterprise-grade security
            </p>
          </div>
          <SignIn
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-none',
                footer: 'hidden',
              },
            }}
            forceRedirectUrl="/briefs"
            signUpUrl="/sign-up"
          />
        </div>
      </div>
    </AuthErrorBoundary>
  );
}
