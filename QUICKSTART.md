# Quick Start - PWA Push Notifications

Guía rápida para levantar el proyecto en 5 minutos.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Generar claves VAPID

```bash
npm run generate-vapid
```

Copia las claves generadas.

## 3. Configurar Supabase

1. Crea una cuenta en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a SQL Editor y ejecuta el contenido de `supabase/schema.sql`
4. Ve a Settings → API y copia:
   - Project URL
   - anon/public key

## 4. Configurar variables de entorno

Edita el archivo `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu-key-aqui
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN...tu-key-publica
VAPID_PRIVATE_KEY=tu-key-privada
VAPID_SUBJECT=mailto:tu@email.com
ADMIN_PASSWORD=admin123
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
```

## 5. Agregar iconos (opcional para desarrollo)

Puedes usar placeholders temporalmente o crear iconos rápidos en:
- [Canva](https://www.canva.com/)
- [Favicon Generator](https://realfavicongenerator.net/)

Los iconos deben ir en `public/`:
- `icon-192x192.png` (192x192px)
- `icon-512x512.png` (512x512px)

## 6. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 7. Probar el sistema

### Suscribirse a notificaciones:

1. Abre http://localhost:3000
2. Click en "Activar Notificaciones"
3. Acepta los permisos del navegador
4. Verás tu ID único

### Enviar notificación:

1. Ve a http://localhost:3000/admin
2. Login con password: `admin123`
3. Escribe un título y mensaje
4. Click en "Enviar a Todos"
5. ¡Deberías recibir la notificación!

## Comandos útiles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build
npm start

# Generar nuevas claves VAPID
npm run generate-vapid

# Linter
npm run lint
```

## Verificar que todo funciona

### Service Worker registrado:

1. F12 (abrir DevTools)
2. Application → Service Workers
3. Debería aparecer `/sw.js` como "activated"

### Suscripción en Supabase:

1. Ve a tu proyecto en Supabase
2. Table Editor → `push_subscriptions`
3. Deberías ver tu suscripción

### Notificación recibida:

1. Envía una notificación desde `/admin`
2. Debería aparecer como notificación del sistema
3. Funciona incluso con la pestaña cerrada

## Problemas comunes

### "Service Worker no se registra"

- Verifica que uses `http://localhost` (no `127.0.0.1`)
- O usa HTTPS en producción

### "Error al conectar con Supabase"

- Verifica las credenciales en `.env`
- Verifica que las tablas existan (ejecuta schema.sql)

### "No recibo notificaciones"

- Verifica permisos del navegador
- Chequea las claves VAPID
- Revisa la consola por errores

## Siguiente paso: Deploy

Una vez que todo funcione localmente, sigue la guía completa en [DEPLOYMENT.md](./DEPLOYMENT.md)

## Recursos

- [README completo](./README.md)
- [Guía de deployment](./DEPLOYMENT.md)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Next.js](https://nextjs.org/docs)

¡Disfruta tu PWA con notificaciones push! 🚀
