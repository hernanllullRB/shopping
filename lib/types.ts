export type Role = 'admin' | 'customer';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: Role;
  name: string;
  createdAt: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export type Category = 'Electronics' | 'Clothing' | 'Books';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: Category;
  active: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export type OrderStatus = 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  username: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  paymentMethod: 'credit_card';
  cardHolder: string;
  lastFour: string;
  couponCode?: string;
}

export type CouponType = 'percent' | 'flat';

export interface Coupon {
  code: string;
  type: CouponType;
  value: number;
  active: boolean;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  perUserOnce?: boolean;
  minSubtotal?: number;
  usedByUsers: Set<string>;
}

export interface ApiError {
  error: string;
  code?: string;
  field?: string;
  details?: Record<string, string>;
}

export interface TokenPayload {
  username: string;
  role: Role;
}
