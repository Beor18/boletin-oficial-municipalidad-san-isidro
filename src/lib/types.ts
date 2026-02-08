// Tipos compartidos entre Server y Client Components

export interface Articulo {
  numero: string;
  texto: string;
}

export interface Resolucion {
  id: string;
  lugar: string;
  fecha: string;
  tipo: string;
  numero: number;
  anio: number;
  titulo: string;
  visto?: string;
  considerando?: string;
  articulos: string;
  cierre?: string;
  boletinId?: string;
  boletin_id?: string;
}

export interface Boletin {
  id: string;
  numero: number;
  anio: number;
  mes: number;
  mesNombre: string;
  activo: boolean;
  cerrado: boolean;
  cantidadResoluciones?: number;
  _count?: {
    resoluciones: number;
  };
  ordenanzas?: Resolucion[];
  promulgaciones?: Resolucion[];
  resoluciones?: Resolucion[];
  totalOrdenanzas?: number;
  totalPromulgaciones?: number;
  totalResoluciones?: number;
}

export interface BoletinesPorAnio {
  [anio: number]: Boletin[];
}

export interface BoletinesData {
  boletines: Boletin[];
  boletinesPorAnio: BoletinesPorAnio;
}
