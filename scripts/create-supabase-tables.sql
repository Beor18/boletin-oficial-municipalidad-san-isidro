-- Script para crear tablas en Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- Tabla de boletines
CREATE TABLE IF NOT EXISTS boletines (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  numero INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  activo BOOLEAN DEFAULT false,
  cerrado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(anio, mes)
);

-- Para bases de datos existentes, agregar la columna cerrado:
-- ALTER TABLE boletines ADD COLUMN IF NOT EXISTS cerrado BOOLEAN DEFAULT false;

-- Tabla de resoluciones
CREATE TABLE IF NOT EXISTS resoluciones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lugar TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL,
  tipo TEXT NOT NULL,
  numero INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  visto TEXT,
  considerando TEXT,
  articulos TEXT NOT NULL,
  cierre TEXT,
  boletin_id TEXT REFERENCES boletines(id),
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Para bases de datos existentes, agregar DEFAULT de UUID a las columnas id:
ALTER TABLE boletines ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE resoluciones ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Actualizar CHECK constraint de tipo para incluir ORDENANZA:
-- (buscar nombre real: SELECT conname FROM pg_constraint WHERE conrelid = 'boletines.resoluciones'::regclass AND contype = 'c';)
ALTER TABLE boletines.resoluciones DROP CONSTRAINT IF EXISTS resoluciones_tipo_check;
ALTER TABLE boletines.resoluciones ADD CONSTRAINT resoluciones_tipo_check
  CHECK (tipo IN ('RESOLUCIÓN', 'PROMULGACIÓN', 'ORDENANZA'));

-- Habilitar RLS (opcional pero recomendado)
ALTER TABLE boletines ENABLE ROW LEVEL SECURITY;
ALTER TABLE resoluciones ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de lectura (ajustar según necesidades)
CREATE POLICY "Lectura pública boletines" ON boletines FOR SELECT USING (true);
CREATE POLICY "Lectura pública resoluciones" ON resoluciones FOR SELECT USING (true);
