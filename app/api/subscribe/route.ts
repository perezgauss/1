import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys, device_info } = body;

    // Validar datos
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: 'Datos de suscripción incompletos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una suscripción con este endpoint
    const { data: existing, error: searchError } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', endpoint)
      .single();

    if (existing) {
      // Ya existe, retornar el ID existente
      return NextResponse.json({ id: existing.id });
    }

    // Generar nuevo UUID
    const id = uuidv4();

    // Guardar en Supabase
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert([
        {
          id,
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
      return NextResponse.json(
        { error: 'Error al guardar suscripción' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error('Error en /api/subscribe:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Retornar todas las suscripciones activas (para el panel admin)
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id, device_info, created_at, active')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ subscriptions: data });
  } catch (error) {
    console.error('Error obteniendo suscripciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener suscripciones' },
      { status: 500 }
    );
  }
}
