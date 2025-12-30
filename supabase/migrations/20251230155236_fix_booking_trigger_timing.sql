/*
  # Corregir Timing del Trigger de Booking History

  ## Problema
  El trigger `log_booking_changes` se ejecuta BEFORE INSERT, lo que causa
  una violación de foreign key porque intenta insertar en booking_history
  antes de que la reserva exista en la tabla bookings.

  ## Solución
  Cambiar el trigger para que se ejecute AFTER INSERT en lugar de BEFORE INSERT.

  ## Cambios
  1. Eliminar el trigger existente
  2. Recrear el trigger con timing AFTER para INSERT
*/

-- Eliminar el trigger existente
DROP TRIGGER IF EXISTS log_booking_changes ON bookings;

-- Recrear el trigger con el timing correcto
CREATE TRIGGER log_booking_changes
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_change();
