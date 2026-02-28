import { create } from 'zustand';
import api from '../lib/api.js';

const useDesignStore = create((set, get) => ({
    designs: [],
    currentDesign: null,
    loading: false,

    loadDesigns: async () => {
        set({ loading: true });
        try {
            const { data } = await api.get('/designs');
            set({ designs: data.designs, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    saveDesign: async (designData) => {
        try {
            const { data } = await api.post('/designs', designData);
            set({ designs: [data.design, ...get().designs] });
            return data.design;
        } catch (err) {
            throw err;
        }
    },

    updateDesign: async (id, designData) => {
        try {
            const { data } = await api.patch(`/designs/${id}`, designData);
            set({
                designs: get().designs.map((d) => (d.id === id ? data.design : d)),
                currentDesign: data.design,
            });
            return data.design;
        } catch (err) {
            throw err;
        }
    },

    deleteDesign: async (id) => {
        try {
            await api.delete(`/designs/${id}`);
            set({ designs: get().designs.filter((d) => d.id !== id) });
        } catch (err) {
            throw err;
        }
    },

    setCurrentDesign: (design) => set({ currentDesign: design }),
}));

export default useDesignStore;
