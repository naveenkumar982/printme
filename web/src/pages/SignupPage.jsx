import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore.js';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const register = useAuthStore((s) => s.register);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(email, password, name);
            navigate('/products');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="nav-brand">
                        <span className="brand-icon">🖨️</span>
                        <span className="brand-text">Print<span className="brand-accent">ME</span></span>
                    </Link>
                    <h2>Create Account</h2>
                    <p>Start creating custom prints</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="form-error">{error}</div>}
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars, 1 uppercase, 1 number" required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Log In</Link>
                </p>
            </div>
        </div>
    );
}
