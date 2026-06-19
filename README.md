# Shopping QA — App de pruebas.

Aplicación full‑stack Next.js 14 (App Router) construida exclusivamente como **sujeto bajo prueba (SUT) para QA manual**. Persiste todo en memoria — no hay base de datos. Cada vez que se reinicia el servidor se vuelve al estado inicial.

> Es deliberadamente rica en funcionalidades: registro/login, catálogo con filtros, carrito, cupones, checkout, órdenes con ciclo de vida, perfil, y panel admin. La idea es maximizar la superficie de prueba.

---

## Cómo correr

```bash
# 1. Instalar dependencias
npm install

# 2. (Opcional) Definir variables de entorno
cp .env.example .env.local
# Las claves de ejemplo ya vienen pre-cargadas en .env.local

# 3. Modo dev
npm run dev

# 4. Producción
npm run build && npm start
```

La app queda disponible en **http://localhost:3000**.

Documentación interactiva de la API (Swagger UI) en **http://localhost:3000/api/docs**.

---

## Credenciales de prueba

| Usuario | Contraseña | Rol      | Notas                  |
|---------|------------|----------|------------------------|
| admin   | admin123   | admin    | Acceso a `/admin`      |
| user1   | pass123    | customer | Cliente común          |
| user2   | pass456    | customer | Cliente común          |

También se puede crear cuentas nuevas desde **/register** (siempre con rol `customer`).

---

## Tarjetas de prueba (checkout)

El validador es relajado a propósito para QA:

- **Número de tarjeta**: cualquier secuencia de 16 dígitos
- **MM/YY**: cualquier mes (`01`–`12`) y año posterior a hoy
- **CVV**: 3 dígitos

Reglas de negocio:
- Si los **últimos 4 dígitos** del número son `0000` → respuesta **402 Payment Declined**
- Si la fecha de vencimiento está en el pasado → **400 Card Expired**
- Cualquier otra terminación crea la orden con status `paid`

### Ejemplos

| Número                | Resultado                |
|-----------------------|--------------------------|
| 4111111111111111      | Éxito                    |
| 4242424242424242      | Éxito                    |
| 1234567812340000      | Rechazado (402)          |
| Expiry `01/20` + cualquier número | Tarjeta expirada (400) |

---

## Cupones precargados

| Código     | Descuento     | Reglas                                    |
|------------|---------------|-------------------------------------------|
| WELCOME10  | 10%           | Sin restricciones                         |
| SAVE20     | 20%           | Requiere subtotal ≥ $100                  |
| FLAT15     | $15 flat      | Sin restricciones                         |
| EXPIRED    | 50%           | Caducó el 2025‑01‑01 → siempre rechazado  |
| USED       | 30%           | maxUses=0 → siempre "agotado"             |
| FIRSTBUY   | 25%           | Solo se puede usar **una vez por usuario** |

Errores observables:
- `COUPON_INVALID`, `COUPON_EXPIRED`, `COUPON_EXHAUSTED`, `COUPON_ALREADY_USED`, `COUPON_MIN_SUBTOTAL`.

---

## Endpoints REST

Todos devuelven JSON. Errores con shape `{ error: string, code?: string, field?: string, details?: { [field]: string } }`.

| Método | Path                                | Auth        | Descripción                                  |
|--------|-------------------------------------|-------------|----------------------------------------------|
| POST   | `/api/auth/login`                   | —           | Login                                        |
| POST   | `/api/auth/register`                | —           | Registro                                     |
| POST   | `/api/auth/logout`                  | Bearer      | Invalida el token                            |
| GET    | `/api/auth/me`                      | Bearer      | Usuario actual                               |
| PUT    | `/api/account`                      | Bearer      | Actualizar nombre                            |
| PUT    | `/api/account/password`             | Bearer      | Cambiar contraseña                           |
| GET    | `/api/products`                     | —           | Listado con filtros, búsqueda, orden, paginado |
| GET    | `/api/products/:id`                 | —           | Detalle                                      |
| GET    | `/api/cart`                         | Bearer      | Carrito del usuario                          |
| POST   | `/api/cart/items`                   | Bearer      | Agregar item                                 |
| PUT    | `/api/cart/items/:productId`        | Bearer      | Actualizar cantidad                          |
| DELETE | `/api/cart/items/:productId`        | Bearer      | Eliminar item                                |
| DELETE | `/api/cart`                         | Bearer      | Vaciar carrito                               |
| POST   | `/api/coupons/validate`             | Bearer      | Validar cupón sobre un subtotal              |
| POST   | `/api/checkout`                     | Bearer      | Pagar carrito                                |
| GET    | `/api/orders`                       | Bearer      | Mis órdenes                                  |
| GET    | `/api/orders/:id`                   | Bearer      | Detalle de orden                             |
| POST   | `/api/orders/:id/cancel`            | Bearer      | Cancelar orden (solo si está en `paid`)      |
| GET    | `/api/admin/products`               | admin       | Todos los productos (incluye inactivos)      |
| POST   | `/api/admin/products`               | admin       | Crear producto                               |
| PUT    | `/api/admin/products/:id`           | admin       | Editar producto                              |
| DELETE | `/api/admin/products/:id`           | admin       | Desactivar producto (soft delete)            |
| GET    | `/api/admin/orders`                 | admin       | Todas las órdenes (filtro `?status=`)        |
| PUT    | `/api/admin/orders/:id`             | admin       | Cambiar status (con flow controlado)         |
| GET    | `/api/admin/users`                  | admin       | Lista de usuarios                            |
| GET    | `/api/docs`                         | —           | Swagger UI                                   |
| GET    | `/api/docs/spec`                    | —           | Spec OpenAPI en JSON                         |

