'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Order, Product, PublicUser } from '@/lib/types';

interface Stats {
  products: number;
  productsInactive: number;
  ordersTotal: number;
  ordersByStatus: Record<string, number>;
  users: number;
}

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (initialized && (!user || user.role !== 'admin')) {
      router.replace('/');
    }
  }, [initialized, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    Promise.all([
      api<{ products: Product[] }>('/api/admin/products'),
      api<{ orders: Order[] }>('/api/admin/orders'),
      api<{ users: PublicUser[] }>('/api/admin/users'),
    ]).then(([p, o, u]) => {
      const ordersByStatus: Record<string, number> = {};
      o.orders.forEach((ord) => {
        ordersByStatus[ord.status] = (ordersByStatus[ord.status] ?? 0) + 1;
      });
      setStats({
        products: p.products.filter((x) => x.active).length,
        productsInactive: p.products.filter((x) => !x.active).length,
        ordersTotal: o.orders.length,
        ordersByStatus,
        users: u.users.length,
      });
    });
  }, [user]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div data-testid="admin-page">
      <h1 className="text-2xl font-bold mb-4">Panel admin</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/products" className="card hover:shadow-md transition" data-testid="admin-card-products">
          <div className="text-slate-500 text-sm">Productos activos</div>
          <div className="text-3xl font-bold">{stats?.products ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-1">Inactivos: {stats?.productsInactive ?? '—'}</div>
        </Link>
        <Link href="/admin/orders" className="card hover:shadow-md transition" data-testid="admin-card-orders">
          <div className="text-slate-500 text-sm">Órdenes totales</div>
          <div className="text-3xl font-bold">{stats?.ordersTotal ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-1">
            {stats && Object.entries(stats.ordersByStatus).map(([s, n]) => `${s}:${n}`).join(' · ')}
          </div>
        </Link>
        <Link href="/admin/users" className="card hover:shadow-md transition" data-testid="admin-card-users">
          <div className="text-slate-500 text-sm">Usuarios</div>
          <div className="text-3xl font-bold">{stats?.users ?? '—'}</div>
        </Link>
      </div>
    </div>
  );
}
