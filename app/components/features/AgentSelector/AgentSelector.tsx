import { useState, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import type { AgentInfo, AgentListResponse, AgentSelectionRequest } from '~/types';
import { AgentList } from './AgentList';

interface AgentSelectorProps {
  selectedAgentId?: string;
  onAgentSelect?: (agent: AgentInfo) => void;
  compact?: boolean;
  maxItems?: number;
  showRefreshButton?: boolean;
  autoLoad?: boolean;
}

export function AgentSelector({ 
  selectedAgentId,
  onAgentSelect,
  compact = false,
  maxItems,
  showRefreshButton = true,
  autoLoad = true
}: AgentSelectorProps) {
  const fetcher = useFetcher<AgentListResponse>();
  const selectionFetcher = useFetcher();
  
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isCached, setIsCached] = useState(false);

  // Load agents on mount if autoLoad is enabled
  useEffect(() => {
    if (autoLoad && !fetcher.data && fetcher.state === 'idle') {
      fetcher.load('/api/agents');
    }
  }, [autoLoad, fetcher]);

  // Update local state when fetcher data changes
  useEffect(() => {
    if (fetcher.data) {
      setAgents(fetcher.data.agents);
      setLastUpdated(new Date(fetcher.data.timestamp));
      setIsCached(fetcher.data.cached);
    }
  }, [fetcher.data]);

  const handleRefresh = () => {
    fetcher.load('/api/agents?refresh=true');
  };

  const handleAgentSelect = (agent: AgentInfo) => {
    // Make selection API call
    const selectionRequest: AgentSelectionRequest = {
      agentId: agent.id,
      context: {
        source: 'quick-switch',
        preserveHistory: true
      }
    };

    selectionFetcher.submit(
      {
        agentId: agent.id,
        context: JSON.stringify(selectionRequest.context)
      },
      {
        method: 'post',
        action: '/api/agents/select'
      }
    );

    // Call parent handler
    if (onAgentSelect) {
      onAgentSelect(agent);
    }
  };

  const isLoading = fetcher.state === 'loading';
  const isSelecting = selectionFetcher.state !== 'idle';

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      {showRefreshButton && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
              Available Agents
            </h3>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                {isCached ? 'Cached' : 'Updated'} {lastUpdated.toLocaleTimeString()}
                {agents.length > 0 && (
                  <span> • {agents.length} agent{agents.length !== 1 ? 's' : ''}</span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`inline-flex items-center border border-gray-300 rounded-md shadow-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 ${
              compact 
                ? 'px-3 py-1.5 text-sm' 
                : 'px-4 py-2 text-sm'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin -ml-1 mr-2 h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && agents.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading agents...</span>
        </div>
      )}

      {/* Selection feedback */}
      {isSelecting && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="ml-2 text-sm text-blue-700">Selecting agent...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {fetcher.data === undefined && fetcher.state === 'idle' && !isLoading && agents.length === 0 && autoLoad && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Failed to load agents</h3>
              <p className="mt-1 text-sm text-red-700">
                There was an error loading the agent list. Please try refreshing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Agent list */}
      {agents.length > 0 && (
        <AgentList
          agents={agents}
          onAgentSelect={handleAgentSelect}
          selectedAgentId={selectedAgentId}
          showSearch={!compact}
          showCategoryFilter={!compact}
          compact={compact}
          maxItems={maxItems}
        />
      )}
    </div>
  );
}