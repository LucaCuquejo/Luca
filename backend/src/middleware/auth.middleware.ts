import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';

export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail: string;
  subscriptionTier: string;
  countryCode: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', message: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    // Verify session hasn't been revoked
    const sessionResult = await query(
      `SELECT id FROM user_sessions
       WHERE user_id = $1 AND token_hash = encode(digest($2, 'sha256'), 'hex')
         AND expires_at > NOW()
         AND revoked_at IS NULL
       LIMIT 1`,
      [decoded.userId, token]
    );

    if (sessionResult.rowCount === 0) {
      res.status(401).json({ error: 'unauthorized', message: 'Session expired or revoked' });
      return;
    }

    // Load user context for handlers
    const profileResult = await query(
      `SELECT up.subscription_tier, up.country_code
       FROM user_profiles up
       WHERE up.user_id = $1 AND (SELECT deleted_at FROM users WHERE id = $1) IS NULL`,
      [decoded.userId]
    );

    const profile = profileResult.rows[0];

    (req as AuthenticatedRequest).userId = decoded.userId;
    (req as AuthenticatedRequest).userEmail = decoded.email;
    (req as AuthenticatedRequest).subscriptionTier = profile?.subscription_tier ?? 'free';
    (req as AuthenticatedRequest).countryCode = profile?.country_code ?? 'US';

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'unauthorized', message: 'Token expired' });
    } else {
      res.status(401).json({ error: 'unauthorized', message: 'Invalid token' });
    }
  }
}

export function requirePremium(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthenticatedRequest;
  if (authReq.subscriptionTier !== 'premium') {
    res.status(403).json({
      error: 'forbidden',
      message: 'This feature requires a Premium subscription',
      upgrade_url: '/billing/create-checkout',
    });
    return;
  }
  next();
}
