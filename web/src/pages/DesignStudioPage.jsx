import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useDesignStore from '../stores/designStore.js';
import useToastStore from '../stores/toastStore.js';

export default function DesignStudioPage() {
    const navigate = useNavigate();
    const toast = useToastStore();
    const saveDesign = useDesignStore((s) => s.saveDesign);
    const fileInputRef = useRef(null);

    const [designName, setDesignName] = useState('Untitled Design');
    const [uploadedImage, setUploadedImage] = useState(null);
    const [textOverlays, setTextOverlays] = useState([]);
    const [saving, setSaving] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [activeText, setActiveText] = useState(null);

    const handleFileDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setUploadedImage(reader.result);
        reader.readAsDataURL(file);
    };

    const addTextOverlay = () => {
        const newText = {
            id: Date.now(),
            text: 'Your Text',
            fontSize: 32,
            color: '#ffffff',
            fontFamily: 'Inter',
            x: 50,
            y: 50,
        };
        setTextOverlays([...textOverlays, newText]);
        setActiveText(newText.id);
    };

    const updateText = (id, updates) => {
        setTextOverlays(textOverlays.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    };

    const removeText = (id) => {
        setTextOverlays(textOverlays.filter((t) => t.id !== id));
        if (activeText === id) setActiveText(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const canvasJson = JSON.stringify({
                image: uploadedImage,
                textOverlays,
                width: 600,
                height: 600,
            });
            await saveDesign({ name: designName, canvasJson });
            toast.success('Design saved!');
            navigate('/my-designs');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save design');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page design-studio-page">
            <div className="studio-header">
                <input
                    className="studio-name-input"
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="Design name..."
                />
                <div className="studio-actions">
                    <button className="btn btn-ghost" onClick={() => navigate('/my-designs')}>My Designs</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || !uploadedImage}>
                        {saving ? 'Saving...' : '💾 Save Design'}
                    </button>
                </div>
            </div>

            <div className="studio-layout">
                {/* Canvas Area */}
                <div className="studio-canvas-area">
                    <div
                        className={`canvas-drop-zone ${dragOver ? 'drag-over' : ''} ${uploadedImage ? 'has-image' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleFileDrop}
                        onClick={() => !uploadedImage && fileInputRef.current?.click()}
                    >
                        {uploadedImage ? (
                            <div className="canvas-preview">
                                <img src={uploadedImage} alt="Design" className="canvas-image" />
                                {textOverlays.map((overlay) => (
                                    <div
                                        key={overlay.id}
                                        className={`canvas-text-overlay ${activeText === overlay.id ? 'active' : ''}`}
                                        style={{
                                            left: `${overlay.x}%`,
                                            top: `${overlay.y}%`,
                                            fontSize: `${overlay.fontSize}px`,
                                            color: overlay.color,
                                            fontFamily: overlay.fontFamily,
                                        }}
                                        onClick={() => setActiveText(overlay.id)}
                                    >
                                        {overlay.text}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="drop-placeholder">
                                <span className="drop-icon">🎨</span>
                                <h3>Drop your image here</h3>
                                <p>or click to browse files</p>
                                <p className="drop-hint">Supports PNG, JPG, SVG</p>
                            </div>
                        )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileDrop} style={{ display: 'none' }} />
                    {uploadedImage && (
                        <button className="btn btn-ghost btn-sm canvas-change-btn" onClick={() => { setUploadedImage(null); setTextOverlays([]); }}>
                            🔄 Change Image
                        </button>
                    )}
                </div>

                {/* Toolbar */}
                <div className="studio-toolbar">
                    <h3>Design Tools</h3>

                    <div className="tool-section">
                        <h4>Text Overlays</h4>
                        <button className="btn btn-primary btn-sm btn-full" onClick={addTextOverlay}>
                            ✏️ Add Text
                        </button>

                        {textOverlays.map((overlay) => (
                            <div
                                key={overlay.id}
                                className={`text-control-card ${activeText === overlay.id ? 'active' : ''}`}
                                onClick={() => setActiveText(overlay.id)}
                            >
                                <input
                                    value={overlay.text}
                                    onChange={(e) => updateText(overlay.id, { text: e.target.value })}
                                    className="text-input"
                                    placeholder="Enter text..."
                                />
                                <div className="text-controls">
                                    <div className="control-row">
                                        <label>Size</label>
                                        <input
                                            type="range" min="12" max="72" value={overlay.fontSize}
                                            onChange={(e) => updateText(overlay.id, { fontSize: parseInt(e.target.value) })}
                                        />
                                        <span>{overlay.fontSize}px</span>
                                    </div>
                                    <div className="control-row">
                                        <label>Color</label>
                                        <input
                                            type="color" value={overlay.color}
                                            onChange={(e) => updateText(overlay.id, { color: e.target.value })}
                                        />
                                    </div>
                                    <div className="control-row">
                                        <label>Font</label>
                                        <select value={overlay.fontFamily} onChange={(e) => updateText(overlay.id, { fontFamily: e.target.value })}>
                                            <option value="Inter">Inter</option>
                                            <option value="Arial">Arial</option>
                                            <option value="Georgia">Georgia</option>
                                            <option value="monospace">Monospace</option>
                                            <option value="cursive">Cursive</option>
                                        </select>
                                    </div>
                                    <div className="control-row">
                                        <label>Position X</label>
                                        <input type="range" min="0" max="100" value={overlay.x}
                                            onChange={(e) => updateText(overlay.id, { x: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="control-row">
                                        <label>Position Y</label>
                                        <input type="range" min="0" max="100" value={overlay.y}
                                            onChange={(e) => updateText(overlay.id, { y: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <button className="btn btn-ghost btn-sm btn-danger" onClick={() => removeText(overlay.id)}>Remove</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
