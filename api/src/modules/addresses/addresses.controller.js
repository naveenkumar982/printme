import * as addressService from './addresses.service.js';

export async function list(req, res, next) {
    try {
        const addresses = await addressService.listAddresses(req.user.id);
        res.json({ addresses });
    } catch (err) { next(err); }
}

export async function create(req, res, next) {
    try {
        const address = await addressService.createAddress(req.user.id, req.body);
        res.status(201).json({ address });
    } catch (err) { next(err); }
}

export async function update(req, res, next) {
    try {
        const address = await addressService.updateAddress(req.user.id, req.params.id, req.body);
        res.json({ address });
    } catch (err) { next(err); }
}

export async function remove(req, res, next) {
    try {
        await addressService.deleteAddress(req.user.id, req.params.id);
        res.json({ message: 'Address deleted' });
    } catch (err) { next(err); }
}
