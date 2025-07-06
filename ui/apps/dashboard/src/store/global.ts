import { create } from 'zustand';

type GlobalState = {
  karmadaTerminalOpen: boolean;
  toggleKarmadaTerminal: () => void;
  setKarmadaTerminalOpen: (isOpen: boolean) => void;
};

export const useGlobalStore = create<GlobalState>((set) => ({
  karmadaTerminalOpen: false,
  toggleKarmadaTerminal: () =>
    set((state) => ({ karmadaTerminalOpen: !state.karmadaTerminalOpen })),
  setKarmadaTerminalOpen: (isOpen) => set({ karmadaTerminalOpen: isOpen }),
}));
