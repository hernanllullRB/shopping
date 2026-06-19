'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { AdminBackLink } from '@/components/AdminBackLink';
import { toast } from '@/components/Toast';
import { useAuthStore } from '@/store/auth';
import type { Product } from '@/lib/types';

export default function AdminProductsPage() {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialized && (!user || user.role !== 'admin')) router.replace('/');
  }, [initialized, user, router]);

  function load() {
    api<{ products: Product[] }>('/api/admin/products').then((res) => {
      setProducts(res.products);
      setLoading(false);
    });
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    if (!confirm('¿Desactivar producto?')) return;
    try {
      await api(`/api/admin/products/${id}`, { method: 'DELETE' });
      toast('Producto desactivado', 'success');
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error', 'error');
    }
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div data-testid="admin-products-page">
      <AdminBackLink />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Link href="/admin/products/new" className="btn-primary" data-testid="new-product-button">
          Nuevo producto
        </Link>
      </div>

      {loading ? (
        <div className="card">Cargando…</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b">
              <tr>
                <th className="py-2">ID</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-0" data-testid={`admin-product-row-${p.id}`}>
                  <td className="font-mono text-xs">{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>${p.price}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded ${p.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="flex gap-2 py-2">
                    <Link href={`/admin/products/${p.id}`} className="btn-secondary text-xs" data-testid={`edit-product-${p.id}`}>
                      Editar
                    </Link>
                    {p.active && (
                      <button onClick={() => handleDelete(p.id)} className="btn-danger text-xs" data-testid={`delete-product-${p.id}`}>
                        Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
