'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';

interface Props {
  subtotal: number;
  onApply: (code: string, discount: number) => void;
  onClear: () => void;
  appliedCode?: string;
  discount?: number;
}

interface ValidateResponse {
  valid: boolean;
  discount: number;
  total: number;
  error?: string;
  code?: string;
}

export function CouponInput({ subtotal, onApply, onClear, appliedCode, discount }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function apply() {
    setError(null);
    setBusy(true);
    try {
      const res = await api<ValidateResponse>('/api/coupons/validate', {
        method: 'POST',
        body: { code, subtotal },
      });
      if (!res.valid) {
        setError(res.error ?? 'Cupón inválido');
        return;
      }
      onApply(code.toUpperCase(), res.discount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error validando cupón');
    } finally {
      setBusy(false);
    }
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between border border-green-200 bg-green-50 p-3 rounded" data-testid="coupon-applied">
        <div>
          <div className="text-sm font-medium text-green-800">Cupón aplicado: {appliedCode}</div>
          <div className="text-xs text-green-700">Descuento: ${discount}</div>
        </div>
        <button
          onClick={() => {
            setCode('');
            onClear();
          }}
          className="text-sm text-green-700 underline"
          data-testid="remove-coupon-button"
        >
          Quitar
        </button>
      </div>
    );
  }

  return (
    <div>
      <label className="label" htmlFor="coupon">Cupón de descuento</label>
      <div className="flex gap-2">
        <input
          id="coupon"
          className="input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="WELCOME10"
          data-testid="coupon-input"
        />
        <button onClick={apply} disabled={!code || busy} className="btn-secondary" data-testid="apply-coupon-button">
          {busy ? '…' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p className="field-error" data-testid="coupon-error">
          {error}
        </p>
      )}
    </div>
  );
}
