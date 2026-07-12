import { PrismaClient } from '@prisma/client';
import logger from './logger.js';

const prisma = new PrismaClient({
  // Explicit SSL enforcement at the client level — belt-and-suspenders
  // alongside the sslmode=require in the connection string
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: [
    { level: 'warn',  emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

// Forward Prisma warnings/errors through the structured logger
prisma.$on('warn', (e) => {
  logger.warn('db.prisma.warn', { message: e.message, target: e.target });
});

prisma.$on('error', (e) => {
  logger.error('db.prisma.error', { message: e.message, target: e.target });
});

export default prisma;
