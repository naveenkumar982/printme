import { useState, useEffect } from 'react';
import api from '../lib/api.js';

const STATUS_COLORS = { PENDING: '#fdcb6e', PAID: '#00cec9', PROCESSING: '#6c5ce7', SHIPPED: '#a29bfe', DELIVERED: '#00b894', CANCELLED: '#ff7675', REFUNDED: '#fab1cc' };

export default function AdminPage() {
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('dashboard');

    useEffect(() => {
        Promise.all([
            api.get('/admin/dashboard'),
            api.get('/admin/orders?limit=50'),
        ]).then(([dashRes, ordersRes]) => {
            setStats(dashRes.data.stats);
            setOrders(ordersRes.data.orders);
        }).finally(() => setLoading(false));
    }, []);

    const updateStatus = async (id, status) => {
        try {
            const { data } = await api.patch(`/admin/orders/${id}/status`, { status });
            setOrders(orders.map((o) => o.id === id ? data.order : o));
        } catch (err) {
            alert(err.response?.data?.error || 'Update failed');
        }
    };

    if (loading) return <div className="page"><div className="loading-spinner">Loading...</div></div>;

    return (
        <div className="page admin-page">
            <h1 className="page-title">Admin <span className="gradient-text">Dashboard</span></h1>

            <div className="admin-tabs">
                <button className={`tab ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
                <button className={`tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Orders</button>
            </div>

            {tab === 'dashboard' && stats && (
                <div className="stats-grid">
                    <div className="stat-card"><span className="stat-value">{stats.orders.total}</span><span className="stat-label">Total Orders</span></div>
                    <div className="stat-card accent"><span className="stat-value">{stats.orders.pending}</span><span className="stat-label">Pending</span></div>
                    <div className="stat-card success"><span className="stat-value">{stats.orders.paid}</span><span className="stat-label">Paid</span></div>
                    <div className="stat-card"><span className="stat-value">{stats.totalUsers}</span><span className="stat-label">Users</span></div>
                    <div className="stat-card"><span className="stat-value">{stats.totalProducts}</span><span className="stat-label">Products</span></div>
                    <div className="stat-card primary"><span className="stat-value">₹{stats.totalRevenue}</span><span className="stat-label">Revenue</span></div>
                </div>
            )}

            {tab === 'orders' && (
                <div className="admin-orders">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>#{order.id.slice(-8)}</td>
                                    <td>{order.user?.email || '—'}</td>
                                    <td>{order.items?.length || 0} items</td>
                                    <td>₹{order.totalAmount}</td>
                                    <td><span className="status-badge" style={{ background: STATUS_COLORS[order.status] }}>{order.status}</span></td>
                                    <td>
                                        <select value="" onChange={(e) => { if (e.target.value) updateStatus(order.id, e.target.value); }}>
                                            <option value="">Update...</option>
                                            {order.status === 'PENDING' && <><option value="PAID">→ Paid</option><option value="CANCELLED">→ Cancelled</option></>}
                                            {order.status === 'PAID' && <><option value="PROCESSING">→ Processing</option><option value="REFUNDED">→ Refunded</option></>}
                                            {order.status === 'PROCESSING' && <><option value="SHIPPED">→ Shipped</option><option value="REFUNDED">→ Refunded</option></>}
                                            {order.status === 'SHIPPED' && <option value="DELIVERED">→ Delivered</option>}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
