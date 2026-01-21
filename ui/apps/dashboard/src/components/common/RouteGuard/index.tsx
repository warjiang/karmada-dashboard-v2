import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/components/auth';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = true,
  requiredPermissions = [],
  fallbackPath = '/login',
}) => {
  const { authenticated } = useAuth();
  const location = useLocation();

  // Redirect to login if authentication is required but user is not authenticated
  if (requireAuth && !authenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // TODO: Add permission checking logic here
  // For now, we'll assume all authenticated users have access
  const hasRequiredPermissions = true;

  if (requireAuth && authenticated && !hasRequiredPermissions) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle="You don't have permission to access this resource."
        icon={<LockOutlined />}
        extra={[
          <Button key="back" onClick={() => window.history.back()}>
            Go Back
          </Button>,
          <Button key="home" type="primary" onClick={() => window.location.href = '/'}>
            Go Home
          </Button>,
        ]}
      />
    );
  }

  return <>{children}</>;
};

export default RouteGuard;