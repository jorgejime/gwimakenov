/*
  # Permitir Acceso Anónimo para Crear Reservas

  ## Problema
  Las políticas RLS actuales no permiten que usuarios no autenticados (anon)
  creen reservas, causando que las reservas públicas fallen.

  ## Solución
  Actualizar la política de INSERT en bookings para permitir acceso al rol
  'anon' (usuarios no autenticados), permitiendo que cualquiera pueda crear
  una reserva desde la web pública.

  ## Cambios
  1. Eliminar la política restrictiva actual de INSERT
  2. Crear nueva política que permita INSERT tanto a anon como a authenticated
*/

-- Eliminar la política restrictiva actual
DROP POLICY IF EXISTS "Creación pública de reservas" ON bookings;

-- Crear política que permita a usuarios anónimos crear reservas
CREATE POLICY "Cualquiera puede crear reservas"
  ON bookings FOR INSERT
  TO public
  WITH CHECK (true);
