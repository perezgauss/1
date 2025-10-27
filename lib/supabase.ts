import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para TypeScript
export interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_info?: string;
  created_at: string;
  active: boolean;
}

export interface NotificationSent {
  id: string;
  title: string;
  body: string;
  target: string;
  created_at: string;
}
