import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { pool } from './config/database';
import { logger } from './config/logger';

const PORT = Number(process.env.PORT ?? 3000);

const server = http.createServer(app);

// WebSocket server for real-time community
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL ?? 'https://app.innerbrother.app',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Community real-time events
io.on('connection', (socket) => {
  logger.debug({ socketId: socket.id }, 'WebSocket client connected');

  socket.on('auth', (data: { token: string }) => {
    // Validate JWT and attach userId to socket
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET!);
      socket.data.userId = decoded.userId;
      socket.emit('auth_success');
    } catch {
      socket.emit('auth_error', { message: 'Invalid token' });
    }
  });

  socket.on('join_group', (data: { group_id: string }) => {
    socket.join(`group:${data.group_id}`);
    logger.debug({ groupId: data.group_id }, 'Socket joined group');
  });

  socket.on('leave_group', (data: { group_id: string }) => {
    socket.leave(`group:${data.group_id}`);
  });

  socket.on('disconnect', () => {
    logger.debug({ socketId: socket.id }, 'WebSocket client disconnected');
  });
});

// Export io for use in routes
export { io };

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Shutdown signal received');

  server.close(async () => {
    await pool.end();
    logger.info('Server shut down gracefully');
    process.exit(0);
  });

  // Force exit after 30s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception — shutting down');
  process.exit(1);
});

server.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, '🚀 InnerBrother API running');
});
