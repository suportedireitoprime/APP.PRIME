import { create } from 'zustand';

export interface InAppPushPayload {
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
}

interface InAppPushState {
  currentPush: InAppPushPayload | null;
  showPush: (payload: InAppPushPayload) => void;
  dismissPush: () => void;
}

export const useInAppPushStore = create<InAppPushState>((set) => ({
  currentPush: null,
  showPush: (payload) => {
    set({ currentPush: payload });
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      set((state) => (state.currentPush === payload ? { currentPush: null } : state));
    }, 6000);
  },
  dismissPush: () => set({ currentPush: null }),
}));
