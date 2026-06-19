import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type {
  CartItem,
  Coupon,
  Order,
  Product,
  User,
} from './types';

interface Store {
  users: Map<string, User>;
  usernameIndex: Map<string, string>;
  emailIndex: Map<string, string>;
  tokens: Map<string, { username: string; expiresAt: number }>;
  carts: Map<string, CartItem[]>;
  orders: Order[];
  products: Map<string, Product>;
  coupons: Map<string, Coupon>;
}

declare global {
  // eslint-disable-next-line no-var
  var __SHOPPING_STORE__: Store | undefined;
}

const SALT_ROUNDS = 8;

function seedUsers(): { users: Map<string, User>; usernameIndex: Map<string, string>; emailIndex: Map<string, string> } {
  const users = new Map<string, User>();
  const usernameIndex = new Map<string, string>();
  const emailIndex = new Map<string, string>();

  const list: Array<Pick<User, 'username' | 'email' | 'role' | 'name'> & { password: string }> = [
    { username: 'admin', email: 'admin@shop.test', password: 'admin123', role: 'admin', name: 'Admin User' },
    { username: 'user1', email: 'user1@shop.test', password: 'pass123', role: 'customer', name: 'Usuario Uno' },
    { username: 'user2', email: 'user2@shop.test', password: 'pass456', role: 'customer', name: 'Usuario Dos' },
  ];

  for (const u of list) {
    const id = randomUUID();
    const user: User = {
      id,
      username: u.username,
      email: u.email,
      passwordHash: bcrypt.hashSync(u.password, SALT_ROUNDS),
      role: u.role,
      name: u.name,
      createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    };
    users.set(id, user);
    usernameIndex.set(u.username.toLowerCase(), id);
    emailIndex.set(u.email.toLowerCase(), id);
  }

  return { users, usernameIndex, emailIndex };
}

function seedProducts(): Map<string, Product> {
  const products = new Map<string, Product>();
  const list: Array<Omit<Product, 'id' | 'imageUrl' | 'createdAt' | 'active'>> = [
    // Electronics (8)
    { name: 'Wireless Headphones', description: 'Auriculares inalámbricos con cancelación de ruido y batería de 30h.', price: 89, stock: 10, category: 'Electronics' },
    { name: 'Mechanical Keyboard', description: 'Teclado mecánico RGB con switches azules.', price: 129, stock: 10, category: 'Electronics' },
    { name: 'USB-C Hub', description: 'Hub 7-en-1 con HDMI 4K, USB 3.0 y lector SD.', price: 45, stock: 10, category: 'Electronics' },
    { name: 'Webcam HD', description: 'Cámara web 1080p con micrófono integrado.', price: 79, stock: 10, category: 'Electronics' },
    { name: 'Bluetooth Speaker', description: 'Parlante portátil resistente al agua con 12h de batería.', price: 59, stock: 5, category: 'Electronics' },
    { name: 'Smart Watch', description: 'Reloj inteligente con monitor cardíaco y GPS.', price: 199, stock: 3, category: 'Electronics' },
    { name: 'Gaming Mouse', description: 'Mouse gamer 16000 DPI con 7 botones programables.', price: 69, stock: 10, category: 'Electronics' },
    { name: 'Monitor 27"', description: 'Monitor 4K IPS con HDR y 144Hz.', price: 349, stock: 0, category: 'Electronics' },
    // Clothing (6)
    { name: 'Cotton T-Shirt', description: 'Remera 100% algodón orgánico.', price: 19, stock: 25, category: 'Clothing' },
    { name: 'Denim Jacket', description: 'Campera de jean clásica unisex.', price: 89, stock: 8, category: 'Clothing' },
    { name: 'Wool Sweater', description: 'Sweater de lana merino, abriga sin abultar.', price: 69, stock: 12, category: 'Clothing' },
    { name: 'Running Shoes', description: 'Zapatillas de running ligeras con amortiguación.', price: 129, stock: 10, category: 'Clothing' },
    { name: 'Baseball Cap', description: 'Gorra ajustable de algodón.', price: 25, stock: 30, category: 'Clothing' },
    { name: 'Leather Belt', description: 'Cinturón de cuero genuino.', price: 39, stock: 15, category: 'Clothing' },
    // Books (4)
    { name: 'Clean Code', description: 'Manual de artesanía de software por Robert C. Martin.', price: 35, stock: 10, category: 'Books' },
    { name: 'The Pragmatic Programmer', description: 'Tu camino hacia la maestría como programador.', price: 45, stock: 10, category: 'Books' },
    { name: 'Refactoring', description: 'Mejora el diseño de código existente, por Martin Fowler.', price: 55, stock: 10, category: 'Books' },
    { name: 'Design Patterns', description: 'Elementos de software orientado a objetos reutilizable.', price: 49, stock: 2, category: 'Books' },
  ];

  list.forEach((p, idx) => {
    const id = `prod-${String(idx + 1).padStart(3, '0')}`;
    products.set(id, {
      id,
      ...p,
      imageUrl: `https://picsum.photos/seed/${id}/400/300`,
      active: true,
      createdAt: new Date(2026, 0, 1 + idx).toISOString(),
    });
  });

  return products;
}

