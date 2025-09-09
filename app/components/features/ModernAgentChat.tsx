import { useState, useEffect, useRef } from 'react';
import type { AgentInfo } from '~/types';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  agentId?: string;
}

interface Session {
  id: string;
  userId: string;
  agentId?: string;
  appName: string;
  lastUpdateTime: number;
  state: Record<string, any>;
  events: any[];
  sessionId?: string; // For backwards compatibility
}

interface ModernAgentChatProps {
  agents: AgentInfo[];
  conversation?: any;
  conversationId?: string;
}

export function ModernAgentChat({ agents, conversation, conversationId }: ModernAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableAgents] = useState<AgentInfo[]>(agents);
  const [selectedAgent, setSelectedAgent] = useState<string>(() => {
    const enterpriseAdmin = agents.find((a: AgentInfo) => a.id === 'enterprise-admin');
    return enterpriseAdmin && enterpriseAdmin.status === 'active' ? 'enterprise-admin' : 'demo-agent';
  });
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation and sessions on mount
  useEffect(() => {
    if (conversation && conversationId) {
      // Load conversation from props
      setSessionId(conversationId);
      
      // Parse conversation history (reusing existing parsing logic)
      const sessionMessages: Message[] = [];
      
      const extractTextContent = (content: any): string => {
        if (typeof content === 'string') {
          try {
            const parsed = JSON.parse(content);
            return extractTextContent(parsed);
          } catch {
            return content;
          }
        }
        
        if (content && typeof content === 'object') {
          if (content.content?.parts?.[0]?.text) return content.content.parts[0].text;
          if (content.text) return content.text;
          if (content.message) return content.message;
          if (content.output) return extractTextContent(content.output);
          if (content.response) return extractTextContent(content.response);
          return JSON.stringify(content, null, 2);
        }
        
        return String(content || '');
      };
      
      if (conversation.events) {
        conversation.events.forEach((event: any, index: number) => {
          const userInputFields = ['userInput', 'user_input', 'query', 'input', 'prompt', 'question'];
          let userInput = null;
          for (const field of userInputFields) {
            if (event[field]) {
              userInput = event[field];
              break;
            }
          }
          
          if (userInput && typeof userInput === 'string' && userInput.trim()) {
            sessionMessages.push({
              id: `user-${index}-${Date.now()}`,
              role: 'user',
              content: userInput.trim(),
              timestamp: event.timestamp ? new Date(event.timestamp * 1000) : new Date(),
            });
          }
          
          const outputFields = ['output', 'response', 'result', 'answer', 'reply'];
          let agentOutput = null;
          for (const field of outputFields) {
            if (event[field]) {
              agentOutput = event[field];
              break;
            }
          }
          
          if (agentOutput) {
            const content = extractTextContent(agentOutput);
            if (content && content.trim()) {
              sessionMessages.push({
                id: `agent-${index}-${Date.now()}`,
                role: 'agent',
                content: content.trim(),
                timestamp: event.timestamp ? new Date(event.timestamp * 1000) : new Date(),
                agentId: selectedAgent,
              });
            }
          }
        });
      }
      
      setMessages(sessionMessages);
    }
    
    fetchSessions();
  }, [conversation, conversationId, selectedAgent]);

  // Create a new session when component mounts or agent changes
  useEffect(() => {
    const initSession = async () => {
      if (!selectedAgent || conversationId) return; // Skip if loading specific conversation
      
      try {
        const response = await fetch('/api/chat/session', {
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
              content: "Hello! I'm an Enterprise IT Administrator with over 10 years of experience managing systems at Fortune 500 companies. I can help you understand enterprise IT challenges, security concerns, and procurement processes. What would you like to discuss?",
              timestamp: new Date(),
              agentId: selectedAgent,
            };
            setMessages([welcomeMessage]);
          }
          
          // Refresh sessions after creating new one
          fetchSessions();
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

  // Fetch sessions
  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await fetch('/api/chat/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'list_sessions',
          agentId: selectedAgent || 'all',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const mappedSessions = (data.sessions || []).map((session: any) => ({
          ...session,
          sessionId: session.id,
        }));
        setSessions(mappedSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };


  // Delete a session with optimistic UI updates
  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    // Set deleting state for visual feedback
    setDeletingSessionId(sessionId);

    // Optimistic update: immediately remove the session from UI after a brief delay
    // This allows users to see the visual feedback before removal
    setTimeout(() => {
      const optimisticSessions = sessions.filter(session => session.id !== sessionId);
      setSessions(optimisticSessions);
      setDeletingSessionId(null);
    }, 300);

    // Keep original sessions for potential revert
    const originalSessions = [...sessions];

    try {
      const response = await fetch('/api/chat/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete_session',
          sessionId,
          agentId: selectedAgent,
        }),
      });

      if (!response.ok) {
        // If request failed, revert the optimistic update
        console.error('Failed to delete session, reverting...');
        setSessions(originalSessions);
        setDeletingSessionId(null);
        
        // Show error message to user (you could replace this with a toast notification)
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete session error:', errorData.error || 'Unknown error');
      }
      // If successful, the optimistic update already happened
    } catch (error) {
      console.error('Error deleting session:', error);
      
      // Revert optimistic update on network error
      setSessions(originalSessions);
      setDeletingSessionId(null);
      console.error('Network error: Failed to delete session');
    }
  };

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
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        try {
          const parsedResponse = JSON.parse(data.response);
          
          if (parsedResponse.content && parsedResponse.content.parts && parsedResponse.content.parts[0]) {
            const part = parsedResponse.content.parts[0];
            if (part.text) {
              responseContent = part.text;
            } else if (part.function_call) {
              responseContent = `Function called: ${part.function_call.name}`;
            }
          } else if (parsedResponse.text) {
            responseContent = parsedResponse.text;
          } else if (parsedResponse.message) {
            responseContent = parsedResponse.message;
          } else if (parsedResponse.output) {
            responseContent = typeof parsedResponse.output === 'string' 
              ? parsedResponse.output 
              : JSON.stringify(parsedResponse.output, null, 2);
          } else {
            responseContent = JSON.stringify(parsedResponse, null, 2);
          }
        } catch {
          responseContent = data.response;
        }
      } else if (data.response) {
        responseContent = typeof data.response === 'object'
          ? JSON.stringify(data.response, null, 2)
          : String(data.response);
      } else if (data.output) {
        responseContent = typeof data.output === 'string' ? data.output : JSON.stringify(data.output, null, 2);
      } else if (data.events && Array.isArray(data.events)) {
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

  const handleNewSession = async () => {
    // Clear current session state
    setMessages([]);
    setSessionId(null);
    setLoadingSessionId(null);
    setDeletingSessionId(null);
    
    // Create a new session immediately
    if (!selectedAgent) return;
    
    try {
      const response = await fetch('/api/chat/session', {
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
        console.log(`New session created for ${selectedAgent}:`, data.sessionId);
        
        // Add welcome message for Enterprise Admin
        if (selectedAgent === 'enterprise-admin') {
          const welcomeMessage: Message = {
            id: `agent-welcome-${Date.now()}`,
            role: 'agent',
            content: "Hello! I'm an Enterprise IT Administrator with over 10 years of experience managing systems at Fortune 500 companies. I can help you understand enterprise IT challenges, security concerns, and procurement processes. What would you like to discuss?",
            timestamp: new Date(),
            agentId: selectedAgent,
          };
          setMessages([welcomeMessage]);
        }
        
        // Refresh sessions list
        fetchSessions();
      } else {
        console.error('Failed to create new session');
      }
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId);
    setShowAgentSelector(false);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp * 1000);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    if (sessionDate.getTime() === today.getTime()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (now.getTime() - sessionDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return d.toLocaleDateString([], { weekday: 'short' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const currentAgentInfo = availableAgents.find(a => a.id === selectedAgent);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-gray-900">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chats</h2>
              <button
                onClick={handleNewSession}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="New chat"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            {/* Agent Selector */}
            <div className="relative">
              <button
                onClick={() => setShowAgentSelector(!showAgentSelector)}
                className="w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentAgentInfo?.name || 'Select Agent'}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showAgentSelector && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                  {availableAgents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleAgentChange(agent.id)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        selectedAgent === agent.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{agent.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingSessions ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">No previous chats</div>
            ) : (
              <div className="p-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer mb-1 transition-all duration-300 ${
                      sessionId === session.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    } ${
                      deletingSessionId === session.id 
                        ? 'opacity-50 scale-95 bg-red-50 dark:bg-red-900/20' 
                        : ''
                    } ${
                      loadingSessionId === session.id
                        ? 'opacity-75 bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                    onClick={() => {
                      if (deletingSessionId !== session.id && loadingSessionId !== session.id) {
                        window.location.href = `/conversation/${session.id}`;
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0 flex items-center space-x-2">
                      {loadingSessionId === session.id && (
                        <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      <div className="flex-1">
                        <div className={`text-sm font-medium truncate ${
                          sessionId === session.id 
                            ? 'text-blue-900 dark:text-blue-100' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          Chat {session.id.substring(0, 8)}
                          {sessionId === session.id && (
                            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(session.lastUpdateTime)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      disabled={deletingSessionId === session.id}
                      className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-all ${
                        deletingSessionId === session.id
                          ? 'opacity-100 text-red-500'
                          : 'opacity-0 group-hover:opacity-100 text-gray-400'
                      }`}
                      title={deletingSessionId === session.id ? "Deleting..." : "Delete chat"}
                    >
                      {deletingSessionId === session.id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentAgentInfo?.name || 'AI Assistant'}
              </h1>
              {sessionId && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Session: {sessionId.substring(0, 8)}... • {messages.length} messages
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleNewSession}
            className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Chat</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  How can I help you today?
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {currentAgentInfo?.description || 'Start a conversation with your AI assistant'}
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white ml-auto' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}>
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  </div>
                  <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={sessionId ? "Message..." : "Initializing..."}
                disabled={!sessionId || isLoading}
                className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-800 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
              />
              <button
                type="submit"
                disabled={!sessionId || !inputValue.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}