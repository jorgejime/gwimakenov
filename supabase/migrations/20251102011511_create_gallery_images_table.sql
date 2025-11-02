/*
  # Crear tabla de imágenes de galería

  1. Nueva Tabla
    - `gallery_images`
      - `id` (uuid, primary key) - Identificador único
      - `url` (text, not null) - URL de la imagen
      - `title` (text, not null) - Título/descripción de la imagen
      - `alt_text` (text, not null) - Texto alternativo para accesibilidad
      - `caption` (text, not null) - Texto que aparece al hacer hover
      - `likes` (integer, default 0) - Número de likes simulados
      - `comments` (integer, default 0) - Número de comentarios simulados
      - `order_position` (integer, not null) - Orden de aparición (1-6)
      - `is_active` (boolean, default true) - Si está visible o no
      - `created_at` (timestamptz) - Fecha de creación
      - `updated_at` (timestamptz) - Fecha de última actualización

  2. Seguridad
    - Habilitar RLS en `gallery_images`
    - Política para lectura pública (cualquiera puede ver imágenes activas)
    - Política para administradores (pueden crear, actualizar, eliminar)

  3. Datos Iniciales
    - Insertar las 6 imágenes actuales de la galería con sus datos
*/

-- Crear tabla de imágenes de galería
CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  title text NOT NULL,
  alt_text text NOT NULL,
  caption text NOT NULL,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  order_position integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública (solo imágenes activas)
CREATE POLICY "Anyone can view active gallery images"
  ON gallery_images
  FOR SELECT
  USING (is_active = true);

-- Política para que administradores puedan ver todas las imágenes
CREATE POLICY "Admins can view all gallery images"
  ON gallery_images
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para crear imágenes (solo autenticados)
CREATE POLICY "Authenticated users can insert gallery images"
  ON gallery_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para actualizar imágenes (solo autenticados)
CREATE POLICY "Authenticated users can update gallery images"
  ON gallery_images
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para eliminar imágenes (solo autenticados)
CREATE POLICY "Authenticated users can delete gallery images"
  ON gallery_images
  FOR DELETE
  TO authenticated
  USING (true);

-- Insertar las imágenes actuales de la galería
INSERT INTO gallery_images (url, title, alt_text, caption, likes, comments, order_position, is_active) VALUES
  ('https://i.ibb.co/BVgWnYbz/imgi-11-510977674-18073508762497491-8712212144693316187-n.jpg', 'Río cristalino', 'Río con agua cristalina en la Sierra Nevada', 'El agua sagrada que limpia y purifica nuestro espíritu. Un regalo de la madre tierra.', 120, 15, 1, true),
  ('https://i.ibb.co/357M7c0H/imgi-13-471863200-1123279195865002-7505376879281847661-n.jpg', 'Tejido ancestral', 'Mujer Arhuaca tejiendo una mochila', 'Tejiendo pensamientos, tejiendo vida. El arte de la mochila Arhuaca.', 256, 23, 2, true),
  ('https://i.ibb.co/j9j9ZLz3/imgi-6-461288196-838543938477413-4359253168510007997-n.jpg', 'Niños de la comunidad', 'Niños de la comunidad sonriendo', 'La alegría y el futuro de nuestra comunidad en una sonrisa.', 310, 45, 3, true),
  ('https://i.ibb.co/PGngLp2S/imgi-32-469199706-18055644730822217-8566621187428463397-n.jpg', 'Mamo Arhuaco', 'Un Mamo Arhuaco en la naturaleza', 'La sabiduría de nuestros mayores es la guía de nuestro camino.', 189, 12, 4, true),
  ('https://i.ibb.co/4wkhhG2s/imgi-25-503980544-1025310469713770-8097250938206860100-n.jpg', 'Cultivos tradicionales', 'Cultivos tradicionales en la montaña', 'La tierra nos da el sustento, nosotros le devolvemos nuestro cuidado.', 145, 8, 5, true),
  ('https://i.ibb.co/HD0b6pdy/imgi-18-503829183-723803386746242-373303711569613251-n.jpg', 'Cascada sagrada', 'Cascada en la Sierra Nevada', 'El agua sagrada que limpia y purifica nuestro espíritu. Un regalo de la madre tierra.', 212, 19, 6, true);
