# PWA Push Notifications con Supabase

Sistema completo de notificaciones push para Progressive Web Apps (PWA) con backend en Supabase. Permite enviar notificaciones push anónimas sin necesidad de registro de usuarios.

## Características

- **PWA completa** con Service Worker y soporte offline
- **Suscripciones anónimas** con ID único (UUID) por dispositivo
- **Panel de administración** para enviar notificaciones
- **Backend en Supabase** con PostgreSQL y Edge Functions
- **Notificaciones selectivas** o masivas
- **Sin login requerido** para usuarios finales
- **TypeScript** para type safety

## Arquitectura

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Usuario   │ ──────▶ │   Next.js    │ ──────▶ │  Supabase   │
│  (Browser)  │         │   (PWA)      │         │  (Backend)  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                         │
      │                        │                         │
   Service                  API Routes              PostgreSQL
   Worker                  + Web Push              + Edge Fns
```

## Estructura del Proyecto

```
.
├── app/
│   ├── layout.tsx              # Layout principal con metadata PWA
│   ├── page.tsx                # Página principal (suscripción)
│   ├── admin/
│   │   └── page.tsx            # Panel de administración
│   └── api/
│       ├── subscribe/
│       │   └── route.ts        # API para registrar suscripciones
│       └── send/
│           └── route.ts        # API para enviar notificaciones
├── lib/
│   ├── supabase.ts             # Cliente de Supabase
│   └── push-notifications.ts   # Utilidades push
├── public/
│   ├── sw.js                   # Service Worker
│   ├── manifest.json           # Manifest de la PWA
│   ├── icon-192x192.png        # Icono 192x192
│   └── icon-512x512.png        # Icono 512x512
├── supabase/
│   ├── schema.sql              # Schema de base de datos
│   └── functions/              # Edge Functions (opcional)
│       ├── subscribe/
│       └── send-notification/
└── scripts/
    └── generate-vapid.js       # Generador de claves VAPID
```

## Instalación

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

### 3. Generar claves VAPID

```bash
npm run generate-vapid
```

Copia las claves generadas a tu archivo `.env`.

### 4. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve al SQL Editor y ejecuta el contenido de `supabase/schema.sql`
3. Copia tu URL y Anon Key al archivo `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 5. Configurar contraseña de admin

```env
ADMIN_PASSWORD=tu-password-seguro
```

### 6. Agregar iconos de la PWA

Coloca tus iconos en la carpeta `public/`:
- `icon-192x192.png` (192x192 píxeles)
- `icon-512x512.png` (512x512 píxeles)

### 7. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Uso

### Para Usuarios

1. Visita la página principal
2. Haz clic en "Activar Notificaciones"
3. Acepta los permisos cuando el navegador lo solicite
4. Se te asignará un ID único que se guarda localmente
5. ¡Listo! Ahora puedes recibir notificaciones

### Para Administradores

1. Ve a `/admin`
2. Ingresa la contraseña configurada en `.env`
3. Verás la lista de todas las suscripciones activas
4. Escribe el título y mensaje de la notificación
5. Selecciona destinatarios específicos o envía a todos
6. Haz clic en el botón de envío

## API Endpoints

### POST `/api/subscribe`

Registra una nueva suscripción push.

**Request:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  },
  "device_info": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "id": "uuid-generado"
}
```

### GET `/api/subscribe`

Obtiene todas las suscripciones activas.

**Response:**
```json
{
  "subscriptions": [
    {
      "id": "uuid",
      "device_info": "...",
      "created_at": "2024-01-01T00:00:00Z",
      "active": true
    }
  ]
}
```

### POST `/api/send`

Envía una notificación push.

**Headers:**
```
Authorization: Bearer <ADMIN_PASSWORD>
```

**Request:**
```json
{
  "ids": ["uuid1", "uuid2"],  // Vacío para enviar a todos
  "title": "Título de la notificación",
  "body": "Mensaje de la notificación",
  "icon": "/icon-192x192.png",
  "badge": "/icon-192x192.png"
}
```

**Response:**
```json
{
  "success": true,
  "sent": 10,
  "failed": 0,
  "total": 10
}
```

## Base de Datos

### Tabla `push_subscriptions`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único (PK) |
| endpoint | TEXT | URL del endpoint push |
| p256dh | TEXT | Clave pública P-256 |
| auth | TEXT | Secret de autenticación |
| device_info | TEXT | User Agent del navegador |
| active | BOOLEAN | Si la suscripción es válida |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Fecha de actualización |

### Tabla `notifications_sent`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único (PK) |
| title | TEXT | Título de la notificación |
| body | TEXT | Cuerpo del mensaje |
| target | TEXT | 'all' o lista de IDs |
| created_at | TIMESTAMP | Fecha de envío |

## Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático

### Otros Hosts

El proyecto es compatible con cualquier hosting que soporte Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

## Notas de Seguridad

- **VAPID Private Key**: Nunca compartas ni expongas tu clave privada
- **Admin Password**: Usa una contraseña segura en producción
- **HTTPS**: Las notificaciones push solo funcionan sobre HTTPS
- **RLS Policies**: Ajusta las políticas de Supabase según tus necesidades
- **Rate Limiting**: Considera implementar rate limiting en producción

## Compatibilidad de Navegadores

| Navegador | Soporte |
|-----------|---------|
| Chrome/Edge | ✅ 50+ |
| Firefox | ✅ 44+ |
| Safari (macOS) | ✅ 16+ |
| Safari (iOS) | ✅ 16.4+ |
| Opera | ✅ 37+ |

## Troubleshooting

### "Service Worker no se registra"

- Verifica que estés usando HTTPS (o localhost)
- Revisa la consola del navegador por errores
- Asegúrate de que `/sw.js` es accesible

### "No se envían las notificaciones"

- Verifica que las claves VAPID sean correctas
- Revisa que el endpoint del usuario siga siendo válido
- Chequea los logs del servidor

### "Error al guardar en Supabase"

- Verifica las credenciales de Supabase en `.env`
- Asegúrate de haber ejecutado el schema SQL
- Revisa las políticas RLS de las tablas

## Mejoras Futuras

- [ ] Programación de notificaciones
- [ ] Templates de mensajes
- [ ] Estadísticas de envíos
- [ ] Segmentación de usuarios
- [ ] Notificaciones con imágenes
- [ ] A/B testing de mensajes
- [ ] Integración con analytics

## Recursos

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

## Licencia

MIT

## Autor

Sistema creado para demostrar la implementación de notificaciones push en PWAs con Supabase.
