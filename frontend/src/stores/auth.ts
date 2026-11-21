import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { User } from "@/types"

interface AuthState {
  token: string | null
  user: User | null
  setSession: (token: string, user: User) => void
  setUser: (user: User) => void
  logout: () => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      isAdmin: () => get().user?.role?.name === "admin",
    }),
    { name: "posbrew-auth" },
  ),
)
