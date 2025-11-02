/*
  # Sistema de Gestión de Precios Configurables

  ## Resumen
  Esta migración crea el sistema para gestionar precios de reservas de forma dinámica
  desde el panel de administración. Los administradores podrán modificar todos los
  componentes del precio (alojamiento, transporte, seguro, etc.) y el sistema
  mantendrá un historial completo de cambios para auditoría.

  ## 1. Nueva Tabla: `pricing_config`
  Almacena la configuración actual de precios del sistema:
    - `id` (uuid, pk) - ID único
    - `created_at` (timestamptz) - Fecha de creación
    - `price_per_night` (numeric) - Precio por noche por persona (COP)
    - `service_fee` (numeric) - Tarifa de servicio (COP)
    - `transport_cost_adult` (numeric) - Costo transporte adulto (COP)
    - `transport_cost_child` (numeric) - Costo transporte niño (COP)
    - `insurance_cost_person` (numeric) - Costo seguro por persona (COP)
    - `max_capacity` (int) - Capacidad máxima de visitantes
    - `is_active` (boolean) - Si esta configuración está activa
    - `updated_at` (timestamptz) - Última actualización
    - `updated_by` (text) - Usuario que actualizó

  ## 2. Nueva Tabla: `pricing_history`
  Mantiene el historial de cambios de precios:
    - `id` (uuid, pk) - ID único
    - `pricing_config_id` (uuid, fk) - Referencia a pricing_config
    - `created_at` (timestamptz) - Fecha del cambio
    - `field_name` (text) - Campo que cambió
    - `old_value` (numeric) - Valor anterior
    - `new_value` (numeric) - Valor nuevo
    - `changed_by` (text) - Usuario que hizo el cambio
    - `notes` (text) - Notas sobre el cambio

  ## 3. Seguridad
  - RLS habilitado en ambas tablas
  - Lectura pública permitida (necesario para cálculos de reservas)
  - Escritura solo sin autenticación (para compatibilidad con sistema actual)
  - Historial completo de auditoría de cambios

  ## 4. Valores por Defecto
  - Se insertan los valores actuales del sistema como configuración inicial
  - Basados en constants.tsx del proyecto
*/

-- Tabla de Configuración de Precios
CREATE TABLE IF NOT EXISTS pricing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  price_per_night numeric NOT NULL DEFAULT 250000,
  service_fee numeric NOT NULL DEFAULT 50000,
  transport_cost_adult numeric NOT NULL DEFAULT 90000,
  transport_cost_child numeric NOT NULL DEFAULT 70000,
  insurance_cost_person numeric NOT NULL DEFAULT 12000,
  max_capacity int NOT NULL DEFAULT 20,
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by text DEFAULT 'system',
  CONSTRAINT price_per_night_positive CHECK (price_per_night > 0),
  CONSTRAINT service_fee_positive CHECK (service_fee >= 0),
  CONSTRAINT transport_adult_positive CHECK (transport_cost_adult >= 0),
  CONSTRAINT transport_child_positive CHECK (transport_cost_child >= 0),
  CONSTRAINT insurance_positive CHECK (insurance_cost_person >= 0),
  CONSTRAINT max_capacity_positive CHECK (max_capacity > 0)
);

