import React from 'react';
import { Result, Button, Space } from 'antd';
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface ResourceNotFoundProps {
  resourceType?: string;
  resourceName?: string;
  memberClusterName?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  showRetryButton?: boolean;
  title?: string;
  subTitle?: string;
}

export const ResourceNotFound: React.FC<ResourceNotFoundProps> = ({
  resourceType = 'Resource',
  resourceName,
  memberClusterName,
  onRetry,
  showHomeButton = true,
  showRetryButton = true,
  title,
  subTitle,
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (memberClusterName) {
      navigate(`/member-cluster/${memberClusterName}/overview`);
    } else {
      navigate('/overview');
    }
  };

  const defaultTitle = resourceName 
    ? `${resourceType} "${resourceName}" not found`
    : `${resourceType} not found`;

  const defaultSubTitle = memberClusterName
    ? `The requested ${resourceType.toLowerCase()} could not be found in member cluster "${memberClusterName}". It may have been deleted or you may not have permission to access it.`
    : `The requested ${resourceType.toLowerCase()} could not be found. It may have been deleted or you may not have permission to access it.`;

  const actions = [];

  if (showRetryButton && onRetry) {
    actions.push(
      <Button key="retry" icon={<ReloadOutlined />} onClick={onRetry}>
        Try Again
      </Button>
    );
  }

  if (showHomeButton) {
    actions.push(
      <Button key="home" type="primary" icon={<HomeOutlined />} onClick={handleGoHome}>
        {memberClusterName ? 'Back to Cluster Overview' : 'Back to Home'}
      </Button>
    );
  }

  return (
    <Result
      status="404"
      title={title || defaultTitle}
      subTitle={subTitle || defaultSubTitle}
      extra={actions.length > 0 ? <Space>{actions}</Space> : undefined}
    />
  );
};

export default ResourceNotFound;