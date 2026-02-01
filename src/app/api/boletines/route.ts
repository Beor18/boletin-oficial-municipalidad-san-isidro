import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/db'

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: boletines, error } = await supabase
      .from('boletines')
      .select('*, resoluciones(count)')
      .order('anio', { ascending: false })
      .order('mes', { ascending: false })

    if (error) throw error

    // Transformar para compatibilidad con el formato anterior
    const boletinesTransformados = boletines?.map(boletin => ({
      ...boletin,
      _count: {
        resoluciones: boletin.resoluciones?.[0]?.count || 0
      }
    })) || []

    // Agrupar por año para facilitar la navegación
    const boletinesPorAnio = boletinesTransformados.reduce((acc, boletin) => {
      const anio = boletin.anio
      if (!acc[anio]) {
        acc[anio] = []
      }
      acc[anio].push({
        ...boletin,
        mesNombre: MESES[boletin.mes],
        cantidadResoluciones: boletin._count.resoluciones
      })
      return acc
    }, {} as Record<number, typeof boletinesTransformados>)

    return NextResponse.json({
      boletines: boletinesTransformados,
      boletinesPorAnio,
      meses: MESES
    })
  } catch (error) {
    console.error('Error fetching boletines:', error)
    return NextResponse.json(
      { error: 'Error al obtener boletines' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Verificar si ya existe un boletín para ese mes/año
    const { data: existente } = await supabase
      .from('boletines')
      .select('id')
      .eq('anio', body.anio)
      .eq('mes', body.mes)
      .single()

    if (existente) {
      return NextResponse.json(
        { error: `Ya existe un boletín para ${MESES[body.mes]} ${body.anio}` },
        { status: 400 }
      )
    }

    // Si se marca como activo, desactivar los demás
    if (body.activo) {
      await supabase
        .from('boletines')
        .update({ activo: false })
        .eq('activo', true)
    }

    const { data: boletin, error } = await supabase
      .from('boletines')
      .insert({
        numero: body.numero,
        anio: body.anio,
        mes: body.mes,
        activo: body.activo || false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      ...boletin,
      mesNombre: MESES[boletin.mes]
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating boletin:', error)
    return NextResponse.json(
      { error: 'Error al crear boletín' },
      { status: 500 }
    )
  }
}
