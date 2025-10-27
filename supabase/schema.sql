-- Script SQL para crear las tablas en Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- Tabla de suscripciones push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_info TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de notificaciones enviadas (historial)
CREATE TABLE IF NOT EXISTS notifications_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target TEXT NOT NULL, -- 'all' o lista de IDs separados por coma
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at ON push_subscriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_created_at ON notifications_sent(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en push_subscriptions
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Opcional, ajusta según tus necesidades
-- Por defecto, permitir acceso público (ya que es anónimo)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_sent ENABLE ROW LEVEL SECURITY;

-- Política para permitir insertar suscripciones (cualquiera puede suscribirse)
CREATE POLICY "Permitir insertar suscripciones" ON push_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política para permitir leer suscripciones (solo para el backend/admin)
CREATE POLICY "Permitir leer suscripciones" ON push_subscriptions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política para permitir actualizar suscripciones (para marcar como inactivas)
CREATE POLICY "Permitir actualizar suscripciones" ON push_subscriptions
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Política para el historial de notificaciones (solo lectura pública, inserción para backend)
CREATE POLICY "Permitir insertar notificaciones" ON notifications_sent
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir leer notificaciones" ON notifications_sent
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Comentarios para documentación
COMMENT ON TABLE push_subscriptions IS 'Almacena las suscripciones push de los usuarios de forma anónima';
COMMENT ON TABLE notifications_sent IS 'Historial de notificaciones enviadas';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL del endpoint push del navegador';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Clave pública P-256 ECDH';
COMMENT ON COLUMN push_subscriptions.auth IS 'Secret de autenticación';
COMMENT ON COLUMN push_subscriptions.device_info IS 'User Agent u otra información del dispositivo';
COMMENT ON COLUMN push_subscriptions.active IS 'Indica si la suscripción sigue siendo válida';