function seedCoupons(): Map<string, Coupon> {
  const coupons = new Map<string, Coupon>();
  const list: Coupon[] = [
    { code: 'WELCOME10', type: 'percent', value: 10, active: true, usedCount: 0, usedByUsers: new Set() },
    { code: 'SAVE20', type: 'percent', value: 20, active: true, minSubtotal: 100, usedCount: 0, usedByUsers: new Set() },
    { code: 'FLAT15', type: 'flat', value: 15, active: true, usedCount: 0, usedByUsers: new Set() },
    { code: 'EXPIRED', type: 'percent', value: 50, active: true, expiresAt: '2025-01-01T00:00:00Z', usedCount: 0, usedByUsers: new Set() },
    { code: 'USED', type: 'percent', value: 30, active: true, maxUses: 0, usedCount: 0, usedByUsers: new Set() },
    { code: 'FIRSTBUY', type: 'percent', value: 25, active: true, perUserOnce: true, usedCount: 0, usedByUsers: new Set() },
  ];
  for (const c of list) coupons.set(c.code, c);
  return coupons;
}

function createStore(): Store {
  const { users, usernameIndex, emailIndex } = seedUsers();
  return {
    users,
    usernameIndex,
    emailIndex,
    tokens: new Map(),
    carts: new Map(),
    orders: [],
    products: seedProducts(),
    coupons: seedCoupons(),
  };
}

export function getStore(): Store {
  if (!globalThis.__SHOPPING_STORE__) {
    globalThis.__SHOPPING_STORE__ = createStore();
  }
  return globalThis.__SHOPPING_STORE__;
}

export function findUserByUsername(username: string): User | undefined {
  const store = getStore();
  const id = store.usernameIndex.get(username.toLowerCase());
  return id ? store.users.get(id) : undefined;
}

export function findUserByEmail(email: string): User | undefined {
  const store = getStore();
  const id = store.emailIndex.get(email.toLowerCase());
  return id ? store.users.get(id) : undefined;
}

export function createUser(input: { username: string; email: string; password: string; name: string; role?: 'admin' | 'customer' }): User {
  const store = getStore();
  const id = randomUUID();
  const user: User = {
    id,
    username: input.username,
    email: input.email,
    passwordHash: bcrypt.hashSync(input.password, SALT_ROUNDS),
    role: input.role ?? 'customer',
    name: input.name,
    createdAt: new Date().toISOString(),
  };
  store.users.set(id, user);
  store.usernameIndex.set(input.username.toLowerCase(), id);
  store.emailIndex.set(input.email.toLowerCase(), id);
  return user;
}

export function getCart(username: string): CartItem[] {
  const store = getStore();
  if (!store.carts.has(username)) store.carts.set(username, []);
  return store.carts.get(username)!;
}

export function clearCart(username: string): void {
  getStore().carts.set(username, []);
}

export function getProduct(id: string): Product | undefined {
  return getStore().products.get(id);
}

export function listActiveProducts(): Product[] {
  return Array.from(getStore().products.values()).filter((p) => p.active);
}

export function listAllProducts(): Product[] {
  return Array.from(getStore().products.values());
}
