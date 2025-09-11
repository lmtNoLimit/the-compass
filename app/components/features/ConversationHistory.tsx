import { useState, useEffect } from 'react';

interface Session {
  id: string;
  sessionId?: string; // For backwards compatibility
  userId: string;
  agentId?: string;
  appName: string;
  lastUpdateTime: number;
  createdAt?: string;
  messageCount?: number;
  lastActivity?: string;
  state: Record<string, any>;
  events: any[];
}

interface ConversationHistoryProps {
  onSelectSession?: (sessionId: string) => void;
  selectedAgentId?: string;
}

export function ConversationHistory({
  onSelectSession,
  selectedAgentId,
}: ConversationHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch sessions
  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'list_sessions',
          agentId: selectedAgentId || 'all',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Map the session data to ensure consistent field names
        const mappedSessions = (data.sessions || []).map((session: any) => ({
          ...session,
          sessionId: session.id, // Add sessionId for backwards compatibility
        }));
        setSessions(mappedSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch session details
  const fetchSessionDetails = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_session',
          sessionId,
          agentId: selectedAgentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionDetails(data.session);
        setSelectedSession(sessionId);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a session
  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete_session',
          sessionId,
          agentId: selectedAgentId,
        }),
      });

      if (response.ok) {
        // Refresh sessions list
        await fetchSessions();
        if (selectedSession === sessionId) {
          setSelectedSession(null);
          setSessionDetails(null);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchSessions();
    }
  }, [showHistory, selectedAgentId]);

  const formatDate = (timestamp: number | string | Date) => {
    let d: Date;
    if (typeof timestamp === 'number') {
      // Convert seconds to milliseconds
      d = new Date(timestamp * 1000);
    } else if (typeof timestamp === 'string') {
      d = new Date(timestamp);
    } else {
      d = timestamp;
    }
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>History</span>
        {sessions.length > 0 && (
          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
            {sessions.length}
          </span>
        )}
      </button>

      {/* History Panel */}
      {showHistory && (
        <div className="absolute top-12 right-0 w-96 max-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Session History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <button
              onClick={fetchSessions}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-y-auto max-h-[500px]">
            {isLoading && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading sessions...
              </div>
            )}

            {!isLoading && sessions.length === 0 && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No sessions yet. Start chatting to create history!
              </div>
            )}

            {!isLoading && sessions.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                      selectedSession === session.id
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1"
                        onClick={() => fetchSessionDetails(session.id)}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          Session {session.id.substring(0, 8)}...
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Agent: {session.agentId || selectedAgentId || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Updated: {formatDate(session.lastUpdateTime)}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {onSelectSession && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSession(session.id);
                              setShowHistory(false);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            title="Resume session"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          title="Delete session"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Show session details if selected */}
                    {selectedSession === session.id && sessionDetails && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>Session ID: {sessionDetails.sessionId || sessionDetails.id}</p>
                          {sessionDetails.user_id && <p>User: {sessionDetails.user_id}</p>}
                          {sessionDetails.messages && (
                            <p>Messages: {sessionDetails.messages.length}</p>
                          )}
                          {sessionDetails.status && <p>Status: {sessionDetails.status}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}