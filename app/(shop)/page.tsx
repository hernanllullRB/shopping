'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/lib/types';

const CATEGORIES = ['Electronics', 'Clothing', 'Books'] as const;

interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function ProductsListingPage() {
  return (
    <Suspense fallback={<div className="card">Cargando…</div>}>
      <ProductsListingInner />
    </Suspense>
  );
}

function ProductsListingInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const search = sp.get('search') ?? '';
  const selectedCategories = sp.getAll('category');
  const minPrice = sp.get('minPrice') ?? '';
  const maxPrice = sp.get('maxPrice') ?? '';
  const sort = sp.get('sort') ?? 'newest';
  const page = Number(sp.get('page') ?? '1');

  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    api<ProductsResponse>(`/api/products?${sp.toString()}`).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [sp]);

  function updateParams(next: Record<string, string | string[] | null>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => {
      params.delete(k);
      if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) return;
      if (Array.isArray(v)) v.forEach((val) => params.append(k, val));
      else params.set(k, v);
    });
    if (!('page' in next)) params.set('page', '1');
    router.push(`/?${params.toString()}`);
  }

  function toggleCategory(cat: string) {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    updateParams({ category: next });
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParams({ search: value }), 250);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6" data-testid="product-grid">
      <aside className="card h-fit" data-testid="filter-sidebar">
        <h3 className="font-semibold mb-3">Buscar</h3>
        <input
          className="input mb-4"
          placeholder="Buscar productos…"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          data-testid="search-input"
        />
        <h3 className="font-semibold mb-2">Categorías</h3>
        <div className="space-y-1 mb-4">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                data-testid={`category-filter-${cat}`}
              />
              {cat}
            </label>
          ))}
        </div>
        <h3 className="font-semibold mb-2">Precio</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <input
            className="input"
            placeholder="Min"
            defaultValue={minPrice}
            onBlur={(e) => updateParams({ minPrice: e.target.value })}
            data-testid="min-price-input"
          />
          <input
            className="input"
            placeholder="Max"
            defaultValue={maxPrice}
            onBlur={(e) => updateParams({ maxPrice: e.target.value })}
            data-testid="max-price-input"
          />
        </div>
        <button
          className="btn-secondary w-full text-sm"
          onClick={() => router.push('/')}
          data-testid="clear-filters-button"
        >
          Limpiar filtros
        </button>
      </aside>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Productos</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Ordenar:</label>
            <select
              className="input w-auto"
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              data-testid="sort-select"
            >
              <option value="newest">Más nuevos</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="products-loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[4/3] bg-slate-200 rounded mb-3" />
                <div className="h-4 bg-slate-200 rounded mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!loading && data?.items.length === 0 && (
          <div className="card text-center py-12 text-slate-500" data-testid="products-empty">
            No se encontraron productos con esos filtros.
          </div>
        )}

        {!loading && data && data.items.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between text-sm" data-testid="pagination">
              <div data-testid="pagination-info">
                Página {data.page} de {data.totalPages} · {data.total} productos
              </div>
              <div className="flex gap-2">
                {page > 1 && (
                  <button
                    className="btn-secondary"
                    onClick={() => updateParams({ page: String(page - 1) })}
                    data-testid="pagination-prev"
                  >
                    ← Anterior
                  </button>
                )}
                {Array.from({ length: data.totalPages }).map((_, i) => {
                  const active = page === i + 1;
                  return (
                    <button
                      key={i}
                      aria-current={active ? 'page' : undefined}
                      className={
                        active
                          ? 'inline-flex items-center justify-center px-4 py-2 rounded-md font-bold bg-brand-600 text-white shadow ring-2 ring-brand-500 ring-offset-1'
                          : 'btn-secondary'
                      }
                      onClick={() => updateParams({ page: String(i + 1) })}
                      data-testid={`pagination-page-${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
                {page < data.totalPages && (
                  <button
                    className="btn-secondary"
                    onClick={() => updateParams({ page: String(page + 1) })}
                    data-testid="pagination-next"
                  >
                    Siguiente →
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
