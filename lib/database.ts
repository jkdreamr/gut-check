export function hasValidPostgresDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim() ?? '';
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

export function explainDatabaseIssue(error?: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (!hasValidPostgresDatabaseUrl()) {
    return 'Database telemetry is unavailable because DATABASE_URL is still set to a local SQLite value. Replace it with a real Postgres URL.';
  }

  if (message.includes('Can\'t reach database server')) {
    return 'Database telemetry is unavailable because Postgres could not be reached from this environment.';
  }

  if (message.includes('the URL must start with the protocol')) {
    return 'Database telemetry is unavailable because DATABASE_URL is not a valid Postgres connection string.';
  }

  return 'Database telemetry is temporarily unavailable. The rest of the app can still run.';
}
