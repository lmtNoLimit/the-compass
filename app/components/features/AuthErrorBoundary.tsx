import React, { Component } from 'react';
import { Link } from 'react-router';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth error caught by boundary:', error, errorInfo);

    // Log to monitoring service (Axiom) if available
    interface WindowWithAxiom extends Window {
      axiom?: {
        log: (level: string, data: Record<string, unknown>) => void;
      };
    }
    if (typeof window !== 'undefined' && (window as WindowWithAxiom).axiom) {
      (window as WindowWithAxiom).axiom.log('error', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        type: 'auth_error',
      });
    }
  }

  public render() {
    if (this.state.hasError) {
      const isAuthError =
        this.state.error?.message?.toLowerCase().includes('auth') ||
        this.state.error?.message?.toLowerCase().includes('clerk');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {isAuthError ? 'Authentication Error' : 'Something went wrong'}
              </h1>
              <p className="text-gray-600 mb-6">
                {isAuthError
                  ? 'We encountered an issue with authentication. Please try again.'
                  : 'An unexpected error occurred. Please try refreshing the page.'}
              </p>
              {this.state.error?.message && (
                <p className="text-sm text-red-600 mb-6 p-3 bg-red-50 rounded">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Return Home
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
