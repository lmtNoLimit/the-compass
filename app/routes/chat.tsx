// import type { Route } from '../+types/chat';
import { ModernAgentChat } from '../components/features/ModernAgentChat';

export async function clientLoader(): Promise<any> {
  const response = await fetch('/api/chat');
  if (!response.ok) {
    throw new Error('Failed to fetch agents');
  }
  const data = await response.json();
  return {
    agents: data.agents || [],
    mode: data.mode,
    status: data.status,
  };
}

export default function Chat({ loaderData }: any) {
  return <ModernAgentChat agents={loaderData.agents} />;
}
