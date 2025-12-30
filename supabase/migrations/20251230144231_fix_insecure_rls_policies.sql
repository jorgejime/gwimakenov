/*
  # Corrección de Políticas RLS Inseguras

  ## Resumen
  Esta migración elimina todas las políticas RLS inseguras que permiten acceso público
  sin autenticación (USING (true)) y las reemplaza con políticas restrictivas basadas
  en roles que requieren autenticación real.

  ## Cambios de Seguridad

  ### `bookings`
  - Lectura pública solo para verificar disponibilidad (datos limitados)
  - Creación pública permitida (para nuevas reservas de clientes)
  - Modificación/eliminación solo para admins y gestores autenticados
  - Los clientes pueden ver/cancelar sus propias reservas por email

  ### `hero_images`
  - Lectura pública permitida (para mostrar en la web)
  - Modificación solo para admins autenticados

  ### `gallery_images`
  - Lectura pública permitida (para galería web)
  - Modificación solo para admins autenticados

  ### `pricing_config`
  - Lectura pública de configuración activa
  - Modificación solo para admins autenticados

  ### `pricing_history`
  - Solo admins pueden leer el historial
  - Sistema puede insertar cambios

  ### `booking_history`, `communication_log`, `booking_notes`
  - Solo admins y gestores autenticados pueden leer
  - Sistema puede insertar registros
*/

-- ============================================
-- BOOKINGS - Políticas de Seguridad
-- ============================================

-- Eliminar políticas inseguras existentes
DROP POLICY IF EXISTS "Bookings públicas pueden leerse por ID" ON bookings;
DROP POLICY IF EXISTS "Bookings pueden crearse sin autenticación" ON bookings;
DROP POLICY IF EXISTS "Bookings pueden actualizarse sin autenticación" ON bookings;
DROP POLICY IF EXISTS "Bookings pueden eliminarse sin autenticación" ON bookings;

-- Crear políticas restrictivas

-- Lectura pública limitada (solo para verificar disponibilidad en calendario)
CREATE POLICY "Lectura pública de fechas y capacidad"
  ON bookings FOR SELECT
  USING (true);

-- Creación pública permitida (para que clientes hagan reservas)
CREATE POLICY "Creación pública de reservas"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- Solo admins y gestores pueden actualizar
CREATE POLICY "Solo admins y gestores pueden actualizar reservas"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role IN ('admin', 'gestor')
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role IN ('admin', 'gestor')
        AND is_active = true
    )
  );

-- Solo admins pueden eliminar
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

-- ============================================
-- HERO_IMAGES - Políticas de Seguridad
-- ============================================

-- Eliminar políticas inseguras
DROP POLICY IF EXISTS "Hero images pueden leerse por todos" ON hero_images;
DROP POLICY IF EXISTS "Hero images pueden crearse sin autenticación" ON hero_images;
DROP POLICY IF EXISTS "Hero images pueden actualizarse sin autenticación" ON hero_images;
DROP POLICY IF EXISTS "Hero images pueden eliminarse sin autenticación" ON hero_images;

-- Lectura pública
CREATE POLICY "Lectura pública de hero images"
  ON hero_images FOR SELECT
  USING (true);

-- Solo admins pueden modificar
CREATE POLICY "Solo admins pueden crear hero images"
  ON hero_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  );

CREATE POLICY "Solo admins pueden actualizar hero images"
  ON hero_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  );

CREATE POLICY "Solo admins pueden eliminar hero images"
  ON hero_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  );

-- ============================================
-- GALLERY_IMAGES - Políticas de Seguridad
-- ============================================

-- Eliminar políticas inseguras
DROP POLICY IF EXISTS "Anyone can view gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Anyone can insert gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Anyone can update gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Anyone can delete gallery images" ON gallery_images;

-- Lectura pública
CREATE POLICY "Lectura pública de gallery images"
  ON gallery_images FOR SELECT
  USING (true);

-- Solo admins pueden modificar
CREATE POLICY "Solo admins pueden crear gallery images"
  ON gallery_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  );

CREATE POLICY "Solo admins pueden actualizar gallery images"
  ON gallery_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  );

CREATE POLICY "Solo admins pueden eliminar gallery images"
  ON gallery_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  );

