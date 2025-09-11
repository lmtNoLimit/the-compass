import type { AgentInfo } from '~/types';

interface AgentCardProps {
  agent: AgentInfo;
  onSelect?: (agent: AgentInfo) => void;
  isSelected?: boolean;
  showActionButton?: boolean;
  compact?: boolean;
}

export function AgentCard({ 
  agent, 
  onSelect, 
  isSelected = false, 
  showActionButton = true,
  compact = false 
}: AgentCardProps) {
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

  const handleClick = () => {
    if (onSelect) {
      onSelect(agent);
    }
  };

  const cardClasses = `
    bg-white rounded-lg shadow-sm border transition-all
    ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:shadow-md'}
    ${onSelect ? 'cursor-pointer' : ''}
    ${compact ? 'p-4' : 'p-6'}
  `;

  return (
    <div className={cardClasses} onClick={handleClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {agent.metadata?.icon && (
              <span className={compact ? "text-base" : "text-lg"}>
                {agent.metadata.icon}
              </span>
            )}
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
              {agent.name}
            </h3>
          </div>
          <p className={`text-gray-600 ${compact ? 'text-sm mb-2' : 'text-sm mb-4'}`}>
            {compact ? 
              agent.description.length > 100 ? 
                `${agent.description.substring(0, 100)}...` : 
                agent.description
              : agent.description
            }
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
      <div className={`flex flex-wrap gap-2 ${compact ? 'mt-2' : 'mt-4'}`}>
        {agent.capabilities.slice(0, compact ? 2 : 3).map((capability) => (
          <span
            key={capability}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
          >
            {capability}
          </span>
        ))}
        {agent.capabilities.length > (compact ? 2 : 3) && (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-md">
            +{agent.capabilities.length - (compact ? 2 : 3)} more
          </span>
        )}
      </div>

      {/* Action button */}
      {showActionButton && (
        <div className={`pt-4 border-t border-gray-100 ${compact ? 'mt-2' : 'mt-4'}`}>
          <button 
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            {agent.status === 'active' ? 'Select Agent' : 'View Details'}
          </button>
        </div>
      )}
    </div>
  );
}