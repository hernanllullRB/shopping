'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { AdminBackLink } from '@/components/AdminBackLink';
import { AdminProductForm, AdminProductFormData } from '@/components/AdminProductForm';
import { toast } from '@/components/Toast';
import type { Product } from '@/lib/types';

export default function AdminProductEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api<{ products: Product[] }>('/api/admin/products')
      .then((res) => setProduct(res.products.find((p) => p.id === params.id) ?? null))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handle(data: AdminProductFormData) {
    setBusy(true);
    setErrors({});
    try {
      await api(`/api/admin/products/${params.id}`, { method: 'PUT', body: data });
      toast('Producto actualizado', 'success');
      router.push('/admin/products');
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      toast(err instanceof ApiError ? err.message : 'Error', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="card">Cargando…</div>;
  if (!product) return <div className="card">Producto no encontrado.</div>;

  return (
    <div className="max-w-xl mx-auto">
      <AdminBackLink href="/admin/products" label="Volver a productos" />
      <h1 className="text-2xl font-bold mb-4">Editar producto</h1>
      <div className="card">
        <AdminProductForm initial={product} onSubmit={handle} busy={busy} errors={errors} submitLabel="Guardar" />
      </div>
    </div>
  );
}
