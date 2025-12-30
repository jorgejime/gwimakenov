/*
  # Corregir Seguridad del Trigger de Booking History

  ## Problema
  La función `log_booking_change()` se ejecuta en el contexto del usuario que hace
  la operación (usuario anónimo), pero intenta insertar en `booking_history` que
  tiene RLS activado. Esto causa un error "new row violates row-level security policy".

  ## Solución
  Cambiar la función para que se ejecute con privilegios de SECURITY DEFINER,
  lo que significa que se ejecutará con los privilegios del propietario de la función
  (postgres/superuser) en lugar del usuario que invoca el trigger.

  ## Cambios
  1. Recrear la función con SECURITY DEFINER
*/

-- Recrear la función con SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.log_booking_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    INSERT INTO booking_history (booking_id, action_type, old_value, changed_by, notes)
    VALUES (OLD.id, 'deleted', to_jsonb(OLD), OLD.modified_by, 'Reserva eliminada');
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;
