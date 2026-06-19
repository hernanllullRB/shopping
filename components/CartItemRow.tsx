'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import { toast } from './Toast';
import { ApiError } from '@/lib/api';
import type { CartItem } from '@/lib/types';

export function CartItemRow({ item }: { item: CartItem }) {
  const update = useCartStore((s) => s.update);
  const remove = useCartStore((s) => s.remove);
  const [busy, setBusy] = useState(false);
  const max = Math.min(10, item.product.stock);

  async function handleQty(qty: number) {
    setBusy(true);
    try {
      await update(item.productId, qty);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await remove(item.productId);
      toast('Item removido', 'info');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card flex gap-4 items-center" data-testid={`cart-item-${item.productId}`}>
      <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
        <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover" unoptimized />
      </div>
      <div className="flex-1">
        <Link href={`/products/${item.product.id}`} className="font-medium hover:text-brand-600">
          {item.product.name}
        </Link>
        <div className="text-sm text-slate-500">${item.product.price} c/u</div>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm">Cant.</label>
        <input
          type="number"
          min={1}
          max={max}
          value={item.quantity}
          onChange={(e) => handleQty(Number(e.target.value))}
          disabled={busy}
          className="w-16 input"
          data-testid={`quantity-input-${item.productId}`}
        />
      </div>
      <div className="font-semibold w-20 text-right" data-testid={`line-total-${item.productId}`}>
        ${Math.round(item.product.price * item.quantity * 100) / 100}
      </div>
      <button onClick={handleRemove} disabled={busy} className="btn-secondary text-sm" data-testid={`remove-item-${item.productId}`}>
        Quitar
      </button>
    </div>
  );
}
