'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import type { Product } from '@/lib/types';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    api<{ product: Product }>(`/api/products/${params.id}`)
      .then((res) => setProduct(res.product))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleAdd() {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!product) return;
    setBusy(true);
    try {
      await add(product.id, qty);
      toast(`${product.name} agregado al carrito`, 'success');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="card">Cargando…</div>;
  if (!product) {
    return (
      <div className="card text-center py-12" data-testid="product-not-found">
        <p className="text-slate-500 mb-4">Producto no encontrado.</p>
        <button onClick={() => router.push('/')} className="btn-primary">
          Volver
        </button>
      </div>
    );
  }

  const outOfStock = product.stock === 0;
  const maxQty = Math.min(10, product.stock);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8" data-testid="product-detail-page">
      <div className="relative aspect-square rounded overflow-hidden">
        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
      </div>
      <div>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{product.category}</span>
        <h1 className="text-3xl font-bold mt-2 mb-2" data-testid="product-detail-name">
          {product.name}
        </h1>
        <p className="text-2xl text-brand-600 font-bold mb-4" data-testid="product-detail-price">
          ${product.price}
        </p>
        <p className="text-slate-700 mb-4" data-testid="product-description">
          {product.description}
        </p>
        <p className="mb-4" data-testid="product-stock-badge">
          {outOfStock ? (
            <span className="text-red-600">Sin stock</span>
          ) : (
            <span className="text-slate-600">Stock disponible: {product.stock}</span>
          )}
        </p>
        {!outOfStock && (
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm">Cantidad:</label>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value))))}
              className="input w-20"
              data-testid="qty-selector"
            />
          </div>
        )}
        <button
          onClick={handleAdd}
          disabled={busy || outOfStock}
          className="btn-primary"
          data-testid="add-to-cart-detail-button"
        >
          {outOfStock ? 'Sin stock' : busy ? 'Agregando…' : 'Agregar al carrito'}
        </button>
      </div>
    </div>
  );
}
