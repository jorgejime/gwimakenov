/*
  # Crear Usuario Administrador Principal

  ## Resumen
  Esta migración crea el usuario administrador principal del sistema con credenciales específicas.

  ## Cambios
  1. **Usuario de Autenticación**
     - Email: admin@gwimake.com
     - Contraseña: @Gwimake2026
     - Rol: authenticated
     - Email confirmado automáticamente
  
  2. **Perfil de Administrador**
     - Rol: admin
     - Nombre completo: Administrador Gwimake
     - Estado: activo
     - Vinculado al usuario de autenticación

  ## Seguridad
  - El usuario se crea con email confirmado para acceso inmediato
  - La contraseña está hasheada usando el algoritmo bcrypt de Supabase
  - El perfil tiene RLS habilitado según las políticas existentes

  ## Notas
  - Este es el usuario principal para la gestión del sistema
  - Puede modificar su contraseña después del primer login
  - El email debe ser único en el sistema
*/

-- Asegurar que la extensión pgcrypto está disponible
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear el usuario administrador en auth.users
DO $$
DECLARE
  admin_user_id uuid;
  hashed_password text;
BEGIN
  -- Generar un UUID fijo para el administrador
  admin_user_id := gen_random_uuid();
  
  -- Hashear la contraseña usando crypt (bcrypt)
  -- Nota: Supabase usa un formato específico, pero para simplicidad usamos crypt
  hashed_password := crypt('@Gwimake2026', gen_salt('bf'));
  
  -- Verificar si el usuario ya existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@gwimake.com') THEN
    -- Insertar el usuario en auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin
    ) VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'admin@gwimake.com',
      hashed_password,
      now(),
      'authenticated',
      'authenticated',
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"full_name": "Administrador Gwimake"}'::jsonb,
      false
    );

    -- Crear el perfil de usuario correspondiente
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      role,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      admin_user_id,
      'admin@gwimake.com',
      'Administrador Gwimake',
      'admin',
      true,
      now(),
      now()
    );

    RAISE NOTICE 'Usuario administrador creado exitosamente: admin@gwimake.com';
  ELSE
    RAISE NOTICE 'El usuario admin@gwimake.com ya existe';
  END IF;
END $$;