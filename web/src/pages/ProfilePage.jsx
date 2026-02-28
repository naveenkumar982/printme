import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore.js';
import useToastStore from '../stores/toastStore.js';
import api from '../lib/api.js';

export default function ProfilePage() {
    const { user, updateProfile } = useAuthStore();
    const toast = useToastStore();
    const [tab, setTab] = useState('profile');
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [saving, setSaving] = useState(false);

    // Addresses
    const [addresses, setAddresses] = useState([]);
    const [addrLoading, setAddrLoading] = useState(true);
    const [addrForm, setAddrForm] = useState({ label: 'Home', line1: '', line2: '', city: '', state: '', zip: '', country: 'IN' });
    const [editingAddr, setEditingAddr] = useState(null);
    const [showAddrForm, setShowAddrForm] = useState(false);

    // Password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwSaving, setPwSaving] = useState(false);

    useEffect(() => {
        api.get('/addresses')
            .then(({ data }) => setAddresses(data.addresses))
            .finally(() => setAddrLoading(false));
    }, []);

    const handleProfileSave = async () => {
        setSaving(true);
        try {
            await updateProfile({ name });
            toast.success('Profile updated!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handleAddressSave = async () => {
        try {
            if (editingAddr) {
                const { data } = await api.patch(`/addresses/${editingAddr}`, addrForm);
                setAddresses(addresses.map((a) => (a.id === editingAddr ? data.address : a)));
                toast.success('Address updated!');
            } else {
                const { data } = await api.post('/addresses', addrForm);
                setAddresses([...addresses, data.address]);
                toast.success('Address added!');
            }
            resetAddrForm();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save address');
        }
    };

    const handleAddressDelete = async (id) => {
        try {
            await api.delete(`/addresses/${id}`);
            setAddresses(addresses.filter((a) => a.id !== id));
            toast.success('Address deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const editAddress = (addr) => {
        setAddrForm({ label: addr.label, line1: addr.line1, line2: addr.line2 || '', city: addr.city, state: addr.state, zip: addr.zip, country: addr.country });
        setEditingAddr(addr.id);
        setShowAddrForm(true);
    };

    const resetAddrForm = () => {
        setAddrForm({ label: 'Home', line1: '', line2: '', city: '', state: '', zip: '', country: 'IN' });
        setEditingAddr(null);
        setShowAddrForm(false);
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setPwSaving(true);
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword });
            toast.success('Password changed!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Password change failed');
        } finally {
            setPwSaving(false);
        }
    };

    return (
        <div className="page profile-page">
            <h1 className="page-title">My <span className="gradient-text">Profile</span></h1>

            <div className="profile-tabs">
                <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
                    👤 Profile
                </button>
                <button className={`tab ${tab === 'addresses' ? 'active' : ''}`} onClick={() => setTab('addresses')}>
                    📍 Addresses
                </button>
                <button className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
                    🔒 Password
                </button>
            </div>

            {tab === 'profile' && (
                <div className="profile-section">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar">
                            {user?.avatarUrl ? <img src={user.avatarUrl} alt="avatar" /> : <span className="avatar-placeholder">{user?.name?.charAt(0) || '?'}</span>}
                        </div>
                        <div className="profile-info">
                            <h2>{user?.name || 'User'}</h2>
                            <p className="profile-email">{user?.email}</p>
                            <span className="role-badge">{user?.role}</span>
                        </div>
                    </div>
                    <div className="profile-form">
                        <div className="form-group">
                            <label>Name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input value={email} disabled className="input-disabled" />
                            <small className="form-hint">Email cannot be changed</small>
                        </div>
                        <button className="btn btn-primary" onClick={handleProfileSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}

            {tab === 'addresses' && (
                <div className="profile-section">
                    <div className="section-header">
                        <h2>Saved Addresses</h2>
                        {!showAddrForm && (
                            <button className="btn btn-primary btn-sm" onClick={() => setShowAddrForm(true)}>+ Add Address</button>
                        )}
                    </div>

                    {showAddrForm && (
                        <div className="address-form-card">
                            <h3>{editingAddr ? 'Edit Address' : 'New Address'}</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Label</label>
                                    <select value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}>
                                        <option>Home</option>
                                        <option>Work</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Address Line 1</label>
                                <input value={addrForm.line1} onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Address Line 2</label>
                                <input value={addrForm.line2} onChange={(e) => setAddrForm({ ...addrForm, line2: e.target.value })} placeholder="Optional" />
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>City</label><input value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} /></div>
                                <div className="form-group"><label>State</label><input value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>ZIP</label><input value={addrForm.zip} onChange={(e) => setAddrForm({ ...addrForm, zip: e.target.value })} /></div>
                                <div className="form-group"><label>Country</label><input value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} /></div>
                            </div>
                            <div className="form-actions">
                                <button className="btn btn-primary" onClick={handleAddressSave}>
                                    {editingAddr ? 'Update' : 'Save'}
                                </button>
                                <button className="btn btn-ghost" onClick={resetAddrForm}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {addrLoading ? (
                        <div className="loading-spinner">Loading...</div>
                    ) : addresses.length === 0 ? (
                        <div className="empty-state-sm">
                            <p>No saved addresses yet</p>
                        </div>
                    ) : (
                        <div className="addresses-grid">
                            {addresses.map((addr) => (
                                <div key={addr.id} className="address-card">
                                    <div className="address-label">{addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '🏢' : '📍'} {addr.label}</div>
                                    <p>{addr.line1}</p>
                                    {addr.line2 && <p>{addr.line2}</p>}
                                    <p>{addr.city}, {addr.state} {addr.zip}</p>
                                    <p>{addr.country}</p>
                                    <div className="address-actions">
                                        <button className="btn btn-ghost btn-sm" onClick={() => editAddress(addr)}>Edit</button>
                                        <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleAddressDelete(addr.id)}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === 'password' && (
                <div className="profile-section">
                    <h2>Change Password</h2>
                    <div className="profile-form narrow">
                        <div className="form-group">
                            <label>Current Password</label>
                            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                        <button className="btn btn-primary" onClick={handlePasswordChange} disabled={pwSaving || !currentPassword || !newPassword}>
                            {pwSaving ? 'Changing...' : 'Change Password'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
