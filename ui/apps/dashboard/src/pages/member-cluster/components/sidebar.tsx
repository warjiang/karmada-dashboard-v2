import { Menu, Card, Button } from 'antd';
import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  AppstoreOutlined,
  ApiOutlined, 
  DatabaseOutlined, 
  ClusterOutlined,
  ScheduleOutlined,
  DeploymentUnitOutlined,
  ContainerOutlined,
  ControlOutlined,
  GlobalOutlined,
  CloudServerOutlined,
  FolderOutlined,
  LockOutlined,
  SettingOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  NodeIndexOutlined,
  AuditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

interface MemberClusterSidebarProps {
  className?: string;
  onCollapse?: (collapsed: boolean) => void;
}

type MenuItem = Required<MenuProps>['items'][number];

export default function MemberClusterSidebar({ className, onCollapse }: MemberClusterSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ memberCluster: string }>();
  const memberClusterName = params.memberCluster || '';

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapse?.(newCollapsed);
  };

  // Get open keys based on current route - only open the group that contains the active item
  const getDefaultOpenKeys = () => {
    const pathname = location.pathname;
    if (pathname.includes('/workload/')) return ['workload-group'];
    if (pathname.includes('/service/')) return ['service-group'];
    if (pathname.includes('/config/')) return ['config-group'];
    if (pathname.includes('/cluster/')) return ['cluster-group'];
    return []; // No groups open by default
  };

  const getMenuItem = (
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
    type?: 'group',
  ): MenuItem => {
    return {
      key,
      icon,
      children,
      label,
      type,
    } as MenuItem;
  };

  const menuItems: MenuItem[] = [
    getMenuItem('Overview', 'overview', <AppstoreOutlined />),
    
    getMenuItem('Workload', 'workload-group', <DeploymentUnitOutlined />, [
      getMenuItem('CronJobs', 'workload/cronjobs', <ScheduleOutlined />),
      getMenuItem('DaemonSets', 'workload/daemonsets', <ControlOutlined />),
      getMenuItem('Deployments', 'workload/deployments', <ContainerOutlined />),
      getMenuItem('Jobs', 'workload/jobs', <ControlOutlined />)
    ], 'group'),

    getMenuItem('Service', 'service-group', <GlobalOutlined />, [
      getMenuItem('Ingress', 'service/ingress', <CloudServerOutlined />),
      getMenuItem('Services', 'service/services', <ApiOutlined />)
    ], 'group'),

    getMenuItem('Config & Storage', 'config-group', <DatabaseOutlined />, [
      getMenuItem('ConfigMaps', 'config/configmaps', <FileTextOutlined />),
      getMenuItem('Persistent Volume Claims', 'config/persistent-volume-claims', <DatabaseOutlined />),
      getMenuItem('Secrets', 'config/secrets', <LockOutlined />)
    ], 'group'),

    getMenuItem('Cluster', 'cluster-group', <ClusterOutlined />, [
      getMenuItem('Cluster Role Bindings', 'cluster/cluster-role-bindings', <SafetyCertificateOutlined />),
      getMenuItem('Cluster Roles', 'cluster/cluster-roles', <SettingOutlined />),
      getMenuItem('Events', 'cluster/events', <AuditOutlined />),
      getMenuItem('Namespaces', 'cluster/namespaces', <FolderOutlined />),
      getMenuItem('Nodes', 'cluster/nodes', <NodeIndexOutlined />),
      getMenuItem('Persistent Volumes', 'cluster/persistent-volumes', <DatabaseOutlined />),
      getMenuItem('Role Bindings', 'cluster/role-bindings', <SafetyCertificateOutlined />),
      getMenuItem('Roles', 'cluster/roles', <SettingOutlined />),
      getMenuItem('Service Accounts', 'cluster/service-accounts', <TeamOutlined />)
    ], 'group')
  ];

  // Get current selected key from location
  const getSelectedKey = () => {
    const pathname = location.pathname;
    if (pathname.includes('overview')) return 'overview';
    
    // Extract the path after member cluster name
    const basePath = `/member-cluster/${memberClusterName}/`;
    if (pathname.startsWith(basePath)) {
      const subPath = pathname.slice(basePath.length);
      return subPath;
    }
    
    return 'overview';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const basePath = `/member-cluster/${memberClusterName}`;
    navigate(`${basePath}/${key}`);
  };

  return (
    <Card 
      className={className}
      styles={{ body: { padding: 0 } }}
      style={{ height: '100%', width: collapsed ? '80px' : 'auto' }}
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%' 
      }}>
        {/* Collapse Toggle Button */}
        <div style={{ 
          padding: '12px', 
          borderBottom: '1px solid #f0f0f0',
          textAlign: collapsed ? 'center' : 'right'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            style={{ 
              fontSize: '16px',
              width: collapsed ? '100%' : 'auto',
              height: '32px'
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          />
        </div>

        {/* Menu */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[getSelectedKey()]}
            defaultOpenKeys={getDefaultOpenKeys()}
            style={{ 
              border: 'none',
              height: '100%'
            }}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </div>
      </div>
    </Card>
  );
}