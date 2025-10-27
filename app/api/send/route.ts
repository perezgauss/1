import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import webpush from 'web-push';

// Configurar VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('Faltan claves VAPID en variables de entorno');
}

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

interface SendNotificationBody {
  ids?: string[]; // Si está vacío, envía a todos
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

export async function POST(request: NextRequest) {
  try {
    // Verificación simple de autenticación (puedes mejorarla)
    const authHeader = request.headers.get('authorization');
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (authHeader !== `Bearer ${adminPassword}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body: SendNotificationBody = await request.json();
    const { ids, title, body: messageBody, icon, badge, data } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Título y cuerpo son requeridos' },
        { status: 400 }
      );
    }

    // Obtener suscripciones
    let query = supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true);

    if (ids && ids.length > 0) {
      query = query.in('id', ids);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No hay suscripciones activas' },
        { status: 404 }
      );
    }

    // Preparar payload
    const payload = JSON.stringify({
      title,
      body: messageBody,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/icon-192x192.png',
      data: data || {},
    });

    // Enviar notificaciones
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          return { id: sub.id, success: true };
        } catch (error: any) {
          console.error(`Error enviando a ${sub.id}:`, error);

          // Si la suscripción es inválida, marcarla como inactiva
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .update({ active: false })
              .eq('id', sub.id);
          }

          return { id: sub.id, success: false, error: error.message };
        }
      })
    );

    // Guardar en historial (opcional)
    await supabase.from('notifications_sent').insert({
      title,
      body: messageBody,
      target: ids && ids.length > 0 ? ids.join(',') : 'all',
    });

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
      results: results.map((r) => r.status === 'fulfilled' ? r.value : null),
    });
  } catch (error) {
    console.error('Error en /api/send:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
