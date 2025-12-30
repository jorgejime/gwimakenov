/*
  # Reset Admin Password
  
  Esta migración resetea la contraseña del usuario admin a un hash conocido.
  Contraseña: @Gwimake2026
  
  1. Actualiza
    - `auth.users.encrypted_password` con un hash bcrypt válido
*/

-- Actualizar la contraseña del admin usando crypt de pgcrypto
UPDATE auth.users
SET encrypted_password = crypt('@Gwimake2026', gen_salt('bf', 10)),
    updated_at = now()
WHERE email = 'admin@gwimake.com';
