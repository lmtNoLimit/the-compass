import type { Route } from '../+types/root';
import { getVertexAIService } from '../lib/vertex-ai.server';

/**
 * Loader for a basic health check.
 * Confirms that the Vertex AI service is initialized.
 */
export async function loader(_args: Route.LoaderArgs) {
  try {
    const vertexAI = getVertexAIService();
    const isReady = vertexAI.isInitialized();

    if (!isReady) {
      throw new Error('Vertex AI Service failed to initialize.');
    }

    return Response.json({
      status: 'ok',
      message: 'Vertex AI service is initialized.',
      mode: vertexAI.getMode(),
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
 * Action to handle interactions with the Vertex AI Agent.
 * It routes requests to either create a session or query an existing one.
 */
export async function action(args: Route.ActionArgs) {
  try {
    const vertexAI = getVertexAIService();
    const body = await args.request.json();

    // Route the request based on the 'action' property in the body
    switch (body.action) {
      case 'create_session': {
        console.log('Action: Creating a new agent session...');
        const userId = body.user_id || 'default_user';
        const { sessionId } = await vertexAI.createAgentSession(userId);
        return Response.json({ sessionId });
      }

      case 'query_session': {
        const { sessionId, prompt, user_id } = body;
        if (!sessionId || !prompt) {
          return Response.json(
            { error: 'sessionId and prompt are required for querying.' },
            { status: 400 }
          );
        }
        console.log(`Action: Querying session ${sessionId.slice(-10)}...`);
        const agentResponse = await vertexAI.streamQuery({
          sessionId,
          prompt,
          userId: user_id || 'default_user',
        });
        return Response.json(agentResponse);
      }

      default: {
        return Response.json(
          { error: "Invalid action. Must be 'create_session' or 'query_session'." },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
