/*
  # Función para Crear Usuario Administrador Inicial

  ## Resumen
  Crea una función que bypasea RLS para crear el primer usuario administrador.

  ## Cambios
  1. **Función create_initial_admin**
     - Usa SECURITY DEFINER para bypassear RLS
     - Crea el usuario en auth.users usando Supabase Auth
     - Crea el perfil del usuario en user_profiles
     - Solo funciona si no hay ningún admin en el sistema

  ## Seguridad
  - Solo permite crear admin si no existe ningún otro admin
  - Usa hash bcrypt para la contraseña

  ## Notas
  - Esta función se ejecuta con privilegios elevados
  - Solo se puede crear un admin si la tabla está vacía o no hay admins
*/

-- Función para crear el admin inicial
CREATE OR REPLACE FUNCTION create_initial_admin(
  p_email text,
  p_password text,
  p_full_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_user_id uuid;
  v_admin_count int;
  v_hashed_password text;
  v_result json;
BEGIN
  -- Verificar si ya existe algún admin
  SELECT COUNT(*) INTO v_admin_count
  FROM user_profiles
  WHERE role = 'admin';

  IF v_admin_count > 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ya existe un administrador en el sistema'
    );
  END IF;

  -- Generar ID para el nuevo usuario
  v_user_id := gen_random_uuid();

  -- Hashear la contraseña
  v_hashed_password := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- Crear el usuario en auth.users
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
    is_super_admin,
    confirmed_at
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
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('full_name', p_full_name),
    false,
    now()
  );

  -- Crear el perfil del usuario (bypaseando RLS con SECURITY DEFINER)
  INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    is_active
  ) VALUES (
    v_user_id,
    p_email,
    p_full_name,
    'admin',
    true
  );

  v_result := json_build_object(
    'success', true,
    'message', 'Usuario administrador creado exitosamente',
    'user_id', v_user_id
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;

-- Ejecutar la función para crear el admin inicial
SELECT create_initial_admin(
  'admin@gwimake.com',
  '@Gwimake2026',
  'Administrador Gwimake'
);