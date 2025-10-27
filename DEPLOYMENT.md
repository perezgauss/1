# Guía de Deployment

Esta guía te ayudará a deployar tu PWA de notificaciones push en producción.

## Pre-requisitos

1. Cuenta en [Supabase](https://supabase.com) (gratis)
2. Cuenta en [Vercel](https://vercel.com) (gratis) u otro hosting
3. Dominio propio con HTTPS (las notificaciones push requieren HTTPS)

## Paso 1: Configurar Supabase

### 1.1 Crear proyecto

1. Ve a [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Espera a que se inicialice (toma 2-3 minutos)

### 1.2 Crear las tablas

1. Ve a **SQL Editor** en el panel de Supabase
2. Copia todo el contenido de `supabase/schema.sql`
3. Pégalo en el editor y ejecuta (**Run**)
4. Verifica que se crearon las tablas en **Table Editor**

### 1.3 Obtener credenciales

1. Ve a **Settings** → **API**
2. Copia:
   - **Project URL** (será tu `SUPABASE_URL`)
   - **anon/public key** (será tu `SUPABASE_ANON_KEY`)

## Paso 2: Generar claves VAPID

En tu máquina local:

```bash
npm install
npm run generate-vapid
```

Guarda las claves generadas, las necesitarás en el siguiente paso.

## Paso 3: Configurar variables de entorno

Crea un archivo `.env.local` con:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# VAPID Keys (generadas en el paso anterior)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu-clave-publica-vapid
VAPID_PRIVATE_KEY=tu-clave-privada-vapid
VAPID_SUBJECT=mailto:tu-email@dominio.com

# Admin
ADMIN_PASSWORD=elige-una-password-segura
```

## Paso 4: Agregar iconos de la PWA

Genera o crea dos iconos:

1. **icon-192x192.png** (192x192 píxeles)
2. **icon-512x512.png** (512x512 píxeles)

Colócalos en la carpeta `public/`.

Herramientas recomendadas:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [Favicon Generator](https://realfavicongenerator.net/)
- [Canva](https://www.canva.com/)

## Paso 5: Deploy en Vercel

### 5.1 Desde la línea de comandos

```bash
npm install -g vercel
vercel login
vercel --prod
```

### 5.2 Desde el Dashboard

1. Ve a [Vercel](https://vercel.com)
2. Click en **Add New** → **Project**
3. Importa tu repositorio de GitHub
4. Configura las variables de entorno (copia desde `.env.local`)
5. Click en **Deploy**

### 5.3 Configurar dominio

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones

**IMPORTANTE**: Las notificaciones push solo funcionan con HTTPS.

## Paso 6: Verificar el deployment

1. Visita tu sitio en el dominio configurado
2. Abre la consola del navegador (F12)
3. Ve a la pestaña **Application** → **Service Workers**
4. Verifica que el Service Worker esté registrado
5. Click en "Activar Notificaciones"
6. Verifica que se guarde en Supabase (ve a **Table Editor**)

## Paso 7: Probar el panel de admin

1. Ve a `https://tu-dominio.com/admin`
2. Ingresa la contraseña configurada
3. Envía una notificación de prueba
4. Deberías recibirla en el navegador

## Deploy Edge Functions (Opcional)

Si prefieres usar Edge Functions de Supabase en lugar de API Routes:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref tu-proyecto-ref

# Deploy functions
supabase functions deploy subscribe
supabase functions deploy send-notification

# Configurar secrets
supabase secrets set ADMIN_PASSWORD=tu-password
supabase secrets set VAPID_PUBLIC_KEY=tu-clave-publica
supabase secrets set VAPID_PRIVATE_KEY=tu-clave-privada
```

**Nota**: Las Edge Functions de Deno tienen limitaciones con `web-push`. Se recomienda usar las API Routes de Next.js para producción.

## Otros Hostings

### Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

Configura las variables de entorno en **Site settings** → **Environment variables**.

### Railway

1. Conecta tu repositorio
2. Agrega las variables de entorno
3. Deploy automático

### Docker (Self-hosted)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t pwa-push .
docker run -p 3000:3000 --env-file .env pwa-push
```

## Monitoreo

### Logs de Supabase

Ve a **Logs** en el dashboard para ver:
- Consultas SQL
- Edge Functions logs
- Errores

### Logs de Vercel

Ve a **Deployments** → tu deployment → **Function Logs**

### Analytics (Opcional)

Agrega analytics para monitorear:
- Tasa de suscripción
- Notificaciones enviadas vs recibidas
- Errores de envío

Opciones:
- [Vercel Analytics](https://vercel.com/analytics)
- [Google Analytics 4](https://analytics.google.com/)
- [Plausible](https://plausible.io/)

## Troubleshooting en Producción

### Error: "Failed to fetch"

- Verifica que las variables de entorno estén configuradas
- Revisa los logs de Supabase
- Verifica que las tablas existan

### Error: "Push subscription failed"

- Verifica que estés usando HTTPS
- Chequea que las claves VAPID sean correctas
- Verifica permisos del navegador

### Error: "Unauthorized"

- Verifica el `ADMIN_PASSWORD`
- Chequea el header `Authorization`

## Mantenimiento

### Limpieza de suscripciones inactivas

Ejecuta periódicamente en SQL Editor:

```sql
DELETE FROM push_subscriptions
WHERE active = false
AND updated_at < NOW() - INTERVAL '30 days';
```

### Backup de base de datos

Supabase hace backups automáticos, pero puedes hacer backups manuales:

1. Ve a **Database** → **Backups**
2. Click en **Create backup**

## Seguridad

- [ ] Usa contraseñas seguras
- [ ] No expongas las claves privadas
- [ ] Implementa rate limiting
- [ ] Configura CORS correctamente
- [ ] Usa Row Level Security en Supabase
- [ ] Actualiza dependencias regularmente

## Costo

**Gratis para empezar:**
- Supabase: 500 MB database, 2 GB bandwidth/mes
- Vercel: 100 GB bandwidth/mes, builds ilimitados

**Planes pagos cuando escales:**
- Supabase Pro: $25/mes
- Vercel Pro: $20/mes

## Soporte

Si tienes problemas:
1. Revisa los logs de Vercel y Supabase
2. Verifica la consola del navegador
3. Revisa la sección Troubleshooting del README.md
4. Abre un issue en GitHub

## Checklist de Deployment

- [ ] Proyecto Supabase creado
- [ ] Tablas creadas con schema.sql
- [ ] Claves VAPID generadas
- [ ] Variables de entorno configuradas
- [ ] Iconos de PWA agregados
- [ ] Deploy en Vercel/hosting exitoso
- [ ] Dominio HTTPS configurado
- [ ] Service Worker registrado correctamente
- [ ] Notificación de prueba enviada y recibida
- [ ] Panel de admin funcional
- [ ] Logs monitoreados

¡Tu PWA de notificaciones push está lista para producción! 🎉
