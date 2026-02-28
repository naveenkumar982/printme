import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './stores/authStore.js';
import useWishlistStore from './stores/wishlistStore.js';
import Navbar from './components/Navbar.jsx';
import Toast from './components/Toast.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import DesignStudioPage from './pages/DesignStudioPage.jsx';
import MyDesignsPage from './pages/MyDesignsPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';

function HomePage() {
    return (
        <div className="page home-page">
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-badge">✨ Design. Print. Deliver.</div>
                    <h1 className="hero-title">
                        Create <span className="gradient-text">Custom Prints</span> That Stand Out
                    </h1>
                    <p className="hero-subtitle">
                        Upload your designs, choose your products, and get premium quality prints
                        delivered to your doorstep. From t-shirts to posters — make it yours.
                    </p>
                    <div className="hero-actions">
                        <a href="/design-studio" className="btn btn-lg btn-primary">
                            Start Designing
                            <span className="btn-arrow">→</span>
                        </a>
                        <a href="#how-it-works" className="btn btn-lg btn-ghost">
                            See How It Works
                        </a>
                    </div>
                    <div className="hero-stats">
                        <div className="stat"><span className="stat-value">10K+</span><span className="stat-label">Designs Created</span></div>
                        <div className="stat"><span className="stat-value">50+</span><span className="stat-label">Products</span></div>
                        <div className="stat"><span className="stat-value">4.9★</span><span className="stat-label">Rating</span></div>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="hero-card card-1"><div className="card-mockup tshirt">👕</div><span>Custom T-Shirts</span></div>
                    <div className="hero-card card-2"><div className="card-mockup mug">☕</div><span>Printed Mugs</span></div>
                    <div className="hero-card card-3"><div className="card-mockup poster">🖼️</div><span>Art Posters</span></div>
                </div>
            </section>

            <section id="how-it-works" className="section how-it-works">
                <h2 className="section-title">How It Works</h2>
                <p className="section-subtitle">Three simple steps to your custom print</p>
                <div className="steps-grid">
                    <div className="step-card"><div className="step-number">01</div><div className="step-icon">🎨</div><h3>Design</h3><p>Use our built-in design studio or upload your own artwork.</p></div>
                    <div className="step-card"><div className="step-number">02</div><div className="step-icon">🛒</div><h3>Choose Product</h3><p>Pick from t-shirts, mugs, posters, phone cases and more.</p></div>
                    <div className="step-card"><div className="step-number">03</div><div className="step-icon">📦</div><h3>Get It Delivered</h3><p>We print with premium quality and ship right to your door.</p></div>
                </div>
            </section>

            <section id="products" className="section products-preview">
                <h2 className="section-title">Popular Products</h2>
                <p className="section-subtitle">Start with our bestsellers</p>
                <div className="products-grid">
                    {['T-Shirts', 'Hoodies', 'Mugs', 'Posters', 'Phone Cases', 'Tote Bags'].map((product) => (
                        <div key={product} className="product-card">
                            <div className="product-image">
                                <span className="product-emoji">
                                    {product === 'T-Shirts' ? '👕' : product === 'Hoodies' ? '🧥' : product === 'Mugs' ? '☕' : product === 'Posters' ? '🖼️' : product === 'Phone Cases' ? '📱' : '👜'}
                                </span>
                            </div>
                            <h3 className="product-name">{product}</h3>
                            <p className="product-price">From ₹299</p>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <span className="brand-icon">🖨️</span>
                        <span className="brand-text">Print<span className="brand-accent">ME</span></span>
                        <p className="footer-tagline">Custom printing, simplified.</p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-col"><h4>Product</h4><a href="/products">Catalogue</a><a href="/design-studio">Design Studio</a><a href="#">Templates</a></div>
                        <div className="footer-col"><h4>Company</h4><a href="#">About</a><a href="#">Contact</a><a href="#">Careers</a></div>
                        <div className="footer-col"><h4>Legal</h4><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Refunds</a></div>
                    </div>
                </div>
                <div className="footer-bottom"><p>© 2026 PrintME. All rights reserved.</p></div>
            </footer>
        </div>
    );
}

function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) return <div className="loading-spinner">Loading...</div>;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) return <div className="loading-spinner">Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
    return children;
}

function App() {
    const init = useAuthStore((s) => s.init);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const loadWishlistIds = useWishlistStore((s) => s.loadIds);

    useEffect(() => { init(); }, []);
    useEffect(() => { if (isAuthenticated) loadWishlistIds(); }, [isAuthenticated]);

    return (
        <>
            <Navbar />
            <Toast />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/design-studio" element={<ProtectedRoute><DesignStudioPage /></ProtectedRoute>} />
                <Route path="/my-designs" element={<ProtectedRoute><MyDesignsPage /></ProtectedRoute>} />
                <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            </Routes>
        </>
    );
}

export default App;
