export function ProductCardSkeleton() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-image shimmer"></div>
            <div className="skeleton-line shimmer" style={{ width: '70%' }}></div>
            <div className="skeleton-line shimmer" style={{ width: '40%' }}></div>
        </div>
    );
}

export function OrderCardSkeleton() {
    return (
        <div className="skeleton-order">
            <div className="skeleton-header">
                <div className="skeleton-line shimmer" style={{ width: '30%' }}></div>
                <div className="skeleton-badge shimmer"></div>
            </div>
            <div className="skeleton-line shimmer" style={{ width: '90%' }}></div>
            <div className="skeleton-line shimmer" style={{ width: '60%' }}></div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="skeleton-profile">
            <div className="skeleton-avatar shimmer"></div>
            <div className="skeleton-line shimmer" style={{ width: '50%' }}></div>
            <div className="skeleton-line shimmer" style={{ width: '70%' }}></div>
        </div>
    );
}