-- Tabla de Historial de Cambios de Precios
CREATE TABLE IF NOT EXISTS pricing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_config_id uuid REFERENCES pricing_config(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  field_name text NOT NULL,
  old_value numeric,
  new_value numeric NOT NULL,
  changed_by text NOT NULL DEFAULT 'admin',
  notes text
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_pricing_config_is_active ON pricing_config(is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_history_config_id ON pricing_history(pricing_config_id, created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pricing_config (lectura pública, escritura sin autenticación)
CREATE POLICY "Pricing config puede leerse por todos"
  ON pricing_config FOR SELECT
  USING (true);

CREATE POLICY "Pricing config puede crearse sin autenticación"
  ON pricing_config FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Pricing config puede actualizarse sin autenticación"
  ON pricing_config FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Pricing config puede eliminarse sin autenticación"
  ON pricing_config FOR DELETE
  USING (true);

-- Políticas RLS para pricing_history (lectura pública, escritura sin autenticación)
CREATE POLICY "Pricing history puede leerse por todos"
  ON pricing_history FOR SELECT
  USING (true);

CREATE POLICY "Pricing history puede crearse sin autenticación"
  ON pricing_history FOR INSERT
  WITH CHECK (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_pricing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en pricing_config
DROP TRIGGER IF EXISTS update_pricing_config_timestamp ON pricing_config;
CREATE TRIGGER update_pricing_config_timestamp
  BEFORE UPDATE ON pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_timestamp();

-- Función para registrar cambios en historial automáticamente
CREATE OR REPLACE FUNCTION log_pricing_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Registrar cambio de price_per_night
    IF OLD.price_per_night != NEW.price_per_night THEN
      INSERT INTO pricing_history (pricing_config_id, field_name, old_value, new_value, changed_by, notes)
      VALUES (NEW.id, 'price_per_night', OLD.price_per_night, NEW.price_per_night, NEW.updated_by, 'Precio por noche actualizado');
    END IF;
    
    -- Registrar cambio de service_fee
    IF OLD.service_fee != NEW.service_fee THEN
      INSERT INTO pricing_history (pricing_config_id, field_name, old_value, new_value, changed_by, notes)
      VALUES (NEW.id, 'service_fee', OLD.service_fee, NEW.service_fee, NEW.updated_by, 'Tarifa de servicio actualizada');
    END IF;
    
    -- Registrar cambio de transport_cost_adult
    IF OLD.transport_cost_adult != NEW.transport_cost_adult THEN
      INSERT INTO pricing_history (pricing_config_id, field_name, old_value, new_value, changed_by, notes)
      VALUES (NEW.id, 'transport_cost_adult', OLD.transport_cost_adult, NEW.transport_cost_adult, NEW.updated_by, 'Costo transporte adulto actualizado');
    END IF;
    
    -- Registrar cambio de transport_cost_child
    IF OLD.transport_cost_child != NEW.transport_cost_child THEN
      INSERT INTO pricing_history (pricing_config_id, field_name, old_value, new_value, changed_by, notes)
      VALUES (NEW.id, 'transport_cost_child', OLD.transport_cost_child, NEW.transport_cost_child, NEW.updated_by, 'Costo transporte niño actualizado');
    END IF;
    
    -- Registrar cambio de insurance_cost_person
    IF OLD.insurance_cost_person != NEW.insurance_cost_person THEN
      INSERT INTO pricing_history (pricing_config_id, field_name, old_value, new_value, changed_by, notes)
      VALUES (NEW.id, 'insurance_cost_person', OLD.insurance_cost_person, NEW.insurance_cost_person, NEW.updated_by, 'Costo seguro actualizado');
    END IF;
    
    -- Registrar cambio de max_capacity
    IF OLD.max_capacity != NEW.max_capacity THEN
      INSERT INTO pricing_history (pricing_config_id, field_name, old_value, new_value, changed_by, notes)
      VALUES (NEW.id, 'max_capacity', OLD.max_capacity, NEW.max_capacity, NEW.updated_by, 'Capacidad máxima actualizada');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para logging automático de cambios de precios
DROP TRIGGER IF EXISTS log_pricing_changes ON pricing_config;
CREATE TRIGGER log_pricing_changes
  AFTER UPDATE ON pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION log_pricing_change();

-- Insertar configuración inicial de precios (valores actuales del sistema)
INSERT INTO pricing_config (
  price_per_night,
  service_fee,
  transport_cost_adult,
  transport_cost_child,
  insurance_cost_person,
  max_capacity,
  is_active,
  updated_by
)
VALUES (
  250000,  -- PRICE_PER_NIGHT
  50000,   -- SERVICE_FEE
  90000,   -- TRANSPORT_COST_ADULT
  70000,   -- TRANSPORT_COST_CHILD
  12000,   -- INSURANCE_COST_PERSON
  20,      -- MAX_CAPACITY
  true,
  'system'
)
ON CONFLICT DO NOTHING;
