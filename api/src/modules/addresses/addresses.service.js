import prisma from '../../lib/prisma.js';

export async function listAddresses(userId) {
    return prisma.address.findMany({
        where: { userId },
        orderBy: { label: 'asc' },
    });
}

export async function createAddress(userId, data) {
    return prisma.address.create({
        data: { ...data, userId },
    });
}

export async function updateAddress(userId, addressId, data) {
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) {
        const err = new Error('Address not found');
        err.status = 404;
        throw err;
    }
    return prisma.address.update({
        where: { id: addressId },
        data,
    });
}

export async function deleteAddress(userId, addressId) {
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) {
        const err = new Error('Address not found');
        err.status = 404;
        throw err;
    }
    await prisma.address.delete({ where: { id: addressId } });
    return { deleted: true };
}
