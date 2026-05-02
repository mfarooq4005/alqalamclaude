// ═══════════════════════════════════════════════════════
//  AL Qalam EMS — Auth Store (Zustand)
//  Manages login state, user data, role-based routing
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import { AuthAPI, TokenStorage, SocketService } from '../api';
import { router } from 'expo-router';

export type UserRole =
  | 'super_admin' | 'admin' | 'principal'
  | 'teacher' | 'student' | 'parent'
  | 'accountant' | 'hr_manager' | 'librarian'
  | 'transport_manager' | 'store_keeper'
  | 'exam_controller' | 'receptionist';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  email: string;
  phone?: string;
  profile_photo?: string;
  branch_id?: number;
}

interface AuthState {
  user:         User | null;
  token:        string | null;
  isLoading:    boolean;
  isLoggedIn:   boolean;
  error:        string | null;

  // Actions
  login:        (username: string, password: string) => Promise<boolean>;
  logout:       () => Promise<void>;
  loadSaved:    () => Promise<void>;
  clearError:   () => void;
}

// Role → route mapping
export const roleRoutes: Record<string, string> = {
  super_admin:       '/(admin)',
  admin:             '/(admin)',
  principal:         '/(admin)',
  accountant:        '/(admin)',
  hr_manager:        '/(admin)',
  store_keeper:      '/(admin)',
  librarian:         '/(admin)',
  transport_manager: '/(admin)',
  exam_controller:   '/(admin)',
  receptionist:      '/(admin)',
  teacher:           '/(teacher)',
  student:           '/(student)',
  parent:            '/(parent)',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user:      null,
  token:     null,
  isLoading: false,
  isLoggedIn: false,
  error:     null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await AuthAPI.login(username, password);
      if (res.success && res.data?.token) {
        const { token, user } = res.data;
        await TokenStorage.save(token);
        await TokenStorage.saveUser(user);
        set({ user, token, isLoggedIn: true, isLoading: false });

        // Connect real-time socket
        SocketService.connect();

        // Navigate to correct portal
        const route = roleRoutes[user.role] || '/(student)';
        router.replace(route as any);
        return true;
      } else {
        set({ error: res.data?.error || 'Login failed', isLoading: false });
        return false;
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Connection error. Check internet.';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try { await AuthAPI.logout(); } catch {}
    await TokenStorage.remove();
    SocketService.disconnect();
    set({ user: null, token: null, isLoggedIn: false, isLoading: false });
    router.replace('/(auth)/login');
  },

  loadSaved: async () => {
    set({ isLoading: true });
    try {
      const [token, user] = await Promise.all([
        TokenStorage.get(),
        TokenStorage.getUser(),
      ]);
      if (token && user) {
        set({ token, user, isLoggedIn: true, isLoading: false });
        SocketService.connect();
        const route = roleRoutes[user.role] || '/(student)';
        router.replace(route as any);
      } else {
        set({ isLoading: false });
        router.replace('/(auth)/login');
      }
    } catch {
      set({ isLoading: false });
      router.replace('/(auth)/login');
    }
  },

  clearError: () => set({ error: null }),
}));
