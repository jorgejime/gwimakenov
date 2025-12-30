# Arquitectura de Seguridad Empresarial - Gwimake

## Resumen Ejecutivo

Se ha implementado un sistema de seguridad empresarial completo que transforma la aplicación de un sistema vulnerable con acceso público sin restricciones a una plataforma segura con múltiples capas de protección.

## Vulnerabilidades Críticas Eliminadas

### ❌ Antes (INSEGURO)
- ✗ Políticas RLS con `USING (true)` - acceso público sin autenticación
- ✗ Validación de contraseña en cliente (hardcodeada en código)
- ✗ OpenAI API key expuesta en navegador con `dangerouslyAllowBrowser: true`
- ✗ Sin rate limiting - vulnerable a ataques de fuerza bruta
- ✗ Sin auditoría de accesos
- ✗ Sin roles ni permisos granulares

### ✅ Ahora (SEGURO)
- ✓ Políticas RLS restrictivas con autenticación real requerida
- ✓ Supabase Auth con email/password
- ✓ OpenAI API key protegida en Edge Functions del servidor
- ✓ Rate limiting: 5 intentos/15 minutos
- ✓ Auditoría completa de todas las acciones
- ✓ Sistema de roles: admin, gestor, viewer

---

## 1. Sistema de Autenticación y Autorización

### Componentes Implementados

#### 1.1 Supabase Authentication
- **Ubicación**: Integración con `auth.users` de Supabase
- **Características**:
  - Autenticación con email y contraseña
  - Gestión automática de sesiones con tokens JWT
  - Refresh tokens con rotación automática
  - Expiración de sesión configurable

#### 1.2 Perfiles de Usuario (`user_profiles`)
```sql
- id (uuid, FK a auth.users)
- email (text)
- full_name (text)
- role (admin | gestor | viewer)
- is_active (boolean)
- last_login_at (timestamptz)
- last_login_ip (text)
```

**Roles y Permisos**:

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso total: CRUD en todas las tablas, gestión de usuarios, configuración |
| **gestor** | Gestión de reservas, imágenes, pricing, notas. Sin gestión de usuarios |
| **viewer** | Solo lectura de información. Sin permisos de modificación |

#### 1.3 Servicios de Autenticación

**Archivo**: `services/authService.ts`

Funciones clave:
- `signIn(email, password)`: Login con verificación de rate limit
- `signOut()`: Cierre de sesión con registro en auditoría
- `getUserProfile(userId)`: Obtener perfil y rol del usuario
- `hasRole(roles[])`: Verificar permisos por rol
- `logAudit(action, resourceType, resourceId, details)`: Registro de auditoría

---

## 2. Row Level Security (RLS)

### Principio: Privilegio Mínimo

Todas las tablas tienen RLS habilitado con políticas restrictivas por defecto. El acceso solo se otorga explícitamente según el rol del usuario autenticado.

### Políticas por Tabla

#### bookings
| Operación | Política |
|-----------|----------|
| SELECT | Lectura pública limitada (solo fechas/capacidad para calendario) |
| INSERT | Creación pública permitida (clientes hacen reservas) |
| UPDATE | Solo admins y gestores autenticados |
| DELETE | Solo admins autenticados |

#### hero_images, gallery_images
| Operación | Política |
|-----------|----------|
| SELECT | Lectura pública (mostrar en web) |
| INSERT | Solo admins autenticados |
| UPDATE | Solo admins autenticados |
| DELETE | Solo admins autenticados |

#### pricing_config
| Operación | Política |
|-----------|----------|
| SELECT | Lectura pública solo de configuración activa |
| INSERT | Solo admins autenticados |
| UPDATE | Solo admins autenticados |

#### audit_logs, booking_history, communication_log
| Operación | Política |
|-----------|----------|
| SELECT | Solo admins y gestores autenticados |
| INSERT | Sistema puede insertar (triggers automáticos) |

#### user_profiles
| Operación | Política |
|-----------|----------|
| SELECT | Usuarios ven su propio perfil, admins ven todos |
| UPDATE | Usuarios pueden actualizar su propio perfil |
| INSERT | Solo admins pueden crear usuarios |

---

