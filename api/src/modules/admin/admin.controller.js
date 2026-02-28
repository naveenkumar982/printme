import * as adminService from './admin.service.js';

/** GET /api/admin/orders */
export async function listOrders(req, res, next) {
    try {
        const result = await adminService.adminListOrders(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

/** GET /api/admin/orders/:id */
export async function getOrder(req, res, next) {
    try {
        const order = await adminService.adminGetOrder(req.params.id);
        res.json({ order });
    } catch (err) {
        next(err);
    }
}

/** PATCH /api/admin/orders/:id/status */
export async function updateOrderStatus(req, res, next) {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const order = await adminService.adminUpdateOrderStatus(req.params.id, status);
        res.json({ message: `Order status updated to ${status}`, order });
    } catch (err) {
        next(err);
    }
}

/** GET /api/admin/dashboard */
export async function dashboard(req, res, next) {
    try {
        const stats = await adminService.getDashboardStats();
        res.json({ stats });
    } catch (err) {
        next(err);
    }
}
