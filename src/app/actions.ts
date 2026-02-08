"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db";
import type { Boletin, BoletinesData, Resolucion } from "@/lib/types";

const MESES = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// ============ FETCH FUNCTIONS ============

export async function getBoletines(): Promise<BoletinesData> {
  const supabase = await createClient();

  const { data: boletines, error } = await supabase
    .from("boletines")
    .select("*, resoluciones(count)")
    .order("anio", { ascending: false })
    .order("mes", { ascending: false });

  if (error) {
    console.error("Error fetching boletines:", error);
    return { boletines: [], boletinesPorAnio: {} };
  }

  // Transformar para compatibilidad
  const boletinesTransformados =
    boletines?.map((boletin) => ({
      ...boletin,
      mesNombre: MESES[boletin.mes],
      cerrado: boletin.cerrado ?? false,
      _count: {
        resoluciones: boletin.resoluciones?.[0]?.count || 0,
      },
      cantidadResoluciones: boletin.resoluciones?.[0]?.count || 0,
    })) || [];

  // Agrupar por año
  const boletinesPorAnio = boletinesTransformados.reduce(
    (acc, boletin) => {
      const anio = boletin.anio;
      if (!acc[anio]) {
        acc[anio] = [];
      }
      acc[anio].push(boletin);
      return acc;
    },
    {} as Record<number, Boletin[]>
  );

  return {
    boletines: boletinesTransformados,
    boletinesPorAnio,
  };
}

export async function getBoletin(id: string): Promise<Boletin | null> {
  const supabase = await createClient();

  // Obtener boletín
  const { data: boletin, error: boletinError } = await supabase
    .from("boletines")
    .select("*")
    .eq("id", id)
    .single();

  if (boletinError || !boletin) {
    console.error("Error fetching boletin:", boletinError);
    return null;
  }

  // Obtener resoluciones del boletín
  const { data: resoluciones, error: resolucionesError } = await supabase
    .from("resoluciones")
    .select("*")
    .eq("boletin_id", id)
    .order("tipo", { ascending: true })
    .order("numero", { ascending: true });

  if (resolucionesError) {
    console.error("Error fetching resoluciones:", resolucionesError);
  }

  // Separar ordenanzas, promulgaciones y resoluciones
  const ordenanzasArr =
    resoluciones?.filter((r) => r.tipo === "ORDENANZA") || [];
  const promulgaciones =
    resoluciones?.filter((r) => r.tipo === "PROMULGACIÓN") || [];
  const resolucionesFiltradas =
    resoluciones?.filter((r) => r.tipo === "RESOLUCIÓN") || [];

  return {
    ...boletin,
    cerrado: boletin.cerrado ?? false,
    mesNombre: MESES[boletin.mes],
    resoluciones: resolucionesFiltradas,
    promulgaciones,
    ordenanzas: ordenanzasArr,
    totalPromulgaciones: promulgaciones.length,
    totalResoluciones: resolucionesFiltradas.length,
    totalOrdenanzas: ordenanzasArr.length,
  };
}

// ============ BOLETIN MUTATIONS ============

