import { useState } from 'react';

export default function StarRating({ rating = 0, onRate, size = 'md', readonly = false }) {
    const [hovered, setHovered] = useState(0);
    const stars = [1, 2, 3, 4, 5];

    return (
        <div className={`star-rating star-rating-${size} ${readonly ? 'readonly' : ''}`}>
            {stars.map((star) => (
                <span
                    key={star}
                    className={`star ${star <= (hovered || rating) ? 'filled' : ''}`}
                    onClick={() => !readonly && onRate && onRate(star)}
                    onMouseEnter={() => !readonly && setHovered(star)}
                    onMouseLeave={() => !readonly && setHovered(0)}
                >
                    ★
                </span>
            ))}
        </div>
    );
}
