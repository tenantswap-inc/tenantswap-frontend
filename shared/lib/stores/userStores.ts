import { create } from "zustand";
import { SwapRequest } from "../../types";

interface UserStore {
  user: SwapRequest | null;
  setUser: (user: SwapRequest | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
