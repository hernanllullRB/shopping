# Diseño — App de Shopping para QA Manual

**Fecha**: 2026-06-18
**Autor**: brainstorming sesión inicial
**Estado**: aprobado por usuario (delegación de decisiones restantes)

## Propósito
Aplicación full-stack Next.js que sirve como sujeto bajo prueba (SUT) para QA manual. Datos en memoria, sin DB real. Foco: amplia superficie de funcionalidades, validaciones, estados de error, control de acceso por rol.

## Stack
- Next.js 14 (App Router)
- TypeScript estricto
- Tailwind CSS
- Zustand (estado cliente: auth, carrito)
- jsonwebtoken (JWT, 24h expiry)
- bcryptjs (hash de passwords)
- zod (validaciones server-side)
- swagger-jsdoc (spec generación) + Swagger UI por CDN en ruta custom
- Storage: módulo singleton in-memory en `lib/store.ts`

## Decisiones de scope (de brainstorming)
1. **Registro + perfil** habilitado
2. **Detalle de producto + búsqueda/filtro/orden** habilitado
3. **Stock simple**: descuento en checkout, restore en cancel
4. **Órdenes**: estados paid→shipped→delivered o cancelled
5. **Admin panel standard**: CRUD productos + órdenes (cambio status) + lista usuarios read-only
6. **Cupones** con set fijo de seeds incluyendo `FIRSTBUY` por-usuario una vez
7. **Validación signup estándar**: username, email, password fuerte, confirm, name, terms

## Modelo de datos

```ts
User {
  id: string
  username: string  // único, 3-20 alfanum
  email: string     // único, formato email
  passwordHash: string  // bcrypt
  role: 'admin' | 'customer'
  name: string
  createdAt: string  // ISO
}

Product {
  id: string
  name: string
  description: string
  price: number  // dólares, dos decimales
  stock: number  // >= 0
  imageUrl: string
  category: 'Electronics' | 'Clothing' | 'Books'
  active: boolean  // admin puede desactivar
  createdAt: string
}

CartItem {
  productId: string
  quantity: number  // 1-10, no exceder stock
  product: Product  // hidratado en GET
}

Order {
  id: string
  userId: string
  username: string  // denormalizado para admin
  items: CartItem[]  // snapshot
  subtotal: number
  discount: number
  total: number
  status: 'paid' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
  updatedAt: string
  paymentMethod: 'credit_card'
  cardHolder: string
  lastFour: string
  couponCode?: string
}

Coupon {
  code: string
  type: 'percent' | 'flat'
  value: number
  active: boolean
  expiresAt?: string
  maxUses?: number
  usedCount: number
  perUserOnce?: boolean  // para FIRSTBUY
  minSubtotal?: number  // para SAVE20
  usedByUsers: Set<string>  // username
}
```

## Storage in-memory (`lib/store.ts`)
Singleton con:
- `users: Map<string, User>` por id
- `usernameIndex: Map<string, string>` username → id
- `emailIndex: Map<string, string>` email → id
- `tokens: Map<string, { username, expiresAt }>`
- `carts: Map<string, CartItem[]>` por username
- `orders: Order[]`
- `products: Map<string, Product>`
- `coupons: Map<string, Coupon>`

Inicializa en `module load` con seed determinístico.

### Seeds
**Usuarios:**
- `admin` / `admin123` (rol admin, name: "Admin User")
- `user1` / `pass123` (customer, name: "Usuario Uno")
- `user2` / `pass456` (customer, name: "Usuario Dos")

**Productos (18 total):**

Electronics (8):
- Wireless Headphones $89 — stock 10
- Mechanical Keyboard $129 — stock 10
- USB-C Hub $45 — stock 10
- Webcam HD $79 — stock 10
- Bluetooth Speaker $59 — stock 5
- Smart Watch $199 — stock 3
- Gaming Mouse $69 — stock 10
- Monitor 27" $349 — stock 0 (out of stock para QA)

