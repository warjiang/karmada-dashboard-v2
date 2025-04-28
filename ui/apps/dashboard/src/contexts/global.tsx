import { createContext, useContext } from 'react';
import { type StoreApi, useStore } from 'zustand';
import { type UseBoundStoreWithEqualityFn } from 'zustand/traditional';
import { createGlobalStore, type GlobalStore } from '@/stores/global.ts';

export const GlobalContext = createContext<
  UseBoundStoreWithEqualityFn<StoreApi<GlobalStore>>
>(null as unknown as UseBoundStoreWithEqualityFn<StoreApi<GlobalStore>>);

export function GlobalContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const globalStore = useContext(GlobalContext) ?? createGlobalStore();

  return (
    <GlobalContext.Provider value={globalStore}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalStore<U>(selector: (state: GlobalStore) => U) {
  const store = useContext(GlobalContext);
  return useStore(store, selector);
}
