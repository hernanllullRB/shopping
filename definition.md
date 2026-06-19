Build a full-stack web application using Next.js for QA automation testing purposes.

## Tech stack
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- API: Next.js Route Handlers (no separate backend)
- Storage: in-memory only (no database, no Redis)
- API docs: Swagger UI via swagger-jsdoc + swagger-ui-express mounted as a route

## Project structure
Single Next.js project:
/

├── app/

│   ├── (auth)/login/

│   ├── (shop)/

│   │   ├── page.tsx              ← product listing

│   │   ├── cart/page.tsx

│   │   ├── checkout/page.tsx

│   │   └── confirmation/page.tsx

│   └── api/

│       ├── auth/login/route.ts

│       ├── auth/logout/route.ts

│       ├── auth/me/route.ts

│       ├── products/route.ts

│       ├── products/[id]/route.ts

│       ├── cart/route.ts

│       ├── cart/items/route.ts

│       ├── cart/items/[productId]/route.ts

│       ├── checkout/route.ts

│       ├── orders/route.ts

│       ├── orders/[id]/route.ts

│       └── docs/route.ts         ← Swagger UI

├── lib/

│   ├── store.ts                  ← in-memory store (singleton)

│   ├── auth.ts                   ← JWT helpers

│   └── api.ts                    ← client-side fetch wrapper

├── components/

│   ├── Navbar.tsx

│   ├── ProductCard.tsx

│   ├── CartItem.tsx

│   └── PaymentForm.tsx

└── middleware.ts                  ← route protection

## In-memory store
Create a singleton module lib/store.ts that holds all state:
- users: User[]
- tokens: Map<string, string>  ← token → username
- carts: Map<string, CartItem[]>  ← username → items
- orders: Order[]
- products: Product[]

Initialize on module load with seed data. State resets on server restart — expected and fine.

## Types (lib/types.ts)
Define all shared types:
```ts
User { id, username, password, role: 'admin' | 'customer', name }
Product { id, name, description, price, stock, imageUrl, category }
CartItem { productId, quantity, product: Product }
Order { id, userId, items: CartItem[], total, status, createdAt, paymentMethod, lastFour }
```

## API Route Handlers

### Auth
- POST /api/auth/login → { username, password } → { token, user }
- POST /api/auth/logout → invalidates token from in-memory map
- GET /api/auth/me → returns user from token (Authorization: Bearer <token>)
- Hardcoded users:
  - admin / admin123 (role: admin)
  - user1 / pass123 (role: customer)
  - user2 / pass456 (role: customer)
- Use jsonwebtoken. On login, store token in the in-memory map. On logout, delete it.

### Products
- GET /api/products → full product list
- GET /api/products/:id → single product

### Cart (all require auth via Authorization header)
- GET /api/cart → current user's cart with computed subtotal
- POST /api/cart/items → { productId, quantity } → adds or increments item
- PUT /api/cart/items/:productId → { quantity } → updates quantity
- DELETE /api/cart/items/:productId → removes item
- DELETE /api/cart → clears entire cart

### Checkout (requires auth)
- POST /api/checkout → { paymentMethod, cardHolder, lastFour }
  - Validates cart is not empty
  - If lastFour === "0000" → return 402 { error: "Payment declined" }
  - Otherwise → create order, clear cart, return order
- GET /api/orders → current user's orders
- GET /api/orders/:id → single order

### Swagger docs
- Mount Swagger UI at /api/docs using next-swagger-doc or swagger-jsdoc
- Document ALL endpoints: request bodies, response shapes, auth header, status codes
- Group by tags: Auth, Products, Cart, Orders

## Auth helper (lib/auth.ts)
```ts
// extractToken(request): string | null
// verifyToken(token): { username, role } | null
// requireAuth(request): { username, role } | NextResponse (401)
```

## Middleware (middleware.ts)
- Protect all routes except /login and /api/auth/login
- Read token from localStorage is client-side — middleware reads it from
  Authorization header for API routes and from a cookie for page routes
- On missing/invalid token for page routes → redirect to /login

## Frontend pages

### /login
- Form: username + password fields, submit button
- On success: store token in localStorage + cookie, redirect to /
- On failure: show inline error message

### / (product listing)
- Responsive grid of ProductCard components
- Each card: image, name, category badge, price, "Add to cart" button
- On add to cart: POST /api/cart/items, update cart badge in navbar

### /cart
- List of CartItem rows: product name, unit price, quantity selector, remove button, line total
- Cart summary: subtotal, "Proceed to checkout" button
- Empty cart state with link back to products

### /checkout
- Payment form: cardholder name, card number (last 4 digits only), expiry, CVV
- "Pay now" button
- On success → redirect to /confirmation?orderId=xxx
- On failure (lastFour = 0000) → show payment error inline with "Try again" option

### /confirmation
- Order summary: order ID, items list, total, payment method
- "Continue shopping" link

## Navbar component
- Logo / app name
- Navigation links
- Cart icon with item count badge
- Username + logout button (when logged in)

## Seed data (initialized in lib/store.ts)
8 products across 3 categories:

Electronics (4): Wireless Headphones $89, Mechanical Keyboard $129, USB-C Hub $45, Webcam HD $79
Clothing (2): Cotton T-Shirt $19, Denim Jacket $89
Books (2): Clean Code $35, The Pragmatic Programmer $45

All with stock: 10, realistic descriptions, placeholder imageUrl from https://picsum.photos/seed/{id}/400/300

## data-testid attributes (critical for QA automation)
Add to ALL interactive and observable elements:

Login page:
- data-testid="username-input"
- data-testid="password-input"
- data-testid="login-button"
- data-testid="login-error"

Navbar:
- data-testid="navbar"
- data-testid="cart-icon"
- data-testid="cart-badge"
- data-testid="logout-button"
- data-testid="nav-username"

Product listing:
- data-testid="product-grid"
- data-testid="product-card-{id}"
- data-testid="product-name-{id}"
- data-testid="product-price-{id}"
- data-testid="add-to-cart-{id}"

Cart:
- data-testid="cart-page"
- data-testid="cart-empty"
- data-testid="cart-item-{productId}"
- data-testid="quantity-input-{productId}"
- data-testid="remove-item-{productId}"
- data-testid="cart-subtotal"
- data-testid="checkout-button"

Checkout:
- data-testid="checkout-form"
- data-testid="cardholder-input"
- data-testid="card-number-input"
- data-testid="expiry-input"
- data-testid="cvv-input"
- data-testid="pay-button"
- data-testid="payment-error"
- data-testid="retry-button"

Confirmation:
- data-testid="confirmation-page"
- data-testid="order-id"
- data-testid="order-total"
- data-testid="order-items"
- data-testid="continue-shopping"

## Scripts
- npm run dev → starts Next.js on port 3000
- npm run build + npm start → for production deploy

## Additional notes
- Use next/image for product images
- Use React Context or Zustand for client-side cart state (optimistic UI)
- All API errors return { error: string } with appropriate HTTP status codes
- Loading skeletons on product grid and cart page
- No test files — the app is the system under test
- Commit-ready: include .env.example with NEXTAUTH_SECRET and JWT_SECRET vars
- Include a README.md with: how to run locally, API endpoint reference table,
  test credentials, and the card numbers to simulate success/failure