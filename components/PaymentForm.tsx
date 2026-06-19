'use client';

import { useState } from 'react';

export interface PaymentData {
  cardHolder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface PaymentFormErrors {
  cardHolder?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
}

interface Props {
  errors?: PaymentFormErrors;
  disabled?: boolean;
  onSubmit: (data: PaymentData) => void;
  submitLabel?: string;
}

export function PaymentForm({ errors = {}, disabled, onSubmit, submitLabel = 'Pagar' }: Props) {
  const [data, setData] = useState<PaymentData>({ cardHolder: '', cardNumber: '', expiry: '', cvv: '' });

  function handleChange<K extends keyof PaymentData>(field: K, value: string) {
    setData((d) => ({ ...d, [field]: value }));
  }

  return (
    <form
      data-testid="checkout-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(data);
      }}
      className="space-y-4"
    >
      <div>
        <label className="label" htmlFor="cardHolder">Titular de la tarjeta</label>
        <input
          id="cardHolder"
          data-testid="cardholder-input"
          className="input"
          value={data.cardHolder}
          onChange={(e) => handleChange('cardHolder', e.target.value)}
        />
        {errors.cardHolder && (
          <p className="field-error" data-testid="cardholder-error">
            {errors.cardHolder}
          </p>
        )}
      </div>
      <div>
        <label className="label" htmlFor="cardNumber">Número de tarjeta (16 dígitos)</label>
        <input
          id="cardNumber"
          data-testid="card-number-input"
          className="input"
          inputMode="numeric"
          maxLength={16}
          value={data.cardNumber}
          onChange={(e) => handleChange('cardNumber', e.target.value.replace(/\D/g, ''))}
          placeholder="4111111111111111"
        />
        {errors.cardNumber && (
          <p className="field-error" data-testid="card-number-error">
            {errors.cardNumber}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="expiry">Vencimiento (MM/YY)</label>
          <input
            id="expiry"
            data-testid="expiry-input"
            className="input"
            maxLength={5}
            placeholder="12/30"
            value={data.expiry}
            onChange={(e) => handleChange('expiry', e.target.value)}
          />
          {errors.expiry && (
            <p className="field-error" data-testid="expiry-error">
              {errors.expiry}
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="cvv">CVV</label>
          <input
            id="cvv"
            data-testid="cvv-input"
            className="input"
            inputMode="numeric"
            maxLength={3}
            value={data.cvv}
            onChange={(e) => handleChange('cvv', e.target.value.replace(/\D/g, ''))}
          />
          {errors.cvv && (
            <p className="field-error" data-testid="cvv-error">
              {errors.cvv}
            </p>
          )}
        </div>
      </div>
      <button type="submit" disabled={disabled} className="btn-primary w-full" data-testid="pay-button">
        {disabled ? 'Procesando…' : submitLabel}
      </button>
    </form>
  );
}
