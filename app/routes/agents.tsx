import { useFetcher, useNavigate } from 'react-router';
import { useState, useMemo, useEffect } from 'react';
import type { AgentListResponse, AgentInfo } from '~/types';

export const meta = () => {
  return [
    { title: 'Agents - Persona Compass' },
    { name: 'description', content: 'Browse and select AI agents for your conversations' },
  ];
};

export async function clientLoader({ request }: any): Promise<AgentListResponse> {
  try {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    const response = await fetch(`/api/agents${forceRefresh ? '?refresh=true' : ''}`);
    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error loading agents:', error);
    return {
      agents: [],
      timestamp: new Date(),
      cached: false,
      totalCount: 0
    };
  }
}

export default function AgentsPage({ loaderData }: any) {
  const [data, setData] = useState<AgentListResponse>(loaderData || { agents: [], timestamp: new Date(), cached: false, totalCount: 0 });

  useEffect(() => {
    if (loaderData) {
      setData(loaderData);
    }
  }, [loaderData]);
  const fetcher = useFetcher();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);

  // Filter agents based on search and category
  const filteredAgents = useMemo(() => {
    return data.agents.filter(agent => {
      const matchesSearch = searchTerm === '' || 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.capabilities.some(cap => cap.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || 
        agent.metadata?.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [data.agents, searchTerm, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(data.agents.map(agent => agent.metadata?.category || 'general'));
    return Array.from(cats).sort();
  }, [data.agents]);

  const handleRefresh = () => {
    fetcher.load('/api/agents?refresh=true');
  };

  const handleAgentSelect = (agent: AgentInfo) => {
    setSelectedAgent(agent);
    
    // Navigate to chat with selected agent (simplified)
    navigate(`/chat?agent=${agent.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'text-blue-600 bg-blue-100';
      case 'specialized': return 'text-purple-600 bg-purple-100';
      case 'enterprise': return 'text-indigo-600 bg-indigo-100';
      case 'demo': return 'text-yellow-600 bg-yellow-100';
      case 'experimental': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isRefreshing = fetcher.state === 'loading';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
              <p className="mt-2 text-gray-600">
                Choose an AI agent to start your conversation
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {isRefreshing ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>

          {/* Cache info */}
          <div className="mt-4 text-sm text-gray-500">
            {data.cached ? (
              <span>Showing cached results from {new Date(data.timestamp).toLocaleTimeString()}</span>
            ) : (
              <span>Updated {new Date(data.timestamp).toLocaleTimeString()}</span>
            )}
            {' • '}
            <span>{data.totalCount} agents available</span>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search agents by name, description, or capabilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleAgentSelect(agent)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {agent.metadata?.icon && (
                      <span className="text-lg">{agent.metadata.icon}</span>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {agent.name}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {agent.description}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                  {agent.metadata?.category && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(agent.metadata.category)}`}>
                      {agent.metadata.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-2 mt-4">
                {agent.capabilities.slice(0, 3).map((capability) => (
                  <span
                    key={capability}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                  >
                    {capability}
                  </span>
                ))}
                {agent.capabilities.length > 3 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-md">
                    +{agent.capabilities.length - 3} more
                  </span>
                )}
              </div>

              {/* Action button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
                  {agent.status === 'active' ? 'Start Conversation' : 'View Details'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredAgents.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No agents found</h3>
            <p className="mt-2 text-gray-500">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search filters.'
                : 'No agents are currently available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}