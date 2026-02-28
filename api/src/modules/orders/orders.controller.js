import * as ordersService from './orders.service.js';

/** POST /api/orders */
export async function create(req, res, next) {
    try {
        const order = await ordersService.createOrder(req.user.id, req.body);
        res.status(201).json({ message: 'Order created', order });
    } catch (err) {
        next(err);
    }
}

/** GET /api/orders */
export async function list(req, res, next) {
    try {
        const result = await ordersService.listOrders(req.user.id, req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

/** GET /api/orders/:id */
export async function get(req, res, next) {
    try {
        const order = await ordersService.getOrderById(req.user.id, req.params.id);
        res.json({ order });
    } catch (err) {
        next(err);
    }
}

/** POST /api/orders/:id/cancel */
export async function cancel(req, res, next) {
    try {
        const order = await ordersService.cancelOrder(req.user.id, req.params.id);
        res.json({ message: 'Order cancelled', order });
    } catch (err) {
        next(err);
    }
}
