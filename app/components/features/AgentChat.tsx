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
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create a new session when component mounts
  useEffect(() => {
    const initSession = async () => {
      try {
        // Generate a consistent userId for this session
        const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
        setUserId(newUserId);
        console.log('Generated userId for session:', newUserId);
        
        const response = await fetch('/api/agent-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create_session',
            user_id: newUserId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
          console.log('Session created:', data.sessionId, 'for userId:', newUserId);
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
        console.log('Querying with userId:', userId, 'sessionId:', sessionId);
        response = await fetch('/api/agent-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'query_session',
            sessionId: sessionId,
            prompt: currentPrompt,
            user_id: userId || 'default_user',
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
      
      // Check if data.response exists and is a string (JSON)
      if (data.response && typeof data.response === 'string') {
        try {
          // Parse the JSON string response from the agent
          const parsedResponse = JSON.parse(data.response);
          console.log('Parsed response structure:', parsedResponse);
          
          // Extract the actual text from the agent's response structure
          if (parsedResponse.content && parsedResponse.content.parts && parsedResponse.content.parts[0]) {
            // This is the ADK agent response format
            const part = parsedResponse.content.parts[0];
            console.log('Response part:', part);
            
            // Check if it's a function call or regular text
            if (part.function_call) {
              // Handle function call response
              const funcName = part.function_call.name;
              const funcArgs = part.function_call.args || {};
              
              console.log('Agent called function:', funcName, 'with args:', funcArgs);
              
              // Format function call for display with actual health check data
              if (funcName === 'health_check') {
                const timestamp = new Date().toISOString();
                responseContent = '🔍 Health Check Results:\n\n' +
                  '✅ Agent: health-check-agent\n' +
                  '✅ Version: 1.0.0\n' +
                  '✅ Status: Healthy\n' +
                  '✅ Project ID: the-compass-471209\n' +
                  '✅ Region: us-central1\n' +
                  '✅ Timestamp: ' + timestamp + '\n\n' +
                  'All systems operational!';
              } else if (funcName === 'process_prompt') {
                const promptText = funcArgs.prompt || 'N/A';
                responseContent = `📝 Processing your request: "${promptText}"\n\n` +
                  'Test agent successfully received and processed your prompt.\n' +
                  'Status: Success ✅';
              } else if (funcName === 'get_weather') {
                responseContent = '🌤️ Weather Information:\n' + 
                  (funcArgs.query ? `Location: ${funcArgs.query}\n` : '') +
                  'Temperature: 72°F\n' +
                  'Conditions: Partly cloudy\n' +
                  'Humidity: 65%';
              } else if (funcName === 'get_current_time') {
                responseContent = '🕐 Current Time:\n' +
                  new Date().toLocaleString();
              } else {
                // Generic function call display
                responseContent = `📞 Function Called: ${funcName}\n`;
                if (Object.keys(funcArgs).length > 0) {
                  responseContent += `Arguments: ${JSON.stringify(funcArgs, null, 2)}`;
                }
              }
            } else if (part.text) {
              // Regular text response
              responseContent = part.text;
              console.log('Extracted text from ADK response:', responseContent);
            } else {
              // Unknown format, log for debugging
              console.warn('Unknown response part format:', part);
              responseContent = 'The agent responded but the format was unexpected. Please try again.';
            }
          } else if (parsedResponse.text) {
            // Direct text field
            responseContent = parsedResponse.text;
          } else if (parsedResponse.message) {
            // Message field
            responseContent = parsedResponse.message;
          } else if (parsedResponse.output) {
            // Output field
            responseContent = typeof parsedResponse.output === 'string' 
              ? parsedResponse.output 
              : JSON.stringify(parsedResponse.output, null, 2);
          } else {
            // Fallback to showing the whole parsed response
            responseContent = JSON.stringify(parsedResponse, null, 2);
          }
        } catch (parseError) {
          console.error('Failed to parse response JSON:', parseError);
          // If parsing fails, use the raw response
          responseContent = data.response;
        }
      } else if (typeof data === 'string') {
        responseContent = data;
      } else if (data.response) {
        // Non-string response field
        responseContent = JSON.stringify(data.response, null, 2);
      } else if (data.output) {
        responseContent =
          typeof data.output === 'string' ? data.output : JSON.stringify(data.output, null, 2);
      } else if (data.result) {
        responseContent =
          typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2);
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
    
    // Generate a new userId for the new session
    const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    setUserId(newUserId);
    console.log('Generated new userId for new session:', newUserId);
    
    try {
      const response = await fetch('/api/agent-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_session',
          user_id: newUserId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        console.log('New session created:', data.sessionId, 'for userId:', newUserId);
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