## 3. Auditoría y Monitoreo

### 3.1 Tabla de Auditoría (`audit_logs`)

Registra TODAS las acciones administrativas:

```sql
- id (uuid, pk)
- user_id (uuid, FK a auth.users)
- action (text) - Ej: 'login', 'update_booking_status', 'delete_image'
- resource_type (text) - Ej: 'auth', 'booking', 'gallery_image'
- resource_id (text) - ID del recurso afectado
- details (jsonb) - Información adicional de la acción
- ip_address (text)
- user_agent (text)
- created_at (timestamptz)
```

### 3.2 Eventos Auditados

- ✓ Todos los logins (exitosos y fallidos)
- ✓ Todos los logouts
- ✓ Cambios de estado de reservas
- ✓ Creación/modificación/eliminación de imágenes
- ✓ Cambios en configuración de pricing
- ✓ Creación/modificación de usuarios

### 3.3 Función de Auditoría

```typescript
await logAudit(
  'update_booking_status',
  'booking',
  bookingId,
  { new_status: 'confirmed', user_role: 'admin' }
);
```

---

## 4. Rate Limiting y Protección contra Fuerza Bruta

### 4.1 Tabla de Intentos Fallidos (`failed_login_attempts`)

```sql
- id (uuid, pk)
- email (text)
- ip_address (text)
- attempted_at (timestamptz)
- reason (text)
```

### 4.2 Función de Verificación

```sql
CREATE FUNCTION check_rate_limit(p_email text, p_ip_address text)
RETURNS boolean
```

**Reglas**:
- Máximo 5 intentos fallidos en 15 minutos
- Bloqueo por email O por IP
- Limpieza automática de intentos antiguos (>1 hora)

### 4.3 Integración

El `authService.signIn()` verifica rate limiting ANTES de intentar autenticar:

```typescript
const isAllowed = await checkRateLimit(email);
if (!isAllowed) {
  throw new Error('RATE_LIMIT_EXCEEDED');
}
```

---

## 5. Protección de API Keys

### ❌ Antes: API Key Expuesta (CRÍTICO)

```typescript
// INSEGURO: API key visible en código del navegador
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true  // ⚠️ PELIGROSO
});
```

### ✅ Ahora: API Key Protegida en Servidor

#### Edge Function (`generate-itinerary`)

```typescript
// SEGURO: API key solo en servidor
const apiKey = Deno.env.get("OPENAI_API_KEY");
const openai = new OpenAI({ apiKey });
```

#### Cliente Frontend

```typescript
// SEGURO: Solo llama a la Edge Function
const response = await fetch(
  `${supabaseUrl}/functions/v1/generate-itinerary`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({ startDate, lang })
  }
);
```

**Beneficios**:
- ✓ API key nunca expuesta al cliente
- ✓ Sin riesgo de robo de credenciales
- ✓ Fácil rotación de keys sin actualizar frontend
- ✓ Rate limiting centralizado en servidor

---

## 6. Gestión de Sesiones

### 6.1 Tabla de Sesiones Activas (`active_sessions`)

```sql
- id (uuid, pk)
- user_id (uuid, FK a auth.users)
- token_hash (text)
- ip_address (text)
- user_agent (text)
- created_at (timestamptz)
- expires_at (timestamptz)
- last_activity (timestamptz)
```

### 6.2 Configuración de Supabase Auth

```typescript
auth: {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true
}
```

### 6.3 Limpieza Automática

```sql
CREATE FUNCTION cleanup_expired_sessions()
RETURNS void
```

Elimina sesiones expiradas automáticamente.

---

## 7. Arquitectura de Componentes

### Frontend

```
App.tsx
├── AuthService (login/logout/permisos)
├── AdminLogin (formulario con email/password)
├── AdminDashboard (verificación de rol)
└── Components (verificación de permisos inline)
```

### Backend (Supabase)

```
Database
├── auth.users (Supabase Auth)
├── user_profiles (roles y permisos)
├── active_sessions (gestión de sesiones)
├── audit_logs (auditoría completa)
└── failed_login_attempts (rate limiting)

Edge Functions
└── generate-itinerary (OpenAI API segura)
```

---

## 8. Flujo de Autenticación

