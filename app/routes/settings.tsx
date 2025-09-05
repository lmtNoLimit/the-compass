export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account and application preferences.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Notifications</label>
              <p className="text-sm text-gray-500 mt-1">
                Manage your email notification preferences
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">API Keys</label>
              <p className="text-sm text-gray-500 mt-1">
                Manage your API keys for integrations
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Data Export</label>
              <p className="text-sm text-gray-500 mt-1">
                Export your briefs and validation data
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}