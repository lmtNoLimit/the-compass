export default function History() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">History</h1>
        <p className="mt-2 text-gray-600">
          View your past validations and brief history.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">No history available yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Your validation history will appear here once you start creating briefs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}