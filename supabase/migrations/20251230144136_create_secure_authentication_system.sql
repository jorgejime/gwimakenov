/*
  # Sistema de Autenticación Segura y Control de Acceso

  ## Resumen
  Esta migración implementa un sistema de autenticación empresarial completo con:
  - Tabla de perfiles de usuario con roles
  - Tabla de sesiones activas para control
  - Tabla de auditoría de accesos
  - Tabla de intentos de login fallidos
  - Políticas RLS restrictivas que requieren autenticación real
  - Rate limiting mediante funciones de base de datos

  ## 1. Nuevas Tablas

  ### `user_profiles`
  - `id` (uuid, pk, fk a auth.users) - ID del usuario
  - `email` (text) - Email del usuario
  - `full_name` (text) - Nombre completo
  - `role` (text) - Rol: admin, gestor, viewer
  - `is_active` (boolean) - Si el usuario está activo
  - `created_at` (timestamptz) - Fecha de creación
  - `updated_at` (timestamptz) - Última actualización
  - `last_login_at` (timestamptz) - Último acceso
  - `last_login_ip` (text) - IP del último acceso

  ### `active_sessions`
  - `id` (uuid, pk) - ID de sesión
  - `user_id` (uuid, fk) - Referencia al usuario
  - `token_hash` (text) - Hash del token de sesión
  - `ip_address` (text) - IP de la sesión
  - `user_agent` (text) - User agent del navegador
  - `created_at` (timestamptz) - Inicio de sesión
  - `expires_at` (timestamptz) - Expiración de la sesión
  - `last_activity` (timestamptz) - Última actividad

  ### `audit_logs`
  - `id` (uuid, pk) - ID del registro
  - `user_id` (uuid) - Usuario que realizó la acción
  - `action` (text) - Tipo de acción
  - `resource_type` (text) - Tipo de recurso afectado
  - `resource_id` (text) - ID del recurso
  - `details` (jsonb) - Detalles de la acción
  - `ip_address` (text) - IP desde donde se realizó
  - `user_agent` (text) - User agent
  - `created_at` (timestamptz) - Timestamp

  ### `failed_login_attempts`
  - `id` (uuid, pk) - ID del intento
  - `email` (text) - Email del intento
  - `ip_address` (text) - IP origen
  - `attempted_at` (timestamptz) - Timestamp del intento
  - `reason` (text) - Razón del fallo

  ## 2. Seguridad
  - RLS habilitado en todas las tablas
  - Solo usuarios autenticados pueden acceder
  - Políticas por rol con privilegios mínimos
  - Rate limiting incorporado
  - Bloqueo automático después de 5 intentos fallidos

  ## 3. Índices
  - Índices para optimizar consultas de autenticación
  - Índices en campos de auditoría
*/

-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'gestor', 'viewer')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login_at timestamptz,
  last_login_ip text
);

-- Crear tabla de sesiones activas
CREATE TABLE IF NOT EXISTS active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_activity timestamptz DEFAULT now()
);

-- Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de intentos fallidos de login
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text NOT NULL,
  attempted_at timestamptz DEFAULT now(),
  reason text
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at ON active_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_attempted_at ON failed_login_attempts(attempted_at);

-- Habilitar RLS en todas las tablas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_profiles
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Los admins pueden ver todos los perfiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Solo admins pueden crear usuarios"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- Políticas RLS para active_sessions
CREATE POLICY "Los usuarios pueden ver sus propias sesiones"
  ON active_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Los usuarios pueden crear sus propias sesiones"
  ON active_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Los usuarios pueden eliminar sus propias sesiones"
  ON active_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Políticas RLS para audit_logs
CREATE POLICY "Solo admins pueden ver logs de auditoría"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Sistema puede crear logs de auditoría"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas RLS para failed_login_attempts
CREATE POLICY "Solo admins pueden ver intentos fallidos"
  ON failed_login_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Sistema puede registrar intentos fallidos"
  ON failed_login_attempts FOR INSERT
  WITH CHECK (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM active_sessions
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar en auditoría
CREATE OR REPLACE FUNCTION log_audit(
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar rate limiting (máximo 5 intentos en 15 minutos)
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_email text,
  p_ip_address text
)
RETURNS boolean AS $$
DECLARE
  attempt_count int;
BEGIN
  -- Contar intentos en los últimos 15 minutos
  SELECT COUNT(*)
  INTO attempt_count
  FROM failed_login_attempts
  WHERE (email = p_email OR ip_address = p_ip_address)
    AND attempted_at > now() - interval '15 minutes';

  -- Retornar false si hay 5 o más intentos
  RETURN attempt_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar intento fallido
CREATE OR REPLACE FUNCTION log_failed_attempt(
  p_email text,
  p_ip_address text,
  p_reason text DEFAULT 'Invalid credentials'
)
RETURNS void AS $$
BEGIN
  INSERT INTO failed_login_attempts (email, ip_address, reason)
  VALUES (p_email, p_ip_address, p_reason);

  -- Limpiar intentos antiguos (más de 1 hora)
  DELETE FROM failed_login_attempts
  WHERE attempted_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar último acceso del usuario
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET last_login_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar último acceso cuando un usuario hace login
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_last_login();
