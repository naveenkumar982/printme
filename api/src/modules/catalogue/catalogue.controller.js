import * as catalogueService from './catalogue.service.js';

// ── Public Endpoints ──

/** GET /api/catalogue/products */
export async function listProducts(req, res, next) {
    try {
        const result = await catalogueService.listProducts(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

/** GET /api/catalogue/products/:id */
export async function getProduct(req, res, next) {
    try {
        const product = await catalogueService.getProductById(req.params.id);
        res.json({ product });
    } catch (err) {
        next(err);
    }
}

/** GET /api/catalogue/products/slug/:slug */
export async function getProductBySlug(req, res, next) {
    try {
        const product = await catalogueService.getProductBySlug(req.params.slug);
        res.json({ product });
    } catch (err) {
        next(err);
    }
}

/** GET /api/catalogue/products/:id/skus */
export async function getSkus(req, res, next) {
    try {
        const skus = await catalogueService.getProductSkus(req.params.id);
        res.json({ skus });
    } catch (err) {
        next(err);
    }
}

/** GET /api/catalogue/products/:id/templates */
export async function getTemplates(req, res, next) {
    try {
        const templates = await catalogueService.getProductTemplates(req.params.id);
        res.json({ templates });
    } catch (err) {
        next(err);
    }
}

// ── Admin Endpoints ──

/** POST /api/catalogue/products */
export async function createProduct(req, res, next) {
    try {
        const product = await catalogueService.createProduct(req.body);
        res.status(201).json({ message: 'Product created', product });
    } catch (err) {
        next(err);
    }
}

/** PATCH /api/catalogue/products/:id */
export async function updateProduct(req, res, next) {
    try {
        const product = await catalogueService.updateProduct(req.params.id, req.body);
        res.json({ message: 'Product updated', product });
    } catch (err) {
        next(err);
    }
}

/** DELETE /api/catalogue/products/:id */
export async function deleteProduct(req, res, next) {
    try {
        await catalogueService.deleteProduct(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        next(err);
    }
}

/** POST /api/catalogue/products/:id/skus */
export async function addSku(req, res, next) {
    try {
        const sku = await catalogueService.addSku(req.params.id, req.body);
        res.status(201).json({ message: 'SKU added', sku });
    } catch (err) {
        next(err);
    }
}

/** DELETE /api/catalogue/skus/:id */
export async function deleteSku(req, res, next) {
    try {
        await catalogueService.deleteSku(req.params.id);
        res.json({ message: 'SKU deleted' });
    } catch (err) {
        next(err);
    }
}

/** POST /api/catalogue/products/:id/templates */
export async function addTemplate(req, res, next) {
    try {
        const template = await catalogueService.addTemplate(req.params.id, req.body);
        res.status(201).json({ message: 'Template added', template });
    } catch (err) {
        next(err);
    }
}

/** DELETE /api/catalogue/templates/:id */
export async function deleteTemplate(req, res, next) {
    try {
        await catalogueService.deleteTemplate(req.params.id);
        res.json({ message: 'Template deleted' });
    } catch (err) {
        next(err);
    }
}
