/*
  # Agregar número de WhatsApp a configuración de precios

  ## Resumen
  Esta migración añade la capacidad de gestionar el número de WhatsApp
  para confirmaciones de reservas desde el panel de administración.

  ## 1. Cambios en Tablas Existentes
  
  ### `pricing_config`
  - Se agrega columna `whatsapp_number` (text) - Número de WhatsApp para confirmaciones
    - Valor por defecto: '573184131391' (número actual del sistema)
    - NOT NULL para garantizar que siempre haya un número configurado

  ## 2. Seguridad
  - No se modifican políticas RLS existentes
  - El campo hereda los permisos de la tabla pricing_config

  ## 3. Notas Importantes
  - El número debe incluir código de país sin símbolos (+, -, espacios)
  - Formato esperado: código de país + número (ej: 573184131391)
  - Los cambios en este campo quedarán registrados en pricing_history
*/

-- Agregar columna whatsapp_number a la tabla pricing_config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pricing_config' AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE pricing_config 
    ADD COLUMN whatsapp_number text NOT NULL DEFAULT '573184131391';
  END IF;
END $$;

-- Crear índice para optimizar consultas del número de WhatsApp
CREATE INDEX IF NOT EXISTS idx_pricing_config_whatsapp 
  ON pricing_config(whatsapp_number);

-- Comentario descriptivo en la columna
COMMENT ON COLUMN pricing_config.whatsapp_number IS 
  'Número de WhatsApp para confirmaciones de reservas. Formato: código de país + número sin símbolos (ej: 573184131391)';
