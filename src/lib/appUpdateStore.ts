import { create } from 'zustand';

interface AppUpdateState {
  isUpdateRequired: boolean;
  setUpdateRequired: (required: boolean) => void;
}

export const useAppUpdateStore = create<AppUpdateState>((set) => ({
  isUpdateRequired: false,
  setUpdateRequired: (required) => set({ isUpdateRequired: required }),
}));
