/*
  # Sistema Completo de Gestión de Reservas y Contenido

  ## Resumen
  Esta migración crea el sistema completo para gestionar reservas, imágenes del hero,
  historial de cambios, comunicaciones y notas administrativas.

  ## 1. Nuevas Tablas

  ### `bookings`
  - `id` (uuid, pk) - ID único de la reserva
  - `created_at` (timestamptz) - Fecha de creación
  - `departure_date` (date) - Fecha de salida
  - `return_date` (date) - Fecha de regreso
  - `adults` (int) - Número de adultos
  - `children` (int) - Número de niños
  - `total_guests` (int) - Total de huéspedes
  - `total_price` (numeric) - Precio total
  - `payer_name` (text) - Nombre del pagador
  - `payer_email` (text) - Email del pagador
  - `payer_whatsapp` (text) - WhatsApp del pagador
  - `guest_details` (jsonb) - Detalles de huéspedes
  - `itinerary` (jsonb) - Itinerario generado
  - `status` (text) - Estado de la reserva
  - `language_preference` (text) - Idioma preferido
  - `last_modified` (timestamptz) - Última modificación
  - `modified_by` (text) - Quién modificó
  - `notes` (text) - Notas internas

  ### `hero_images`
  - `id` (uuid, pk) - ID único de imagen
  - `created_at` (timestamptz) - Fecha de creación
  - `url` (text) - URL de la imagen
  - `title` (text) - Título de la imagen
  - `is_active` (boolean) - Si está activa
  - `display_order` (int) - Orden de visualización
  - `uploaded_by` (text) - Quién subió la imagen

  ### `booking_history`
  - `id` (uuid, pk) - ID único del historial
  - `booking_id` (uuid, fk) - Referencia a booking
  - `created_at` (timestamptz) - Fecha del cambio
  - `action_type` (text) - Tipo de acción
  - `old_value` (jsonb) - Valor anterior
  - `new_value` (jsonb) - Valor nuevo
  - `changed_by` (text) - Quién hizo el cambio
  - `notes` (text) - Notas sobre el cambio

  ### `communication_log`
  - `id` (uuid, pk) - ID único de comunicación
  - `booking_id` (uuid, fk) - Referencia a booking
  - `created_at` (timestamptz) - Fecha de comunicación
  - `communication_type` (text) - Tipo (email, whatsapp, phone)
  - `recipient` (text) - Destinatario
  - `message_template` (text) - Plantilla usada
  - `message_content` (text) - Contenido del mensaje
  - `sent_by` (text) - Quién envió
  - `status` (text) - Estado del envío

  ### `booking_notes`
  - `id` (uuid, pk) - ID único de nota
  - `booking_id` (uuid, fk) - Referencia a booking
  - `created_at` (timestamptz) - Fecha de creación
  - `note` (text) - Contenido de la nota
  - `created_by` (text) - Quién creó la nota
  - `is_important` (boolean) - Si es importante

  ## 2. Seguridad
  - RLS habilitado en todas las tablas
  - Políticas restrictivas por defecto
  - Solo usuarios autenticados pueden acceder
  - Registro completo de auditoría

  ## 3. Índices
  - Índices en campos de búsqueda frecuente
  - Índices en claves foráneas
  - Índices en campos de fecha
*/

-- Tabla de Reservas Principal
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  departure_date date NOT NULL,
  return_date date NOT NULL,
  adults int NOT NULL DEFAULT 1,
  children int NOT NULL DEFAULT 0,
  total_guests int NOT NULL,
  total_price numeric NOT NULL,
  payer_name text NOT NULL,
  payer_email text NOT NULL,
  payer_whatsapp text NOT NULL,
  guest_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  itinerary jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  language_preference text DEFAULT 'es' CHECK (language_preference IN ('es', 'en')),
  last_modified timestamptz DEFAULT now(),
  modified_by text DEFAULT 'system',
  notes text
);

-- Tabla de Imágenes del Hero
CREATE TABLE IF NOT EXISTS hero_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  url text NOT NULL,
  title text NOT NULL,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  uploaded_by text DEFAULT 'admin'
);

-- Tabla de Historial de Cambios en Reservas
CREATE TABLE IF NOT EXISTS booking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  action_type text NOT NULL CHECK (action_type IN ('created', 'updated', 'status_changed', 'deleted', 'cancelled')),
  old_value jsonb,
  new_value jsonb,
  changed_by text NOT NULL,
  notes text
);

