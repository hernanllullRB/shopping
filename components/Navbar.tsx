'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

function isSectionActive(pathname: string, section: string): boolean {
  if (section === '/') {
    return pathname === '/' || pathname.startsWith('/products');
  }
  return pathname === section || pathname.startsWith(`${section}/`);
}

function linkClass(active: boolean): string {
  return active
    ? 'text-sm font-semibold text-brand-600 border-b-2 border-brand-600 pb-2 -mb-2'
    : 'text-sm text-slate-700 hover:text-brand-600';
}

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const cartReset = useCartStore((s) => s.reset);
  const count = useCartStore((s) => s.count);
  const router = useRouter();
  const pathname = usePathname() ?? '/';

  const isProducts = isSectionActive(pathname, '/');
  const isOrders = isSectionActive(pathname, '/orders');
  const isAccount = isSectionActive(pathname, '/account');
  const isAdmin = isSectionActive(pathname, '/admin');
  const isCart = isSectionActive(pathname, '/cart');

  async function handleLogout() {
    await logout();
    cartReset();
    router.push('/login');
  }

  return (
    <nav className="bg-white border-b border-slate-200" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-brand-600" data-testid="logo">
          Shopping QA
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={linkClass(isProducts)}
            aria-current={isProducts ? 'page' : undefined}
            data-active={isProducts}
            data-testid="nav-products"
          >
            Productos
          </Link>
          <Link
            href="/orders"
            className={linkClass(isOrders)}
            aria-current={isOrders ? 'page' : undefined}
            data-active={isOrders}
            data-testid="nav-orders"
          >
            Mis órdenes
          </Link>
          <Link
            href="/account"
            className={linkClass(isAccount)}
            aria-current={isAccount ? 'page' : undefined}
            data-active={isAccount}
            data-testid="nav-account"
          >
            Mi cuenta
          </Link>
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={
                isAdmin
                  ? 'text-sm font-bold text-amber-700 border-b-2 border-amber-500 pb-2 -mb-2'
                  : 'text-sm font-semibold text-amber-600 hover:text-amber-700'
              }
              aria-current={isAdmin ? 'page' : undefined}
              data-active={isAdmin}
              data-testid="nav-admin"
            >
              Admin
            </Link>
          )}
          <Link
            href="/cart"
            className={`relative ${linkClass(isCart)}`}
            aria-current={isCart ? 'page' : undefined}
            data-active={isCart}
            data-testid="cart-icon"
          >
            Carrito
            {count > 0 && (
              <span
                className="absolute -top-2 -right-4 bg-brand-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                data-testid="cart-badge"
              >
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200" data-testid="user-pill">
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold uppercase"
                  aria-hidden
                >
                  {user.username.slice(0, 1)}
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">Sesión</span>
                  <span className="text-sm font-medium text-slate-800" data-testid="nav-username">
                    {user.username}
                  </span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-secondary text-sm" data-testid="logout-button">
                Salir
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
