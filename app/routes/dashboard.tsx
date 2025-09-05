export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your feature validation dashboard. Track your briefs and validations here.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active Briefs</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
          <p className="text-sm text-gray-500 mt-1">No briefs created yet</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Validations</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">0</p>
          <p className="text-sm text-gray-500 mt-1">No validations run</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Success Rate</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">--%</p>
          <p className="text-sm text-gray-500 mt-1">No data available</p>
        </div>
      </div>
    </div>
  );
}