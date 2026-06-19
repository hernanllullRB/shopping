'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { useRouter } from 'next/navigation';
import { toast } from './Toast';
import type { Product } from '@/lib/types';
import { ApiError } from '@/lib/api';

export function ProductCard({ product }: { product: Product }) {
  const [busy, setBusy] = useState(false);
  const add = useCartStore((s) => s.add);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const outOfStock = product.stock === 0;

  async function handleAdd() {
    if (!user) {
      router.push('/login');
      return;
    }
    setBusy(true);
    try {
      await add(product.id, 1);
      toast(`${product.name} agregado al carrito`, 'success');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error agregando al carrito';
      toast(msg, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card flex flex-col" data-testid={`product-card-${product.id}`}>
      <Link href={`/products/${product.id}`} className="block relative aspect-[4/3] mb-3 overflow-hidden rounded">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          unoptimized
        />
      </Link>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{product.category}</span>
        {outOfStock && (
          <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700" data-testid={`out-of-stock-${product.id}`}>
            Sin stock
          </span>
        )}
        {!outOfStock && product.stock <= 3 && (
          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700" data-testid={`low-stock-${product.id}`}>
            Quedan {product.stock}
          </span>
        )}
      </div>
      <Link href={`/products/${product.id}`} className="font-semibold mb-1 hover:text-brand-600" data-testid={`product-name-${product.id}`}>
        {product.name}
      </Link>
      <div className="text-lg font-bold text-brand-600 mb-3" data-testid={`product-price-${product.id}`}>
        ${product.price}
      </div>
      <button
        onClick={handleAdd}
        disabled={busy || outOfStock}
        className="btn-primary text-sm mt-auto"
        data-testid={`add-to-cart-${product.id}`}
      >
        {busy ? 'Agregando…' : outOfStock ? 'Sin stock' : 'Agregar al carrito'}
      </button>
    </div>
  );
}
