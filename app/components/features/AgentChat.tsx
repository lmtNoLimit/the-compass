import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create a new session when component mounts
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetch('/api/agent-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create_session',
            user_id: 'user_' + Date.now(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
          console.log('Session created:', data.sessionId);
        } else {
          console.error('Failed to create session, falling back to demo mode');
          setSessionId('demo_session_' + Date.now());
        }
      } catch (error) {
        console.error('Error creating session, falling back to demo mode:', error);
        setSessionId('demo_session_' + Date.now());
      }
    };

    initSession();
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

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
      // First try the real API if we have a session
      let response;

      if (sessionId && !sessionId.includes('demo')) {
        response = await fetch('/api/agent-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'query_session',
            sessionId: sessionId,
            prompt: currentPrompt,
            user_id: 'user_' + Date.now(),
          }),
        });
      }

      // If no session or real API fails, return error
      if (!response || !response.ok) {
        const errorData = response ? await response.json() : { error: 'No session available' };
        console.error('API request failed:', errorData);

        const errorMessage: Message = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: `Error: ${errorData.error || 'Failed to connect to the agent. Please try again or create a new session.'}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      const data = await response.json();

      // Extract the response content - handle Agent Engine response format
      let responseContent = '';
      if (typeof data === 'string') {
        responseContent = data;
      } else if (data.response) {
        // This is the expected format from Agent Engine with SSE
        responseContent =
          typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
      } else if (data.output) {
        responseContent =
          typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
      } else if (data.result) {
        responseContent =
          typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
      } else if (data.events && Array.isArray(data.events)) {
        // Handle SSE events from Agent Engine
        // Process all events to extract text responses
        const textParts: string[] = [];
        for (const event of data.events) {
          if (event.output) {
            if (typeof event.output === 'string') {
              textParts.push(event.output);
            } else if (event.output.text) {
              textParts.push(event.output.text);
            } else if (event.output.message) {
              textParts.push(event.output.message);
            }
          } else if (event.response && typeof event.response === 'string') {
            textParts.push(event.response);
          } else if (event.text) {
            textParts.push(event.text);
          } else if (event.message) {
            textParts.push(event.message);
          }
        }

        if (textParts.length > 0) {
          responseContent = textParts.join('');
        } else {
          // No text found, return structured data
          responseContent = JSON.stringify(data.events[data.events.length - 1], null, 2);
        }
      } else {
        responseContent = JSON.stringify(data, null, 2);
      }

      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error querying agent:', error);

      const errorMessage: Message = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = async () => {
    setMessages([]);
    setSessionId(null);
    try {
      const response = await fetch('/api/agent-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_session',
          user_id: 'user_' + Date.now(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        console.log('New session created:', data.sessionId);
      } else {
        console.error('Failed to create new session');
      }
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[800px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Agent Assistant</h2>
          {sessionId && (
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Session:{' '}
                {(sessionId.includes('/') ? sessionId.split('/').pop() : sessionId)?.substring(
                  0,
                  8
                )}
                ...
              </p>
              {sessionId.includes('demo') && (
                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">
                  Demo Mode
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p className="text-lg mb-2">Welcome! 👋</p>
            <p className="text-sm">
              Start a conversation with the agent by typing a message below.
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
                {message.role === 'user' ? 'You' : 'Agent'}
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
            placeholder={sessionId ? 'Type your message...' : 'Initializing session...'}
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
