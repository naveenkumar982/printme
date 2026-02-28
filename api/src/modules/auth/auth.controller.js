import {
    registerUser,
    loginUser,
    refreshTokens,
    logoutUser,
    logoutAllDevices,
    getUserProfile,
    updateUserProfile,
    changePassword as changePasswordService,
    googleOAuthLogin,
} from './auth.service.js';

/**
 * POST /api/auth/register
 */
export async function register(req, res, next) {
    try {
        const { user, accessToken, refreshToken } = await registerUser(req.body);

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/api/auth',
        });

        res.status(201).json({
            message: 'Registration successful',
            user,
            accessToken,
            refreshToken, // Also in body for mobile clients
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
    try {
        const { user, accessToken, refreshToken } = await loginUser(req.body);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/auth',
        });

        res.json({
            message: 'Login successful',
            user,
            accessToken,
            refreshToken,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/refresh
 */
export async function refresh(req, res, next) {
    try {
        // Get refresh token from cookie or body
        const token = req.cookies?.refreshToken || req.body.refreshToken;

        if (!token) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const { accessToken, refreshToken } = await refreshTokens(token);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/auth',
        });

        res.json({
            message: 'Token refreshed',
            accessToken,
            refreshToken,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req, res, next) {
    try {
        const token = req.cookies?.refreshToken || req.body.refreshToken;
        if (token) {
            await logoutUser(token);
        }

        res.clearCookie('refreshToken', { path: '/api/auth' });
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/logout-all
 * Requires authentication.
 */
export async function logoutAll(req, res, next) {
    try {
        await logoutAllDevices(req.user.id);
        res.clearCookie('refreshToken', { path: '/api/auth' });
        res.json({ message: 'Logged out from all devices' });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/auth/me
 * Requires authentication.
 */
export async function me(req, res, next) {
    try {
        const user = await getUserProfile(req.user.id);
        res.json({ user });
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /api/auth/me
 * Requires authentication.
 */
export async function updateMe(req, res, next) {
    try {
        const user = await updateUserProfile(req.user.id, req.body);
        res.json({ message: 'Profile updated', user });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/change-password
 * Requires authentication.
 */
export async function changePass(req, res, next) {
    try {
        await changePasswordService(req.user.id, req.body);
        res.clearCookie('refreshToken', { path: '/api/auth' });
        res.json({ message: 'Password changed successfully. Please login again.' });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/google/callback
 * Receives Google OAuth token from the frontend, validates it, and returns JWT.
 * The frontend handles the Google sign-in UI and sends the credential here.
 */
export async function googleCallback(req, res, next) {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        // Dynamically import google-auth-library (only needed for this route)
        const { OAuth2Client } = await import('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid Google credential' });
        }

        const { user, accessToken, refreshToken } = await googleOAuthLogin({
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            avatarUrl: payload.picture,
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/auth',
        });

        res.json({
            message: 'Google login successful',
            user,
            accessToken,
            refreshToken,
        });
    } catch (err) {
        if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token')) {
            return res.status(401).json({ error: 'Invalid or expired Google credential' });
        }
        next(err);
    }
}

