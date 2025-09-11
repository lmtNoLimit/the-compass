import { useState, useMemo } from 'react';
import type { AgentInfo } from '~/types';
import { AgentCard } from './AgentCard';

interface AgentListProps {
  agents: AgentInfo[];
  onAgentSelect?: (agent: AgentInfo) => void;
  selectedAgentId?: string;
  showSearch?: boolean;
  showCategoryFilter?: boolean;
  compact?: boolean;
  maxItems?: number;
}

export function AgentList({ 
  agents, 
  onAgentSelect, 
  selectedAgentId,
  showSearch = true,
  showCategoryFilter = true,
  compact = false,
  maxItems
}: AgentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter agents based on search and category
  const filteredAgents = useMemo(() => {
    let filtered = agents.filter(agent => {
      const matchesSearch = searchTerm === '' || 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.capabilities.some(cap => cap.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || 
        agent.metadata?.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Apply maxItems limit if specified
    if (maxItems && maxItems > 0) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [agents, searchTerm, selectedCategory, maxItems]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(agents.map(agent => agent.metadata?.category || 'general'));
    return Array.from(cats).sort();
  }, [agents]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      {(showSearch || showCategoryFilter) && (
        <div className={`space-y-4 ${compact ? 'sm:space-y-0 sm:flex sm:items-center sm:space-x-3' : 'sm:space-y-0 sm:flex sm:items-center sm:space-x-4'}`}>
          {showSearch && (
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${compact ? 'py-1.5 text-sm' : 'py-2'}`}
              />
            </div>
          )}
          {showCategoryFilter && categories.length > 1 && (
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${compact ? 'py-1.5 text-sm' : 'py-2'}`}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Agent Grid */}
      <div className={`grid gap-4 ${
        compact 
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {filteredAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onSelect={onAgentSelect}
            isSelected={agent.id === selectedAgentId}
            compact={compact}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredAgents.length === 0 && (
        <div className="text-center py-8">
          <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-gray-900">No agents found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search filters.'
              : 'No agents are currently available.'}
          </p>
        </div>
      )}

      {/* Show more indicator if maxItems is limiting results */}
      {maxItems && agents.length > maxItems && filteredAgents.length === maxItems && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Showing {maxItems} of {agents.length} agents
          </p>
        </div>
      )}
    </div>
  );
}