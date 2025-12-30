/*
  # Corregir Contraseña del Usuario Administrador

  ## Resumen
  Actualiza la contraseña del usuario administrador usando el formato correcto de Supabase Auth.

  ## Cambios
  - Actualiza el hash de contraseña para el usuario admin@gwimake.com
  - Usa el algoritmo de hash compatible con Supabase Auth
  - Contraseña: @Gwimake2026

  ## Notas
  - La contraseña se hashea usando el formato estándar de Supabase
  - El usuario debe poder iniciar sesión inmediatamente después de esta migración
*/

-- Actualizar la contraseña del usuario administrador
UPDATE auth.users
SET 
  encrypted_password = crypt('@Gwimake2026', gen_salt('bf', 10)),
  updated_at = now()
WHERE email = 'admin@gwimake.com';