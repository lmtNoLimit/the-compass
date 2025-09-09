import { AgentChat } from '../components/features/AgentChat';

export default function Agent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            AI Agent Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Interact with your deployed Vertex AI agent. Ask questions, get insights, and explore
            capabilities.
          </p>
        </div>

        <AgentChat />

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Tips for using the agent:
          </h3>
          <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>Be specific and clear in your questions</li>
            <li>You can ask follow-up questions in the same session</li>
            <li>{`Use "New Session" to start a fresh conversation`}</li>
            <li>The agent maintains context throughout the session</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
