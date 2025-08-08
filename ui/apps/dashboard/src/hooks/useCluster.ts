
import { GetClusters } from '@/services/cluster';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

export const useClusters = () => {
  return useQuery({
    queryKey: ['GetClusters'],
    queryFn: async () => {
      const ret = await GetClusters();
      return ret.data.clusters || [];
    },
  });
};

export type ClusterContextType = {
  cluster?: string;
  setCluster: (cluster: string) => void;
};

export const ClusterContext = createContext<ClusterContextType>({
  setCluster: () => {},
});

export const useCluster = () => {
  return useContext(ClusterContext);
};
