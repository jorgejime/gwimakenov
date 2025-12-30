# Verificación del Sistema de Eliminación de Reservas

## Cambios Implementados

### 1. Configuración del Cliente Supabase
- **Archivo**: `services/supabaseExtendedService.ts` y `services/supabaseService.ts`
- **Cambio**: Se agregó configuración de autenticación persistente a los clientes de Supabase
- **Razón**: Los clientes necesitan compartir la sesión de autenticación para que las políticas RLS funcionen correctamente

```typescript
supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

### 2. Mejora en la Función de Eliminación
- **Archivo**: `services/supabaseExtendedService.ts`
- **Cambio**: Agregada verificación de autenticación y manejo de errores específicos
- **Código**:
```typescript
export const deleteBooking = async (id: string): Promise<void> => {
  const client = getSupabaseClient();

  // Verificar que el usuario esté autenticado
  const { data: { user } } = await client.auth.getUser();

  if (!user) {
    throw new Error('USER_NOT_AUTHENTICATED');
  }

  const { error } = await client
    .from('bookings')
    .delete()
    .eq('id', id);

  if (error) {
    // Detectar errores de permisos RLS
    if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('policy')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }

    throw new Error('DELETE_BOOKING_FAILED');
  }
};
```

### 3. Traducciones de Errores
- **Archivos**: `locales/es.json` y `locales/en.json`
- **Errores agregados**:
  - `DELETE_BOOKING_FAILED`: Error general de eliminación
  - `USER_NOT_AUTHENTICATED`: Usuario no autenticado
  - `INSUFFICIENT_PERMISSIONS`: Permisos insuficientes

### 4. Interfaz de Usuario
- **Archivo**: `components/BookingDetailModal.tsx`
- **Cambio**: Agregado estado y visualización de errores de eliminación
- El error se muestra en un banner rojo en la parte inferior del modal

## Políticas RLS Aplicadas

La política de eliminación en la base de datos es:

```sql
CREATE POLICY "Solo admins pueden eliminar reservas"
  ON bookings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );
```

## Cómo Verificar que Funciona

### 1. Verificar Usuario Admin
Ejecuta en la consola SQL de Supabase:

```sql
SELECT id, email, role, is_active
FROM user_profiles
WHERE email = 'tu-email-de-admin@ejemplo.com';
```

El resultado debe mostrar:
- `role = 'admin'`
- `is_active = true`

### 2. Verificar la Política RLS
```sql
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'bookings' AND cmd = 'DELETE';
```

Debe aparecer la política "Solo admins pueden eliminar reservas".

### 3. Probar la Eliminación
1. Inicia sesión como admin en el dashboard
2. Abre cualquier reserva (incluidas las canceladas)
3. Haz clic en el botón "Eliminar Reserva" (icono de basura)
4. Confirma en los dos diálogos de confirmación
5. La reserva debe eliminarse y desaparecer de la lista

### 4. Verificar el Historial
Después de eliminar una reserva, verifica que se guardó en el historial:

```sql
SELECT * FROM booking_history
WHERE action_type = 'deleted'
ORDER BY created_at DESC
LIMIT 5;
```

## Solución de Problemas

### Error: "No tienes permisos suficientes"
**Causa**: Tu usuario no tiene el rol 'admin' o no está activo.

**Solución**:
```sql
-- Verificar tu usuario
SELECT * FROM auth.users WHERE email = 'tu-email@ejemplo.com';

-- Si existe en auth.users pero no en user_profiles, crear el perfil
INSERT INTO user_profiles (id, email, role, is_active)
VALUES (
  'id-del-usuario-de-auth-users',
  'tu-email@ejemplo.com',
  'admin',
  true
);

-- Si ya existe pero no es admin, actualizar
UPDATE user_profiles
SET role = 'admin', is_active = true
WHERE email = 'tu-email@ejemplo.com';
```

### Error: "Debes estar autenticado"
**Causa**: La sesión expiró o no se guardó correctamente.

**Solución**:
1. Cierra sesión
2. Limpia las cookies del navegador
3. Inicia sesión nuevamente

### Error: "No se pudo eliminar la reserva"
**Causa**: Error genérico de base de datos.

**Solución**:
1. Verifica los logs de la consola del navegador (F12)
2. Verifica que las migraciones se hayan aplicado correctamente
3. Revisa el trigger de booking_history

## Diferencia con el Sistema Anterior

### Antes
- Política RLS usaba `USING (true)` - cualquiera podía eliminar
- No había verificación de autenticación en el código
- Errores genéricos sin información específica

### Ahora
- Solo usuarios con rol 'admin' y activos pueden eliminar
- Verificación de autenticación antes de intentar eliminar
- Mensajes de error claros y específicos
- El historial se preserva correctamente antes de la eliminación

## Mantenimiento de la Base de Datos

Para mantener la base de datos limpia, ahora puedes:
1. Eliminar reservas canceladas antiguas periódicamente
2. El historial se mantiene para auditoría
3. Las relaciones en cascada eliminan datos relacionados (notas, comunicaciones)

## Comandos Útiles

```sql
-- Ver todas las reservas canceladas
SELECT id, payer_name, departure_date, status, created_at
FROM bookings
WHERE status = 'cancelled'
ORDER BY created_at DESC;

-- Contar reservas por estado
SELECT status, COUNT(*)
FROM bookings
GROUP BY status;

-- Ver últimas eliminaciones
SELECT bh.*, b.payer_name
FROM booking_history bh
LEFT JOIN bookings b ON bh.booking_id = b.id
WHERE bh.action_type = 'deleted'
ORDER BY bh.created_at DESC
LIMIT 10;
```