Clothing (6):
- Cotton T-Shirt $19 — stock 25
- Denim Jacket $89 — stock 8
- Wool Sweater $69 — stock 12
- Running Shoes $129 — stock 10
- Baseball Cap $25 — stock 30
- Leather Belt $39 — stock 15

Books (4):
- Clean Code $35 — stock 10
- The Pragmatic Programmer $45 — stock 10
- Refactoring $55 — stock 10
- Design Patterns $49 — stock 2 (low stock)

**Cupones:**
- `WELCOME10` — 10%, activo, ilimitado
- `SAVE20` — 20%, min subtotal $100
- `FLAT15` — $15 flat off
- `EXPIRED` — 50%, expirado 2025-01-01
- `USED` — 30%, maxUses 0, usedCount 0 → simula agotado
- `FIRSTBUY` — 25%, perUserOnce

## API (resumen)
Detalle completo en Swagger `/api/docs`.

### Auth
- `POST /api/auth/login` → `{ username, password }` → `{ token, user }`
- `POST /api/auth/register` → `{ username, email, password, confirmPassword, name, terms }` → `{ token, user }`
- `POST /api/auth/logout` → invalida token (header)
- `GET /api/auth/me` → user actual

### Account
- `PUT /api/account` → update name
- `PUT /api/account/password` → `{ currentPassword, newPassword, confirmPassword }`

### Products
- `GET /api/products?search=&category=&minPrice=&maxPrice=&sort=&page=&pageSize=` → `{ items, total, page, pageSize, totalPages }`
- `GET /api/products/:id` → producto

### Cart (auth)
- `GET /api/cart` → items + subtotal
- `POST /api/cart/items` → `{ productId, quantity }`
- `PUT /api/cart/items/:productId` → `{ quantity }`
- `DELETE /api/cart/items/:productId`
- `DELETE /api/cart`

### Coupons
- `POST /api/coupons/validate` → `{ code, subtotal }` → `{ valid, discount, total, error? }`

### Checkout (auth)
- `POST /api/checkout` → `{ paymentMethod, cardHolder, cardNumber, expiry, cvv, couponCode? }`
  - Server extrae `lastFour` de cardNumber
  - Si `lastFour === "0000"` → 402
  - Valida cart no vacío, stock suficiente, cupón válido
  - Crea orden, descuenta stock, limpia carrito, marca cupón usado

### Orders (auth)
- `GET /api/orders` → órdenes del usuario
- `GET /api/orders/:id`
- `POST /api/orders/:id/cancel` → sólo si status `paid`

