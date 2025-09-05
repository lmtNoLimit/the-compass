import { SignUp } from '@clerk/react-router';
import { AuthErrorBoundary } from '~/components/features/AuthErrorBoundary';

export default function SignUpRoute() {
  return (
    <AuthErrorBoundary>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Join The Compass for feature validation insights
            </p>
          </div>
          <SignUp
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-none',
                footer: 'hidden',
              },
            }}
            forceRedirectUrl="/briefs"
            signInUrl="/sign-in"
          />
        </div>
      </div>
    </AuthErrorBoundary>
  );
}
