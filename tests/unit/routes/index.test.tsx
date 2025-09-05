import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Index from '~/routes/_index';

// Mock Clerk's useAuth hook
vi.mock('@clerk/react-router', () => ({
  useAuth: () => ({ isSignedIn: false }),
}));

describe('Index Route', () => {
  it('renders the welcome message', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    expect(screen.getByText('Welcome to The Compass')).toBeDefined();
  });

  it('renders the description', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    expect(
      screen.getByText('AI-Powered Feature Brief Validation Platform for Product Managers')
    ).toBeDefined();
  });

  it('shows sign in button when not authenticated', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    expect(screen.getByText('Sign In')).toBeDefined();
    expect(screen.getByText('Create Account')).toBeDefined();
  });
});
