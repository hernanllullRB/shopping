import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Mínimo 3 caracteres')
      .max(20, 'Máximo 20 caracteres')
      .regex(/^[a-zA-Z0-9]+$/, 'Solo letras y números'),
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Za-z]/, 'Debe tener al menos una letra')
      .regex(/\d/, 'Debe tener al menos un número'),
    confirmPassword: z.string(),
    name: z.string().min(1, 'Nombre requerido'),
    terms: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar los términos' }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

export const updateNameSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Za-z]/, 'Debe tener al menos una letra')
      .regex(/\d/, 'Debe tener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(10),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
});

export const checkoutSchema = z.object({
  paymentMethod: z.literal('credit_card'),
  cardHolder: z.string().min(1, 'Titular requerido'),
  cardNumber: z.string().regex(/^\d{16}$/, 'Número de tarjeta inválido (16 dígitos)'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/(\d{2})$/, 'Formato MM/YY'),
  cvv: z.string().regex(/^\d{3}$/, 'CVV de 3 dígitos'),
  couponCode: z.string().optional(),
});

export const adminProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  imageUrl: z.string().url(),
  category: z.enum(['Electronics', 'Clothing', 'Books']),
  active: z.boolean().optional(),
});

export const adminUpdateProductSchema = adminProductSchema.partial();

export const adminUpdateOrderStatusSchema = z.object({
  status: z.enum(['paid', 'shipped', 'delivered', 'cancelled']),
});

export function isExpiryFuture(expiry: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const last = new Date(year, month, 0, 23, 59, 59);
  return last.getTime() > Date.now();
}

export function fieldErrorsFromZod(err: z.ZodError): { details: Record<string, string>; firstMessage: string } {
  const details: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join('.') || '_';
    if (!details[path]) details[path] = issue.message;
  }
  const firstMessage = err.issues[0]?.message ?? 'Error de validación';
  return { details, firstMessage };
}
