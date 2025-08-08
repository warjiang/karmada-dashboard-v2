import { Select, Tag } from "antd";
import { useClusters, useCluster } from "@/hooks/useCluster.ts";
import { useNavigate } from "react-router-dom";

export const KarmadaClusterSelector = () => {
  const { data = [] } = useClusters();
  const { cluster, setCluster } = useCluster();
  const navigate = useNavigate();

  const handleChange = (value: string) => {
    if (value === "control-plane") {
      setCluster("");
      navigate("/overview");
      return;
    }
    navigate(`/member-cluster/${value}/overview`);
  };

  return (
    <Select
      className="min-w-[200px] mr-[10px]"
      size="middle"
      variant="outlined"
      value={cluster || "control-plane"}
      onChange={handleChange}
    >
      <Select.Option value="control-plane">
        <div className="flex flex-row justify-between items-center">
          <span>Karmada</span>
          <Tag color="green" bordered={false}>
            control-plane
          </Tag>
        </div>
      </Select.Option>
      {data.map((cluster) => (
        <Select.Option key={cluster.objectMeta.name} value={cluster.objectMeta.name}>
          <div className="flex flex-row justify-between items-center">
            <span>{cluster.objectMeta.name}</span>
            <Tag color="blue" bordered={false}>
              member-cluster
            </Tag>
          </div>
        </Select.Option>
      ))}
    </Select>
  );
};