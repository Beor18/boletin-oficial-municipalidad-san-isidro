import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/db'

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Obtener boletín
    const { data: boletin, error: boletinError } = await supabase
      .from('boletines')
      .select('*')
      .eq('id', id)
      .single()

    if (boletinError || !boletin) {
      return NextResponse.json(
        { error: 'Boletín no encontrado' },
        { status: 404 }
      )
    }

    // Obtener resoluciones del boletín
    const { data: resoluciones, error: resolucionesError } = await supabase
      .from('resoluciones')
      .select('*')
      .eq('boletin_id', id)
      .order('tipo', { ascending: true })
      .order('numero', { ascending: true })

    if (resolucionesError) throw resolucionesError

    // Separar promulgaciones y resoluciones
    const promulgaciones = resoluciones?.filter(r => r.tipo === 'PROMULGACIÓN') || []
    const resolucionesFiltradas = resoluciones?.filter(r => r.tipo === 'RESOLUCIÓN') || []

    return NextResponse.json({
      ...boletin,
      resoluciones: resoluciones || [],
      mesNombre: MESES[boletin.mes],
      promulgaciones,
      totalPromulgaciones: promulgaciones.length,
      totalResoluciones: resolucionesFiltradas.length
    })
  } catch (error) {
    console.error('Error fetching boletin:', error)
    return NextResponse.json(
      { error: 'Error al obtener boletín' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Verificar si el boletín está cerrado
    const { data: boletinExistente, error: fetchError } = await supabase
      .from('boletines')
      .select('cerrado')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    if (boletinExistente?.cerrado) {
      return NextResponse.json(
        { error: 'No se puede editar un boletín cerrado. El boletín está archivado.' },
        { status: 403 }
      )
    }

    const { data: boletin, error } = await supabase
      .from('boletines')
      .update({
        numero: body.numero,
        anio: body.anio,
        mes: body.mes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      ...boletin,
      mesNombre: MESES[boletin.mes]
    })
  } catch (error) {
    console.error('Error updating boletin:', error)
    return NextResponse.json(
      { error: 'Error al actualizar boletín' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verificar si el boletín está cerrado
    const { data: boletinExistente, error: fetchError } = await supabase
      .from('boletines')
      .select('cerrado')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    if (boletinExistente?.cerrado) {
      return NextResponse.json(
        { error: 'No se puede eliminar un boletín cerrado. El boletín está archivado.' },
        { status: 403 }
      )
    }

    // Verificar si tiene resoluciones asociadas
    const { count, error: countError } = await supabase
      .from('resoluciones')
      .select('*', { count: 'exact', head: true })
      .eq('boletin_id', id)

    if (countError) throw countError

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un boletín con resoluciones. Primero elimine o mueva las resoluciones.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('boletines')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting boletin:', error)
    return NextResponse.json(
      { error: 'Error al eliminar boletín' },
      { status: 500 }
    )
  }
}
