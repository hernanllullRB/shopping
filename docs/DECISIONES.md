# Decisiones de diseño

Este documento explica el **por qué** detrás de las decisiones tomadas durante la construcción. El **qué** se ve en el código y el README. La idea es que si algo más adelante hay que cambiar, se entienda el razonamiento original.

## 1. Stack y arquitectura

| Decisión | Razón |
|----------|-------|
| **Next.js 14 App Router** | Spec original lo pedía. Permite mezclar UI y API en un único repo. |
| **TypeScript estricto** | Cero costo extra y atrapa muchísimos bugs antes de runtime — clave para QA. |
| **Tailwind CSS** | Velocidad. No es un proyecto de design system. |
| **Zustand para estado cliente** | Mucho más liviano que Redux/Context+reducer; sin boilerplate. Es ideal para auth y carrito. |
| **In‑memory store (singleton)** | Pedido del spec. Se inicializa al cargar `lib/store.ts` y persiste mientras viva el proceso. Acepto que se pierda al reiniciar. |
| **zod para validaciones** | Mismo schema sirve para validar y para inferir tipos. Mensajes en español listos para mostrar. |
| **jsonwebtoken + bcryptjs** | bcrypt para hashear (los usuarios del seed y los nuevos). JWT con tabla de tokens activos en memoria para soportar logout real. |
| **swagger-jsdoc + Swagger UI por CDN** | `swagger-ui-express` no se monta limpio en App Router. Se sirve la spec por una ruta JSON y un HTML estático con CDN. |

## 2. Decisiones tomadas durante el brainstorming

(Confirmadas explícitamente con el usuario)

1. **Funcionalidades elegidas**: registro/perfil, detalle/búsqueda/filtro, stock simple, lifecycle de órdenes, admin standard, cupones. Se descartó wishlist y reviews por overlap con el resto.
2. **Admin standard**: CRUD productos + cambio de status de órdenes + lista usuarios read‑only. No incluye refunds, métricas avanzadas ni CRUD de cupones.
3. **Stock simple**: el stock se descuenta cuando la orden pasa a `paid`. Si la orden se cancela, se restaura. Sin reserva ni timers.
4. **Cupones**: se mantienen los 5 iniciales y se agrega `FIRSTBUY` con uso único por usuario para ejercitar tracking per‑user.
5. **Registro estándar**: username único, email único válido, password con regla compuesta, confirmación, name, y checkbox de términos.
6. **Catálogo standard**: filtro por categoría (múltiple), por precio min/max, ordenamiento (4 opciones), búsqueda en nombre+descripción, paginación 6/pág. URL query state, refrescable y compartible.

## 3. Decisiones que el usuario delegó

| Tema | Decisión | Por qué |
|------|----------|---------|
| **Seed de productos** | 18 productos (Electronics 8, Clothing 6, Books 4) — incluyen un producto sin stock (`Monitor 27"`) y dos con low stock (`Smart Watch` 3, `Design Patterns` 2) | Para tener pruebas significativas de paginación, low‑stock y out‑of‑stock |
| **Token TTL** | 24h | Suficiente para una sesión de QA. Lo guardo también en una tabla in‑memory para que el logout sea efectivo. |
| **Tarjeta válida** | 16 dígitos numéricos cualquiera, MM/YY a futuro, CVV 3 dígitos | Equilibrio entre realismo y comodidad de tipear. La única regla "trampa" es `lastFour === "0000"` → 402 |
| **Tarjeta vencida** | Validación adicional: vencimiento en el pasado → 400 | Da otro escenario de error de pago aparte del declined |
| **Max qty por carrito** | 10 unidades por item | Genera otro escenario observable. Si el producto tiene menos de 10 de stock, el límite efectivo es el stock. |
| **Errores de API** | `{ error, code?, field?, details? }` consistente | Permite mostrar errores inline por campo en formularios y trackearlos por `code` desde tests |
| **Form de checkout** | Cupón aparte del form (botón "Aplicar"), validación antes de pagar | Hace que el QA pueda probar el cupón de forma independiente, sin escribir todos los campos de tarjeta cada vez |
| **Soft delete de productos** | El admin no borra, marca `active = false` | Las órdenes pasadas referencian el snapshot del producto, no necesitamos borrar. Y permite reactivar. |
| **Transiciones de estado** | `paid → shipped`, `paid → cancelled`, `shipped → delivered`. `delivered` y `cancelled` terminales | Refleja una mini máquina de estado realista y deja superficie de pruebas de transiciones inválidas (422) |
| **Restore de stock** | Solo en `cancelled` (sea por user o admin) | Coherente con el modelo: shipped/delivered ya consumieron stock real |

## 4. Decisiones técnicas concretas

- **Cookies + localStorage**: el token va a `localStorage` (para que el cliente lo lea) **y** a una cookie no‑HTTPOnly (para que el middleware pueda redirigir sin pegarle a la API). Es un compromiso aceptable para una app de QA. En producción se usaría HTTPOnly + endpoint de sesión.
- **`'use client'` para todas las páginas**: para evitar la complejidad de mezclar SSR y stores de Zustand. La performance no es objetivo aquí.
- **Suspense boundaries**: Next 14 requiere envolver páginas que usan `useSearchParams` en `<Suspense>` para que el build pueda prerender. Aplicado a `/login`, `/`, `/confirmation`, `/admin/orders`.
- **`globalThis.__SHOPPING_STORE__`**: el store sobrevive a las reloads de HMR en dev. Sin esto, cada modificación de archivo resetearía la base.
- **Swagger UI**: la spec se genera con `swagger-jsdoc` desde un objeto JS (no comentarios JSDoc) para mantener todo tipado. Sirvo HTML mínimo con assets desde unpkg para evitar líos con el bundler.
- **Búsqueda case‑insensitive**: simple `toLowerCase().includes()`. Suficiente para QA.
- **Sin pagination del lado del admin de productos / órdenes**: no hay tantos como para justificarlo. Si crecen, se podría sumar igual al `?page=` del API público.

## 5. Decisiones explícitamente NO tomadas (fuera de scope)

- Refresh tokens / rotación
- Email notifications (welcome, order confirmation)
- Internacionalización (la app está toda en español por defecto)
- Modo oscuro
- Carrito de invitado (guest cart)
- Direcciones de envío (la orden no las guarda)
- Cancelación de órdenes en `shipped`
- Endpoints de admin para gestionar cupones
- Métricas / dashboards detallados
- Tests automatizados

Si algo de esto se necesita más adelante, agregarlo es trabajo nuevo, no un fix.
