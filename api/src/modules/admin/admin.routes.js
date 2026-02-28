import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { listOrders, getOrder, updateOrderStatus, dashboard } from './admin.controller.js';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/dashboard', dashboard);
router.get('/orders', listOrders);
router.get('/orders/:id', getOrder);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
