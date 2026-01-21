import {FC, Key, ReactNode} from 'react';
import type {MenuProps} from 'antd';
import {Menu} from 'antd';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {
  ApiOutlined,
  AuditOutlined,
  CloudServerOutlined,
  ClusterOutlined,
  ContainerOutlined,
  ControlOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  FileTextOutlined,
  FolderOutlined,
  GlobalOutlined,
  LockOutlined,
  NodeIndexOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {Icons} from '@/components/icons'
import {cn} from '@/utils/cn';

interface MemberClusterSidebarProps {
  className?: string;
}

type MenuItem = Required<MenuProps>['items'][number];

const MemberClusterSidebar: FC<MemberClusterSidebarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ memberCluster: string }>();
  const memberClusterName = params.memberCluster || '';

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
    label: ReactNode,
    key: Key,
    icon?: ReactNode,
    children?: MenuItem[],
  ): MenuItem => {
    return {
      key,
      icon,
      children,
      label,
      // type,
    } as MenuItem;
  };

  const menuItems: MenuItem[] = [
    getMenuItem('Overview', 'overview', <Icons.panelsTopLeft width={16} height={16} />),
    getMenuItem('Workload', 'workload-group', <DeploymentUnitOutlined />, [
      getMenuItem('CronJobs', 'workload/cronjobs', <ScheduleOutlined />),
      getMenuItem('DaemonSets', 'workload/daemonsets', <ControlOutlined />),
      getMenuItem('Deployments', 'workload/deployments', <ContainerOutlined />),
      getMenuItem('Jobs', 'workload/jobs', <ControlOutlined />),
      getMenuItem('StatefulSets', 'workload/statefulsets', <DatabaseOutlined />),
    ]),

    getMenuItem('Service', 'service-group', <GlobalOutlined />, [
      getMenuItem('Ingress', 'service/ingress', <CloudServerOutlined />),
      getMenuItem('Services', 'service/services', <ApiOutlined />),
    ]),

    getMenuItem('Config & Storage', 'config-group', <DatabaseOutlined />, [
      getMenuItem('ConfigMaps', 'config/configmaps', <FileTextOutlined />),
      getMenuItem(
        'Persistent Volume Claims',
        'config/persistent-volume-claims',
        <DatabaseOutlined />,
      ),
      getMenuItem('Secrets', 'config/secrets', <LockOutlined />),
    ]),

    getMenuItem('Cluster', 'cluster-group', <ClusterOutlined />, [
      getMenuItem(
        'Cluster Role Bindings',
        'cluster/cluster-role-bindings',
        <SafetyCertificateOutlined />,
      ),
      getMenuItem(
        'Cluster Roles',
        'cluster/cluster-roles',
        <SettingOutlined />,
      ),
      getMenuItem('Events', 'cluster/events', <AuditOutlined />),
      getMenuItem('Namespaces', 'cluster/namespaces', <FolderOutlined />),
      getMenuItem('Nodes', 'cluster/nodes', <NodeIndexOutlined />),
      getMenuItem(
        'Persistent Volumes',
        'cluster/persistent-volumes',
        <DatabaseOutlined />,
      ),
      getMenuItem(
        'Role Bindings',
        'cluster/role-bindings',
        <SafetyCertificateOutlined />,
      ),
      getMenuItem('Roles', 'cluster/roles', <SettingOutlined />),
      getMenuItem(
        'Service Accounts',
        'cluster/service-accounts',
        <TeamOutlined />,
      ),
    ]),
  ];

  // Get current selected key from location
  const getSelectedKey = () => {
    const pathname = location.pathname;
    if (pathname.includes('overview')) return 'overview';

    // Extract the path after member cluster name
    const basePath = `/member-cluster/${memberClusterName}/`;
    if (pathname.startsWith(basePath)) {
      return pathname.slice(basePath.length);
    }

    return 'overview';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const basePath = `/member-cluster/${memberClusterName}`;
    navigate(`${basePath}/${key}`);
  };

  return (
    <div className={cn('w-full', 'h-full', 'overflow-y-auto')}>
      {/* Menu */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          defaultOpenKeys={getDefaultOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </div>
    </div>
  );
};

export default MemberClusterSidebar;
