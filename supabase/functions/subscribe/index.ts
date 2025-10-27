// Supabase Edge Function para registrar suscripciones push
// Deploy: supabase functions deploy subscribe

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { endpoint, keys, device_info } = await req.json();

      // Validar datos
      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return new Response(
          JSON.stringify({ error: 'Datos de suscripción incompletos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar si ya existe
      const { data: existing } = await supabaseClient
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', endpoint)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ id: existing.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Crear nuevo registro
      const { data, error } = await supabaseClient
        .from('push_subscriptions')
        .insert([
          {
            endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
            device_info: device_info || null,
            active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error guardando suscripción:', error);
        return new Response(
          JSON.stringify({ error: 'Error al guardar suscripción' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ id: data.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      const { data, error } = await supabaseClient
        .from('push_subscriptions')
        .select('id, device_info, created_at, active')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ subscriptions: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
