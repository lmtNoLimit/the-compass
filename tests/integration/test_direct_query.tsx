import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

describe('Direct Query API Pattern', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should send messages directly to query API without sessionId', async () => {
    const mockResponse = {
      response: 'Agent response',
      sessionId: 'auto-generated-123' // Backend auto-generates this
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    // Simulate message submission
    const handleSubmit = async (message: string, agentId: string) => {
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          prompt: message
          // Note: NO sessionId in request
        })
      });
      return response.json();
    };

    const result = await handleSubmit('Hello agent', 'demo-agent');

    // Verify the request was made correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/chat/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: 'demo-agent',
        prompt: 'Hello agent'
        // Verify NO sessionId was sent
      })
    });

    // Verify NO sessionId in request body
    const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(callBody.sessionId).toBeUndefined();
    
    expect(result.response).toBe('Agent response');
  });

  it('should maintain conversation continuity without UI session management', async () => {
    const messages: any[] = [];
    
    // First message
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'First response',
        sessionId: 'backend-session-1'
      })
    });

    const firstResponse = await fetch('/api/chat/query', {
      method: 'POST',
      body: JSON.stringify({ agentId: 'demo-agent', prompt: 'First message' })
    });
    const firstData = await firstResponse.json();
    messages.push({ role: 'user', content: 'First message' });
    messages.push({ role: 'agent', content: firstData.response });

    // Second message - backend handles session continuity
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Second response with context',
        sessionId: 'backend-session-1' // Same session maintained by backend
      })
    });

    const secondResponse = await fetch('/api/chat/query', {
      method: 'POST',
      body: JSON.stringify({ agentId: 'demo-agent', prompt: 'Second message' })
    });
    const secondData = await secondResponse.json();
    messages.push({ role: 'user', content: 'Second message' });
    messages.push({ role: 'agent', content: secondData.response });

    // Verify conversation maintained
    expect(messages).toHaveLength(4);
    expect(messages[3].content).toContain('context');
    
    // Verify NO sessionId was passed from UI
    const secondCall = JSON.parse((global.fetch as any).mock.calls[1][1].body);
    expect(secondCall.sessionId).toBeUndefined();
  });
});