import { create } from 'zustand'
import { supabase } from '../services/supabase'

interface AuthState {
  user: { id: string; email: string } | null
  isAuthenticated: boolean
  loading: boolean
  init: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ user: { id: session.user.id, email: session.user.email! }, isAuthenticated: true })
    }
    set({ loading: false })
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({ user: { id: session.user.id, email: session.user.email! }, isAuthenticated: true })
      } else {
        set({ user: null, isAuthenticated: false })
      }
    })
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signup: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false })
  },
}))
