import useToastStore from '../stores/toastStore.js';

export default function Toast() {
    const toasts = useToastStore((s) => s.toasts);
    const removeToast = useToastStore((s) => s.removeToast);

    if (!toasts.length) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <span className="toast-icon">
                        {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
                    </span>
                    <span className="toast-message">{toast.message}</span>
                    <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
                </div>
            ))}
        </div>
    );
}
