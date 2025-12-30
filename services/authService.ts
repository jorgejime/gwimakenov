import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'gestor' | 'viewer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  last_login_ip: string | null;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

let supabase: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (supabase) return supabase;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  return supabase;
};

/**
 * Verifica si un email está bloqueado por intentos fallidos
 */
const checkRateLimit = async (email: string): Promise<boolean> => {
  const client = getSupabaseClient();

  try {
    // Usar la función de base de datos para verificar rate limit
    const { data, error } = await client.rpc('check_rate_limit', {
      p_email: email,
      p_ip_address: 'frontend' // En producción, obtener IP real del servidor
    });

    if (error) {
      console.error('Error checking rate limit:', error);
      return true; // Por seguridad, permitir si hay error
    }

    return data as boolean;
  } catch (error) {
    console.error('Error in checkRateLimit:', error);
    return true; // Por seguridad, permitir si hay error
  }
};

/**
 * Registra un intento fallido de login
 */
const logFailedAttempt = async (email: string, reason: string = 'Invalid credentials'): Promise<void> => {
  const client = getSupabaseClient();

  try {
    await client.rpc('log_failed_attempt', {
      p_email: email,
      p_ip_address: 'frontend',
      p_reason: reason
    });
  } catch (error) {
    console.error('Error logging failed attempt:', error);
  }
};

/**
 * Registra una acción en la auditoría
 */
export const logAudit = async (
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: object
): Promise<void> => {
  const client = getSupabaseClient();

  try {
    const { data: { user } } = await client.auth.getUser();

    if (!user) return;

    await client.rpc('log_audit', {
      p_user_id: user.id,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId || null,
      p_details: details || {},
      p_ip_address: 'frontend',
      p_user_agent: navigator.userAgent
    });
  } catch (error) {
    console.error('Error logging audit:', error);
  }
};

/**
 * Obtiene el perfil del usuario actual
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('FETCH_PROFILE_FAILED');
  }

  return data as UserProfile | null;
};

/**
 * Inicia sesión con email y contraseña
 */
export const signIn = async (email: string, password: string): Promise<{
  user: User;
  profile: UserProfile;
  session: Session;
}> => {
  const client = getSupabaseClient();

  // Verificar rate limiting
  const isAllowed = await checkRateLimit(email);
  if (!isAllowed) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }

  try {
    // Intentar login
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Registrar intento fallido
      await logFailedAttempt(email, error.message);
      throw error;
    }

    if (!data.user || !data.session) {
      await logFailedAttempt(email, 'No user or session returned');
      throw new Error('SIGN_IN_FAILED');
    }

    // Obtener perfil del usuario
    const profile = await getUserProfile(data.user.id);

    if (!profile) {
      throw new Error('USER_PROFILE_NOT_FOUND');
    }

    if (!profile.is_active) {
      await client.auth.signOut();
      throw new Error('USER_INACTIVE');
    }

    // Registrar en auditoría
    await logAudit('login', 'auth', data.user.id, {
      email: data.user.email,
      role: profile.role
    });

    // Actualizar última conexión
    await client
      .from('user_profiles')
      .update({
        last_login_at: new Date().toISOString(),
        last_login_ip: 'frontend'
      })
      .eq('id', data.user.id);

    return {
      user: data.user,
      profile,
      session: data.session
    };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

/**
 * Cierra sesión del usuario actual
 */
export const signOut = async (): Promise<void> => {
  const client = getSupabaseClient();

  try {
    const { data: { user } } = await client.auth.getUser();

    if (user) {
      // Registrar en auditoría antes de cerrar sesión
      await logAudit('logout', 'auth', user.id);
    }

    // Cerrar sesión
    const { error } = await client.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};

/**
 * Obtiene la sesión actual
 */
export const getSession = async (): Promise<Session | null> => {
  const client = getSupabaseClient();

  const { data: { session }, error } = await client.auth.getSession();

  if (error) {
    console.error('Get session error:', error);
    return null;
  }

  return session;
};

/**
 * Obtiene el usuario actual
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const client = getSupabaseClient();

  const { data: { user }, error } = await client.auth.getUser();

  if (error) {
    console.error('Get user error:', error);
    return null;
  }

  return user;
};

/**
 * Verifica si el usuario tiene un rol específico
 */
export const hasRole = async (allowedRoles: string[]): Promise<boolean> => {
  const client = getSupabaseClient();

  try {
    const { data: { user } } = await client.auth.getUser();

    if (!user) return false;

    const profile = await getUserProfile(user.id);

    if (!profile || !profile.is_active) return false;

    return allowedRoles.includes(profile.role);
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
};

/**
 * Verifica si el usuario es admin
 */
export const isAdmin = async (): Promise<boolean> => {
  return hasRole(['admin']);
};

/**
 * Verifica si el usuario puede gestionar contenido
 */
export const canManageContent = async (): Promise<boolean> => {
  return hasRole(['admin', 'gestor']);
};

/**
 * Suscripción a cambios de autenticación
 */
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  const client = getSupabaseClient();

  return client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

/**
 * Limpia sesiones expiradas (llamar periódicamente desde el servidor)
 */
export const cleanupExpiredSessions = async (): Promise<void> => {
  const client = getSupabaseClient();

  try {
    await client.rpc('cleanup_expired_sessions');
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
};
