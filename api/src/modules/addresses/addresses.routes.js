import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { createAddressSchema, updateAddressSchema } from './addresses.schema.js';
import { list, create, update, remove } from './addresses.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', list);
router.post('/', validate(createAddressSchema), create);
router.patch('/:id', validate(updateAddressSchema), update);
router.delete('/:id', remove);

export default router;
