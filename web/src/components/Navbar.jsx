import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../stores/authStore.js';
import useCartStore from '../stores/cartStore.js';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        setUserMenuOpen(false);
        navigate('/');
    };

    // Close user menu on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <nav className="nav">
            <Link to="/" className="nav-brand">
                <span className="brand-icon">🖨️</span>
                <span className="brand-text">Print<span className="brand-accent">ME</span></span>
            </Link>

            <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                <span></span><span></span><span></span>
            </button>

            <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
                <Link to="/products" className="nav-link" onClick={() => setMenuOpen(false)}>Products</Link>
                <Link to="/design-studio" className="nav-link" onClick={() => setMenuOpen(false)}>Design Studio</Link>
                {isAuthenticated ? (
                    <>
                        <Link to="/cart" className="nav-link cart-link" onClick={() => setMenuOpen(false)}>
                            🛒 {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </Link>
                        <div className="user-menu-wrapper" ref={userMenuRef}>
                            <button className="user-avatar-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="" className="avatar-img" />
                                ) : (
                                    <span className="avatar-initial">{user?.name?.charAt(0) || '?'}</span>
                                )}
                            </button>
                            {userMenuOpen && (
                                <div className="user-dropdown">
                                    <div className="dropdown-header">
                                        <strong>{user?.name || 'User'}</strong>
                                        <span className="dropdown-email">{user?.email}</span>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>👤 Profile</Link>
                                    <Link to="/my-designs" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>🎨 My Designs</Link>
                                    <Link to="/orders" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>📦 My Orders</Link>
                                    <Link to="/wishlist" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>💝 Wishlist</Link>
                                    {user?.role === 'ADMIN' && (
                                        <Link to="/admin" className="dropdown-item dropdown-admin" onClick={() => setUserMenuOpen(false)}>⚙️ Admin</Link>
                                    )}
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>🚪 Logout</button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link btn-outline" onClick={() => setMenuOpen(false)}>Log In</Link>
                        <Link to="/signup" className="nav-link btn-primary" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
