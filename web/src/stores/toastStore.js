import { create } from 'zustand';

let toastId = 0;

const useToastStore = create((set, get) => ({
    toasts: [],

    addToast: (message, type = 'success', duration = 3000) => {
        const id = ++toastId;
        set({ toasts: [...get().toasts, { id, message, type }] });
        setTimeout(() => {
            set({ toasts: get().toasts.filter((t) => t.id !== id) });
        }, duration);
        return id;
    },

    success: (msg) => get().addToast(msg, 'success'),
    error: (msg) => get().addToast(msg, 'error', 4000),
    info: (msg) => get().addToast(msg, 'info'),

    removeToast: (id) => {
        set({ toasts: get().toasts.filter((t) => t.id !== id) });
    },
}));

export default useToastStore;