```
1. Usuario ingresa email/password
   ↓
2. Frontend llama authService.signIn()
   ↓
3. Verificar rate limit (check_rate_limit)
   ↓
4. Supabase Auth verifica credenciales
   ↓
5. Obtener perfil de usuario (user_profiles)
   ↓
6. Verificar is_active = true
   ↓
7. Registrar en audit_logs
   ↓
8. Actualizar last_login_at
   ↓
9. Retornar usuario, perfil y sesión
   ↓
10. Frontend guarda estado de autenticación
```

---

## 9. Migraciones Aplicadas

### 1. `create_secure_authentication_system.sql`
- Tablas: user_profiles, active_sessions, audit_logs, failed_login_attempts
- Funciones: check_rate_limit, log_failed_attempt, log_audit, cleanup_expired_sessions
- Triggers: update_last_login, update_updated_at_timestamp
- Políticas RLS para todas las nuevas tablas

### 2. `fix_insecure_rls_policies.sql`
- Eliminación de políticas `USING (true)` inseguras
- Reemplazo con políticas restrictivas basadas en roles
- Aplicado a: bookings, hero_images, gallery_images, pricing_config, pricing_history, booking_history, communication_log, booking_notes

---

## 10. Cumplimiento de Estándares

### OWASP Top 10 (2021)

| Vulnerabilidad | Estado | Mitigación |
|----------------|--------|------------|
| A01 Broken Access Control | ✅ Protegido | RLS + roles + permisos |
| A02 Cryptographic Failures | ✅ Protegido | Supabase maneja cifrado |
| A03 Injection | ✅ Protegido | Queries parametrizadas |
| A04 Insecure Design | ✅ Protegido | Arquitectura zero-trust |
| A05 Security Misconfiguration | ✅ Protegido | RLS habilitado por defecto |
| A06 Vulnerable Components | ⚠️ Parcial | Dependencias actualizadas |
| A07 Authentication Failures | ✅ Protegido | Auth real + rate limiting |
| A08 Data Integrity Failures | ✅ Protegido | Auditoría + triggers |
| A09 Logging Failures | ✅ Protegido | audit_logs completo |
| A10 SSRF | ✅ Protegido | Edge Functions aisladas |

### Principios de Seguridad

✅ **Defense in Depth**: Múltiples capas de seguridad
✅ **Least Privilege**: Permisos mínimos por defecto
✅ **Zero Trust**: Verificación en cada operación
✅ **Audit Everything**: Log completo de acciones
✅ **Fail Secure**: Bloqueo en caso de error

---

## 11. Tareas Pendientes (Mejoras Futuras)

### Alta Prioridad
1. Implementar validación con Zod en todos los formularios
2. Agregar Content Security Policy (CSP) headers
3. Implementar 2FA para administradores
4. Encriptar datos PII en base de datos

### Media Prioridad
5. Dashboard de seguridad con métricas
6. Alertas automáticas por email/SMS para eventos críticos
7. Exportación de logs de auditoría
8. Política de retención de datos

### Baja Prioridad
9. Integración con SIEM
10. Certificación SOC 2
11. Penetration testing profesional

---

## 12. Mantenimiento y Monitoreo

### Tareas Semanales
- Revisar audit_logs para actividad sospechosa
- Verificar failed_login_attempts por patrones de ataque
- Confirmar que todas las sesiones activas son legítimas

### Tareas Mensuales
- Revisar y actualizar roles de usuarios
- Desactivar cuentas inactivas
- Actualizar dependencias del proyecto

### Tareas Trimestrales
- Auditoría de seguridad completa
- Revisión de políticas RLS
- Capacitación de seguridad para el equipo
- Rotación de credenciales críticas

---

## 13. Contactos de Emergencia

### Incidente de Seguridad
1. Email: seguridad@gwimake.com
2. Protocolo: Ver `SECURITY_SETUP.md` sección 6

### Soporte Técnico
- Documentación: Este archivo + SECURITY_SETUP.md
- Supabase Dashboard: https://supabase.com/dashboard

---

**Versión**: 1.0.0
**Última Actualización**: 2025-12-30
**Próxima Revisión**: 2026-03-30
