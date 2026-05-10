// lib/prisma.ts — singleton Prisma client with a deployment-safe SQLite fallback.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function ensureFallbackDbFile(targetPath: string) {
  try {
    if (fs.existsSync(targetPath)) return;

    const bundledDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    if (fs.existsSync(bundledDbPath)) {
      fs.copyFileSync(bundledDbPath, targetPath);
      return;
    }

    fs.closeSync(fs.openSync(targetPath, 'a'));
  } catch (error) {
    console.warn('Failed to prepare fallback SQLite database:', error);
  }
}

function isSqliteUrl(url: string) {
  return url.startsWith('file:');
}

function maybeSeedTmpDbFromConfiguredUrl(configuredUrl: string, targetPath: string) {
  try {
    const rawPath = configuredUrl.replace(/^file:/, '');
    const sourcePath = path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
    if (!fs.existsSync(sourcePath) || sourcePath === targetPath) return;

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  } catch (error) {
    console.warn('Failed to seed tmp SQLite database from configured path:', error);
  }
}

function resolveDatabaseUrl() {
  const configuredUrl = process.env.DATABASE_URL?.trim();
  const isProductionLike = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');
  const tmpDbPath = path.join(os.tmpdir(), 'gut-check.db');

  if (configuredUrl && configuredUrl.length > 0) {
    if (isProductionLike && !isSqliteUrl(configuredUrl)) {
      ensureFallbackDbFile(tmpDbPath);
      return `file:${tmpDbPath}`;
    }
    if (isProductionLike && isSqliteUrl(configuredUrl)) {
      ensureFallbackDbFile(tmpDbPath);
      maybeSeedTmpDbFromConfiguredUrl(configuredUrl, tmpDbPath);
      return `file:${tmpDbPath}`;
    }
    return configuredUrl;
  }

  if (isProductionLike) {
    ensureFallbackDbFile(tmpDbPath);
    return `file:${tmpDbPath}`;
  }

  return 'file:./dev.db';
}

const databaseUrl = resolveDatabaseUrl();

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
