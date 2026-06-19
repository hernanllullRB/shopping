# Progreso de implementación

Estado final: **completado** ✅.

## Decisiones tomadas (referenciado en `docs/DECISIONES.md`)
- Stack: Next.js 14 App Router + TypeScript + Tailwind + Zustand
- Storage: in-memory singleton (`lib/store.ts`)
- Auth: JWT (`jsonwebtoken`) + bcrypt, TTL 24h, tabla in-memory para soporte de logout
- Cupones: 6 seeds (WELCOME10, SAVE20, FLAT15, EXPIRED, USED, FIRSTBUY)
- Stock: descuenta en checkout, restaura en cancel
- Statuses de orden: paid → shipped → delivered, paid → cancelled (terminal)
- Card validation: 16 dígitos, MM/YY futura, CVV 3 dígitos. `lastFour === "0000"` → 402
- Paginación: 6 productos/página por defecto
- Seed: 18 productos (8 Electronics, 6 Clothing, 4 Books)

## Fases — resultado

### Fase 0 — Diseño ✅
- Documento: `docs/superpowers/specs/2026-06-18-shopping-qa-design.md`

### Fase 1 — Scaffolding ✅
- `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`
- `.env.example`, `.env.local`, `.gitignore`, `next-env.d.ts`

### Fase 2 — Lib (núcleo) ✅
- `lib/types.ts`, `lib/store.ts` (con seeds), `lib/auth.ts`, `lib/validators.ts`
- `lib/api.ts`, `lib/coupons.ts`, `lib/swagger.ts`, `middleware.ts`

### Fase 3 — API routes ✅
- Auth: `login`, `register`, `logout`, `me`
- Account: `PUT /api/account`, `PUT /api/account/password`
- Products: `GET list`, `GET detail`
- Cart: `GET`, `DELETE`, `POST items`, `PUT/DELETE items/[id]`
- Coupons: `POST validate`
- Checkout: `POST`
- Orders: `GET list`, `GET detail`, `POST cancel`
- Admin: `products` CRUD, `orders` GET+PUT status, `users` GET
- Docs: `GET /api/docs` (HTML) + `GET /api/docs/spec` (JSON)

### Fase 4 — Stores cliente (Zustand) ✅
- `store/auth.ts` (login, hydrate, logout)
- `store/cart.ts` (fetch, add, update, remove, clear)

### Fase 5 — Componentes ✅
- `Navbar`, `ProductCard`, `CartItemRow`, `PaymentForm`, `CouponInput`
- `AuthHydrator`, `Toast`/`Toaster`, `AdminProductForm`

### Fase 6 — Páginas ✅
- `(auth)/login`, `(auth)/register`
- `(shop)/` (listing con filtros, búsqueda, sort, paginación, query state en URL)
- `(shop)/products/[id]`
- `(shop)/cart`, `(shop)/checkout`, `(shop)/confirmation`
- `(shop)/orders`, `(shop)/orders/[id]`
- `(shop)/account`
- `(shop)/admin`, `(shop)/admin/products`, `(shop)/admin/products/new`,
  `(shop)/admin/products/[id]`, `(shop)/admin/orders`, `(shop)/admin/users`

### Fase 7 — Verificación ✅
- `npm install` OK (429 paquetes)
- `npm run build` exitoso. Detalle: agregados `Suspense` boundaries en las pages que usan `useSearchParams` (`/login`, `/`, `/confirmation`, `/admin/orders`) para que el prerender funcione.

### Fase 8 — Documentación final (español) ✅
- `README.md` — cómo correr, credenciales, tarjetas, cupones, tabla de endpoints, páginas, estructura
- `docs/DECISIONES.md` — el "por qué" detrás de cada decisión
- `docs/QA-GUIDE.md` — escenarios manuales sugeridos, organizados por módulo
