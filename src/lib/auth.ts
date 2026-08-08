import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export type Role = 'ADMIN' | 'OFFICE_STAFF' | 'SPONSOR' | 'STUDENT_FAMILY';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'yatheemcare_super_secret_jwt_key_2026'
);

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  sponsorId?: string;
  studentId?: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('yatheem_token')?.value;

  if (!token) return null;
  return verifyToken(token);
}

export function isAuthorized(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}
