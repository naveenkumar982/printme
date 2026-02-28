import { create } from 'zustand';
import api from '../lib/api.js';

const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    // Initialize auth state from stored token
    init: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            set({ isLoading: false });
            return;
        }
        try {
            const { data } = await api.get('/auth/me');
            set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch {
            localStorage.removeItem('accessToken');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('accessToken', data.accessToken);
        set({ user: data.user, isAuthenticated: true });
        return data;
    },

    register: async (email, password, name) => {
        const { data } = await api.post('/auth/register', { email, password, name });
        localStorage.setItem('accessToken', data.accessToken);
        set({ user: data.user, isAuthenticated: true });
        return data;
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch { /* ignore */ }
        localStorage.removeItem('accessToken');
        set({ user: null, isAuthenticated: false });
    },

    updateProfile: async (data) => {
        const { data: res } = await api.patch('/auth/me', data);
        set({ user: res.user });
        return res;
    },
}));

export default useAuthStore;
