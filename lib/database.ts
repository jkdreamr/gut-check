export function hasValidPostgresDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim() ?? '';
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

export function isDatabaseConfigured() {
  return hasValidPostgresDatabaseUrl();
}

export function explainDatabaseIssue(error?: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const url = process.env.DATABASE_URL?.trim() ?? '';

  if (!url) {
    return 'Database telemetry is unavailable because DATABASE_URL is not set. Add a Postgres URL to enable proposal logging.';
  }

  if (!hasValidPostgresDatabaseUrl()) {
    return 'Database telemetry is unavailable because DATABASE_URL is not a Postgres connection string. Replace it with a real Postgres URL.';
  }

  if (message.includes('Can\'t reach database server')) {
    return 'Database telemetry is unavailable because Postgres could not be reached from this environment.';
  }

  if (message.includes('the URL must start with the protocol')) {
    return 'Database telemetry is unavailable because DATABASE_URL is not a valid Postgres connection string.';
  }

  return 'Database telemetry is temporarily unavailable. The rest of the app can still run.';
}