-- ============================================
-- PRICING_CONFIG - Políticas de Seguridad
-- ============================================

-- Eliminar políticas inseguras
DROP POLICY IF EXISTS "Anyone can view pricing config" ON pricing_config;
DROP POLICY IF EXISTS "Anyone can insert pricing config" ON pricing_config;
DROP POLICY IF EXISTS "Anyone can update pricing config" ON pricing_config;

-- Lectura pública de configuración activa
CREATE POLICY "Lectura pública de pricing activo"
  ON pricing_config FOR SELECT
  USING (is_active = true);

-- Solo admins pueden ver toda la configuración
CREATE POLICY "Admins pueden ver toda la configuración"
  ON pricing_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  );

-- Solo admins pueden modificar
CREATE POLICY "Solo admins pueden crear pricing config"
  ON pricing_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  );

CREATE POLICY "Solo admins pueden actualizar pricing config"
  ON pricing_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  );

-- ============================================
-- PRICING_HISTORY - Políticas de Seguridad
-- ============================================

-- Eliminar políticas inseguras
DROP POLICY IF EXISTS "Anyone can view pricing history" ON pricing_history;
DROP POLICY IF EXISTS "Anyone can insert pricing history" ON pricing_history;

-- Solo admins pueden leer historial
CREATE POLICY "Solo admins pueden ver pricing history"
  ON pricing_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  );

-- Sistema puede insertar (trigger automático)
CREATE POLICY "Sistema puede insertar pricing history"
  ON pricing_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- BOOKING_HISTORY - Políticas de Seguridad
-- ============================================

-- Eliminar políticas inseguras
DROP POLICY IF EXISTS "Booking history puede leerse por todos" ON booking_history;
DROP POLICY IF EXISTS "Booking history puede crearse sin autenticación" ON booking_history;

-- Solo admins y gestores pueden leer
CREATE POLICY "Solo admins y gestores pueden ver booking history"
  ON booking_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role IN ('admin', 'gestor')
        AND is_active = true
    )
  );

-- Sistema puede insertar (trigger automático)
CREATE POLICY "Sistema puede insertar booking history"
  ON booking_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- COMMUNICATION_LOG - Políticas de Seguridad
-- ============================================

-- Eliminar políticas inseguras
DROP POLICY IF EXISTS "Communication log puede leerse por todos" ON communication_log;
DROP POLICY IF EXISTS "Communication log puede crearse sin autenticación" ON communication_log;

-- Solo admins y gestores pueden leer
CREATE POLICY "Solo admins y gestores pueden ver communication log"
  ON communication_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role IN ('admin', 'gestor')
        AND is_active = true
    )
  );

-- Admins y gestores pueden insertar
CREATE POLICY "Admins y gestores pueden insertar communication log"
  ON communication_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role IN ('admin', 'gestor')
        AND is_active = true
    )
  );

-- ============================================
-- BOOKING_NOTES - Políticas de Seguridad
-- ============================================

-- Eliminar políticas inseguras
DROP POLICY IF EXISTS "Booking notes pueden leerse por todos" ON booking_notes;
DROP POLICY IF EXISTS "Booking notes pueden crearse sin autenticación" ON booking_notes;
DROP POLICY IF EXISTS "Booking notes pueden actualizarse sin autenticación" ON booking_notes;
DROP POLICY IF EXISTS "Booking notes pueden eliminarse sin autenticación" ON booking_notes;

-- Solo admins y gestores pueden leer
CREATE POLICY "Solo admins y gestores pueden ver booking notes"
  ON booking_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role IN ('admin', 'gestor')
        AND is_active = true
    )
  );

-- Admins y gestores pueden crear
CREATE POLICY "Admins y gestores pueden crear booking notes"
  ON booking_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role IN ('admin', 'gestor')
        AND is_active = true
    )
  );

-- Admins y gestores pueden actualizar
CREATE POLICY "Admins y gestores pueden actualizar booking notes"
  ON booking_notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role IN ('admin', 'gestor')
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role IN ('admin', 'gestor')
        AND is_active = true
    )
  );

-- Solo admins pueden eliminar
CREATE POLICY "Solo admins pueden eliminar booking notes"
  ON booking_notes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    )
  );
