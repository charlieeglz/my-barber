-- ==========================================
-- SCRIPT DE SEGURIDAD: POLÍTICAS RLS SUPABASE
-- Ejecuta este script en el editor SQL de tu panel de Supabase.
-- ==========================================

-- Habilitar Row Level Security (RLS) en todas las tablas
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 1. POLÍTICAS PARA LA TABLA 'barbershops' (Barberías)
-- ==========================================

-- Permitir lectura pública de las barberías (para que los clientes exploren)
CREATE POLICY "Permitir lectura pública de barberías" 
ON barbershops FOR SELECT 
USING (true);

-- Permitir a los dueños crear su propio perfil de barbería
CREATE POLICY "Permitir creación de barbería a usuarios autenticados" 
ON barbershops FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Permitir a los dueños actualizar sus propios datos de barbería
CREATE POLICY "Permitir actualización de barbería al dueño" 
ON barbershops FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir a los dueños eliminar su perfil de barbería
CREATE POLICY "Permitir eliminación de barbería al dueño" 
ON barbershops FOR DELETE 
USING (auth.uid() = user_id);


-- ==========================================
-- 2. POLÍTICAS PARA LA TABLA 'staff' (Equipo de Barberos)
-- ==========================================

-- Permitir lectura pública del equipo de barberos
CREATE POLICY "Permitir lectura pública de staff" 
ON staff FOR SELECT 
USING (true);

-- Permitir insertar miembros del equipo si el usuario es el dueño de la barbería
CREATE POLICY "Permitir inserción de staff al dueño" 
ON staff FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM barbershops 
    WHERE id = staff.barbershop_id AND user_id = auth.uid()
  )
);

-- Permitir actualizar miembros del equipo si el usuario es el dueño de la barbería
CREATE POLICY "Permitir actualización de staff al dueño" 
ON staff FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM barbershops 
    WHERE id = staff.barbershop_id AND user_id = auth.uid()
  )
);

-- Permitir eliminar miembros del equipo si el usuario es el dueño de la barbería
CREATE POLICY "Permitir eliminación de staff al dueño" 
ON staff FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM barbershops 
    WHERE id = staff.barbershop_id AND user_id = auth.uid()
  )
);


-- ==========================================
-- 3. POLÍTICAS PARA LA TABLA 'appointments' (Citas)
-- ==========================================

-- Permitir a clientes e integrantes del staff leer sus citas correspondientes
CREATE POLICY "Permitir lectura de citas a involucrados" 
ON appointments FOR SELECT 
USING (
  client_id = auth.uid() -- El cliente autenticado
  OR EXISTS (
    -- El barbero asignado a la cita
    SELECT 1 FROM staff 
    WHERE id = appointments.staff_id AND user_id = auth.uid()
  )
  OR EXISTS (
    -- El dueño de la barbería donde se programó la cita
    SELECT 1 FROM barbershops 
    WHERE id = appointments.barber_id AND user_id = auth.uid()
  )
);

-- Permitir a clientes e integrantes del staff crear citas
CREATE POLICY "Permitir creación de citas a clientes" 
ON appointments FOR INSERT 
WITH CHECK (
  auth.uid() = client_id -- Asegura que la cita se cree a nombre del cliente autenticado
  OR EXISTS (
    -- Permite que el dueño o staff cree citas manualmente
    SELECT 1 FROM barbershops 
    WHERE id = appointments.barber_id AND user_id = auth.uid()
  )
);

-- Permitir actualización de citas (ej: cambiar estado)
CREATE POLICY "Permitir actualización de citas a involucrados" 
ON appointments FOR UPDATE 
USING (
  client_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM staff 
    WHERE id = appointments.staff_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM barbershops 
    WHERE id = appointments.barber_id AND user_id = auth.uid()
  )
);

-- Permitir cancelación/eliminación de citas
CREATE POLICY "Permitir cancelación de citas a involucrados" 
ON appointments FOR DELETE 
USING (
  client_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM barbershops 
    WHERE id = appointments.barber_id AND user_id = auth.uid()
  )
);


-- ==========================================
-- 4. POLÍTICAS PARA LA TABLA 'portfolio_photos' (Fotos)
-- ==========================================

-- Permitir lectura pública de las fotos del portfolio
CREATE POLICY "Permitir lectura pública de fotos" 
ON portfolio_photos FOR SELECT 
USING (true);

-- Permitir subir fotos si pertenece a la barbería asociada
CREATE POLICY "Permitir subida de fotos al dueño o staff" 
ON portfolio_photos FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM barbershops 
    WHERE id = portfolio_photos.barber_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM staff 
    WHERE id = portfolio_photos.staff_id AND user_id = auth.uid()
  )
);

-- Permitir actualización de visibilidad de fotos (is_visible)
CREATE POLICY "Permitir actualización de fotos al dueño o staff"
ON portfolio_photos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM barbershops
    WHERE id = portfolio_photos.barber_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM staff
    WHERE id = portfolio_photos.staff_id AND user_id = auth.uid()
  )
);


-- ==========================================
-- 5. POLÍTICAS PARA SUPABASE STORAGE (Buckets de imágenes)
-- ==========================================
-- ⚠️  IMPORTANTE: Antes de ejecutar estas políticas asegúrate de que
--     existan los buckets. Si no los has creado aún, ve a
--     Storage → New bucket y crea:
--       - "avatars"   (public: true)
--       - "covers"    (public: true)
--       - "portfolio" (public: true)
-- ==========================================

-- ---- Bucket: avatars (fotos de perfil del barbero) ----

CREATE POLICY "Avatars: lectura pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Avatars: subida para usuarios autenticados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Avatars: actualización por el propietario del archivo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Avatars: eliminación por el propietario del archivo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);


-- ---- Bucket: covers (fotos de portada de la barbería) ----

CREATE POLICY "Covers: lectura pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "Covers: subida para usuarios autenticados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'covers'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Covers: actualización por el propietario del archivo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'covers'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Covers: eliminación por el propietario del archivo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);


-- ---- Bucket: portfolio (fotos de resultados de citas) ----

CREATE POLICY "Portfolio: lectura pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');

CREATE POLICY "Portfolio: subida para usuarios autenticados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Portfolio: actualización por el propietario del archivo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolio'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'portfolio'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Portfolio: eliminación por el propietario del archivo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
