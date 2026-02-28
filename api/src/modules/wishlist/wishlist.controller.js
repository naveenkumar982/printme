import * as wishlistService from './wishlist.service.js';

export async function list(req, res, next) {
    try {
        const items = await wishlistService.listWishlist(req.user.id);
        res.json({ wishlist: items });
    } catch (err) { next(err); }
}

export async function toggle(req, res, next) {
    try {
        const result = await wishlistService.toggleWishlist(req.user.id, req.params.productId);
        res.json(result);
    } catch (err) { next(err); }
}

export async function remove(req, res, next) {
    try {
        await wishlistService.removeFromWishlist(req.user.id, req.params.productId);
        res.json({ message: 'Removed from wishlist' });
    } catch (err) { next(err); }
}

export async function ids(req, res, next) {
    try {
        const productIds = await wishlistService.getWishlistIds(req.user.id);
        res.json({ productIds });
    } catch (err) { next(err); }
}
