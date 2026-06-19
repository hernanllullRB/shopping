'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { AdminBackLink } from '@/components/AdminBackLink';
import { AdminProductForm, AdminProductFormData } from '@/components/AdminProductForm';
import { toast } from '@/components/Toast';

export default function AdminProductNewPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handle(data: AdminProductFormData) {
    setBusy(true);
    setErrors({});
    try {
      await api('/api/admin/products', { method: 'POST', body: data });
      toast('Producto creado', 'success');
      router.push('/admin/products');
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      toast(err instanceof ApiError ? err.message : 'Error', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <AdminBackLink href="/admin/products" label="Volver a productos" />
      <h1 className="text-2xl font-bold mb-4">Nuevo producto</h1>
      <div className="card">
        <AdminProductForm onSubmit={handle} busy={busy} errors={errors} submitLabel="Crear" />
      </div>
    </div>
  );
}
