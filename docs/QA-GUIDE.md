# Guía de QA manual

Esta guía resume los **escenarios de prueba sugeridos** organizados por módulo. Sirve como punto de partida para construir un suite manual. No pretende ser exhaustiva — la idea es que cada item de aquí destape al menos 3‑5 sub‑casos.

## 1. Autenticación

### Login
- ✅ Login con `admin/admin123` → redirige a `/`
- ✅ Login con `user1/pass123` → redirige a `/`
- ❌ Usuario inexistente → "Usuario o contraseña inválidos"
- ❌ Password incorrecto → mismo mensaje (no debe revelar si el user existe)
- ❌ Campos vacíos → error de validación inline
- 🔁 Login en pestaña A; luego logout en pestaña B; refrescar pestaña A → debe quedar deslogueado
- 🔒 Probar `?next=/orders` antes de login → tras login debe ir a `/orders`

### Registro
- ✅ Registro con datos válidos → auto‑login + redirección a `/`
- ❌ Username con menos de 3 chars / con símbolos
- ❌ Username ya tomado (`admin`) → 409
- ❌ Email mal formado (`abc@`)
- ❌ Email ya registrado (`admin@shop.test`) → 409
- ❌ Password sin números, sin letras, < 8 chars
- ❌ Confirmación de password no coincide
- ❌ Términos sin tildar
- 🎯 Al registrar, el rol asignado debe ser siempre `customer`

### Sesión
- 🔁 Borrar la cookie `token` manualmente y refrescar `/cart` → redirección a `/login`
- 🔁 Borrar localStorage pero mantener la cookie → el navbar no muestra al usuario pero el middleware deja pasar; refrescar resincronizará
- ⏰ Manipular el JWT → `me` debe responder 401

## 2. Catálogo

### Listado
- ✅ Ver 6 productos por página, paginación visible
- ✅ Cambiar a página 2 → URL refleja `?page=2`
- ✅ Filtrar por categoría única → query string suma `?category=Electronics`
- ✅ Filtrar por dos categorías → URL con dos params
- ✅ Combinar búsqueda + filtros + sort + page → todos los params en la URL
- 🔄 Refrescar con esos params → resultados son determinísticos
- 🧹 Botón "Limpiar filtros" → URL queda en `/`
- 📦 Sin resultados (ej: `search=zzzzz`) → estado empty
- 💲 `minPrice=100&maxPrice=50` (rango imposible) → empty