### Query params relevantes en `GET /api/products`

| Param      | Tipo            | Descripción                          |
|------------|-----------------|--------------------------------------|
| search     | string          | Busca en nombre y descripción        |
| category   | string (multi)  | `Electronics`, `Clothing`, `Books`   |
| minPrice   | number          | Precio mínimo                        |
| maxPrice   | number          | Precio máximo                        |
| sort       | string          | `price-asc`, `price-desc`, `name`, `newest` |
| page       | int             | 1‑indexado                           |
| pageSize   | int             | Por defecto 6                        |

---

## Páginas

| Ruta                                | Acceso         | Descripción                       |
|-------------------------------------|----------------|-----------------------------------|
| `/login`                            | público        | Login                             |
| `/register`                         | público        | Registro                          |
| `/`                                 | autenticado    | Listado de productos              |
| `/products/:id`                     | autenticado    | Detalle de producto               |
| `/cart`                             | autenticado    | Carrito                           |
| `/checkout`                         | autenticado    | Pago + cupones                    |
| `/confirmation?orderId=`            | autenticado    | Resumen post‑pago                 |
| `/orders`                           | autenticado    | Historial de órdenes              |
| `/orders/:id`                       | autenticado    | Detalle + cancelar                |
| `/account`                          | autenticado    | Perfil y cambio de contraseña     |
| `/admin`                            | admin          | Dashboard                         |
| `/admin/products`                   | admin          | CRUD de productos                 |
| `/admin/products/new`               | admin          | Nuevo                             |
| `/admin/products/:id`               | admin          | Editar                            |
| `/admin/orders`                     | admin          | Lista de órdenes + cambio status  |
| `/admin/users`                      | admin          | Usuarios (read‑only)              |

> El middleware redirige a `/login` ante cualquier ruta protegida sin token. El acceso a `/admin/*` se valida en el cliente y en la API (rol `admin` requerido).

---

## Estados de orden

```
paid ──► shipped ──► delivered
  │
  └────► cancelled (restaura stock)
```

- Solo `paid` puede transicionar a `shipped` o `cancelled`.
- Solo `shipped` puede transicionar a `delivered`.
- `delivered` y `cancelled` son terminales.

El customer puede cancelar su propia orden en `paid`. El admin puede mover entre cualquier transición válida.

---

## Atributos `data-testid`

Cada elemento interactivo importante tiene un `data-testid` predecible. Algunos ejemplos:

- Login: `username-input`, `password-input`, `login-button`, `login-error`, `login-form`.
- Registro: `email-input`, `confirm-password-input`, `terms-checkbox`, `register-button`, `register-error-{field}`.
- Listado: `search-input`, `category-filter-Electronics`, `min-price-input`, `sort-select`, `pagination-prev`, `pagination-next`, `pagination-page-{n}`.
- Cards: `product-card-{id}`, `add-to-cart-{id}`, `out-of-stock-{id}`, `low-stock-{id}`.
- Carrito: `cart-page`, `cart-empty`, `cart-item-{id}`, `quantity-input-{id}`, `remove-item-{id}`, `cart-subtotal`, `checkout-button`.
- Checkout: `checkout-form`, `cardholder-input`, `card-number-input`, `expiry-input`, `cvv-input`, `pay-button`, `payment-error`, `retry-button`.
- Cupón: `coupon-input`, `apply-coupon-button`, `coupon-applied`, `coupon-error`.
- Órdenes: `order-row-{id}`, `order-status-{id}`, `cancel-order-button`.
- Admin: `admin-page`, `admin-products-page`, `admin-orders-page`, `admin-users-page`, `new-product-button`, `delete-product-{id}`, `admin-order-set-shipped-{id}`.

Para la lista completa, ver el código fuente en [components/](components/) y en [app/](app/).

---

## Estructura del proyecto

```
.
├── app/
│   ├── (auth)/login          ← login
│   ├── (auth)/register       ← registro
│   ├── (shop)/               ← rutas con Navbar (autenticadas)
│   │   ├── page.tsx          ← listado
│   │   ├── products/[id]
│   │   ├── cart
│   │   ├── checkout
│   │   ├── confirmation
│   │   ├── orders
│   │   ├── orders/[id]
│   │   ├── account
│   │   └── admin/*
│   ├── api/                  ← route handlers
│   ├── layout.tsx
│   └── globals.css
├── components/               ← componentes compartidos
├── lib/
│   ├── types.ts
│   ├── store.ts              ← singleton in‑memory + seeds
│   ├── auth.ts               ← JWT helpers
│   ├── validators.ts         ← zod schemas
│   ├── coupons.ts
│   ├── swagger.ts
│   └── api.ts                ← fetch wrapper de cliente
├── store/                    ← Zustand
│   ├── auth.ts
│   └── cart.ts
├── middleware.ts             ← redirección a /login
└── docs/
    ├── DECISIONES.md
    ├── QA-GUIDE.md
    └── superpowers/specs/2026-06-18-shopping-qa-design.md
```

---

## Tareas conocidas / fuera de scope

- No hay tests automatizados — la app es el sistema bajo prueba.
- No hay envíos por email (es mock — se ignora).
- Wishlist, reviews y faceted search se evaluaron y descartaron por overlap con el resto.
- Estado se resetea al reiniciar el server. Esperado.
