-- ==========================================
-- MIGRACIÓN: Añadir campo is_visible a portfolio_photos
-- Ejecuta este script en el editor SQL de tu panel de Supabase.
-- ==========================================

-- Añade la columna is_visible. DEFAULT true para que todas las fotos
-- existentes sigan siendo visibles sin necesidad de acción manual.
ALTER TABLE portfolio_photos
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- Índice para mejorar el rendimiento de las consultas públicas que filtran por visibilidad
CREATE INDEX IF NOT EXISTS idx_portfolio_photos_visible
  ON portfolio_photos (barber_id, is_visible)
  WHERE is_visible = true;
