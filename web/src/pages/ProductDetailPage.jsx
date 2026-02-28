import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import useCartStore from '../stores/cartStore.js';
import useAuthStore from '../stores/authStore.js';
import useWishlistStore from '../stores/wishlistStore.js';
import useToastStore from '../stores/toastStore.js';
import StarRating from '../components/StarRating.jsx';

export default function ProductDetailPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSku, setSelectedSku] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const addItem = useCartStore((s) => s.addItem);
    const isAuth = useAuthStore((s) => s.isAuthenticated);
    const { wishlistedIds, toggle: toggleWishlist } = useWishlistStore();
    const toast = useToastStore();

    // Reviews
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [myRating, setMyRating] = useState(0);
    const [myComment, setMyComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        api.get(`/catalogue/products/slug/${slug}`)
            .then(({ data }) => { setProduct(data.product); if (data.product.skus?.length) setSelectedSku(data.product.skus[0]); })
            .catch(() => navigate('/products'))
            .finally(() => setLoading(false));
    }, [slug]);

    // Load reviews when product loads
    useEffect(() => {
        if (product?.id) {
            api.get(`/reviews/product/${product.id}`).then(({ data }) => {
                setReviews(data.reviews);
                setAvgRating(data.averageRating);
                setTotalReviews(data.totalReviews);
            });
        }
    }, [product?.id]);

    const handleAddToCart = () => {
        if (!selectedSku) return;
        addItem(selectedSku, product, quantity);
        toast.success(`${product.name} added to cart!`);
    };

    const handleWishlist = async () => {
        if (!isAuth) { toast.info('Please log in to use wishlist'); return; }
        const result = await toggleWishlist(product.id);
        if (result !== null) {
            toast.success(result ? 'Added to wishlist ♥' : 'Removed from wishlist');
        }
    };

    const handleReviewSubmit = async () => {
        if (!isAuth) { toast.info('Please log in to leave a review'); return; }
        if (myRating === 0) { toast.error('Please select a rating'); return; }
        setSubmittingReview(true);
        try {
            const { data } = await api.post('/reviews', { productId: product.id, rating: myRating, comment: myComment || undefined });
            // Refresh reviews
            const res = await api.get(`/reviews/product/${product.id}`);
            setReviews(res.data.reviews);
            setAvgRating(res.data.averageRating);
            setTotalReviews(res.data.totalReviews);
            setMyRating(0);
            setMyComment('');
            toast.success('Review submitted!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return <div className="page"><div className="loading-spinner">Loading...</div></div>;
    if (!product) return null;

    const sizes = [...new Set(product.skus.map((s) => s.size))];
    const colors = [...new Set(product.skus.filter((s) => !selectedSku || s.size === selectedSku.size).map((s) => s.color))];
    const isWishlisted = wishlistedIds.includes(product.id);

    return (
        <div className="page product-detail">
            <div className="detail-grid">
                <div className="detail-image">
                    <div className="detail-emoji">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : '📦'}</div>
                </div>
                <div className="detail-info">
                    <div className="detail-title-row">
                        <h1 className="detail-title">{product.name}</h1>
                        {isAuth && (
                            <button className={`wishlist-btn-lg ${isWishlisted ? 'active' : ''}`} onClick={handleWishlist}>
                                {isWishlisted ? '♥' : '♡'}
                            </button>
                        )}
                    </div>
                    <div className="detail-rating-row">
                        <StarRating rating={Math.round(avgRating)} readonly size="sm" />
                        <span className="rating-text">{avgRating} ({totalReviews} reviews)</span>
                    </div>
                    <p className="detail-desc">{product.description || 'Premium quality custom printing.'}</p>
                    <p className="detail-price">₹{selectedSku?.price || product.basePrice}</p>

                    {sizes.length > 0 && (
                        <div className="option-group">
                            <label>Size</label>
                            <div className="option-chips">
                                {sizes.map((size) => (
                                    <button key={size} className={`chip ${selectedSku?.size === size ? 'active' : ''}`}
                                        onClick={() => { const sku = product.skus.find((s) => s.size === size); if (sku) setSelectedSku(sku); }}>
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {colors.length > 0 && (
                        <div className="option-group">
                            <label>Color</label>
                            <div className="option-chips">
                                {colors.map((color) => (
                                    <button key={color} className={`chip ${selectedSku?.color === color ? 'active' : ''}`}
                                        onClick={() => { const sku = product.skus.find((s) => s.size === selectedSku?.size && s.color === color); if (sku) setSelectedSku(sku); }}>
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="option-group">
                        <label>Quantity</label>
                        <div className="qty-control">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                            <span>{quantity}</span>
                            <button onClick={() => setQuantity(Math.min(99, quantity + 1))}>+</button>
                        </div>
                    </div>

                    {selectedSku?.stock <= 0 && <p className="out-of-stock">Out of Stock</p>}

                    <div className="detail-actions">
                        <button className="btn btn-primary btn-lg" onClick={handleAddToCart} disabled={!selectedSku || selectedSku.stock <= 0}>
                            🛒 Add to Cart
                        </button>
                        <button className="btn btn-ghost btn-lg" onClick={() => navigate('/cart')}>View Cart</button>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section">
                <h2 className="section-title">Customer Reviews</h2>

                <div className="reviews-summary">
                    <div className="reviews-avg">
                        <span className="avg-number">{avgRating}</span>
                        <StarRating rating={Math.round(avgRating)} readonly />
                        <span className="avg-count">{totalReviews} reviews</span>
                    </div>
                </div>

                {/* Write Review */}
                {isAuth && (
                    <div className="review-form">
                        <h3>Write a Review</h3>
                        <div className="review-form-rating">
                            <label>Your Rating</label>
                            <StarRating rating={myRating} onRate={setMyRating} />
                        </div>
                        <textarea
                            className="review-textarea"
                            placeholder="Share your experience with this product..."
                            value={myComment}
                            onChange={(e) => setMyComment(e.target.value)}
                            rows={3}
                        />
                        <button className="btn btn-primary" onClick={handleReviewSubmit} disabled={submittingReview || myRating === 0}>
                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                )}

                {/* Review List */}
                <div className="reviews-list">
                    {reviews.length === 0 ? (
                        <p className="text-muted">No reviews yet. Be the first!</p>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="review-card">
                                <div className="review-header">
                                    <div className="review-user">
                                        <span className="review-avatar">{review.user?.name?.charAt(0) || '?'}</span>
                                        <span className="review-author">{review.user?.name || 'Anonymous'}</span>
                                    </div>
                                    <StarRating rating={review.rating} readonly size="sm" />
                                </div>
                                {review.comment && <p className="review-comment">{review.comment}</p>}
                                <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
