import * as bcrypt from 'bcrypt';

/** Longitud mínima de `ADMIN_PASSWORD`: se valida antes de tocar la base. */
export const MIN_PASSWORD = 8;
const ROUNDS = 10;

export interface AdminEnv {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_NAME?: string;
}

export interface CredencialesAdmin {
  email: string;
  password: string;
  name: string;
}

/** Datos exactos del `create` del admin (compatible con `Prisma.UserCreateArgs`). */
export interface AdminCreateArgs {
  data: {
    email: string;
    name: string;
    role: 'ADMIN';
    isActive: boolean;
    passwordHash: string;
  };
}

/** Contrato mínimo de Prisma que necesita el bootstrap (facilita el test unitario). */
export interface AdminUserClient {
  user: {
    findUnique(args: {
      where: { email: string };
    }): Promise<{ id: string; email: string; role: string } | null>;
    create(args: AdminCreateArgs): Promise<{ id: string }>;
  };
}

export interface ResultadoBootstrapAdmin {
  estado: 'creado' | 'existente';
  email: string;
  id?: string;
  mensaje: string;
}

/**
 * Lee y valida `ADMIN_EMAIL` / `ADMIN_PASSWORD` (y opcional `ADMIN_NAME`).
 * Lanza con mensaje explícito: el script debe fallar antes de escribir en la base.
 */
export function leerCredencialesAdmin(env: AdminEnv): CredencialesAdmin {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase() ?? '';
  const password = env.ADMIN_PASSWORD ?? '';

  const faltantes = [
    email === '' ? 'ADMIN_EMAIL' : null,
    password === '' ? 'ADMIN_PASSWORD' : null,
  ].filter((clave): clave is string => clave !== null);

  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno para crear el admin: ${faltantes.join(', ')}.`,
    );
  }

  if (password.length < MIN_PASSWORD) {
    throw new Error(
      `ADMIN_PASSWORD debe tener al menos ${MIN_PASSWORD} caracteres.`,
    );
  }

  return { email, password, name: env.ADMIN_NAME?.trim() || 'Administrador' };
}

/**
 * Crea el primer usuario `ADMIN` a partir del entorno. Idempotente: si el email ya
 * existe no lo duplica ni lo sobrescribe (tampoco degrada su rol), solo informa.
 */
export async function bootstrapAdmin(
  prisma: AdminUserClient,
  env: AdminEnv,
): Promise<ResultadoBootstrapAdmin> {
  const { email, password, name } = leerCredencialesAdmin(env);

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return {
      estado: 'existente',
      email,
      id: existente.id,
      mensaje: `El usuario ${email} ya existe con rol ${existente.role}: no se modifica.`,
    };
  }

  const passwordHash = await bcrypt.hash(password, ROUNDS);
  const creado = await prisma.user.create({
    data: { email, name, role: 'ADMIN', isActive: true, passwordHash },
  });

  return {
    estado: 'creado',
    email,
    id: creado.id,
    mensaje: `Usuario ADMIN ${email} creado.`,
  };
}
