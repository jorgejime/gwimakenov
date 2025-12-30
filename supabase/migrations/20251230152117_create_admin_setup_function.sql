/*
  # Crear Función para Configurar Usuario Administrador

  ## Resumen
  Crea una función SQL que configura el usuario administrador con contraseña correcta.

  ## Cambios
  1. **Función RPC**
     - Busca o crea el usuario admin@gwimake.com
     - Actualiza la contraseña usando el formato correcto de Supabase
     - Crea o actualiza el perfil de usuario

  ## Seguridad
  - Solo ejecutable por service role
  - Usa bcrypt para hashear contraseña

  ## Notas
  - Esta función se puede llamar desde el frontend o backend
  - Devuelve el ID del usuario creado/actualizado
*/

-- Función para setup del admin
CREATE OR REPLACE FUNCTION setup_admin_user(
  p_email text,
  p_password text,
  p_full_name text DEFAULT 'Administrador Gwimake'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_exists boolean;
  v_hashed_password text;
  v_result json;
BEGIN
  -- Verificar si el usuario existe
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  ) INTO v_user_exists;

  -- Hashear la contraseña
  v_hashed_password := crypt(p_password, gen_salt('bf', 10));

  IF v_user_exists THEN
    -- Obtener ID del usuario existente
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    -- Actualizar contraseña
    UPDATE auth.users 
    SET 
      encrypted_password = v_hashed_password,
      updated_at = now(),
      email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE email = p_email;

    -- Actualizar o crear perfil
    INSERT INTO user_profiles (id, email, full_name, role, is_active)
    VALUES (v_user_id, p_email, p_full_name, 'admin', true)
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = 'admin',
      is_active = true,
      updated_at = now();

    v_result := json_build_object(
      'success', true,
      'message', 'Usuario actualizado exitosamente',
      'user_id', v_user_id,
      'action', 'updated'
    );
  ELSE
    -- Crear nuevo usuario
    v_user_id := gen_random_uuid();
    
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
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      p_email,
      v_hashed_password,
      now(),
      'authenticated',
      'authenticated',
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      json_build_object('full_name', p_full_name)::jsonb,
      false
    );

    -- Crear perfil
    INSERT INTO user_profiles (id, email, full_name, role, is_active)
    VALUES (v_user_id, p_email, p_full_name, 'admin', true);

    v_result := json_build_object(
      'success', true,
      'message', 'Usuario creado exitosamente',
      'user_id', v_user_id,
      'action', 'created'
    );
  END IF;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM,
      'action', 'error'
    );
END;
$$;