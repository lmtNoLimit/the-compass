import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { action } from '~/routes/api.clerk-webhook';
import { Webhook } from 'svix';
import type { ActionFunctionArgs } from 'react-router';

// Mock prisma
vi.mock('~/lib/prisma.server', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock svix
vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: vi.fn(),
  })),
}));

// Mock @react-router/node
vi.mock('@react-router/node', () => ({
  json: (data: unknown, init?: ResponseInit) => {
    const response = new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    return response;
  },
}));

describe('Clerk Webhook Handler', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.CLERK_WEBHOOK_SECRET = 'test_webhook_secret';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 500 when webhook secret is missing', async () => {
    delete process.env.CLERK_WEBHOOK_SECRET;

    const request = new Request('http://localhost:3000/api/clerk-webhook', {
      method: 'POST',
      headers: {
        'svix-id': 'test-id',
        'svix-timestamp': '1234567890',
        'svix-signature': 'test-signature',
      },
      body: JSON.stringify({}),
    });

    const response = await action({ request } as ActionFunctionArgs);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server configuration error');
  });

  it('returns 400 when webhook headers are missing', async () => {
    const request = new Request('http://localhost:3000/api/clerk-webhook', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await action({ request } as ActionFunctionArgs);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing webhook headers');
  });

  it('returns 400 when signature verification fails', async () => {
    const mockWebhook = new Webhook('test_webhook_secret');
    (mockWebhook.verify as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const request = new Request('http://localhost:3000/api/clerk-webhook', {
      method: 'POST',
      headers: {
        'svix-id': 'test-id',
        'svix-timestamp': '1234567890',
        'svix-signature': 'invalid-signature',
      },
      body: JSON.stringify({ type: 'user.created' }),
    });

    const response = await action({ request } as ActionFunctionArgs);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid signature');
  });

  it('creates user on user.created event', async () => {
    const mockWebhook = new Webhook('test_webhook_secret');
    const eventData = {
      type: 'user.created',
      data: {
        id: 'user_123',
        email_addresses: [{ email_address: 'test@example.com' }],
        first_name: 'Test',
        last_name: 'User',
        organization_memberships: [],
      },
    };

    (mockWebhook.verify as ReturnType<typeof vi.fn>).mockReturnValue(eventData);

    const { prisma } = await import('~/lib/prisma.server');

    const request = new Request('http://localhost:3000/api/clerk-webhook', {
      method: 'POST',
      headers: {
        'svix-id': 'test-id',
        'svix-timestamp': '1234567890',
        'svix-signature': 'valid-signature',
      },
      body: JSON.stringify(eventData),
    });

    const response = await action({ request } as ActionFunctionArgs);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        clerkId: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        organization: null,
        role: 'USER',
        lastLoginAt: expect.any(Date),
      },
    });
  });

  it('updates user on user.updated event', async () => {
    const mockWebhook = new Webhook('test_webhook_secret');
    const eventData = {
      type: 'user.updated',
      data: {
        id: 'user_123',
        email_addresses: [{ email_address: 'updated@example.com' }],
        first_name: 'Updated',
        last_name: 'User',
        organization_memberships: [{ name: 'Acme Corp' }],
      },
    };

    (mockWebhook.verify as ReturnType<typeof vi.fn>).mockReturnValue(eventData);

    const { prisma } = await import('~/lib/prisma.server');

    const request = new Request('http://localhost:3000/api/clerk-webhook', {
      method: 'POST',
      headers: {
        'svix-id': 'test-id',
        'svix-timestamp': '1234567890',
        'svix-signature': 'valid-signature',
      },
      body: JSON.stringify(eventData),
    });

    const response = await action({ request } as ActionFunctionArgs);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { clerkId: 'user_123' },
      data: {
        email: 'updated@example.com',
        name: 'Updated User',
        organization: 'Acme Corp',
        lastLoginAt: expect.any(Date),
      },
    });
  });

  it('deletes user on user.deleted event', async () => {
    const mockWebhook = new Webhook('test_webhook_secret');
    const eventData = {
      type: 'user.deleted',
      data: {
        id: 'user_123',
      },
    };

    (mockWebhook.verify as ReturnType<typeof vi.fn>).mockReturnValue(eventData);

    const { prisma } = await import('~/lib/prisma.server');

    const request = new Request('http://localhost:3000/api/clerk-webhook', {
      method: 'POST',
      headers: {
        'svix-id': 'test-id',
        'svix-timestamp': '1234567890',
        'svix-signature': 'valid-signature',
      },
      body: JSON.stringify(eventData),
    });

    const response = await action({ request } as ActionFunctionArgs);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { clerkId: 'user_123' },
    });
  });

  it('updates lastLoginAt on session.created event', async () => {
    const mockWebhook = new Webhook('test_webhook_secret');
    const eventData = {
      type: 'session.created',
      data: {
        user_id: 'user_123',
      },
    };

    (mockWebhook.verify as ReturnType<typeof vi.fn>).mockReturnValue(eventData);

    const { prisma } = await import('~/lib/prisma.server');

    const request = new Request('http://localhost:3000/api/clerk-webhook', {
      method: 'POST',
      headers: {
        'svix-id': 'test-id',
        'svix-timestamp': '1234567890',
        'svix-signature': 'valid-signature',
      },
      body: JSON.stringify(eventData),
    });

    const response = await action({ request } as ActionFunctionArgs);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { clerkId: 'user_123' },
      data: {
        lastLoginAt: expect.any(Date),
      },
    });
  });

  it('handles unhandled event types gracefully', async () => {
    const mockWebhook = new Webhook('test_webhook_secret');
    const eventData = {
      type: 'unknown.event',
      data: {},
    };

    (mockWebhook.verify as ReturnType<typeof vi.fn>).mockReturnValue(eventData);

    const request = new Request('http://localhost:3000/api/clerk-webhook', {
      method: 'POST',
      headers: {
        'svix-id': 'test-id',
        'svix-timestamp': '1234567890',
        'svix-signature': 'valid-signature',
      },
      body: JSON.stringify(eventData),
    });

    const response = await action({ request } as ActionFunctionArgs);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
