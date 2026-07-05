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
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      currentPassword: { type: 'string' },
                      newPassword: { type: 'string', minLength: 8, description: 'Mínimo 8 caracteres, al menos una letra y un número' },
                      confirmPassword: { type: 'string', description: 'Debe coincidir con newPassword' },
                    },
                    required: ['currentPassword', 'newPassword', 'confirmPassword'],
                  },
                },
              },
            },
            responses: { 200: { description: 'OK' }, 400: { description: 'Validación o contraseña actual incorrecta' }, 404: { description: 'Usuario no encontrado' } },
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
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      productId: { type: 'string' },
                      quantity: { type: 'integer', minimum: 1, maximum: 10 },
                    },
                    required: ['productId', 'quantity'],
                  },
                },
              },
            },
            responses: { 200: { description: 'OK' }, 422: { description: 'Stock insuficiente' } },
          },
        },
        '/api/cart/items/{productId}': {
          put: {
            tags: ['Cart'],
            summary: 'Actualizar cantidad',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'productId', required: true, schema: { type: 'string' } }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      quantity: { type: 'integer', minimum: 1, maximum: 10 },
                    },
                    required: ['quantity'],
                  },
                },
              },
            },
            responses: { 200: { description: 'OK' }, 404: { description: 'Item no encontrado' }, 422: { description: 'Stock insuficiente' } },
          },
          delete: {
            tags: ['Cart'],
            summary: 'Remover item',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'productId', required: true, schema: { type: 'string' } }],
            responses: { 200: { description: 'OK' } },
          },
        },
        '/api/coupons/validate': {
          post: {
            tags: ['Coupons'],
            summary: 'Validar cupón',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: { type: 'string' },
                      subtotal: { type: 'number', minimum: 0 },
                    },
                    required: ['code', 'subtotal'],
                  },
                },
              },
            },
            responses: { 200: { description: 'OK' }, 404: { description: 'Cupón no encontrado o inválido' } },
          },
        },
        '/api/checkout': {
          post: {
            tags: ['Checkout'],
            summary: 'Procesar pago',
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      paymentMethod: { type: 'string', enum: ['credit_card'] },
                      cardHolder: { type: 'string' },
                      cardNumber: { type: 'string', pattern: '^\\d{16}$', description: '16 dígitos' },
                      expiry: { type: 'string', pattern: '^(0[1-9]|1[0-2])/\\d{2}$', description: 'Formato MM/YY' },
                      cvv: { type: 'string', pattern: '^\\d{3}$', description: '3 dígitos' },
                      couponCode: { type: 'string' },
                    },
                    required: ['paymentMethod', 'cardHolder', 'cardNumber', 'expiry', 'cvv'],
                  },
                },
              },
            },
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
          get: {
            tags: ['Orders'],
            summary: 'Detalle de orden',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: { 200: { description: 'OK' }, 404: { description: 'No encontrada' } },
          },
        },
        '/api/orders/{id}/cancel': {
          post: {
            tags: ['Orders'],
            summary: 'Cancelar orden',
            description: 'No requiere body. Solo cancela órdenes en estado paid.',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
              200: { description: 'OK' },
              403: { description: 'Acceso denegado' },
              404: { description: 'Orden no encontrada' },
              422: { description: 'Estado no cancelable' },
            },
          },
        },
        '/api/admin/products': {
          get: { tags: ['Admin'], summary: 'Listar todos los productos', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
          post: {
            tags: ['Admin'],
            summary: 'Crear producto',
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      price: { type: 'number', minimum: 0 },
                      stock: { type: 'integer', minimum: 0 },
                      imageUrl: { type: 'string', format: 'uri' },
                      category: { type: 'string', enum: ['Electronics', 'Clothing', 'Books'] },
                      active: { type: 'boolean' },
                    },
                    required: ['name', 'description', 'price', 'stock', 'imageUrl', 'category'],
                  },
                },
              },
            },
            responses: { 201: { description: 'Creado' }, 400: { description: 'Validación' }, 403: { description: 'Solo admin' } },
          },
        },
        '/api/admin/products/{id}': {
          put: {
            tags: ['Admin'],
            summary: 'Actualizar producto',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    description: 'Todos los campos son opcionales (partial update)',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      price: { type: 'number', minimum: 0 },
                      stock: { type: 'integer', minimum: 0 },
                      imageUrl: { type: 'string', format: 'uri' },
                      category: { type: 'string', enum: ['Electronics', 'Clothing', 'Books'] },
                      active: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            responses: { 200: { description: 'OK' }, 404: { description: 'No encontrado' } },
          },
          delete: {
            tags: ['Admin'],
            summary: 'Desactivar producto',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: { 200: { description: 'OK' }, 404: { description: 'No encontrado' } },
          },
        },
        '/api/admin/orders': {
          get: { tags: ['Admin'], summary: 'Listar todas las órdenes', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
        },
        '/api/admin/orders/{id}': {
          put: {
            tags: ['Admin'],
            summary: 'Cambiar status de orden',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['paid', 'shipped', 'delivered', 'cancelled'] },
                    },
                    required: ['status'],
                  },
                },
              },
            },
            responses: { 200: { description: 'OK' }, 404: { description: 'No encontrada' }, 422: { description: 'Transición inválida' } },
          },
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
