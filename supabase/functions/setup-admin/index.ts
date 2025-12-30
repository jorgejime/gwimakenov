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

    const adminEmail = 'admin@gwimake.com';
    const adminPassword = '@Gwimake2026';

    // Crear usuario usando la Admin API de Supabase
    const createResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Administrador Gwimake'
        },
        app_metadata: {
          role: 'admin'
        }
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error creando usuario: ${error}`
        }),
        {
          status: createResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const newUser = await createResponse.json();

    // Crear el perfil de usuario
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: newUser.id,
        email: adminEmail,
        full_name: 'Administrador Gwimake',
        role: 'admin',
        is_active: true
      })
    });

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      console.error('Error creando perfil:', error);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuario administrador creado exitosamente',
        userId: newUser.id,
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
        error: error.message || 'Error desconocido'
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