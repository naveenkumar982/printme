import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useDesignStore from '../stores/designStore.js';
import useToastStore from '../stores/toastStore.js';

export default function MyDesignsPage() {
    const navigate = useNavigate();
    const toast = useToastStore();
    const { designs, loading, loadDesigns, deleteDesign, updateDesign } = useDesignStore();
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    useEffect(() => { loadDesigns(); }, []);

    const handleDelete = async (id) => {
        if (!confirm('Delete this design?')) return;
        try {
            await deleteDesign(id);
            toast.success('Design deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleRename = async (id) => {
        try {
            await updateDesign(id, { name: editName });
            toast.success('Design renamed');
            setEditingId(null);
        } catch {
            toast.error('Rename failed');
        }
    };

    const getThumbFromCanvas = (canvasJson) => {
        try {
            const data = JSON.parse(canvasJson);
            return data.image || null;
        } catch { return null; }
    };

    if (loading) return <div className="page"><div className="loading-spinner">Loading...</div></div>;

    return (
        <div className="page my-designs-page">
            <div className="page-header">
                <h1 className="page-title">My <span className="gradient-text">Designs</span></h1>
                <Link to="/design-studio" className="btn btn-primary">✨ Create New Design</Link>
            </div>

            {designs.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">🎨</span>
                    <h2>No designs yet</h2>
                    <p>Create your first custom design in the Design Studio.</p>
                    <Link to="/design-studio" className="btn btn-primary">Start Designing</Link>
                </div>
            ) : (
                <div className="designs-grid">
                    {designs.map((design) => {
                        const thumb = design.thumbUrl || getThumbFromCanvas(design.canvasJson);
                        return (
                            <div key={design.id} className="design-card">
                                <div className="design-preview">
                                    {thumb ? <img src={thumb} alt={design.name} /> : <span className="design-placeholder">🎨</span>}
                                </div>
                                <div className="design-info">
                                    {editingId === design.id ? (
                                        <div className="design-rename">
                                            <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                                            <button className="btn btn-primary btn-sm" onClick={() => handleRename(design.id)}>✓</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>✕</button>
                                        </div>
                                    ) : (
                                        <h3 className="design-name">{design.name}</h3>
                                    )}
                                    <p className="design-date">{new Date(design.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="design-actions">
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(design.id); setEditName(design.name); }}>
                                        ✏️ Rename
                                    </button>
                                    <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(design.id)}>
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
