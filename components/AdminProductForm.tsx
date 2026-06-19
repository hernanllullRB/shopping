'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';

export interface AdminProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: 'Electronics' | 'Clothing' | 'Books';
  active: boolean;
}

interface Props {
  initial?: Product;
  errors?: Record<string, string>;
  busy?: boolean;
  submitLabel?: string;
  onSubmit: (data: AdminProductFormData) => void;
}

export function AdminProductForm({ initial, errors = {}, busy, submitLabel = 'Guardar', onSubmit }: Props) {
  const [data, setData] = useState<AdminProductFormData>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    price: initial?.price ?? 0,
    stock: initial?.stock ?? 0,
    imageUrl: initial?.imageUrl ?? 'https://picsum.photos/seed/new/400/300',
    category: initial?.category ?? 'Electronics',
    active: initial?.active ?? true,
  });

  function update<K extends keyof AdminProductFormData>(k: K, v: AdminProductFormData[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(data);
      }}
      className="space-y-4"
      data-testid="product-form"
    >
      <div>
        <label className="label">Nombre</label>
        <input className="input" value={data.name} onChange={(e) => update('name', e.target.value)} data-testid="product-form-name" />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea className="input" rows={3} value={data.description} onChange={(e) => update('description', e.target.value)} data-testid="product-form-description" />
        {errors.description && <p className="field-error">{errors.description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Precio</label>
          <input type="number" min={0} step="0.01" className="input" value={data.price} onChange={(e) => update('price', Number(e.target.value))} data-testid="product-form-price" />
          {errors.price && <p className="field-error">{errors.price}</p>}
        </div>
        <div>
          <label className="label">Stock</label>
          <input type="number" min={0} className="input" value={data.stock} onChange={(e) => update('stock', Number(e.target.value))} data-testid="product-form-stock" />
          {errors.stock && <p className="field-error">{errors.stock}</p>}
        </div>
      </div>
      <div>
        <label className="label">Categoría</label>
        <select className="input" value={data.category} onChange={(e) => update('category', e.target.value as AdminProductFormData['category'])} data-testid="product-form-category">
          <option>Electronics</option>
          <option>Clothing</option>
          <option>Books</option>
        </select>
      </div>
      <div>
        <label className="label">URL imagen</label>
        <input className="input" value={data.imageUrl} onChange={(e) => update('imageUrl', e.target.value)} data-testid="product-form-image" />
        {errors.imageUrl && <p className="field-error">{errors.imageUrl}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={data.active} onChange={(e) => update('active', e.target.checked)} data-testid="product-form-active" />
        Activo
      </label>
      <button type="submit" disabled={busy} className="btn-primary" data-testid="product-form-submit">
        {busy ? 'Guardando…' : submitLabel}
      </button>
    </form>
  );
}
