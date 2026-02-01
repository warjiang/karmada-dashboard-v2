import { Select, Tag } from 'antd';
import { useClusters, useCluster } from '@/hooks';
import { useNavigate, useParams } from 'react-router-dom';

export const KarmadaClusterSelector = () => {
  const { data = [] } = useClusters();
  const { setCurrentCluster } = useCluster();
  const navigate = useNavigate();
  const params = useParams<{
    memberCluster: string;
  }>();
  const handleChange = (value: string) => {
    if (value === 'control-plane') {
      navigate('/overview');
      return;
    }
    setCurrentCluster(value)
    navigate(`/member-cluster/${value}/overview`);
  };

  return (
    <Select
      className="min-w-[230px] mr-[10px]"
      size="middle"
      variant="outlined"
      value={params.memberCluster || 'control-plane'}
      onChange={handleChange}
    >
      <Select.Option value="control-plane">
        <div className="flex flex-row justify-between items-center">
          <span className="mr-[2]">Karmada</span>
          <Tag color="green" bordered={false}>
            control-plane
          </Tag>
        </div>
      </Select.Option>
      {data.map((cluster) => (
        <Select.Option
          key={cluster.objectMeta.name}
          value={cluster.objectMeta.name}
        >
          <div className="flex flex-row justify-between items-center">
            <span className="mr-[2]">{cluster.objectMeta.name}</span>
            <Tag color="blue" bordered={false}>
              member-cluster
            </Tag>
          </div>
        </Select.Option>
      ))}
    </Select>
  );
};
