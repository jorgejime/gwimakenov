# Configuración de Seguridad - Gwimake

## Configuración Inicial del Sistema de Autenticación

### 1. Crear el Primer Usuario Administrador

Después de aplicar las migraciones, necesitas crear manualmente el primer usuario administrador en Supabase:

#### Paso 1: Crear usuario en Supabase Auth

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Authentication** > **Users**
3. Haz clic en **Add User**
4. Ingresa:
   - Email: tu-email@ejemplo.com
   - Password: (contraseña segura de al menos 16 caracteres)
   - Confirmar email automáticamente: ✓
5. Haz clic en **Create User**
6. Copia el **User ID** que se generó

#### Paso 2: Crear perfil de administrador

1. Navega a **Table Editor** > **user_profiles**
2. Haz clic en **Insert** > **Insert row**
3. Ingresa:
   - `id`: (pega el User ID del paso anterior)
   - `email`: tu-email@ejemplo.com
   - `full_name`: Tu Nombre Completo
   - `role`: admin
   - `is_active`: true
4. Haz clic en **Save**

#### Paso 3: Verificar acceso

1. Ve a tu aplicación web
2. Navega a la sección de administración
3. Inicia sesión con las credenciales creadas
4. Deberías ver el panel de administración

### 2. Crear Usuarios Adicionales

Una vez que tengas acceso como administrador, puedes crear usuarios adicionales repitiendo los pasos anteriores con diferentes roles:

- **admin**: Acceso completo al sistema, puede crear otros usuarios
- **gestor**: Puede gestionar reservas, imágenes y configuración
- **viewer**: Solo puede ver información, sin permisos de edición

### 3. Configurar OpenAI API Key en Edge Function

La API key de OpenAI debe configurarse en las variables de entorno de Supabase Edge Functions:

1. Ve a **Edge Functions** en tu dashboard de Supabase
2. Selecciona la función **generate-itinerary**
3. Ve a **Settings** > **Environment Variables**
4. Agrega la variable:
   - Name: `OPENAI_API_KEY`
   - Value: (tu API key de OpenAI)
5. Guarda los cambios

**IMPORTANTE**: La API key NUNCA debe estar en el código frontend ni en el archivo .env del proyecto.

### 4. Medidas de Seguridad Implementadas

✅ **Autenticación Real**: Sistema de autenticación con Supabase Auth
✅ **Roles y Permisos**: Control de acceso basado en roles (admin, gestor, viewer)
✅ **Row Level Security (RLS)**: Políticas restrictivas en todas las tablas
✅ **Auditoría Completa**: Registro de todas las acciones administrativas
✅ **Rate Limiting**: Protección contra ataques de fuerza bruta (5 intentos/15 min)
✅ **API Keys Seguras**: OpenAI API key protegida en Edge Functions
✅ **Sesiones Seguras**: Gestión automática de sesiones con expiración
✅ **Bloqueo Automático**: Cuentas bloqueadas después de 5 intentos fallidos

### 5. Mejores Prácticas de Seguridad

#### Contraseñas
- Mínimo 16 caracteres
- Incluir mayúsculas, minúsculas, números y símbolos
- No reutilizar contraseñas de otros sitios
- Cambiar contraseñas cada 90 días

#### Gestión de Usuarios
- Revisar periódicamente usuarios activos
- Desactivar cuentas de usuarios que ya no trabajan en el proyecto
- Usar el principio de privilegio mínimo (asignar el rol más bajo necesario)

#### Monitoreo
- Revisar logs de auditoría semanalmente
- Investigar intentos de login fallidos sospechosos
- Verificar actividad inusual en el dashboard de Supabase

### 6. Respuesta a Incidentes

Si sospechas de un acceso no autorizado:

1. **Inmediato**:
   - Desactivar la cuenta comprometida en `user_profiles` (is_active = false)
   - Cerrar todas las sesiones activas
   - Cambiar las credenciales de Supabase si es necesario

2. **Investigación**:
   - Revisar la tabla `audit_logs` para identificar acciones sospechosas
   - Revisar `failed_login_attempts` para patrones de ataque
   - Verificar logs de Supabase Auth

3. **Prevención**:
   - Forzar cambio de contraseñas para todos los usuarios
   - Revisar y actualizar políticas RLS si es necesario
   - Implementar medidas adicionales según el tipo de incidente

### 7. Contacto y Soporte

Para reportar problemas de seguridad o solicitar asistencia:
- Email de seguridad: seguridad@gwimake.com (configurar)
- Documentación: Este archivo

---

**Última actualización**: 2025-12-30
**Versión del sistema de seguridad**: 1.0.0
