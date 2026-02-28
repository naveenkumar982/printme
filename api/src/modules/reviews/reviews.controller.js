import * as reviewService from './reviews.service.js';

export async function create(req, res, next) {
    try {
        const review = await reviewService.createReview(req.user.id, req.body);
        res.status(201).json({ review });
    } catch (err) { next(err); }
}

export async function listByProduct(req, res, next) {
    try {
        const result = await reviewService.listReviews(req.params.productId);
        res.json(result);
    } catch (err) { next(err); }
}

export async function remove(req, res, next) {
    try {
        await reviewService.deleteReview(req.user.id, req.params.id);
        res.json({ message: 'Review deleted' });
    } catch (err) { next(err); }
}
