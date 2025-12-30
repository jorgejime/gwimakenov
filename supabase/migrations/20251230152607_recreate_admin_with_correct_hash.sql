/*
  # Recrear Usuario Admin con Hash Correcto

  ## Resumen
  Elimina y recrea el usuario admin con el formato de hash correcto para Supabase Auth.

  ## Cambios
  - Elimina el usuario admin existente
  - Recrea con factor de trabajo bcrypt más alto (10 en lugar de default)
  - Asegura que el formato sea compatible con Supabase Auth

  ## Notas
  - Usa bcrypt con factor de trabajo 10 (estándar de Supabase)
*/

-- Eliminar usuario existente
DELETE FROM auth.users WHERE email = 'admin@gwimake.com';
DELETE FROM user_profiles WHERE email = 'admin@gwimake.com';

-- Recrear función con factor de trabajo correcto
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

  -- Registrar en identities también
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email',
    now(),
    now(),
    now()
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