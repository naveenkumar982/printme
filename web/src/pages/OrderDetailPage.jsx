import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import useCartStore from '../stores/cartStore.js';
import useToastStore from '../stores/toastStore.js';

const STATUS_STEPS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const STATUS_COLORS = { PENDING: '#fdcb6e', PAID: '#00cec9', PROCESSING: '#6c5ce7', SHIPPED: '#a29bfe', DELIVERED: '#00b894', CANCELLED: '#ff7675', REFUNDED: '#fab1cc' };

export default function OrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToastStore();
    const addItem = useCartStore((s) => s.addItem);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/orders/${id}`)
            .then(({ data }) => setOrder(data.order))
            .catch(() => navigate('/orders'))
            .finally(() => setLoading(false));
    }, [id]);

    const cancelOrder = async () => {
        try {
            await api.post(`/orders/${id}/cancel`);
            setOrder({ ...order, status: 'CANCELLED' });
            toast.success('Order cancelled');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Cancel failed');
        }
    };

    const reorder = () => {
        order.items?.forEach((item) => {
            if (item.sku) {
                addItem(item.sku, item.sku.product || { name: 'Product' }, item.quantity);
            }
        });
        toast.success('Items added to cart!');
        navigate('/cart');
    };

    if (loading) return <div className="page"><div className="loading-spinner">Loading...</div></div>;
    if (!order) return null;

    const currentStepIndex = STATUS_STEPS.indexOf(order.status);
    const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';

    return (
        <div className="page order-detail-page">
            <Link to="/orders" className="back-link">← Back to Orders</Link>

            <div className="order-detail-header">
                <div>
                    <h1 className="page-title">Order <span className="gradient-text">#{order.id.slice(-8)}</span></h1>
                    <p className="order-date">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <span className="status-badge status-badge-lg" style={{ background: STATUS_COLORS[order.status] || '#6a6a82' }}>
                    {order.status}
                </span>
            </div>

            {/* Status Timeline */}
            {!isCancelled && (
                <div className="status-timeline">
                    {STATUS_STEPS.map((step, i) => (
                        <div key={step} className={`timeline-step ${i <= currentStepIndex ? 'completed' : ''} ${i === currentStepIndex ? 'current' : ''}`}>
                            <div className="timeline-dot">
                                {i < currentStepIndex ? '✓' : i === currentStepIndex ? '●' : '○'}
                            </div>
                            <span className="timeline-label">{step}</span>
                            {i < STATUS_STEPS.length - 1 && <div className={`timeline-line ${i < currentStepIndex ? 'filled' : ''}`}></div>}
                        </div>
                    ))}
                </div>
            )}

            {isCancelled && (
                <div className="cancelled-banner">
                    <span>⚠️</span> This order has been {order.status.toLowerCase()}.
                </div>
            )}

            {/* Order Items */}
            <div className="order-detail-section">
                <h2>Items ({order.items?.length || 0})</h2>
                <div className="order-items-list">
                    {order.items?.map((item) => (
                        <div key={item.id} className="order-item-detail">
                            <div className="order-item-image">📦</div>
                            <div className="order-item-info">
                                <h3>{item.sku?.product?.name || 'Product'}</h3>
                                <p>{item.sku?.size} / {item.sku?.color}</p>
                            </div>
                            <div className="order-item-qty">×{item.quantity}</div>
                            <div className="order-item-price">₹{item.unitPrice * item.quantity}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div className="order-detail-grid">
                <div className="order-detail-section">
                    <h2>Shipping Address</h2>
                    {order.address ? (
                        <div className="order-address">
                            <p>{order.address.line1}</p>
                            {order.address.line2 && <p>{order.address.line2}</p>}
                            <p>{order.address.city}, {order.address.state} {order.address.zip}</p>
                            <p>{order.address.country}</p>
                        </div>
                    ) : (
                        <p className="text-muted">No address on record</p>
                    )}
                </div>
                <div className="order-detail-section">
                    <h2>Payment Summary</h2>
                    <div className="order-summary-table">
                        <div className="summary-row"><span>Subtotal</span><span>₹{order.totalAmount}</span></div>
                        <div className="summary-row"><span>Shipping</span><span>Free</span></div>
                        <div className="summary-row total"><span>Total</span><span>₹{order.totalAmount}</span></div>
                    </div>
                    {order.stripePaymentId && (
                        <p className="payment-id">Payment ID: {order.stripePaymentId}</p>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="order-detail-actions">
                {order.status === 'PENDING' && (
                    <button className="btn btn-outline" onClick={cancelOrder}>Cancel Order</button>
                )}
                <button className="btn btn-primary" onClick={reorder}>🔄 Reorder</button>
            </div>
        </div>
    );
}
