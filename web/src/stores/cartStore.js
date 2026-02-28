import { create } from 'zustand';

const useCartStore = create((set, get) => ({
    items: JSON.parse(localStorage.getItem('cart') || '[]'),

    addItem: (sku, product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.skuId === sku.id);

        let updated;
        if (existing) {
            updated = items.map((i) =>
                i.skuId === sku.id ? { ...i, quantity: i.quantity + quantity } : i
            );
        } else {
            updated = [...items, {
                skuId: sku.id,
                productName: product.name,
                size: sku.size,
                color: sku.color,
                price: sku.price,
                quantity,
                imageUrl: product.imageUrl,
            }];
        }

        localStorage.setItem('cart', JSON.stringify(updated));
        set({ items: updated });
    },

    updateQuantity: (skuId, quantity) => {
        if (quantity < 1) return;
        const updated = get().items.map((i) =>
            i.skuId === skuId ? { ...i, quantity } : i
        );
        localStorage.setItem('cart', JSON.stringify(updated));
        set({ items: updated });
    },

    removeItem: (skuId) => {
        const updated = get().items.filter((i) => i.skuId !== skuId);
        localStorage.setItem('cart', JSON.stringify(updated));
        set({ items: updated });
    },

    clear: () => {
        localStorage.removeItem('cart');
        set({ items: [] });
    },

    get total() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    },

    get count() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
    },
}));

export default useCartStore;
