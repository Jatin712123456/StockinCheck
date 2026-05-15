import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';
import { getProfile } from '../services/usersService';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,

  async loadSession() {
    set({ isLoading: true });
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session?.user) {
        const profile = await getProfile(session.user.id).catch(() => null);
        set({ user: session.user, profile });
      } else {
        set({ user: null, profile: null });
      }
    } finally {
      set({ isLoading: false });
    }

    // Keep state in sync with future auth events.
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await getProfile(session.user.id).catch(() => null);
        set({ user: session.user, profile });
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    const profile = await getProfile(data.user.id).catch(() => null);
    set({ user: data.user, profile });
    return data.user;
  },

  async logout() {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  setProfile(profile) {
    set({ profile });
  },

  isAdmin() {
    return get().profile?.role === 'admin';
  },
}));
