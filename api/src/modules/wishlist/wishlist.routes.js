import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { list, toggle, remove, ids } from './wishlist.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', list);
router.get('/ids', ids);
router.post('/:productId', toggle);
router.delete('/:productId', remove);

export default router;
