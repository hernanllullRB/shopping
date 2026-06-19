'use client';

import Link from 'next/link';

interface Props {
  href?: string;
  label?: string;
}

export function AdminBackLink({ href = '/admin', label = 'Volver al panel admin' }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 mb-3"
      data-testid="admin-back-link"
    >
      <span aria-hidden>←</span>
      {label}
    </Link>
  );
}
