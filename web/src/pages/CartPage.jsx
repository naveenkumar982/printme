import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useCartStore from '../stores/cartStore.js';
import useAuthStore from '../stores/authStore.js';
import api from '../lib/api.js';

export default function CartPage() {
    const items = useCartStore((s) => s.items);
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const removeItem = useCartStore((s) => s.removeItem);
    const clear = useCartStore((s) => s.clear);
    const isAuth = useAuthStore((s) => s.isAuthenticated);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [address, setAddress] = useState({ line1: '', city: '', state: '', zip: '' });

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const handleCheckout = async () => {
        if (!isAuth) { navigate('/login'); return; }
        if (!address.line1 || !address.city || !address.state || !address.zip) {
            setError('Please fill in all address fields');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/orders', {
                items: items.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
                address,
                idempotencyKey: `order_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            });
            clear();
            navigate('/orders');
        } catch (err) {
            setError(err.response?.data?.error || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    if (!items.length) {
        return (
            <div className="page cart-page">
                <div className="empty-state">
                    <span className="empty-icon">🛒</span>
                    <h2>Your cart is empty</h2>
                    <p>Explore our products and add items to get started.</p>
                    <Link to="/products" className="btn btn-primary">Browse Products</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page cart-page">
            <h1 className="page-title">Your <span className="gradient-text">Cart</span></h1>
            <div className="cart-layout">
                <div className="cart-items">
                    {items.map((item) => (
                        <div key={item.skuId} className="cart-item">
                            <div className="cart-item-image">📦</div>
                            <div className="cart-item-details">
                                <h3>{item.productName}</h3>
                                <p>{item.size} / {item.color}</p>
                                <p className="cart-item-price">₹{item.price}</p>
                            </div>
                            <div className="qty-control">
                                <button onClick={() => updateQuantity(item.skuId, item.quantity - 1)}>−</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.skuId, item.quantity + 1)}>+</button>
                            </div>
                            <p className="cart-item-total">₹{item.price * item.quantity}</p>
                            <button className="cart-remove" onClick={() => removeItem(item.skuId)}>✕</button>
                        </div>
                    ))}
                </div>
                <div className="cart-summary">
                    <h3>Order Summary</h3>
                    <div className="summary-row"><span>Subtotal</span><span>₹{total}</span></div>
                    <div className="summary-row"><span>Shipping</span><span>Free</span></div>
                    <div className="summary-row total"><span>Total</span><span>₹{total}</span></div>

                    <h4>Shipping Address</h4>
                    {error && <div className="form-error">{error}</div>}
                    <div className="form-group"><input placeholder="Address line 1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} /></div>
                    <div className="form-row">
                        <div className="form-group"><input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></div>
                        <div className="form-group"><input placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><input placeholder="ZIP Code" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} /></div>

                    <button className="btn btn-primary btn-full" onClick={handleCheckout} disabled={loading}>
                        {loading ? 'Placing Order...' : `Place Order — ₹${total}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
