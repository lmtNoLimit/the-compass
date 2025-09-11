// import type { Route } from '../+types/conversation.$id';
import { ModernAgentChat } from '../components/features/ModernAgentChat';

export async function clientLoader({ params }: any): Promise<any> {
  // Fetch agents
  const agentsResponse = await fetch('/api/chat');
  if (!agentsResponse.ok) {
    throw new Error('Failed to fetch agents');
  }
  const agentsData = await agentsResponse.json();

  // Fetch conversation data
  const conversationResponse = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'get_session',
      sessionId: params.id,
      agentId: 'demo-agent', // We'll need to determine this from the session data
    }),
  });

  let conversation = null;
  if (conversationResponse.ok) {
    const conversationData = await conversationResponse.json();
    conversation = conversationData.session;
  }

  return {
    agents: agentsData.agents || [],
    mode: agentsData.mode,
    status: agentsData.status,
    conversation,
    conversationId: params.id,
  };
}

export default function Conversation({ loaderData }: any) {
  return (
    <ModernAgentChat 
      agents={loaderData.agents} 
      conversation={loaderData.conversation}
      conversationId={loaderData.conversationId}
    />
  );
}