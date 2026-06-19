import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { createUser, findUserByEmail, findUserByUsername } from '@/lib/store';
import { fieldErrorsFromZod, registerSchema } from '@/lib/validators';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const { firstMessage, details } = fieldErrorsFromZod(parsed.error);
    return NextResponse.json({ error: firstMessage, details }, { status: 400 });
  }
  const { username, email, password, name } = parsed.data;

  if (findUserByUsername(username)) {
    return NextResponse.json(
      { error: 'El usuario ya existe', code: 'USERNAME_TAKEN', field: 'username' },
      { status: 409 },
    );
  }
  if (findUserByEmail(email)) {
    return NextResponse.json(
      { error: 'El email ya está registrado', code: 'EMAIL_TAKEN', field: 'email' },
      { status: 409 },
    );
  }

  const user = createUser({ username, email, password, name });
  const token = signToken({ username: user.username, role: user.role });
  const { passwordHash, ...publicUser } = user;
  return NextResponse.json({ token, user: publicUser }, { status: 201 });
}
