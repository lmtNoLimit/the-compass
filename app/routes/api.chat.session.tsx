// import type { Route } from '../+types/api.chat.session';
import { getAgentEngineService } from '../lib/agent-engine.server';
import { getAuth } from '@clerk/react-router/ssr.server';

/**
 * Session Management API Endpoint
 * Handles session creation, deletion, and listing
 */
export async function action(args: any) {
  try {
    const auth = await getAuth(args);
    const userId = auth.userId || 'anonymous';

    const agentEngine = getAgentEngineService();
    const body = await args.request.json();
    const { action, agentId = 'demo-agent', sessionId } = body;

    switch (action) {
      case 'create_session': {
        console.log(`Action: Creating session for agent ${agentId}...`);
        const { sessionId: newSessionId } = await agentEngine.createSession(userId, agentId);
        
        return Response.json({
          sessionId: newSessionId,
          userId,
          agentId,
          createdAt: new Date().toISOString(),
        });
      }

      case 'list_sessions': {
        console.log(`Action: Listing sessions for user ${userId}, agent ${agentId}`);
        const { sessions } = await agentEngine.listSessions(
          userId,
          agentId === 'all' ? undefined : agentId
        );

        return Response.json({
          sessions,
          count: sessions.length,
        });
      }

      case 'delete_session': {
        if (!sessionId) {
          return Response.json({ error: 'sessionId is required' }, { status: 400 });
        }

        console.log(`Action: Deleting session ${sessionId}`);
        const result = await agentEngine.deleteSession(sessionId, userId, agentId);

        if (!result.success) {
          return Response.json(
            { error: result.message || 'Session not found or access denied' },
            { status: 404 }
          );
        }

        return Response.json(result);
      }

      default: {
        return Response.json(
          { error: `Invalid action '${action}'. Valid actions: create_session, list_sessions, delete_session` },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('Session API error:', error);
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}