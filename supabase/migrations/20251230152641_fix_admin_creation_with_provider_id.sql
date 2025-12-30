/*
  # Arreglar Creación de Admin con provider_id

  ## Resumen
  Corrige la función de creación de admin para incluir todos los campos requeridos.

  ## Cambios
  - Añade provider_id a la inserción en identities
  - Usa el email como provider_id para el proveedor email
*/

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

  -- Hashear la contraseña con bcrypt factor 10
  v_hashed_password := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

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
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('full_name', p_full_name),
    false
  );

  -- Registrar en identities con provider_id
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email',
    now(),
    now(),
    now()
  );

  -- Crear el perfil del usuario
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

-- Ejecutar la función para crear el admin
SELECT create_initial_admin(
  'admin@gwimake.com',
  '@Gwimake2026',
  'Administrador Gwimake'
);