import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const adminEmail = 'admin@gwimake.com';
    const adminPassword = '@Gwimake2026';

    // Intentar obtener el usuario por email usando Admin API
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Error listando usuarios: ${listError.message}`);
    }

    const existingUser = users.find(u => u.email === adminEmail);

    if (existingUser) {
      // Actualizar la contraseña del usuario existente
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: adminPassword }
      );

      if (updateError) {
        throw new Error(`Error actualizando contraseña: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Contraseña actualizada exitosamente',
          userId: existingUser.id,
          email: adminEmail
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Si no existe, crear el usuario
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Administrador Gwimake'
      }
    });

    if (createError) {
      throw new Error(`Error creando usuario: ${createError.message}`);
    }

    // Crear el perfil de usuario (usando service role que bypasea RLS)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: newUser.user.id,
        email: adminEmail,
        full_name: 'Administrador Gwimake',
        role: 'admin',
        is_active: true
      });

    if (profileError && profileError.code !== '23505') {
      console.error('Profile error (non-fatal):', profileError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuario administrador creado exitosamente',
        userId: newUser.user.id,
        email: adminEmail
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error completo:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error desconocido',
        stack: error.stack
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});