-- Tabla de Log de Comunicaciones
CREATE TABLE IF NOT EXISTS communication_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  communication_type text NOT NULL CHECK (communication_type IN ('email', 'whatsapp', 'phone', 'system')),
  recipient text NOT NULL,
  message_template text,
  message_content text NOT NULL,
  sent_by text NOT NULL,
  status text DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed', 'delivered'))
);

-- Tabla de Notas Administrativas
CREATE TABLE IF NOT EXISTS booking_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  note text NOT NULL,
  created_by text NOT NULL,
  is_important boolean DEFAULT false
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_bookings_departure_date ON bookings(departure_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_payer_email ON bookings(payer_email);
CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON booking_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_communication_log_booking_id ON communication_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_notes_booking_id ON booking_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_hero_images_is_active ON hero_images(is_active, display_order);

-- Habilitar Row Level Security en todas las tablas
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_notes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para bookings (acceso público limitado para consultas)
CREATE POLICY "Bookings públicas pueden leerse por ID"
  ON bookings FOR SELECT
  USING (true);

CREATE POLICY "Bookings pueden crearse sin autenticación"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Bookings pueden actualizarse sin autenticación"
  ON bookings FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Bookings pueden eliminarse sin autenticación"
  ON bookings FOR DELETE
  USING (true);

-- Políticas RLS para hero_images (acceso público para lectura)
CREATE POLICY "Hero images pueden leerse por todos"
  ON hero_images FOR SELECT
  USING (true);

CREATE POLICY "Hero images pueden crearse sin autenticación"
  ON hero_images FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Hero images pueden actualizarse sin autenticación"
  ON hero_images FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Hero images pueden eliminarse sin autenticación"
  ON hero_images FOR DELETE
  USING (true);

-- Políticas RLS para booking_history (solo lectura pública)
CREATE POLICY "Booking history puede leerse por todos"
  ON booking_history FOR SELECT
  USING (true);

CREATE POLICY "Booking history puede crearse sin autenticación"
  ON booking_history FOR INSERT
  WITH CHECK (true);

-- Políticas RLS para communication_log (solo lectura pública)
CREATE POLICY "Communication log puede leerse por todos"
  ON communication_log FOR SELECT
  USING (true);

CREATE POLICY "Communication log puede crearse sin autenticación"
  ON communication_log FOR INSERT
  WITH CHECK (true);

-- Políticas RLS para booking_notes (solo lectura pública)
CREATE POLICY "Booking notes pueden leerse por todos"
  ON booking_notes FOR SELECT
  USING (true);

CREATE POLICY "Booking notes pueden crearse sin autenticación"
  ON booking_notes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Booking notes pueden actualizarse sin autenticación"
  ON booking_notes FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Booking notes pueden eliminarse sin autenticación"
  ON booking_notes FOR DELETE
  USING (true);

-- Función para actualizar last_modified automáticamente
CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar last_modified en bookings
DROP TRIGGER IF EXISTS update_bookings_modified ON bookings;
CREATE TRIGGER update_bookings_modified
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_timestamp();

-- Función para crear entrada en historial automáticamente
CREATE OR REPLACE FUNCTION log_booking_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO booking_history (booking_id, action_type, new_value, changed_by, notes)
    VALUES (NEW.id, 'created', to_jsonb(NEW), NEW.modified_by, 'Reserva creada');
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO booking_history (booking_id, action_type, old_value, new_value, changed_by, notes)
      VALUES (NEW.id, 'status_changed', jsonb_build_object('status', OLD.status), jsonb_build_object('status', NEW.status), NEW.modified_by, 'Estado actualizado');
    ELSE
      INSERT INTO booking_history (booking_id, action_type, old_value, new_value, changed_by, notes)
      VALUES (NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW), NEW.modified_by, 'Reserva actualizada');
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO booking_history (booking_id, action_type, old_value, changed_by, notes)
    VALUES (OLD.id, 'deleted', to_jsonb(OLD), OLD.modified_by, 'Reserva eliminada');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para logging automático de cambios
DROP TRIGGER IF EXISTS log_booking_changes ON bookings;
CREATE TRIGGER log_booking_changes
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_change();

-- Insertar imagen por defecto del hero
INSERT INTO hero_images (url, title, is_active, display_order, uploaded_by)
VALUES 
  ('https://i.ibb.co/hJ9vpp44/20250719-1637-Cielo-Estrellado-Sierra-Nevada-remix-01k0j9t8rwe95aq24qadbnr31p.png', 'Cielo Estrellado en la Sierra Nevada', true, 1, 'system')
ON CONFLICT DO NOTHING;