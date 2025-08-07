import { useParams, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Row, Col } from 'antd';
import Panel from '@/components/panel';
import MemberClusterSidebar from './components/sidebar';

export default function MemberCluster() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const params = useParams<{
    memberCluster: string;
  }>();

  const memberClusterName = params.memberCluster || '';

  // Log the member cluster name for debugging
  useEffect(() => {
    console.log('Member cluster name:', memberClusterName);
  }, [memberClusterName]);

  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <Panel>
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        <div className="mb-6" style={{ flexShrink: 0 }}>
          <h1 className="text-2xl font-bold mb-2">
            Member Cluster: {memberClusterName}
          </h1>
          <p className="text-gray-600">
            Manage and monitor member cluster resources and configuration
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          flex: 1,
          gap: '16px',
          minHeight: 0
        }}>
          {/* Sidebar */}
          <div style={{ 
            width: sidebarCollapsed ? '80px' : '280px',
            transition: 'width 0.2s',
            flexShrink: 0,
            height: '100%'
          }}>
            <MemberClusterSidebar 
              className="h-full" 
              onCollapse={handleSidebarCollapse}
            />
          </div>
          
          {/* Main Content */}
          <div style={{ 
            flex: 1, 
            minWidth: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div 
              className="member-cluster-content bg-white rounded-lg" 
              style={{ 
                margin: 0, 
                padding: 0,
                border: 'none',
                boxShadow: 'none',
                height: '100%',
                overflow: 'auto',
                flex: 1
              }}
            >
              <Outlet context={{ memberClusterName }} />
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}