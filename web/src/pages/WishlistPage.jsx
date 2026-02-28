import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useWishlistStore from '../stores/wishlistStore.js';
import useCartStore from '../stores/cartStore.js';
import useToastStore from '../stores/toastStore.js';

const EMOJI_MAP = { 't-shirt': '👕', hoodie: '🧥', mug: '☕', poster: '🖼️', 'phone-case': '📱', 'tote-bag': '👜' };

export default function WishlistPage() {
    const { items, loadFull } = useWishlistStore();
    const toggle = useWishlistStore((s) => s.toggle);
    const toast = useToastStore();

    useEffect(() => { loadFull(); }, []);

    const handleRemove = async (productId) => {
        await toggle(productId);
        toast.info('Removed from wishlist');
    };

    return (
        <div className="page wishlist-page">
            <h1 className="page-title">My <span className="gradient-text">Wishlist</span></h1>

            {items.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">💝</span>
                    <h2>Your wishlist is empty</h2>
                    <p>Browse products and tap the heart to save your favorites.</p>
                    <Link to="/products" className="btn btn-primary">Browse Products</Link>
                </div>
            ) : (
                <div className="products-grid catalog-grid">
                    {items.map(({ product, productId }) => (
                        <div key={productId} className="product-card wishlist-card">
                            <button className="wishlist-heart active" onClick={() => handleRemove(productId)}>♥</button>
                            <Link to={`/products/${product.slug}`}>
                                <div className="product-image">
                                    <span className="product-emoji">{EMOJI_MAP[product.slug] || '📦'}</span>
                                </div>
                                <h3 className="product-name">{product.name}</h3>
                                <p className="product-price">From ₹{product.basePrice}</p>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
