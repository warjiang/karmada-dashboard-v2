import { useParams, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Panel from '@/components/panel';

export default function MemberCluster() {
  const params = useParams<{
    memberCluster: string;
  }>();

  const memberClusterName = params.memberCluster || '';

  // Log the member cluster name for debugging
  useEffect(() => {
    console.log('Member cluster name:', memberClusterName);
  }, [memberClusterName]);

  return (
    <Panel>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Member Cluster: {memberClusterName}
        </h1>
        <p className="text-gray-600">
          Manage and monitor member cluster resources and configuration
        </p>
      </div>

      <div className="member-cluster-content">
        <Outlet context={{ memberClusterName }} />
      </div>
    </Panel>
  );
}