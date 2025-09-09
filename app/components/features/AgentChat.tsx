import { useState, useEffect, useRef } from 'react';
import type { AgentInfo } from '~/types';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  agentId?: string;
}

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('demo-agent');
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/chat');
        if (response.ok) {
          const data = await response.json();
          if (data.agents && Array.isArray(data.agents)) {
            setAvailableAgents(data.agents);
            // Set default to enterprise-admin if available
            const enterpriseAdmin = data.agents.find((a: AgentInfo) => a.id === 'enterprise-admin');
            if (enterpriseAdmin && enterpriseAdmin.status === 'active') {
              setSelectedAgent('enterprise-admin');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };

    fetchAgents();
  }, []);

  // Create a new session when component mounts or agent changes
  useEffect(() => {
    const initSession = async () => {
      if (!selectedAgent) return;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create_session',
            agentId: selectedAgent,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
          console.log(`Session created for ${selectedAgent}:`, data.sessionId);

          // Clear messages when switching agents
          setMessages([]);

          // Add welcome message for Enterprise Admin
          if (selectedAgent === 'enterprise-admin') {
            const welcomeMessage: Message = {
              id: `agent-welcome-${Date.now()}`,
              role: 'agent',
              content:
                "Hello, I'm an Enterprise IT Administrator with over 10 years of experience managing systems at Fortune 500 companies. I can help you understand enterprise IT challenges, security concerns, and procurement processes. What would you like to discuss?",
              timestamp: new Date(),
              agentId: selectedAgent,
            };
            setMessages([welcomeMessage]);
          }
        } else {
          console.error('Failed to create session');
          setSessionId(null);
        }
      } catch (error) {
        console.error('Error creating session:', error);
        setSessionId(null);
      }
    };

    initSession();
  }, [selectedAgent]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !sessionId) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const currentPrompt = inputValue;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'query_session',
          agentId: selectedAgent,
          sessionId: sessionId,
          prompt: currentPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API request failed:', errorData);

        const errorMessage: Message = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: `Error: ${errorData.error || 'Failed to connect to the agent. Please try again.'}`,
          timestamp: new Date(),
          agentId: selectedAgent,
        };

        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      const data = await response.json();

      // Extract the response content
      let responseContent = '';

      if (data.response && typeof data.response === 'string') {
        // Handle string response (could be JSON or plain text)
        try {
          const parsedResponse = JSON.parse(data.response);

          // Extract text from parsed structure
          if (
            parsedResponse.content &&
            parsedResponse.content.parts &&
            parsedResponse.content.parts[0]
          ) {
            const part = parsedResponse.content.parts[0];
            if (part.text) {
              responseContent = part.text;
            } else if (part.function_call) {
              // Handle function calls if needed
              responseContent = `Function called: ${part.function_call.name}`;
            }
          } else if (parsedResponse.text) {
            responseContent = parsedResponse.text;
          } else if (parsedResponse.message) {
            responseContent = parsedResponse.message;
          } else if (parsedResponse.output) {
            responseContent =
              typeof parsedResponse.output === 'string'
                ? parsedResponse.output
                : JSON.stringify(parsedResponse.output, null, 2);
          } else {
            responseContent = JSON.stringify(parsedResponse, null, 2);
          }
        } catch {
          // If not JSON, use as plain text
          responseContent = data.response;
        }
      } else if (data.response) {
        responseContent =
          typeof data.response === 'object'
            ? JSON.stringify(data.response, null, 2)
            : String(data.response);
      } else if (data.output) {
        responseContent =
          typeof data.output === 'string' ? data.output : JSON.stringify(data.output, null, 2);
      } else if (data.events && Array.isArray(data.events)) {
        // Handle SSE events
        const textParts: string[] = [];
        for (const event of data.events) {
          if (event.output && typeof event.output === 'string') {
            textParts.push(event.output);
          } else if (event.text) {
            textParts.push(event.text);
          }
        }
        responseContent = textParts.join('') || JSON.stringify(data.events[0], null, 2);
      } else {
        responseContent = JSON.stringify(data, null, 2);
      }

      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: responseContent,
        timestamp: new Date(),
        agentId: selectedAgent,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error querying agent:', error);

      const errorMessage: Message = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date(),
        agentId: selectedAgent,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    setSessionId(null);
    // Trigger useEffect to create new session
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId);
    setShowAgentSelector(false);
  };

  const currentAgentInfo = availableAgents.find((a) => a.id === selectedAgent);

  return (
    <div className="flex flex-col h-full max-h-[800px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentAgentInfo?.name || 'Agent Assistant'}
            </h2>
            <button
              onClick={() => setShowAgentSelector(!showAgentSelector)}
              className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              Switch Agent
            </button>
          </div>
          {sessionId && (
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Session: {sessionId.substring(0, 8)}...
              </p>
              {currentAgentInfo?.status === 'active' && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
                  Active
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleNewSession}
          className="px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-600"
        >
          New Session
        </button>
      </div>

      {/* Agent Selector */}
      {showAgentSelector && availableAgents.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select an Agent:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleAgentChange(agent.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedAgent === agent.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">{agent.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {agent.description}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {agent.capabilities.slice(0, 3).map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded-full text-gray-600 dark:text-gray-400"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p className="text-lg mb-2">Welcome! 👋</p>
            <p className="text-sm">
              {currentAgentInfo?.description ||
                'Start a conversation with the agent by typing a message below.'}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {message.role === 'user' ? 'You' : currentAgentInfo?.name || 'Agent'}
              </div>
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
              <div className="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-xl"
      >
        <div className="flex space-x-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              sessionId
                ? `Ask ${currentAgentInfo?.name || 'the agent'} something...`
                : 'Initializing session...'
            }
            disabled={!sessionId || isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-500 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={!sessionId || !inputValue.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
