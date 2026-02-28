import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate an access token for a user.
 */
export function signAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate a refresh token for a user.
 */
export function signRefreshToken(payload) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * Verify an access token.
 */
export function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

/**
 * Verify a refresh token.
 */
export function verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}

/**
 * Parse duration string (e.g. '7d', '15m', '1h') to milliseconds.
 */
export function parseDuration(duration) {
    const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 86_400_000; // default 7 days
    return parseInt(match[1]) * units[match[2]];
}

export default {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN,
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    parseDuration,
};
