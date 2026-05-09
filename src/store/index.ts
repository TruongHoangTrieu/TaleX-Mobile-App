import create from 'zustand';

type RootState = {
  ready: boolean;
  setReady: (v: boolean) => void;
};

export const useRootStore = create<RootState>((set) => ({
  ready: false,
  setReady: (v) => set({ ready: v }),
}));
