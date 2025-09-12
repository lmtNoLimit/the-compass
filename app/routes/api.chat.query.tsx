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
    const { sessionId, prompt, agentId } = body;

    if (!prompt) {
      return Response.json(
        { error: 'prompt is required for querying.' },
        { status: 400 }
      );
    }

    if (!agentId) {
      return Response.json(
        { error: 'agentId is required for querying.' },
        { status: 400 }
      );
    }

    // If no sessionId provided, backend will auto-create one
    let effectiveSessionId = sessionId;
    if (!sessionId) {
      // Backend auto-creates session on first query
      const { sessionId: newSessionId } = await agentEngine.createSession(userId, agentId);
      effectiveSessionId = newSessionId;
      console.log(`Action: Auto-created session ${newSessionId.slice(-10)} for ${agentId}`);
    }

    console.log(`Action: Querying ${agentId} session ${effectiveSessionId.slice(-10)}...`);
    const startTime = Date.now();

    const agentResponse = await agentEngine.streamQuery({
      sessionId: effectiveSessionId,
      prompt,
      userId,
      agentId,
    });

    const processingTime = Date.now() - startTime;

    return Response.json({
      ...agentResponse,
      sessionId: effectiveSessionId,
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