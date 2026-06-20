import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { logger } from '../config/logger';
import { createHash } from 'crypto';

const router = Router();

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

function generateTokens(userId: string, email: string) {
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '1h' }
  );

  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d' }
  );

  return { accessToken, refreshToken };
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function storeSession(
  userId: string,
  accessToken: string,
  req: Request
): Promise<void> {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await query(
    `INSERT INTO user_sessions (user_id, token_hash, ip_address, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, hashToken(accessToken), req.ip, expiresAt]
  );
}

// POST /auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8, max: 100 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('username')
      .isAlphanumeric()
      .isLength({ min: 3, max: 30 })
      .trim(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'validation_error', details: errors.array() });
    }

    const { email, password, username } = req.body;

    try {
      // Check email/username uniqueness
      const existing = await query(
        `SELECT id FROM users WHERE email = $1
         UNION
         SELECT user_id FROM user_profiles WHERE username = $2`,
        [email, username]
      );

      if (existing.rowCount > 0) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'Email or username already in use',
        });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      const { user, profile } = await transaction(async (client) => {
        const userResult = await client.query(
          `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email`,
          [email, passwordHash]
        );
        const newUser = userResult.rows[0];

        await client.query(
          `INSERT INTO user_profiles (user_id, username) VALUES ($1, $2)`,
          [newUser.id, username]
        );

        await client.query(
          `INSERT INTO user_xp (user_id) VALUES ($1)`,
          [newUser.id]
        );

        return { user: newUser, profile: { username } };
      });

      const { accessToken, refreshToken } = generateTokens(user.id, user.email);
      await storeSession(user.id, accessToken, req);

      logger.info({ userId: user.id }, 'New user registered');

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          profile: { username, onboarding_completed: false },
        },
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600,
      });
    } catch (error) {
      logger.error({ error }, 'Registration failed');
      res.status(500).json({ error: 'internal_error' });
    }
  }
);

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'validation_error' });
    }

    const { email, password } = req.body;

    try {
      const userResult = await query(
        `SELECT u.id, u.email, u.password_hash,
                up.display_name, up.username, up.country_code,
                up.onboarding_completed, up.subscription_tier, up.active_struggles,
                up.avatar_color, up.notifications_enabled,
                cr.organization, cr.hotline_display, cr.hotline_number, cr.available_hours
         FROM users u
         JOIN user_profiles up ON up.user_id = u.id
         LEFT JOIN crisis_resources cr ON cr.country_code = up.country_code AND cr.is_primary = true
         WHERE u.email = $1 AND u.deleted_at IS NULL`,
        [email]
      );

      if (userResult.rowCount === 0) {
        // Timing-safe: hash a dummy password to prevent user enumeration
        await bcrypt.hash('dummy', BCRYPT_ROUNDS);
        return res.status(401).json({ error: 'unauthorized', message: 'Invalid credentials' });
      }

      const user = userResult.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) {
        return res.status(401).json({ error: 'unauthorized', message: 'Invalid credentials' });
      }

      const { accessToken, refreshToken } = generateTokens(user.id, user.email);
      await storeSession(user.id, accessToken, req);

      await query(`UPDATE users SET last_active_at = NOW() WHERE id = $1`, [user.id]);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          profile: {
            username: user.username,
            display_name: user.display_name,
            country_code: user.country_code,
            subscription_tier: user.subscription_tier,
            active_struggles: user.active_struggles,
            onboarding_completed: user.onboarding_completed,
            avatar_color: user.avatar_color,
            notifications_enabled: user.notifications_enabled,
          },
          crisis_resource: user.organization
            ? {
                organization: user.organization,
                hotline_display: user.hotline_display,
                hotline_number: user.hotline_number,
                available_hours: user.available_hours,
              }
            : null,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600,
      });
    } catch (error) {
      logger.error({ error }, 'Login failed');
      res.status(500).json({ error: 'internal_error' });
    }
  }
);

// POST /auth/refresh
router.post(
  '/refresh',
  [body('refresh_token').notEmpty()],
  async (req: Request, res: Response) => {
    const { refresh_token } = req.body;

    try {
      const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        return res.status(401).json({ error: 'unauthorized' });
      }

      const { accessToken } = generateTokens(decoded.userId, decoded.email);
      await storeSession(decoded.userId, accessToken, req);

      res.json({ access_token: accessToken, expires_in: 3600 });
    } catch {
      res.status(401).json({ error: 'unauthorized', message: 'Invalid refresh token' });
    }
  }
);

// POST /auth/logout
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const token = req.headers.authorization?.substring(7) ?? '';

  await query(
    `UPDATE user_sessions SET revoked_at = NOW()
     WHERE user_id = $1 AND token_hash = $2`,
    [authReq.userId, hashToken(token)]
  );

  res.status(204).send();
});

export default router;
