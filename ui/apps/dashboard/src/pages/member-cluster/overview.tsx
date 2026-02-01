import { useMemberClusterContext } from './hooks';
import { useQuery } from '@tanstack/react-query';
import { GetClusterDetail, ClusterDetail } from '@/services/cluster';

export default function MemberClusterOverview() {
  const { memberClusterName } = useMemberClusterContext();

  const { data: clusterResp, isLoading } = useQuery({
    queryKey: ['GetClusterDetail', memberClusterName],
    queryFn: async () => {
      const ret = await GetClusterDetail(memberClusterName);
      return ret;
    },
  });

  const cluster: ClusterDetail | undefined = clusterResp?.data;

  const nodeCount = cluster?.nodeSummary.totalNum ?? 0;
  const totalPods = cluster?.allocatedResources.allocatedPods ?? 0;
  const cpuUsage = cluster?.allocatedResources.cpuFraction ?? null;
  const memoryUsage = cluster?.allocatedResources.memoryFraction ?? null;
  const kubeVersion = cluster?.kubernetesVersion ?? '-';
  const syncMode = cluster?.syncMode ?? '-';
  const loading = isLoading;

  const formatPercentage = (value: number | null) =>
    value !== null ? `${value.toFixed(2)}%` : '-';

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold mb-4">
        Member Cluster({memberClusterName}) Overview
        <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">
          Monitor your Kubernetes cluster health and performance.
        </p>
      </h2>

      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Cluster Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Cluster Name:</span>{' '}
            {memberClusterName}
          </div>
          <div>
            <span className="font-medium">Sync Mode:</span> {syncMode}
          </div>
          <div>
            <span className="font-medium">Kubernetes Version:</span> {kubeVersion}
          </div>
          <div>
            <span className="font-medium">Region:</span> -
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Pods</h3>
          <p className="text-2xl font-bold text-green-600">
            {loading ? '...' : totalPods}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Node Count</h3>
          <p className="text-2xl font-bold text-blue-600">
            {loading ? '...' : nodeCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">CPU Usage</h3>
          <p className="text-2xl font-bold text-orange-600">
            {loading ? '...' : formatPercentage(cpuUsage)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Memory Usage</h3>
          <p className="text-2xl font-bold text-red-600">
            {loading ? '...' : formatPercentage(memoryUsage)}
          </p>
        </div>
      </div>
    </div>
  );
}
