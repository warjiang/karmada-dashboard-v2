import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

export interface GlobalStore {
  isTerminalOpen: boolean;
  setIsTerminalOpen: (isTerminalOpen: boolean) => void;
  get: () => GlobalStore;
  set: (
    partial:
      | GlobalStore
      | Partial<GlobalStore>
      | ((state: GlobalStore) => GlobalStore | Partial<GlobalStore>),
    replace?: boolean | undefined,
  ) => void;
}

export const createGlobalStore = () =>
  createWithEqualityFn<GlobalStore>((set, get) => {
    return {
      isTerminalOpen: false,
      setIsTerminalOpen: (isTerminalOpen: boolean) => {
        set({
          isTerminalOpen,
        });
      },
      get,
      set,
    };
  }, shallow);
