import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { getStore } from './store';
import type { Role, TokenPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24h

export function signToken(payload: TokenPayload): string {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
  const store = getStore();
  store.tokens.set(token, {
    username: payload.username,
    expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000,
  });
  return token;
}

export function invalidateToken(token: string): void {
  getStore().tokens.delete(token);
}

export function verifyToken(token: string): TokenPayload | null {
  const store = getStore();
  const tracked = store.tokens.get(token);
  if (!tracked) return null;
  if (tracked.expiresAt < Date.now()) {
    store.tokens.delete(token);
    return null;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return { username: decoded.username, role: decoded.role };
  } catch {
    store.tokens.delete(token);
    return null;
  }
}

export function extractToken(request: NextRequest | Request): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (header && header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  if ('cookies' in request && typeof (request as NextRequest).cookies?.get === 'function') {
    const cookie = (request as NextRequest).cookies.get('token');
    if (cookie?.value) return cookie.value;
  }
  return null;
}

export type AuthResult =
  | { ok: true; payload: TokenPayload }
  | { ok: false; response: NextResponse };

export function requireAuth(request: NextRequest | Request): AuthResult {
  const token = extractToken(request);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No autenticado', code: 'UNAUTHENTICATED' }, { status: 401 }),
    };
  }
  const payload = verifyToken(token);
  if (!payload) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Token inválido o expirado', code: 'INVALID_TOKEN' }, { status: 401 }),
    };
  }
  return { ok: true, payload };
}

export function requireRole(request: NextRequest | Request, role: Role): AuthResult {
  const auth = requireAuth(request);
  if (!auth.ok) return auth;
  if (auth.payload.role !== role) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Acceso denegado', code: 'FORBIDDEN' }, { status: 403 }),
    };
  }
  return auth;
}
