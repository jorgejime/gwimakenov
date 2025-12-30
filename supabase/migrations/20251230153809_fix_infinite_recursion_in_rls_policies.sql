/*
  # Corregir Recursión Infinita en Políticas RLS
  
  Las políticas RLS de user_profiles estaban consultando la misma tabla user_profiles
  para verificar si un usuario es admin, causando recursión infinita.
  
  1. Cambios
    - Eliminar todas las políticas RLS existentes de user_profiles
    - Crear nuevas políticas usando auth.jwt() en lugar de consultar user_profiles
    - Los roles se almacenan en app_metadata del usuario en auth.users
  
  2. Seguridad
    - Los usuarios solo pueden ver su propio perfil
    - Los admins pueden ver todos los perfiles (verificando app_metadata)
    - Los usuarios solo pueden actualizar ciertos campos de su perfil
    - Solo admins pueden crear usuarios
*/

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Los admins pueden ver todos los perfiles" ON user_profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Solo admins pueden crear usuarios" ON user_profiles;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política: Los admins pueden ver todos los perfiles
CREATE POLICY "Los admins pueden ver todos los perfiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'role')::text = 'admin'
    OR (auth.jwt()->'app_metadata'->>'role')::text = 'admin'
  );

-- Política: Los usuarios pueden actualizar su propio perfil (campos limitados)
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- No permitir cambiar el rol ni el estado activo
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM user_profiles WHERE id = auth.uid())
  );

-- Política: Solo admins pueden crear usuarios
CREATE POLICY "Solo admins pueden crear usuarios"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'role')::text = 'admin'
    OR (auth.jwt()->'app_metadata'->>'role')::text = 'admin'
  );

-- Política: Solo admins pueden eliminar usuarios
CREATE POLICY "Solo admins pueden eliminar usuarios"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'role')::text = 'admin'
    OR (auth.jwt()->'app_metadata'->>'role')::text = 'admin'
  );