export async function crearBoletin(data: {
  numero: number;
  anio: number;
  mes: number;
  activo: boolean;
}): Promise<{ success: boolean; error?: string; boletin?: Boletin }> {
  const supabase = await createClient();

  // Verificar si ya existe
  const { data: existente } = await supabase
    .from("boletines")
    .select("id")
    .eq("anio", data.anio)
    .eq("mes", data.mes)
    .single();

  if (existente) {
    return {
      success: false,
      error: `Ya existe un boletín para ${MESES[data.mes]} ${data.anio}`,
    };
  }

  // Si se marca como activo, desactivar los demás
  if (data.activo) {
    await supabase
      .from("boletines")
      .update({ activo: false })
      .eq("activo", true);
  }

  const { data: boletin, error } = await supabase
    .from("boletines")
    .insert({
      id: crypto.randomUUID(),
      numero: data.numero,
      anio: data.anio,
      mes: data.mes,
      activo: data.activo || false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating boletin:", error);
    return { success: false, error: "Error al crear boletín" };
  }

  revalidatePath("/");

  return {
    success: true,
    boletin: {
      ...boletin,
      cerrado: boletin.cerrado ?? false,
      mesNombre: MESES[boletin.mes],
    },
  };
}

export async function activarBoletin(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Desactivar todos
  await supabase.from("boletines").update({ activo: false }).eq("activo", true);

  // Activar el seleccionado
  const { error } = await supabase
    .from("boletines")
    .update({ activo: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error activating boletin:", error);
    return { success: false, error: "Error al activar boletín" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function cerrarBoletin(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verificar estado actual
  const { data: boletin, error: fetchError } = await supabase
    .from("boletines")
    .select("activo, cerrado")
    .eq("id", id)
    .single();

  if (fetchError || !boletin) {
    return { success: false, error: "Boletín no encontrado" };
  }

  if (boletin.activo) {
    return {
      success: false,
      error: "No se puede cerrar un boletín activo. Primero desactívelo.",
    };
  }

  if (boletin.cerrado) {
    return { success: false, error: "El boletín ya está cerrado" };
  }

  const { error } = await supabase
    .from("boletines")
    .update({ cerrado: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error closing boletin:", error);
    return { success: false, error: "Error al cerrar boletín" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function eliminarBoletin(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verificar si está cerrado
  const { data: boletin } = await supabase
    .from("boletines")
    .select("cerrado")
    .eq("id", id)
    .single();

  if (boletin?.cerrado) {
    return {
      success: false,
      error: "No se puede eliminar un boletín cerrado. El boletín está archivado.",
    };
  }

  // Verificar si tiene resoluciones
  const { count } = await supabase
    .from("resoluciones")
    .select("*", { count: "exact", head: true })
    .eq("boletin_id", id);

  if (count && count > 0) {
    return {
      success: false,
      error:
        "No se puede eliminar un boletín con resoluciones. Primero elimine las resoluciones.",
    };
  }

  const { error } = await supabase.from("boletines").delete().eq("id", id);

  if (error) {
    console.error("Error deleting boletin:", error);
    return { success: false, error: "Error al eliminar boletín" };
  }

  revalidatePath("/");
  return { success: true };
}

// ============ RESOLUCION MUTATIONS ============

export async function crearResolucion(data: {
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
}): Promise<{ success: boolean; error?: string; resolucion?: Resolucion }> {
  const supabase = await createClient();

  let boletinId = data.boletinId;

  // Si no hay boletinId, usar el activo
  if (!boletinId) {
    const { data: activo } = await supabase
      .from("boletines")
      .select("id")
      .eq("activo", true)
      .single();

    if (activo) {
      boletinId = activo.id;
    }
  }

  // Verificar que el boletín no esté cerrado
  if (boletinId) {
    const { data: boletin } = await supabase
      .from("boletines")
      .select("cerrado")
      .eq("id", boletinId)
      .single();

    if (boletin?.cerrado) {
      return {
        success: false,
        error: "No se pueden agregar resoluciones a un boletín cerrado.",
      };
    }
  }

  const { data: resolucion, error } = await supabase
    .from("resoluciones")
    .insert({
      id: crypto.randomUUID(),
      lugar: data.lugar,
      fecha: data.fecha,
      tipo: data.tipo,
      numero: data.numero,
      anio: data.anio,
      titulo: data.titulo,
      visto: data.visto || null,
      considerando: data.considerando || null,
      articulos: data.articulos,
      cierre: data.cierre || null,
      boletin_id: boletinId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating resolucion:", error);
    return { success: false, error: "Error al crear resolución" };
  }

  revalidatePath("/");
  return { success: true, resolucion };
}

export async function editarResolucion(
  id: string,
  data: {
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
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Obtener la resolución para verificar el boletín
  const { data: resolucionExistente } = await supabase
    .from("resoluciones")
    .select("boletin_id")
    .eq("id", id)
    .single();

  if (resolucionExistente?.boletin_id) {
    const { data: boletin } = await supabase
      .from("boletines")
      .select("cerrado")
      .eq("id", resolucionExistente.boletin_id)
      .single();

    if (boletin?.cerrado) {
      return {
        success: false,
        error: "No se pueden editar resoluciones de un boletín cerrado.",
      };
    }
  }

  const { error } = await supabase
    .from("resoluciones")
    .update({
      lugar: data.lugar,
      fecha: data.fecha,
      tipo: data.tipo,
      numero: data.numero,
      anio: data.anio,
      titulo: data.titulo,
      visto: data.visto || null,
      considerando: data.considerando || null,
      articulos: data.articulos,
      cierre: data.cierre || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating resolucion:", error);
    return { success: false, error: "Error al actualizar resolución" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function eliminarResolucion(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Obtener la resolución para verificar el boletín
  const { data: resolucion } = await supabase
    .from("resoluciones")
    .select("boletin_id")
    .eq("id", id)
    .single();

  if (resolucion?.boletin_id) {
    const { data: boletin } = await supabase
      .from("boletines")
      .select("cerrado")
      .eq("id", resolucion.boletin_id)
      .single();

    if (boletin?.cerrado) {
      return {
        success: false,
        error: "No se pueden eliminar resoluciones de un boletín cerrado.",
      };
    }
  }

  const { error } = await supabase.from("resoluciones").delete().eq("id", id);

  if (error) {
    console.error("Error deleting resolucion:", error);
    return { success: false, error: "Error al eliminar resolución" };
  }

  revalidatePath("/");
  return { success: true };
}
