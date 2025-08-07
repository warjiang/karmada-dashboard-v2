import { useMemberClusterContext } from './hooks';

export default function MemberClusterOverview() {
  const { memberClusterName } = useMemberClusterContext();

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Overview for Member Cluster: {memberClusterName}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Current Status</h3>
          <p className="text-2xl font-bold text-green-600">Active</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Node Count</h3>
          <p className="text-2xl font-bold text-blue-600">3</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">CPU Usage</h3>
          <p className="text-2xl font-bold text-orange-600">45%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Memory Usage</h3>
          <p className="text-2xl font-bold text-red-600">62%</p>
        </div>
      </div>
      
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Cluster Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Cluster Name:</span> {memberClusterName}
          </div>
          <div>
            <span className="font-medium">Sync Mode:</span> Push
          </div>
          <div>
            <span className="font-medium">Kubernetes Version:</span> v1.28.0
          </div>
          <div>
            <span className="font-medium">Region:</span> us-west-2
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        🚧 This is a placeholder overview page. The member cluster name "{memberClusterName}" is successfully passed from the parent route.
      </div>
    </div>
  );
}