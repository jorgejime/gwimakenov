/*
  # Corrección del Trigger de Eliminación de Reservas

  ## Resumen
  Esta migración corrige el problema que impedía eliminar reservas correctamente.
  El trigger log_booking_change no manejaba apropiadamente las operaciones DELETE.

  ## Cambios Realizados
  
  1. **Corrección de la función log_booking_change**:
     - Ahora retorna OLD para operaciones DELETE en lugar de NEW
     - El historial se guarda antes de que la reserva sea eliminada
     - Se asegura que la referencia booking_id sea válida
  
  2. **Seguridad**:
     - El historial de eliminación se preserva correctamente
     - Las operaciones de cascada funcionan sin conflictos
     - Se mantiene la auditoría completa de todas las eliminaciones

  ## Notas Importantes
  - Esta corrección permite eliminar reservas físicamente de la base de datos
  - El historial de la reserva eliminada se mantiene en booking_history
  - Las tablas relacionadas (communication_log, booking_notes) se eliminan en cascada
*/

-- Reemplazar la función de logging con una versión corregida
CREATE OR REPLACE FUNCTION log_booking_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO booking_history (booking_id, action_type, new_value, changed_by, notes)
    VALUES (NEW.id, 'created', to_jsonb(NEW), NEW.modified_by, 'Reserva creada');
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO booking_history (booking_id, action_type, old_value, new_value, changed_by, notes)
      VALUES (NEW.id, 'status_changed', jsonb_build_object('status', OLD.status), jsonb_build_object('status', NEW.status), NEW.modified_by, 'Estado actualizado');
    ELSE
      INSERT INTO booking_history (booking_id, action_type, old_value, new_value, changed_by, notes)
      VALUES (NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW), NEW.modified_by, 'Reserva actualizada');
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Para DELETE, insertamos el historial ANTES de que la fila sea eliminada
    -- y retornamos OLD en lugar de NEW
    INSERT INTO booking_history (booking_id, action_type, old_value, changed_by, notes)
    VALUES (OLD.id, 'deleted', to_jsonb(OLD), OLD.modified_by, 'Reserva eliminada');
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger usando BEFORE en lugar de AFTER para asegurar 
-- que el historial se guarde antes de la eliminación
DROP TRIGGER IF EXISTS log_booking_changes ON bookings;
CREATE TRIGGER log_booking_changes
  BEFORE INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_change();

-- Comentarios para documentar el comportamiento
COMMENT ON FUNCTION log_booking_change() IS 
'Función de trigger que registra automáticamente todos los cambios en reservas. 
Para DELETE, retorna OLD y se ejecuta BEFORE para preservar el historial.';

COMMENT ON TRIGGER log_booking_changes ON bookings IS
'Trigger que guarda automáticamente el historial de cambios en booking_history.
Se ejecuta BEFORE DELETE para asegurar que el historial se guarde correctamente.';