import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitializing: false,
      setUser: (user) => set({ user }),

      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, refreshToken, user } = response.data;

          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.message || 'Login failed'
          };
        }
      },

      register: async (email, password) => {
        try {
          const response = await api.post('/auth/register', { email, password });
          const { token, refreshToken, user } = response.data;

          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.message || 'Registration failed'
          };
        }
      },

      logout: async () => {
        const token = get().token;
        if (token) {
          try {
            await api.post('/auth/logout');
          } catch (error) {
            console.error('Logout error:', error);
          }
        }

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false
        });

        delete api.defaults.headers.common['Authorization'];
      },

      refreshAccessToken: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) return false;

        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;

          set({
            token,
            refreshToken: newRefreshToken
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      initialize: async () => {
        set({ isInitializing: true });

        const token = get().token;
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          try {
            // 验证token是否有效
            await get().fetchCurrentUser();
          } catch (error) {
            console.error('Token validation failed:', error);
            // Token无效，清除认证状态
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false
            });
            delete api.defaults.headers.common['Authorization'];
          }
        }

        set({ isInitializing: false });
      },

      fetchCurrentUser: async () => {
        try {
          const response = await api.get('/users/me');
          const currentUser = response.data.user;
          if (currentUser) {
            set({ user: currentUser, isAuthenticated: true });
          }
          return currentUser;
        } catch (error) {
          if (error.response?.status === 401) {
            set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
            delete api.defaults.headers.common['Authorization'];
          }
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);