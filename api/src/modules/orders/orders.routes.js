import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { createOrderSchema, listOrdersSchema } from './orders.schema.js';
import { create, list, get, cancel } from './orders.controller.js';

const router = Router();

// All order routes require authentication
router.use(authenticate);

router.post('/', validate(createOrderSchema), create);
router.get('/', validate(listOrdersSchema, 'query'), list);
router.get('/:id', get);
router.post('/:id/cancel', cancel);

export default router;
