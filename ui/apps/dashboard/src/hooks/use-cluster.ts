
import { GetClusters } from '@/services/cluster';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';

export const useClusters = () => {
  return useQuery({
    queryKey: ['GetClusters'],
    queryFn: async () => {
      const ret = await GetClusters();
      return ret?.data?.clusters || [];
    },
  });
};

export type ClusterContextType = {
  currentCluster: string;
  setCurrentCluster: (currentCluster: string) => void;
};

export const ClusterContext = createContext<ClusterContextType>({
  currentCluster: 'control-plane',
  setCurrentCluster: () => {},
});

export const useCluster = () => {
  return useContext(ClusterContext);
};


type MemberClusterContext = {
  memberClusterName: string;
};

export function useMemberClusterContext(): MemberClusterContext {
  return useOutletContext<MemberClusterContext>();
}