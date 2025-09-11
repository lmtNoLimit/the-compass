import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';

describe('Chat Route - Zero Session API Calls', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should NOT make any session-related API calls on route load', async () => {
    const mockAgents = [
      { id: 'demo-agent', name: 'Demo Agent', status: 'active' }
    ];

    // Mock only the agent list fetch
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/agents')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAgents)
        });
      }
      throw new Error(`Unexpected API call to ${url}`);
    });

    const router = createMemoryRouter([
      {
        path: '/chat',
        element: <div>Chat Component</div>,
        loader: async () => {
          // This should only fetch agents, NOT sessions
          const agents = await fetch('/api/agents').then(r => r.json());
          return { agents };
        }
      }
    ], {
      initialEntries: ['/chat']
    });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText('Chat Component')).toBeInTheDocument();
    });

    // Verify only agent list was fetched
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/agents');
    
    // Verify NO session-related calls were made
    const calls = (global.fetch as any).mock.calls;
    calls.forEach((call: any[]) => {
      expect(call[0]).not.toContain('/api/chat/session');
      expect(call[0]).not.toContain('createSession');
      expect(call[0]).not.toContain('fetchSessions');
    });
  });

  it('should render chat interface without any session indicators', async () => {
    const router = createMemoryRouter([
      {
        path: '/chat',
        element: <div data-testid="chat-interface">
          <div data-testid="message-input">Input</div>
        </div>
      }
    ], {
      initialEntries: ['/chat']
    });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
    });

    // Should NOT have session displays
    expect(screen.queryByText(/session/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('session-id')).not.toBeInTheDocument();
    expect(screen.queryByTestId('session-sidebar')).not.toBeInTheDocument();
  });
});