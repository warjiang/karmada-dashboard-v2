import React from 'react';
import { Result, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/overview');
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={[
          <Button key="home" type="primary" icon={<HomeOutlined />} onClick={handleGoHome}>
            Back Home
          </Button>,
          <Button key="back" onClick={handleGoBack}>
            Go Back
          </Button>,
        ]}
      />
    </div>
  );
}