import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authenticate.js';
import {
    listProductsSchema,
    createProductSchema,
    updateProductSchema,
    createSkuSchema,
    createTemplateSchema,
} from './catalogue.schema.js';
import {
    listProducts,
    getProduct,
    getProductBySlug,
    getSkus,
    getTemplates,
    createProduct,
    updateProduct,
    deleteProduct,
    addSku,
    deleteSku,
    addTemplate,
    deleteTemplate,
} from './catalogue.controller.js';

const router = Router();

// ── Public Routes ──
router.get('/products', validate(listProductsSchema, 'query'), listProducts);
router.get('/products/slug/:slug', getProductBySlug);
router.get('/products/:id', getProduct);
router.get('/products/:id/skus', getSkus);
router.get('/products/:id/templates', getTemplates);

// ── Admin Routes ──
router.post('/products', authenticate, authorize('ADMIN'), validate(createProductSchema), createProduct);
router.patch('/products/:id', authenticate, authorize('ADMIN'), validate(updateProductSchema), updateProduct);
router.delete('/products/:id', authenticate, authorize('ADMIN'), deleteProduct);
router.post('/products/:id/skus', authenticate, authorize('ADMIN'), validate(createSkuSchema), addSku);
router.delete('/skus/:id', authenticate, authorize('ADMIN'), deleteSku);
router.post('/products/:id/templates', authenticate, authorize('ADMIN'), validate(createTemplateSchema), addTemplate);
router.delete('/templates/:id', authenticate, authorize('ADMIN'), deleteTemplate);

export default router;
