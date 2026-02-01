-- Script para crear tablas en Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- Tabla de boletines
CREATE TABLE IF NOT EXISTS boletines (
  id TEXT PRIMARY KEY,
  numero INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  activo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(anio, mes)
);

-- Tabla de resoluciones
CREATE TABLE IF NOT EXISTS resoluciones (
  id TEXT PRIMARY KEY,
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

-- Habilitar RLS (opcional pero recomendado)
ALTER TABLE boletines ENABLE ROW LEVEL SECURITY;
ALTER TABLE resoluciones ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de lectura (ajustar según necesidades)
CREATE POLICY "Lectura pública boletines" ON boletines FOR SELECT USING (true);
CREATE POLICY "Lectura pública resoluciones" ON resoluciones FOR SELECT USING (true);