### Detalle
- ✅ Click en card → `/products/{id}`
- ✅ Selector de cantidad respeta stock y `<=10`
- 📦 Producto con stock 0 (`prod-008`, Monitor 27") → botón disabled, no permite agregar
- 🚫 ID inexistente → estado "no encontrado"

## 3. Carrito

- ✅ Agregar producto desde card → toast verde, badge en navbar incrementa
- ✅ Sin login: agregar al carrito → redirección a `/login`
- ✅ Cambiar cantidad → línea total y subtotal recalculan
- ❌ Cambiar a cantidad > stock → error 422 inline
- ❌ Cambiar a cantidad > 10 → 422
- ✅ Quitar item → desaparece, toast info
- ✅ Vaciar carrito (no hay botón directo en UI, pero `DELETE /api/cart` desde Swagger funciona)
- ✅ Refrescar con items → se hidratan desde la API

## 4. Cupones

| Código     | Subtotal | Resultado esperado                          |
|------------|----------|---------------------------------------------|
| WELCOME10  | cualquiera | 10% off                                    |
| SAVE20     | 99       | Error `COUPON_MIN_SUBTOTAL` ("$100 mín.")   |
| SAVE20     | 150      | 20% off ($30)                              |
| FLAT15     | 50       | $15 off                                    |
| FLAT15     | 10       | Máximo $10 (no deja total negativo)        |
| EXPIRED    | cualquiera | `COUPON_EXPIRED`                          |
| USED       | cualquiera | `COUPON_EXHAUSTED`                        |
| FIRSTBUY   | 1ra vez  | 25% off                                    |
| FIRSTBUY   | 2da vez del mismo user | `COUPON_ALREADY_USED`          |
| FIRSTBUY   | otro user diferente | Funciona OK                       |
| INVALIDO99 | cualquiera | `COUPON_INVALID`                          |

Tip: probar todos desde `/checkout` con un carrito > $100.

## 5. Checkout

### Felices
- ✅ Pago con `4111111111111111`, MM/YY futuro, CVV 123 → orden creada, redirección a `/confirmation`
- ✅ Aplicar cupón antes de pagar → descuento visible en el resumen y en el monto del botón
- ✅ Pagar con un cupón `FIRSTBUY`, ver la orden, intentar usarlo de nuevo → bloquea
- ✅ Pagar el carrito → stock del producto baja (verificar en `/admin/products` o en el detalle)

### Errores
- ❌ Pagar con carrito vacío (vaciar primero) → 422 `CART_EMPTY`
- ❌ Pagar con `...0000` → 402, mensaje "Pago rechazado", botón Reintentar
- ❌ Pagar con MM/YY pasado (`01/20`) → 400 `CARD_EXPIRED`
- ❌ Pagar con cartNumber de 15 dígitos → 400 validación
- ❌ Pagar mientras un admin desactiva el producto en otra pestaña → 422 `PRODUCT_UNAVAILABLE`
- ❌ Pagar con cantidad > stock (ej: stock bajaron mientras estabas en el carrito) → 422 `STOCK_INSUFFICIENT`

## 6. Órdenes

- ✅ Ver el historial en `/orders` ordenado por fecha desc
- ✅ Ver detalle, incluido cupón y tarjeta enmascarada (`**** **** **** 1111`)
- ✅ Cancelar una orden en `paid` → status `cancelled`, stock restaurado
- ❌ Cancelar una orden en `shipped` → 422 `INVALID_STATUS_TRANSITION`
- ❌ Cancelar una orden ya `cancelled` → 422
- 🔒 Como `user1`, intentar abrir `/orders/{id_de_user2}` → 403

## 7. Cuenta

- ✅ Actualizar nombre → se refleja en navbar
- ✅ Cambiar password con datos válidos → poder loguear con el password nuevo
- ❌ Password actual incorrecta → 400 `INVALID_CURRENT_PASSWORD`
- ❌ Password nuevo no cumple regla → mensaje por campo
- ❌ Confirmación no coincide → mensaje por campo

## 8. Admin

### Acceso
- ❌ `user1` intenta abrir `/admin` → redirige a `/`
- ❌ `user1` llama `GET /api/admin/products` → 403
- ✅ `admin` ve los 3 dashboards (productos, órdenes, usuarios)

### Productos
- ✅ Crear producto → aparece en `/` y en la lista admin
- ✅ Editar precio o stock → ver el cambio en `/products/{id}` sin recargar el server
- ✅ Desactivar producto → desaparece del listado público pero aparece como "Inactivo" en admin
- ✅ Editar producto inactivo y marcarlo activo de nuevo → reaparece en `/`
- ❌ Crear con precio negativo / stock negativo / imageUrl mal formada → 400

### Órdenes
- ✅ Filtrar por status
- ✅ Cambiar `paid → shipped → delivered`
- ✅ `paid → cancelled` restaura stock
- ❌ Botones de transición inválida no aparecen (UI los filtra) y la API responde 422 si llaman directo
- 🔒 Como admin abrir cualquier orden por ID → permitido (a diferencia de un customer)

### Usuarios
- ✅ Ver los 3 seeds + cualquier usuario nuevo creado
- ✅ Passwords NO deben venir en la respuesta (auditar el JSON crudo)

## 9. Otros

- 🔁 Swagger UI carga en `/api/docs` con todos los tags visibles
- 🔁 Spec JSON crudo accesible en `/api/docs/spec`
- 🔁 Reiniciar `npm run dev` → estado vuelve a los seeds (no quedan órdenes / usuarios extra)
- 📱 Responsive: probar todas las páginas en viewport móvil (>360px)
- ♿ `Tab` debe poder llegar a todos los botones y campos

## Anexo: cómo provocar todos los códigos HTTP

| Status | Cómo obtenerlo |
|--------|----------------|
| 200 | `GET /api/products` |
| 201 | `POST /api/auth/register` con datos nuevos |
| 400 | `POST /api/auth/login` con body inválido / `POST /api/checkout` con CVV de 2 dígitos |
| 401 | Cualquier endpoint protegido sin Bearer |
| 402 | `POST /api/checkout` con `cardNumber` que termina en `0000` |
| 403 | Customer pega `GET /api/admin/products` |
| 404 | `GET /api/products/no-existe` |
| 409 | `POST /api/auth/register` con `username: "admin"` |
| 422 | `POST /api/checkout` con carrito vacío |
