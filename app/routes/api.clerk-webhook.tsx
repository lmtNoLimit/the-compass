import { type ActionFunctionArgs } from 'react-router';
import { Webhook } from 'svix';
import { prisma } from '~/lib/prisma.server';

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    user_id?: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    organization_memberships?: Array<{ name: string }>;
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Get headers
  const svix_id = request.headers.get('svix-id') ?? '';
  const svix_timestamp = request.headers.get('svix-timestamp') ?? '';
  const svix_signature = request.headers.get('svix-signature') ?? '';

  // If there are missing headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return Response.json({ error: 'Missing webhook headers' }, { status: 400 });
  }

  // Get body
  const body = await request.text();

  // Create a new Webhook instance with your webhook secret
  const webhook = new Webhook(CLERK_WEBHOOK_SECRET);

  let event: ClerkWebhookEvent;

  // Verify the webhook
  try {
    event = webhook.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the webhook events
  try {
    const eventType = event.type;
    const data = event.data;

    switch (eventType) {
      case 'user.created':
        await prisma.user.create({
          data: {
            clerkId: data.id,
            email: data.email_addresses[0].email_address,
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown User',
            organization: data.organization_memberships?.[0]?.name || null,
            role: 'USER',
            lastLoginAt: new Date(),
          },
        });
        console.log(`User created: ${data.id}`);
        break;

      case 'user.updated':
        await prisma.user.update({
          where: { clerkId: data.id },
          data: {
            email: data.email_addresses[0].email_address,
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown User',
            organization: data.organization_memberships?.[0]?.name || null,
            lastLoginAt: new Date(),
          },
        });
        console.log(`User updated: ${data.id}`);
        break;

      case 'user.deleted':
        await prisma.user.delete({
          where: { clerkId: data.id },
        });
        console.log(`User deleted: ${data.id}`);
        break;

      case 'session.created':
        await prisma.user.update({
          where: { clerkId: data.user_id },
          data: {
            lastLoginAt: new Date(),
          },
        });
        console.log(`User session created: ${data.user_id}`);
        break;

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: 'Error processing webhook' }, { status: 500 });
  }
}