### Admin (auth + role=admin)
- `GET /api/admin/products` → todos (incluye inactive)
- `POST /api/admin/products` → crear
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id` (soft delete vía active=false)
- `GET /api/admin/orders` → todas
- `PUT /api/admin/orders/:id` → `{ status }` (transición de estado)
- `GET /api/admin/users` → lista (sin passwords)

### Docs
- `GET /api/docs` → HTML Swagger UI (CDN)
- `GET /api/docs/spec` → JSON spec

## Middleware
- Páginas protegidas: redirect a `/login` si no hay cookie con token válido
- Páginas admin: redirect a `/` si rol != admin
- APIs protegidas: 401 si no auth, 403 si role insuficiente
- Rutas públicas: `/login`, `/register`, `/api/auth/*` (excepto me/logout), `/api/docs/*`, `/api/products*`

## Frontend páginas

### `/login`
Form username + password. Errores inline. Link a /register.

### `/register`
Form con validaciones en vivo. Errores inline por campo. Auto-login al éxito.

### `/` (listing)
- SearchBar arriba
- FilterSidebar (categorías checkboxes, min/max price)
- SortDropdown (price asc/desc, name, newest)
- Grid de ProductCards (6 por página)
- Pagination al pie
- URL state: querystrings refleja filtros (`?category=Electronics&sort=price-asc&page=2`)

### `/products/[id]`
- Imagen grande, descripción full, badge categoría, stock badge
- Selector qty (1-10, capped por stock)
- Botón "Agregar al carrito"
- Si stock 0: botón disabled, mensaje "Sin stock"

### `/cart`
- Lista CartItem con selector qty + remover
- Subtotal
- Botón "Proceder al checkout"
- Empty state si vacío

### `/checkout`
- Form pago (cardholder, cardNumber, expiry, CVV)
- CouponInput separado (apply → muestra descuento)
- Resumen: items, subtotal, descuento, total
- Botón "Pagar"
- Error inline si declined

### `/confirmation`
- Detalle orden recién creada
- Link continuar comprando

### `/orders`
- Tabla órdenes del usuario (id, fecha, total, status)
- Link a detalle

### `/orders/[id]`
- Detalle completo
- Botón "Cancelar orden" si status=paid

### `/account`
- Form editar name
- Form cambiar password
- Info: username, email, createdAt

### `/admin` (sólo admin)
- Dashboard con conteos: productos, órdenes por status, usuarios
- Links a sub-secciones

### `/admin/products`
- Tabla productos (incluye inactive)
- Botón "Nuevo"
- Edit/delete por fila

### `/admin/products/new` y `/admin/products/[id]`
- Form CRUD producto

### `/admin/orders`
- Tabla todas las órdenes (filtro por status)
- Selector status por fila (cambio inline)

### `/admin/users`
- Tabla read-only (id, username, email, role, createdAt)

## Estado cliente (Zustand)
- `authStore`: `{ user, token, login, logout, hydrate }`
- `cartStore`: `{ items, count, fetch, add, update, remove, clear }`

Hydration en root layout: lee token de cookie/localStorage, llama `/api/auth/me`.

## data-testid
Todos los selectores del spec original + nuevos para:
- Registro: `register-form`, `email-input`, `confirm-password-input`, `name-input`, `terms-checkbox`, `register-button`, `register-error-{field}`
- Búsqueda/filtro: `search-input`, `category-filter-{cat}`, `min-price-input`, `max-price-input`, `sort-select`, `pagination-prev`, `pagination-next`, `pagination-page-{n}`, `pagination-info`
- Producto detalle: `product-detail-page`, `product-description`, `product-stock-badge`, `qty-selector`, `add-to-cart-detail-button`
- Cupón: `coupon-input`, `apply-coupon-button`, `coupon-applied`, `coupon-error`, `cart-discount`, `cart-total`
- Órdenes: `orders-page`, `order-row-{id}`, `order-status-{id}`, `cancel-order-button`
- Cuenta: `account-page`, `name-input`, `update-name-button`, `current-password-input`, `new-password-input`, `change-password-button`
- Admin: `admin-page`, `admin-products-page`, `admin-orders-page`, `admin-users-page`, `product-form`, `delete-product-{id}`, `order-status-select-{id}`, `update-status-button-{id}`

## Códigos de estado HTTP
- 200 OK
- 201 Created
- 400 Bad Request (validación)
- 401 Unauthorized (falta/invalid token)
- 402 Payment Required (declined)
- 403 Forbidden (role insuficiente)
- 404 Not Found
- 409 Conflict (username/email duplicado)
- 422 Unprocessable Entity (negocio: stock insuficiente, cupón expirado)

## Errores: forma
```json
{ "error": "mensaje human-readable", "code": "STOCK_INSUFFICIENT", "field": "quantity" }
```

## Estructura final de archivos
Ver `PROGRESS.md` para árbol completo.

## Escenarios QA cubiertos (resumen)
- Login feliz + credenciales inválidas
- Registro con conflictos username/email + validaciones campo
- Productos: search, filter combos, ordenamiento, paginación, productos sin stock
- Carrito: add, update qty, remover, clear, exceder stock
- Cupones: válido, expirado, agotado, min subtotal no cumplido, por-usuario duplicado
- Checkout: declined (0000), éxito, cart vacío, stock insuficiente al pagar
- Órdenes: ver historial, ver detalle, cancelar (restore stock)
- Perfil: editar name, cambiar password (validaciones)
- Admin: CRUD productos, cambio status órdenes, ver users
- Control acceso: customer intenta /admin → bloqueado
- Token expirado / inválido / faltante
