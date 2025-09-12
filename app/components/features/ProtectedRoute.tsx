import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@clerk/react-router';

function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}

// Default export for React Router v7 layout
export default ProtectedRoute;

// Named export for backward compatibility (tests, etc.)
export { ProtectedRoute };
