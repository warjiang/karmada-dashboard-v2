import { useMemberClusterContext } from '@/hooks';
import { useQuery } from '@tanstack/react-query';
import { GetClusterDetail, ClusterDetail } from '@/services/cluster';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function MemberClusterOverview() {
  const { memberClusterName } = useMemberClusterContext();
  const { data: clusterResp, isLoading } = useQuery({
    queryKey: ['GetClusterDetail', memberClusterName],
    queryFn: async () => {
      const ret = await GetClusterDetail(memberClusterName);
      return ret;
    },
  });

  const clusterDetail: ClusterDetail | undefined = clusterResp?.data;

  const nodeCount = clusterDetail?.nodeSummary.totalNum ?? 0;
  const totalPods = clusterDetail?.allocatedResources.allocatedPods ?? 0;
  const cpuUsage = clusterDetail?.allocatedResources.cpuFraction ?? null;
  const memoryUsage = clusterDetail?.allocatedResources.memoryFraction ?? null;
  const kubeVersion = clusterDetail?.kubernetesVersion ?? '-';
  const syncMode = clusterDetail?.syncMode ?? '-';
  const loading = isLoading;

  const formatPercentage = (value: number | null) =>
    value !== null ? `${value.toFixed(2)}%` : '-';

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Member Cluster ({memberClusterName}) Overview
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor your Kubernetes cluster health and performance.
            </p>
          </div>
        </div>
        <Separator />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Cluster Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cluster Name</p>
              <p className="font-medium break-all">{memberClusterName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Sync Mode</p>
              <p className="font-medium">{syncMode}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Kubernetes Version</p>
              <p className="font-medium">{kubeVersion}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Region</p>
              <p className="font-medium">-</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-green-600">{totalPods}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Node Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-blue-600">{nodeCount}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-orange-600">
                {formatPercentage(cpuUsage)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-red-600">
                {formatPercentage(memoryUsage)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
