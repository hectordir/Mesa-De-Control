/** Opciones que se pasan al adapter `PrismaPg` (node-postgres). */
export interface PgAdapterOptions {
  connectionString: string;
  ssl?: { rejectUnauthorized: boolean };
}

/**
 * Traduce el `sslmode` de la connection string a la configuración TLS de node-postgres.
 * - Sin `sslmode` o `disable`/`allow`/`prefer` → sin SSL (Postgres local de docker-compose).
 * - `require` → TLS sin validar el certificado (Railway/Neon usan certs propios).
 * - `verify-ca` / `verify-full` → TLS con validación estricta del certificado.
 */
export function pgAdapterOptions(
  connectionString: string | undefined,
): PgAdapterOptions {
  if (!connectionString || connectionString.trim() === '') {
    throw new Error(
      'DATABASE_URL no está definida: no se puede conectar a PostgreSQL.',
    );
  }

  const sslmode = /[?&]sslmode=([a-z-]+)/i.exec(connectionString)?.[1];

  if (sslmode === 'verify-ca' || sslmode === 'verify-full') {
    return { connectionString, ssl: { rejectUnauthorized: true } };
  }

  if (sslmode === 'require') {
    return { connectionString, ssl: { rejectUnauthorized: false } };
  }

  return { connectionString };
}
