import { useState } from 'react';
import { NavLink, Outlet, useNavigation } from 'react-router';
import { SignedIn, SignedOut, UserButton, SignInButton, useUser } from '@clerk/react-router';
import * as Dialog from '@radix-ui/react-dialog';
import {
  DashboardIcon,
  FileTextIcon,
  CheckCircledIcon,
  ClockIcon,
  GearIcon,
  HamburgerMenuIcon,
  Cross2Icon,
} from '@radix-ui/react-icons';

interface AppShellProps {
  children?: React.ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/briefs', label: 'Briefs', icon: FileTextIcon },
  { to: '/validations', label: 'Validations', icon: CheckCircledIcon },
  { to: '/history', label: 'History', icon: ClockIcon },
  { to: '/settings', label: 'Settings', icon: GearIcon },
];

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigation = useNavigation();
  const { user, isLoaded } = useUser();
  const isNavigating = navigation.state === 'loading';

  const userEmail = user?.emailAddresses?.[0]?.emailAddress;

  const NavLinks = ({
    mobile = false,
    onItemClick,
  }: {
    mobile?: boolean;
    onItemClick?: () => void;
  }) => (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onItemClick}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'text-blue-600 bg-blue-50 rounded-md'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md'
            } ${mobile ? 'w-full' : ''}`
          }
        >
          <item.icon className="w-4 h-4" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Desktop Nav */}
            <div className="flex items-center">
              {/* Mobile menu button */}
              <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <Dialog.Trigger asChild>
                  <button
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:hidden"
                    aria-label="Open menu"
                  >
                    <HamburgerMenuIcon className="w-5 h-5" />
                  </button>
                </Dialog.Trigger>

                {/* Mobile menu dialog */}
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30 sm:hidden" />
                  <Dialog.Content
                    className="fixed top-0 left-0 bottom-0 w-64 bg-white shadow-xl sm:hidden"
                    aria-describedby="mobile-menu-description"
                  >
                    <Dialog.Title className="sr-only">Navigation Menu</Dialog.Title>
                    <Dialog.Description className="sr-only" id="mobile-menu-description">
                      Mobile navigation menu with links to different sections of the application
                    </Dialog.Description>
                    <div className="flex items-center justify-between p-4 border-b">
                      <h2 className="text-lg font-bold text-gray-900">The Compass</h2>
                      <Dialog.Close asChild>
                        <button
                          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
                          aria-label="Close menu"
                        >
                          <Cross2Icon className="w-4 h-4" />
                        </button>
                      </Dialog.Close>
                    </div>
                    <nav className="p-4 space-y-1">
                      <NavLinks mobile onItemClick={() => setMobileMenuOpen(false)} />
                    </nav>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>

              {/* Logo */}
              <NavLink to="/" className="flex items-center ml-4 sm:ml-0">
                <h1 className="text-xl font-bold text-gray-900">The Compass</h1>
              </NavLink>

              {/* Desktop Navigation */}
              <nav className="hidden sm:flex sm:items-center sm:ml-10 sm:space-x-1">
                <SignedIn>
                  <NavLinks />
                </SignedIn>
              </nav>
            </div>

            {/* Right side - User menu */}
            <div className="flex items-center space-x-4">
              {/* User email display (desktop only) */}
              <SignedIn>
                {isLoaded && userEmail && (
                  <span className="hidden lg:block text-sm text-gray-600">{userEmail}</span>
                )}
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'w-8 h-8',
                    },
                  }}
                  showName={false}
                />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {isNavigating && (
          <div className="h-1 bg-blue-100">
            <div className="h-full bg-blue-600 animate-pulse" />
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">{children || <Outlet />}</div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2025 The Compass. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
