import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma.js';
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    parseDuration,
} from '../../config/jwt.js';

const SALT_ROUNDS = 12;

/**
 * Register a new user.
 * @returns {{ user, accessToken, refreshToken }}
 */
export async function registerUser({ email, password, name }) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        const err = new Error('Email already registered');
        err.status = 409;
        throw err;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
        data: { email, passwordHash, name },
        select: { id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true },
    });

    // Generate tokens
    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });

    // Store refresh token
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d')),
        },
    });

    return { user, accessToken, refreshToken };
}

/**
 * Login with email and password.
 * @returns {{ user, accessToken, refreshToken }}
 */
export async function loginUser({ email, password }) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatarUrl: true,
            passwordHash: true,
            createdAt: true,
        },
    });

    if (!user || !user.passwordHash) {
        const err = new Error('Invalid email or password');
        err.status = 401;
        throw err;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        const err = new Error('Invalid email or password');
        err.status = 401;
        throw err;
    }

    // Generate tokens
    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });

    // Store refresh token
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d')),
        },
    });

    // Remove passwordHash from response
    const { passwordHash: _, ...safeUser } = user;

    return { user: safeUser, accessToken, refreshToken };
}

/**
 * Refresh access token using a valid refresh token.
 * Implements token rotation — old token is invalidated.
 * @returns {{ accessToken, refreshToken }}
 */
export async function refreshTokens(oldRefreshToken) {
    // Verify the refresh token JWT
    let decoded;
    try {
        decoded = verifyRefreshToken(oldRefreshToken);
    } catch {
        const err = new Error('Invalid or expired refresh token');
        err.status = 401;
        throw err;
    }

    // Check if refresh token exists in DB (not revoked)
    const stored = await prisma.refreshToken.findUnique({
        where: { token: oldRefreshToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
        // If token was reused after rotation, revoke ALL tokens for this user (security)
        if (stored) {
            await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } });
        }
        const err = new Error('Refresh token revoked or expired');
        err.status = 401;
        throw err;
    }

    // Token rotation: delete old, create new
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true },
    });

    if (!user) {
        const err = new Error('User not found');
        err.status = 401;
        throw err;
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
        data: {
            token: newRefreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d')),
        },
    });

    return { accessToken, refreshToken: newRefreshToken };
}

/**
 * Logout — revoke a specific refresh token.
 */
export async function logoutUser(refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

/**
 * Logout from all devices — revoke ALL refresh tokens for a user.
 */
export async function logoutAllDevices(userId) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
}

/**
 * Get user profile by ID.
 */
export async function getUserProfile(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatarUrl: true,
            googleId: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }

    return user;
}

/**
 * Update user profile.
 */
export async function updateUserProfile(userId, data) {
    const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
}

/**
 * Change password — verify current password then update.
 */
export async function changePassword(userId, { currentPassword, newPassword }) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
        const err = new Error('Cannot change password for OAuth-only accounts');
        err.status = 400;
        throw err;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
        const err = new Error('Current password is incorrect');
        err.status = 401;
        throw err;
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens (force re-login on all devices)
    await prisma.refreshToken.deleteMany({ where: { userId } });
}

/**
 * Google OAuth — find or create user from Google profile.
 * Uses an atomic transaction for safe account linking.
 * @returns {{ user, accessToken, refreshToken }}
 */
export async function googleOAuthLogin({ googleId, email, name, avatarUrl }) {
    const user = await prisma.$transaction(async (tx) => {
        // Check if user exists by googleId
        let existing = await tx.user.findUnique({ where: { googleId } });

        if (existing) return existing;

        // Check if user exists by email (link accounts)
        existing = await tx.user.findUnique({ where: { email } });

        if (existing) {
            // Link Google account to existing email account
            return tx.user.update({
                where: { id: existing.id },
                data: { googleId, avatarUrl: avatarUrl || existing.avatarUrl },
            });
        }

        // Create new user
        return tx.user.create({
            data: {
                email,
                name,
                googleId,
                avatarUrl,
            },
        });
    });

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d')),
        },
    });

    const safeUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
    };

    return { user: safeUser, accessToken, refreshToken };
}
