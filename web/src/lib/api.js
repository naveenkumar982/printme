import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-refresh on 401 (token expired)
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
            original._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject });
                }).then((token) => {
                    original.headers.Authorization = `Bearer ${token}`;
                    return api(original);
                });
            }

            isRefreshing = true;

            try {
                const { data } = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
                localStorage.setItem('accessToken', data.accessToken);

                refreshQueue.forEach(({ resolve }) => resolve(data.accessToken));
                refreshQueue = [];

                original.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(original);
            } catch (refreshError) {
                refreshQueue.forEach(({ reject }) => reject(refreshError));
                refreshQueue = [];
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
