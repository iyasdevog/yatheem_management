import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Fix for SQLite on Vercel Serverless environment:
// Vercel function filesystem is read-only, except for /tmp.
// We copy the seeded SQLite dev.db from bundle (/var/task/prisma/dev.db) to /tmp/dev.db.
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  try {
    const dbName = 'dev.db';
    const bundledDbPath = path.join(process.cwd(), 'prisma', dbName);
    const tmpDbPath = path.join('/tmp', dbName);

    if (fs.existsSync(bundledDbPath) && !fs.existsSync(tmpDbPath)) {
      fs.copyFileSync(bundledDbPath, tmpDbPath);
      console.log(`[Prisma DB] Successfully copied ${bundledDbPath} to writable ${tmpDbPath}`);
    }

    if (fs.existsSync(tmpDbPath)) {
      process.env.DATABASE_URL = `file:${tmpDbPath}`;
    } else if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = `file:${bundledDbPath}`;
    }
  } catch (err) {
    console.error('[Prisma DB] Vercel /tmp DB copy error:', err);
  }
} else if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

