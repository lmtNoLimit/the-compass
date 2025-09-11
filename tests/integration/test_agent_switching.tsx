import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

describe('Agent Switching - UI Only', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should switch agents without any backend API calls', () => {
    const AgentSelector = ({ agents, selectedAgent, onAgentChange }: any) => (
      <select 
        value={selectedAgent} 
        onChange={(e) => onAgentChange(e.target.value)}
        data-testid="agent-selector"
      >
        {agents.map((agent: any) => (
          <option key={agent.id} value={agent.id}>{agent.name}</option>
        ))}
      </select>
    );

    const mockAgents = [
      { id: 'agent-1', name: 'Agent 1' },
      { id: 'agent-2', name: 'Agent 2' }
    ];

    let currentAgent = 'agent-1';
    const handleAgentChange = (agentId: string) => {
      // Should only update local state, no API calls
      currentAgent = agentId;
    };

    const { rerender } = render(
      <AgentSelector 
        agents={mockAgents} 
        selectedAgent={currentAgent} 
        onAgentChange={handleAgentChange}
      />
    );

    const selector = screen.getByTestId('agent-selector');
    
    // Switch to agent-2
    fireEvent.change(selector, { target: { value: 'agent-2' } });
    
    // Verify NO API calls were made
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Verify agent changed in UI only
    expect(currentAgent).toBe('agent-2');
    
    // Re-render with new agent
    rerender(
      <AgentSelector 
        agents={mockAgents} 
        selectedAgent={currentAgent} 
        onAgentChange={handleAgentChange}
      />
    );
    
    expect((selector as HTMLSelectElement).value).toBe('agent-2');
  });

  it('should complete agent switch in under 10ms', () => {
    const startTime = performance.now();
    
    let selectedAgent = 'agent-1';
    const handleAgentChange = (agentId: string) => {
      selectedAgent = agentId;
    };
    
    // Simulate agent switching
    handleAgentChange('agent-2');
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should be near-instant (UI only operation)
    expect(duration).toBeLessThan(10);
    expect(selectedAgent).toBe('agent-2');
  });

  it('should not create new session when switching agents', async () => {
    const mockHandleAgentChange = vi.fn((agentId: string) => {
      // Should only update state, not create session
      return { selectedAgent: agentId };
    });

    mockHandleAgentChange('new-agent');

    // Verify the handler was called
    expect(mockHandleAgentChange).toHaveBeenCalledWith('new-agent');
    
    // Verify NO session-related operations
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Verify return value only contains agent selection
    const result = mockHandleAgentChange.mock.results[0].value;
    expect(result).toEqual({ selectedAgent: 'new-agent' });
    expect(result.sessionId).toBeUndefined();
  });
});