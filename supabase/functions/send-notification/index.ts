// Supabase Edge Function para enviar notificaciones push
// Deploy: supabase functions deploy send-notification
// Nota: web-push no funciona en Deno, esta es una implementación alternativa

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Nota: Para enviar notificaciones push desde Deno/Edge Functions,
// necesitas implementar el protocolo Web Push manualmente o usar un servicio externo
// Esta es una implementación de ejemplo que demuestra la lógica

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Autenticación simple
    const authHeader = req.headers.get('authorization');
    const adminPassword = Deno.env.get('ADMIN_PASSWORD') || 'admin123';

    if (authHeader !== `Bearer ${adminPassword}`) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { ids, title, body: messageBody, icon, badge, data } = await req.json();

    if (!title || !messageBody) {
      return new Response(
        JSON.stringify({ error: 'Título y cuerpo son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener suscripciones
    let query = supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('active', true);

    if (ids && ids.length > 0) {
      query = query.in('id', ids);
    }

    const { data: subscriptions, error } = await query;

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No hay suscripciones activas' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({
      title,
      body: messageBody,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/icon-192x192.png',
      data: data || {},
    });

    // IMPORTANTE: Para implementación en producción con Deno/Edge Functions,
    // necesitas usar una librería compatible con Deno para Web Push
    // o llamar a tu API de Next.js que tiene web-push instalado

    // Por ahora, esta función registra el intento y retorna éxito simulado
    console.log(`Intentando enviar a ${subscriptions.length} suscripciones`);
    console.log('Payload:', payload);

    // Guardar en historial
    await supabaseClient.from('notifications_sent').insert({
      title,
      body: messageBody,
      target: ids && ids.length > 0 ? ids.join(',') : 'all',
    });

    // En producción, aquí implementarías el envío real usando:
    // 1. Una librería de Web Push compatible con Deno
    // 2. O hacer una llamada a tu backend de Next.js
    // 3. O usar un servicio externo como Firebase Cloud Messaging

    return new Response(
      JSON.stringify({
        success: true,
        sent: subscriptions.length,
        failed: 0,
        total: subscriptions.length,
        note: 'Esta es una implementación de ejemplo. En producción, usa la API de Next.js para envíos reales.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
