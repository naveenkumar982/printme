import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import useWishlistStore from '../stores/wishlistStore.js';
import useAuthStore from '../stores/authStore.js';
import useToastStore from '../stores/toastStore.js';
import { ProductCardSkeleton } from '../components/Skeleton.jsx';

const EMOJI_MAP = { 't-shirt': '👕', hoodie: '🧥', mug: '☕', poster: '🖼️', 'phone-case': '📱', 'tote-bag': '👜' };

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState('newest');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const isAuth = useAuthStore((s) => s.isAuthenticated);
    const { wishlistedIds, toggle } = useWishlistStore();
    const toast = useToastStore();

    useEffect(() => {
        setLoading(true);
        const params = { page, limit: 12 };
        if (search) params.search = search;
        if (sortBy) params.sortBy = sortBy;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        api.get('/catalogue/products', { params })
            .then(({ data }) => { setProducts(data.products); setPagination(data.pagination); })
            .finally(() => setLoading(false));
    }, [page, search, sortBy, minPrice, maxPrice]);

    const handleWishlistToggle = async (e, productId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuth) { toast.info('Please log in to use wishlist'); return; }
        const result = await toggle(productId);
        if (result !== null) {
            toast.success(result ? 'Added to wishlist' : 'Removed from wishlist');
        }
    };

    return (
        <div className="page catalog-page">
            <div className="page-header">
                <h1 className="page-title">Our <span className="gradient-text">Products</span></h1>
                <div className="search-bar">
                    <input type="text" placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filters-bar">
                <div className="filter-group">
                    <label>Sort by</label>
                    <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
                        <option value="newest">Newest</option>
                        <option value="price_asc">Price: Low → High</option>
                        <option value="price_desc">Price: High → Low</option>
                        <option value="name_asc">Name: A → Z</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Min Price</label>
                    <input type="number" placeholder="₹" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} className="filter-input" />
                </div>
                <div className="filter-group">
                    <label>Max Price</label>
                    <input type="number" placeholder="₹" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} className="filter-input" />
                </div>
                {(minPrice || maxPrice || sortBy !== 'newest') && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { setMinPrice(''); setMaxPrice(''); setSortBy('newest'); }}>Clear Filters</button>
                )}
            </div>

            {loading ? (
                <div className="products-grid catalog-grid">
                    {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
            ) : (
                <>
                    <div className="products-grid catalog-grid">
                        {products.map((p) => (
                            <Link to={`/products/${p.slug}`} key={p.id} className="product-card">
                                {isAuth && (
                                    <button
                                        className={`wishlist-heart ${wishlistedIds.includes(p.id) ? 'active' : ''}`}
                                        onClick={(e) => handleWishlistToggle(e, p.id)}
                                    >
                                        {wishlistedIds.includes(p.id) ? '♥' : '♡'}
                                    </button>
                                )}
                                <div className="product-image">
                                    <span className="product-emoji">{EMOJI_MAP[p.slug] || '📦'}</span>
                                </div>
                                <h3 className="product-name">{p.name}</h3>
                                <p className="product-price">From ₹{p.basePrice}</p>
                                <div className="product-meta">
                                    <span>{p._count?.skus || 0} variants</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                    {products.length === 0 && (
                        <div className="empty-state">
                            <span className="empty-icon">🔍</span>
                            <h2>No products found</h2>
                            <p>Try adjusting your search or filters.</p>
                        </div>
                    )}
                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
                            <span className="page-info">Page {page} of {pagination.totalPages}</span>
                            <button className="btn btn-ghost" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
