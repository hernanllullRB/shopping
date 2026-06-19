import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { findUserByUsername } from '@/lib/store';
import { fieldErrorsFromZod, loginSchema } from '@/lib/validators';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const { firstMessage, details } = fieldErrorsFromZod(parsed.error);
    return NextResponse.json({ error: firstMessage, details }, { status: 400 });
  }
  const { username, password } = parsed.data;
  const user = findUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Usuario o contraseña inválidos', code: 'INVALID_CREDENTIALS' }, { status: 401 });
  }
  const token = signToken({ username: user.username, role: user.role });
  const { passwordHash, ...publicUser } = user;
  return NextResponse.json({ token, user: publicUser });
}
