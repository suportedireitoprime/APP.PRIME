import { create } from 'zustand';

export interface InAppPushPayload {
  id?: string;
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
}

interface InAppPushState {
  queue: InAppPushPayload[];
  currentPush: InAppPushPayload | null;
  currentIndex: number;
  totalCount: number;
  showPush: (payload: InAppPushPayload) => void;
  dismissPush: () => void;
}

export const useInAppPushStore = create<InAppPushState>((set, get) => ({
  queue: [],
  currentPush: null,
  currentIndex: 0,
  totalCount: 0,
  showPush: (payload) => {
    set((state) => {
      // Evitar duplicados exatos
      const isDuplicate = state.queue.some(p => p.title === payload.title && p.body === payload.body) ||
        (state.currentPush?.title === payload.title && state.currentPush?.body === payload.body);
      if (isDuplicate) return state;

      if (!state.currentPush) {
        return {
          currentPush: payload,
          queue: [],
          currentIndex: 1,
          totalCount: 1,
        };
      } else {
        const newQueue = [...state.queue, payload];
        return {
          queue: newQueue,
          totalCount: state.currentIndex + newQueue.length,
        };
      }
    });
  },
  dismissPush: () => {
    const { queue, currentIndex } = get();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({
        currentPush: next,
        queue: rest,
        currentIndex: currentIndex + 1,
      });
    } else {
      set({
        currentPush: null,
        queue: [],
        currentIndex: 0,
        totalCount: 0,
      });
    }
  },
}));
