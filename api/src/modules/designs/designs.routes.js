import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import {
    createDesignSchema,
    updateDesignSchema,
    listDesignsSchema,
} from './designs.schema.js';
import {
    create,
    list,
    get,
    update,
    remove,
} from './designs.controller.js';

const router = Router();

// All design routes require authentication
router.use(authenticate);

router.post('/', validate(createDesignSchema), create);
router.get('/', validate(listDesignsSchema, 'query'), list);
router.get('/:id', get);
router.patch('/:id', validate(updateDesignSchema), update);
router.delete('/:id', remove);

export default router;
