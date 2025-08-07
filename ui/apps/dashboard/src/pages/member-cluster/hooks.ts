import { useOutletContext } from 'react-router-dom';

type MemberClusterContext = {
  memberClusterName: string;
};

export function useMemberClusterContext(): MemberClusterContext {
  return useOutletContext<MemberClusterContext>();
}