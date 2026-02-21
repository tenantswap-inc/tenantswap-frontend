import { create } from "zustand";
import { UnregisteredUser } from "../../types";

interface UnregisteredUserStore {
  user: UnregisteredUser | null;
  setUser: (user: UnregisteredUser | null) => void;
}

export const useUserRegistration = create<UnregisteredUserStore>((set) => ({
  user: null,
  setUser: (user) => set((state) => ({ user: state.user })),
}));
