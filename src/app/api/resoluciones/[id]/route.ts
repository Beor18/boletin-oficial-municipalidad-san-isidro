import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: resolucion, error } = await supabase
      .from('resoluciones')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !resolucion) {
      return NextResponse.json(
        { error: 'Resolución no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(resolucion)
  } catch (error) {
    console.error('Error fetching resolucion:', error)
    return NextResponse.json(
      { error: 'Error al obtener resolución' },
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

    // Obtener la resolución actual para verificar el boletín
    const { data: resolucionExistente, error: fetchError } = await supabase
      .from('resoluciones')
      .select('boletin_id')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Verificar si el boletín actual está cerrado
    if (resolucionExistente?.boletin_id) {
      const { data: boletin, error: boletinError } = await supabase
        .from('boletines')
        .select('cerrado')
        .eq('id', resolucionExistente.boletin_id)
        .single()

      if (boletinError) throw boletinError

      if (boletin?.cerrado) {
        return NextResponse.json(
          { error: 'No se pueden editar resoluciones de un boletín cerrado. El boletín está archivado.' },
          { status: 403 }
        )
      }
    }

    const updateData: Record<string, unknown> = {
      lugar: body.lugar,
      fecha: body.fecha,
      tipo: body.tipo,
      numero: body.numero,
      anio: body.anio,
      titulo: body.titulo,
      visto: body.visto || null,
      considerando: body.considerando || null,
      articulos: body.articulos,
      cierre: body.cierre || null,
      updated_at: new Date().toISOString(),
    }

    // Solo actualizar boletin_id si se proporciona explícitamente
    if (body.boletinId !== undefined || body.boletin_id !== undefined) {
      updateData.boletin_id = body.boletinId ?? body.boletin_id
    }

    const { data: resolucion, error } = await supabase
      .from('resoluciones')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(resolucion)
  } catch (error) {
    console.error('Error updating resolucion:', error)
    return NextResponse.json(
      { error: 'Error al actualizar resolución' },
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

    // Obtener la resolución para verificar el boletín
    const { data: resolucionExistente, error: fetchError } = await supabase
      .from('resoluciones')
      .select('boletin_id')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Verificar si el boletín está cerrado
    if (resolucionExistente?.boletin_id) {
      const { data: boletin, error: boletinError } = await supabase
        .from('boletines')
        .select('cerrado')
        .eq('id', resolucionExistente.boletin_id)
        .single()

      if (boletinError) throw boletinError

      if (boletin?.cerrado) {
        return NextResponse.json(
          { error: 'No se pueden eliminar resoluciones de un boletín cerrado. El boletín está archivado.' },
          { status: 403 }
        )
      }
    }

    const { error } = await supabase
      .from('resoluciones')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting resolucion:', error)
    return NextResponse.json(
      { error: 'Error al eliminar resolución' },
      { status: 500 }
    )
  }
}
