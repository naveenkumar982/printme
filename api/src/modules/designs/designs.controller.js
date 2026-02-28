import * as designsService from './designs.service.js';

/** POST /api/designs */
export async function create(req, res, next) {
    try {
        const design = await designsService.createDesign(req.user.id, req.body);
        res.status(201).json({ message: 'Design saved', design });
    } catch (err) {
        next(err);
    }
}

/** GET /api/designs */
export async function list(req, res, next) {
    try {
        const result = await designsService.listDesigns(req.user.id, req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

/** GET /api/designs/:id */
export async function get(req, res, next) {
    try {
        const design = await designsService.getDesignById(req.user.id, req.params.id);
        res.json({ design });
    } catch (err) {
        next(err);
    }
}

/** PATCH /api/designs/:id */
export async function update(req, res, next) {
    try {
        const design = await designsService.updateDesign(req.user.id, req.params.id, req.body);
        res.json({ message: 'Design updated', design });
    } catch (err) {
        next(err);
    }
}

/** DELETE /api/designs/:id */
export async function remove(req, res, next) {
    try {
        await designsService.deleteDesign(req.user.id, req.params.id);
        res.json({ message: 'Design deleted' });
    } catch (err) {
        next(err);
    }
}
