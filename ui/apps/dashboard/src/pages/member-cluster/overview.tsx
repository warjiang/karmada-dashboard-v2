import { useMemberClusterContext } from './hooks';
import { useQuery } from '@tanstack/react-query';
import {
  GetMemberClusterNodes,
  Node,
} from '@/services/member-cluster/node.ts';
import {
  GetMemberClusterPods,
} from '@/services/member-cluster/pod.ts';

// NOTE: allocatedResources.cpuFraction / memoryFraction on each node
// is already a percentage value (0-100) computed by backend.
// For member-cluster overview we approximate the cluster-level
// utilization as the average of all node fractions.
function computeClusterCpuUsage(nodes: Node[] | undefined): number | null {
  if (!nodes || nodes.length === 0) return null;
  const fractions = nodes
    .map((n) => n.allocatedResources?.cpuFraction)
    .filter((v): v is number => typeof v === 'number');
  if (!fractions.length) return null;
  const sum = fractions.reduce((acc, v) => acc + v, 0);
  return Math.round(sum / fractions.length);
}

function computeClusterMemoryUsage(nodes: Node[] | undefined): number | null {
  if (!nodes || nodes.length === 0) return null;
  const fractions = nodes
    .map((n) => n.allocatedResources?.memoryFraction)
    .filter((v): v is number => typeof v === 'number');
  if (!fractions.length) return null;
  const sum = fractions.reduce((acc, v) => acc + v, 0);
  return Math.round(sum / fractions.length);
}

export default function MemberClusterOverview() {
  const { memberClusterName } = useMemberClusterContext();

  const {
    data: nodeData,
    isLoading: nodesLoading,
  } = useQuery({
    queryKey: [memberClusterName, 'GetMemberClusterNodesOverview'],
    queryFn: async () => {
      const ret = await GetMemberClusterNodes({ memberClusterName });
      return ret;
    },
  });

  const {
    data: podData,
    isLoading: podsLoading,
  } = useQuery({
    queryKey: [memberClusterName, 'GetMemberClusterPodsOverview'],
    queryFn: async () => {
      const ret = await GetMemberClusterPods({ memberClusterName });
      return ret;
    },
  });

  const nodes = nodeData?.nodes ?? [];
  const nodeCount = nodeData?.listMeta?.totalItems ?? nodes.length ?? 0;
  const totalPods = podData?.listMeta?.totalItems ?? podData?.pods?.length ?? 0;

  const cpuUsage = computeClusterCpuUsage(nodes);
  const memoryUsage = computeClusterMemoryUsage(nodes);

  const loading = nodesLoading || podsLoading;

  const kubeVersion = nodes[0]?.nodeInfo?.kubeletVersion ?? '-';

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
            <span className="font-medium">Sync Mode:</span> -
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
            {loading ? '...' : cpuUsage !== null ? `${cpuUsage}%` : '-'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Memory Usage</h3>
          <p className="text-2xl font-bold text-red-600">
            {loading ? '...' : memoryUsage !== null ? `${memoryUsage}%` : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
