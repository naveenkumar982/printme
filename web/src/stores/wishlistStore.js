import { create } from 'zustand';
import api from '../lib/api.js';

const useWishlistStore = create((set, get) => ({
    wishlistedIds: [],
    items: [],
    loaded: false,

    loadIds: async () => {
        try {
            const { data } = await api.get('/wishlist/ids');
            set({ wishlistedIds: data.productIds, loaded: true });
        } catch {
            set({ loaded: true });
        }
    },

    loadFull: async () => {
        try {
            const { data } = await api.get('/wishlist');
            set({ items: data.wishlist, loaded: true });
            set({ wishlistedIds: data.wishlist.map((w) => w.productId) });
        } catch { /* ignore */ }
    },

    toggle: async (productId) => {
        try {
            const { data } = await api.post(`/wishlist/${productId}`);
            const ids = get().wishlistedIds;
            if (data.wishlisted) {
                set({ wishlistedIds: [...ids, productId] });
            } else {
                set({ wishlistedIds: ids.filter((id) => id !== productId) });
                set({ items: get().items.filter((w) => w.productId !== productId) });
            }
            return data.wishlisted;
        } catch { return null; }
    },

    isWishlisted: (productId) => get().wishlistedIds.includes(productId),
}));

export default useWishlistStore;
