// import type { Route } from '../+types/api.chat.query';
import { getAgentEngineService } from '../lib/agent-engine.server';
import { getAuth } from '@clerk/react-router/ssr.server';

/**
 * Chat Query API Endpoint
 * Handles sending messages to agents
 */
export async function action(args: any) {
  try {
    const auth = await getAuth(args);
    const userId = auth.userId || 'anonymous';

    const agentEngine = getAgentEngineService();
    const body = await args.request.json();
    const { sessionId, prompt, agentId = 'demo-agent' } = body;

    if (!sessionId || !prompt) {
      return Response.json(
        { error: 'sessionId and prompt are required for querying.' },
        { status: 400 }
      );
    }

    console.log(`Action: Querying ${agentId} session ${sessionId.slice(-10)}...`);
    const startTime = Date.now();

    const agentResponse = await agentEngine.streamQuery({
      sessionId,
      prompt,
      userId,
      agentId,
    });

    const processingTime = Date.now() - startTime;

    return Response.json({
      ...agentResponse,
      metadata: {
        agentId,
        userId,
        processingTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Query API error:', error);
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}