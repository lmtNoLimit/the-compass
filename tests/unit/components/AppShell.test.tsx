import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { AppShell } from '~/components/layouts/AppShell';

// Default mock values
const defaultUserState = {
  isLoaded: true,
  isSignedIn: true,
  user: {
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  },
};

const defaultNavigationState = {
  state: 'idle',
};

// Setup mocks with configurable values
let currentUserState = defaultUserState;
let currentNavigationState = defaultNavigationState;

// Mock Clerk hooks
vi.mock('@clerk/react-router', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedIn: ({ children }: { children: React.ReactNode }) => {
    const userState = currentUserState;
    return userState.isSignedIn ? <>{children}</> : null;
  },
  SignedOut: ({ children }: { children: React.ReactNode }) => {
    const userState = currentUserState;
    return !userState.isSignedIn ? <>{children}</> : null;
  },
  UserButton: () => {
    const userState = currentUserState;
    return userState.isSignedIn ? <div data-testid="user-button">User Button</div> : null;
  },
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useUser: () => currentUserState,
}))

// Mock React Router hooks
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigation: () => currentNavigationState,
    NavLink: ({ to, children, className }: any) => (
      <a href={to} className={typeof className === 'function' ? className({ isActive: false }) : className}>
        {children}
      </a>
    ),
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

// Mock window.matchMedia for responsive testing
const matchMediaMock = (matches: boolean) => ({
  matches,
  media: '',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

describe('AppShell Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    // Reset to default mock values
    currentUserState = { ...defaultUserState };
    currentNavigationState = { ...defaultNavigationState };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderAppShell = (children?: React.ReactNode) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppShell>{children}</AppShell>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Header', () => {
    it('renders the logo', () => {
      renderAppShell();
      expect(screen.getByText('The Compass')).toBeInTheDocument();
    });

    it('renders the UserButton when signed in', () => {
      renderAppShell();
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
    });

    it('displays user email on desktop', () => {
      window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock(true));
      renderAppShell();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders all navigation links', () => {
      renderAppShell();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Briefs')).toBeInTheDocument();
      expect(screen.getByText('Validations')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders navigation links with correct href attributes', () => {
      renderAppShell();
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      const briefsLink = screen.getByText('Briefs').closest('a');
      
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(briefsLink).toHaveAttribute('href', '/briefs');
    });

    it('applies active styles to active nav links', () => {
      renderAppShell();
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink?.className).toContain('text-gray-700');
    });
  });

  describe('Responsive Behavior', () => {
    it('shows hamburger menu on mobile', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => {
        return matchMediaMock(query.includes('640px'));
      });
      
      renderAppShell();
      const hamburger = screen.getByLabelText('Open menu');
      expect(hamburger).toBeInTheDocument();
    });

    it('hides desktop navigation on mobile', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => {
        return matchMediaMock(query.includes('640px'));
      });
      
      renderAppShell();
      const nav = screen.getByText('Dashboard').closest('nav');
      expect(nav?.className).toContain('sm:flex');
    });

    it('opens mobile menu when hamburger is clicked', () => {
      window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock(false));
      
      renderAppShell();
      const hamburger = screen.getByLabelText('Open menu');
      
      fireEvent.click(hamburger);
      
      // Check if close button appears (indicates menu is open)
      expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator when navigation is in progress', () => {
      // Set navigation to loading state
      currentNavigationState = { state: 'loading' };

      renderAppShell();
      const loadingBar = document.querySelector('.animate-pulse');
      expect(loadingBar).toBeInTheDocument();
    });
  });

  describe('Content Area', () => {
    it('renders children when provided', () => {
      renderAppShell(<div data-testid="test-child">Test Content</div>);
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('renders Outlet when no children provided', () => {
      renderAppShell();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    it('renders the footer with copyright text', () => {
      renderAppShell();
      expect(screen.getByText(/© 2025 The Compass/)).toBeInTheDocument();
    });
  });

  describe('Authentication States', () => {
    it('shows sign in button when not authenticated', () => {
      // Set user state to not signed in
      currentUserState = {
        isLoaded: true,
        isSignedIn: false,
        user: null,
      };

      renderAppShell();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('does not display user email when not authenticated', () => {
      // Set user state to not signed in
      currentUserState = {
        isLoaded: true,
        isSignedIn: false,
        user: null,
      };
      
      renderAppShell();
      
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      renderAppShell();
      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    });

    it('maintains focus management for mobile menu', () => {
      renderAppShell();
      const hamburger = screen.getByLabelText('Open menu');
      
      fireEvent.click(hamburger);
      
      const closeButton = screen.getByLabelText('Close menu');
      expect(closeButton).toBeInTheDocument();
      
      fireEvent.click(closeButton);
      
      expect(screen.queryByLabelText('Close menu')).not.toBeInTheDocument();
    });
  });
});