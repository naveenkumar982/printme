import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { createReviewSchema } from './reviews.schema.js';
import { create, listByProduct, remove } from './reviews.controller.js';

const router = Router();

// Public: list reviews for a product
router.get('/product/:productId', listByProduct);

// Protected: create/delete
router.post('/', authenticate, validate(createReviewSchema), create);
router.delete('/:id', authenticate, remove);

export default router;
