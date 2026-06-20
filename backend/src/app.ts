import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { logger } from './config/logger';
import { checkDatabaseHealth } from './config/database';

// Route imports
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import crisisRoutes from './routes/crisis.routes';
import goalsRoutes from './routes/goals.routes';

const app: Application = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL ?? 'https://app.innerbrother.app',
    // Allow Expo development
    ...(process.env.NODE_ENV !== 'production'
      ? ['http://localhost:8081', 'http://localhost:19006']
      : []),
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Version', 'X-Platform'],
}));

app.use(compression());
app.use(express.json({ limit: '10kb' })); // Prevent body too large attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.url === '/health',
  }));
}

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000), // 15 min
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', retry_after: 60 },
});

// Tighter auth rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { error: 'rate_limited', message: 'Too many login attempts. Try again in 15 minutes.' },
});

// Chat rate limiter (free: 60/hour, premium checked in route)
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  keyGenerator: (req) => req.headers.authorization ?? req.ip ?? 'unknown',
  message: { error: 'rate_limited', message: 'Chat limit reached for free plan' },
});

app.use(globalLimiter);

// Health check (no auth, no rate limit)
app.get('/health', async (_req: Request, res: Response) => {
  const dbHealthy = await checkDatabaseHealth();
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION ?? 'v1',
  });
});

// API Routes
const API_PREFIX = `/v1`;

app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${API_PREFIX}/chat`, chatLimiter, chatRoutes);
app.use(`${API_PREFIX}/crisis`, crisisRoutes); // No rate limit on crisis
app.use(`${API_PREFIX}/goals`, goalsRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'not_found' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');
  res.status(500).json({ error: 'internal_error', request_id: req.headers['x-request-id'] });
});

export default app;
