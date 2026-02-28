import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { OrderCardSkeleton } from '../components/Skeleton.jsx';

const STATUS_COLORS = { PENDING: '#fdcb6e', PAID: '#00cec9', PROCESSING: '#6c5ce7', SHIPPED: '#a29bfe', DELIVERED: '#00b894', CANCELLED: '#ff7675', REFUNDED: '#fab1cc' };

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/orders').then(({ data }) => setOrders(data.orders)).finally(() => setLoading(false));
    }, []);

    const cancelOrder = async (id) => {
        try {
            await api.post(`/orders/${id}/cancel`);
            setOrders(orders.map((o) => o.id === id ? { ...o, status: 'CANCELLED' } : o));
        } catch { /* ignore */ }
    };

    if (loading) return (
        <div className="page orders-page">
            <h1 className="page-title">My <span className="gradient-text">Orders</span></h1>
            <div className="orders-list">
                {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}
            </div>
        </div>
    );

    return (
        <div className="page orders-page">
            <h1 className="page-title">My <span className="gradient-text">Orders</span></h1>
            {!orders.length ? (
                <div className="empty-state">
                    <span className="empty-icon">📦</span>
                    <h2>No orders yet</h2>
                    <Link to="/products" className="btn btn-primary">Start Shopping</Link>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map((order) => (
                        <Link to={`/orders/${order.id}`} key={order.id} className="order-card order-card-link">
                            <div className="order-header">
                                <div>
                                    <span className="order-id">#{order.id.slice(-8)}</span>
                                    <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <span className="status-badge" style={{ background: STATUS_COLORS[order.status] || '#6a6a82' }}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="order-items">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="order-item-row">
                                        <span>{item.sku?.product?.name || 'Product'} ({item.sku?.size}/{item.sku?.color})</span>
                                        <span>×{item.quantity}</span>
                                        <span>₹{item.unitPrice * item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="order-footer">
                                <span className="order-total">Total: ₹{order.totalAmount}</span>
                                <span className="order-view-btn">View Details →</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
