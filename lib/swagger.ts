import swaggerJSDoc from 'swagger-jsdoc';

let cachedSpec: object | null = null;

export function getSwaggerSpec(): object {
  if (cachedSpec) return cachedSpec;

  cachedSpec = swaggerJSDoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Shopping QA API',
        version: '1.0.0',
        description: 'API REST de la app de shopping para QA manual. Storage en memoria.',
      },
      servers: [{ url: '/' }],
      tags: [
        { name: 'Auth', description: 'Login, logout, registro y sesión' },
        { name: 'Account', description: 'Perfil del usuario' },
        { name: 'Products', description: 'Catálogo público' },
        { name: 'Cart', description: 'Carrito del usuario autenticado' },
        { name: 'Coupons', description: 'Validación de cupones' },
        { name: 'Checkout', description: 'Procesar pago' },
        { name: 'Orders', description: 'Órdenes del usuario' },
        { name: 'Admin', description: 'Panel administrador' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              code: { type: 'string' },
              field: { type: 'string' },
              details: { type: 'object', additionalProperties: { type: 'string' } },
            },
            required: ['error'],
          },
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string', enum: ['admin', 'customer'] },
              name: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          Product: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number' },
              stock: { type: 'integer' },
              imageUrl: { type: 'string' },
              category: { type: 'string', enum: ['Electronics', 'Clothing', 'Books'] },
              active: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          CartItem: {
            type: 'object',
            properties: {
              productId: { type: 'string' },
              quantity: { type: 'integer' },
              product: { $ref: '#/components/schemas/Product' },
            },
          },
          Cart: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
              subtotal: { type: 'number' },
              count: { type: 'integer' },
            },
          },
          Order: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              username: { type: 'string' },
              items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
              subtotal: { type: 'number' },
              discount: { type: 'number' },
              total: { type: 'number' },
              status: { type: 'string', enum: ['paid', 'shipped', 'delivered', 'cancelled'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              paymentMethod: { type: 'string' },
              cardHolder: { type: 'string' },
              lastFour: { type: 'string' },
              couponCode: { type: 'string' },
            },
          },
        },
      },
      paths: {
        '/api/auth/login': {
          post: {
            tags: ['Auth'],
            summary: 'Iniciar sesión',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { username: { type: 'string' }, password: { type: 'string' } },
                    required: ['username', 'password'],
                  },
                },
              },
            },
            responses: {
              200: {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        token: { type: 'string' },
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
              401: { description: 'Credenciales inválidas' },
            },
          },
        },
        '/api/auth/register': {
          post: {
            tags: ['Auth'],
            summary: 'Registrar nuevo usuario',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      username: { type: 'string' },
                      email: { type: 'string' },
                      password: { type: 'string' },
                      confirmPassword: { type: 'string' },
                      name: { type: 'string' },
                      terms: { type: 'boolean' },
                    },
                    required: ['username', 'email', 'password', 'confirmPassword', 'name', 'terms'],
                  },
                },
              },
            },
            responses: {
              201: { description: 'Creado' },
              400: { description: 'Validación' },
              409: { description: 'Username o email ya existe' },
            },
          },
        },
        '/api/auth/logout': {
          post: {
            tags: ['Auth'],
            summary: 'Cerrar sesión',
            security: [{ bearerAuth: [] }],
            responses: { 200: { description: 'OK' } },
          },
        },
        '/api/auth/me': {
          get: {
            tags: ['Auth'],
            summary: 'Usuario actual',
            security: [{ bearerAuth: [] }],
            responses: { 200: { description: 'OK' }, 401: { description: 'No auth' } },
          },
        },
        '/api/account': {
          put: {
            tags: ['Account'],
            summary: 'Actualizar nombre',
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
            },
            responses: { 200: { description: 'OK' } },
          },
        },
        '/api/account/password': {
          put: {
            tags: ['Account'],
            summary: 'Cambiar contraseña',
            security: [{ bearerAuth: [] }],
            responses: { 200: { description: 'OK' }, 400: { description: 'Validación' } },
          },
        },
        '/api/products': {
          get: {
            tags: ['Products'],
            summary: 'Listar productos con filtros',
            parameters: [
              { in: 'query', name: 'search', schema: { type: 'string' } },
              { in: 'query', name: 'category', schema: { type: 'string' } },
              { in: 'query', name: 'minPrice', schema: { type: 'number' } },
              { in: 'query', name: 'maxPrice', schema: { type: 'number' } },
              { in: 'query', name: 'sort', schema: { type: 'string', enum: ['price-asc', 'price-desc', 'name', 'newest'] } },
              { in: 'query', name: 'page', schema: { type: 'integer' } },
              { in: 'query', name: 'pageSize', schema: { type: 'integer' } },
            ],
            responses: { 200: { description: 'OK' } },
          },
        },
        '/api/products/{id}': {
          get: {
            tags: ['Products'],
            summary: 'Detalle de producto',
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: { 200: { description: 'OK' }, 404: { description: 'No encontrado' } },
          },
        },
        '/api/cart': {
          get: { tags: ['Cart'], summary: 'Ver carrito', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
          delete: { tags: ['Cart'], summary: 'Vaciar carrito', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
        },
        '/api/cart/items': {
          post: {
            tags: ['Cart'],
            summary: 'Agregar item',
            security: [{ bearerAuth: [] }],
            responses: { 200: { description: 'OK' }, 422: { description: 'Stock insuficiente' } },
          },
        },
        '/api/cart/items/{productId}': {
          put: { tags: ['Cart'], summary: 'Actualizar cantidad', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
          delete: { tags: ['Cart'], summary: 'Remover item', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
        },
        '/api/coupons/validate': {
          post: { tags: ['Coupons'], summary: 'Validar cupón', responses: { 200: { description: 'OK' } } },
        },
        '/api/checkout': {
          post: {
            tags: ['Checkout'],
            summary: 'Procesar pago',
            security: [{ bearerAuth: [] }],
            responses: {
              201: { description: 'Orden creada' },
              402: { description: 'Pago rechazado' },
              422: { description: 'Carrito vacío o stock insuficiente' },
            },
          },
        },
        '/api/orders': {
          get: { tags: ['Orders'], summary: 'Listar órdenes del usuario', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
        },
        '/api/orders/{id}': {
          get: { tags: ['Orders'], summary: 'Detalle de orden', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
        },
        '/api/orders/{id}/cancel': {
          post: { tags: ['Orders'], summary: 'Cancelar orden', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
        },
        '/api/admin/products': {
          get: { tags: ['Admin'], summary: 'Listar todos los productos', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
          post: { tags: ['Admin'], summary: 'Crear producto', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Creado' } } },
        },
        '/api/admin/products/{id}': {
          put: { tags: ['Admin'], summary: 'Actualizar producto', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
          delete: { tags: ['Admin'], summary: 'Desactivar producto', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
        },
        '/api/admin/orders': {
          get: { tags: ['Admin'], summary: 'Listar todas las órdenes', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
        },
        '/api/admin/orders/{id}': {
          put: { tags: ['Admin'], summary: 'Cambiar status de orden', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
        },
        '/api/admin/users': {
          get: { tags: ['Admin'], summary: 'Listar usuarios', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
        },
      },
    },
    apis: [],
  });

  return cachedSpec!;
}
