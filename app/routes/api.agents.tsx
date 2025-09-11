import type { Route } from '../+types/root';
import { getAgentEngineService } from '~/lib/agent-engine.server';
import type { 
  AgentListResponse, 
  AgentInfo, 
  AgentSelectionRequest, 
  AgentSelectionResponse,
  RefreshResponse 
} from '~/types';

/**
 * GET /api/agents - Retrieve list of available agents
 * GET /api/agents/:id - Get specific agent details
 */
export async function loader(args: Route.LoaderArgs) {
  const { request } = args;
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const agentService = getAgentEngineService();

    // Extract path after /api/agents/
    const agentsPath = pathname.replace('/api/agents', '').replace(/^\//, '');
    
    // Handle specific agent ID - if path is a valid agent ID
    if (agentsPath && agentsPath !== '' && !agentsPath.includes('/')) {
      const agentId = agentsPath;
      
      // Validate agent ID format
      if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(agentId)) {
        return Response.json({ error: 'Invalid agent ID format' }, { status: 400 });
      }

      const agent = await agentService.getAgentById(agentId);
      
      if (!agent) {
        return Response.json({ error: 'Agent not found' }, { status: 404 });
      }

      return Response.json(agent);
    }

    // Handle agent list (default case)
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const agentListResponse = await agentService.getAvailableAgents(forceRefresh);

    return Response.json(agentListResponse);
  } catch (error) {
    console.error('Error in agents loader:', error);
    return Response.json(
      { 
        error: 'Failed to retrieve agents',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/select - Select an agent for current session
 * POST /api/agents/refresh - Force refresh of agent list
 */
export async function action(args: Route.ActionArgs) {
  const { request } = args;
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    const agentService = getAgentEngineService();

    // Handle agent refresh
    if (pathname.endsWith('/refresh')) {
      if (request.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
      }

      const refreshResult = await agentService.refreshAgents();
      
      const response: RefreshResponse = {
        success: refreshResult.success,
        totalAgents: refreshResult.totalAgents,
        newAgents: refreshResult.newAgents,
        timestamp: refreshResult.timestamp,
        cached: refreshResult.cached
      };

      return Response.json(response);
    }

    // Handle agent selection
    if (pathname.endsWith('/select')) {
      if (request.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
      }

      const requestBody = await request.json();
      
      // Validate request body
      if (!requestBody.agentId || typeof requestBody.agentId !== 'string') {
        return Response.json({ error: 'Missing or invalid agentId field' }, { status: 400 });
      }

      // Validate context source if provided
      if (requestBody.context?.source) {
        const validSources = ['chat', 'agents-page', 'quick-switch'];
        if (!validSources.includes(requestBody.context.source)) {
          return Response.json({ error: 'Invalid context source value' }, { status: 400 });
        }
      }

      const selectionRequest: AgentSelectionRequest = requestBody;

      // Get the selected agent
      const selectedAgent = await agentService.getAgentById(selectionRequest.agentId);
      
      if (!selectedAgent) {
        return Response.json({ error: 'Agent not found' }, { status: 404 });
      }

      // Check if agent is available
      if (selectedAgent.status === 'inactive' || selectedAgent.status === 'error') {
        return Response.json({ 
          error: `Agent '${selectedAgent.name}' is not available (status: ${selectedAgent.status})` 
        }, { status: 400 });
      }

      // For now, we don't track previous agent selection server-side
      // This could be enhanced to maintain session state
      const response: AgentSelectionResponse = {
        success: true,
        agent: selectedAgent,
        timestamp: new Date()
      };

      return Response.json(response);
    }

    return Response.json({ error: 'Invalid endpoint' }, { status: 404 });
  } catch (error) {
    console.error('Error in agents action:', error);
    return Response.json(
      { 
        error: 'Failed to process agent request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}