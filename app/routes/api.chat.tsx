import type { Route } from '../+types/root';
import { getAgentEngineService } from '../lib/agent-engine.server';
import { getAuth } from '@clerk/react-router/ssr.server';

/**
 * Unified Chat API Endpoint
 * Handles multi-agent chat interactions with Vertex AI
 */

/**
 * Loader to get available agents
 */
export async function loader(_args: Route.LoaderArgs) {
  try {
    const agentEngine = getAgentEngineService();
    const isReady = agentEngine.isInitialized();

    if (!isReady) {
      throw new Error('Agent Engine Service failed to initialize.');
    }

    const agents = await agentEngine.getAvailableAgents();

    return Response.json({
      status: 'ok',
      message: 'Chat service is ready.',
      mode: agentEngine.getMode(),
      agents,
    });
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        message: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

/**
 * Action to handle specific chat actions that still need to be in this endpoint
 */
export async function action(args: Route.ActionArgs) {
  try {
    const auth = await getAuth(args);
    const userId = auth.userId || 'anonymous';

    const agentEngine = getAgentEngineService();
    const body = await args.request.json();
    const { action, agentId, sessionId } = body;

    switch (action) {
      case 'get_session': {
        if (!sessionId) {
          return Response.json({ error: 'sessionId is required' }, { status: 400 });
        }

        console.log(`Action: Getting session ${sessionId}`);
        const { session } = await agentEngine.getSession(sessionId, userId, agentId);

        if (!session) {
          return Response.json({ error: 'Session not found or access denied' }, { status: 404 });
        }

        return Response.json({
          session,
        });
      }

      default: {
        return Response.json(
          { error: `Invalid action '${action}'. Valid actions: get_session` },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
