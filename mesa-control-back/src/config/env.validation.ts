/**
 * Validación de variables de entorno en el arranque.
 * Si falta JWT_SECRET (o DATABASE_URL) la app falla en el boot: nunca se arranca
 * con un secreto por defecto.
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = ['JWT_SECRET', 'DATABASE_URL'].filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}. ` +
        'Copia .env.example a .env y complétalas.',
    );
  }

  return config;
}
