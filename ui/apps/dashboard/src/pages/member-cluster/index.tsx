import { useParams, Outlet } from 'react-router-dom';
import MemberClusterSidebar from './components/sidebar';
import Header from '@/layout/header';
import { Layout as AntdLayout } from 'antd';
import { cn } from '@/utils/cn.ts';
import { getSidebarWidth } from '@/utils/i18n';
import { useWindowSize } from '@uidotdev/usehooks';
import Panel from '@/components/panel';

const { Sider: AntdSider, Content: AntdContent } = AntdLayout;

export default function MemberCluster() {
  const { width } = useWindowSize();
  const isSmallScreen = width !== null && width <= 768;

  const params = useParams<{
    memberCluster: string;
  }>();

  const memberClusterName = params.memberCluster || '';
  // const handleSidebarCollapse = (collapsed: boolean) => {
  // };

  return (
    <>
      {/* header */}
      <Header />

      {/* content */}
      <AntdLayout
        className={cn('h-[calc(100vh-48px)]', 'overflow-hidden', 'flex')}
      >
        <AntdSider
          width={getSidebarWidth()}
          collapsible
          collapsed={isSmallScreen}
          breakpoint="lg"
          trigger={null}
        >
          <MemberClusterSidebar
            className="h-full"
            // onCollapse={handleSidebarCollapse}
          />
        </AntdSider>
        <AntdContent>
          <Panel>
            <Outlet context={{ memberClusterName }} />
          </Panel>
        </AntdContent>
      </AntdLayout>
    </>
  );
}
