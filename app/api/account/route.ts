import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { findUserByUsername } from '@/lib/store';
import { fieldErrorsFromZod, updateNameSchema } from '@/lib/validators';

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const parsed = updateNameSchema.safeParse(body);
  if (!parsed.success) {
    const { firstMessage, details } = fieldErrorsFromZod(parsed.error);
    return NextResponse.json({ error: firstMessage, details }, { status: 400 });
  }
  const user = findUserByUsername(auth.payload.username);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  user.name = parsed.data.name;
  const { passwordHash, ...publicUser } = user;
  return NextResponse.json({ user: publicUser });
}
