import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/db'

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Desactivar todos los boletines
    await supabase
      .from('boletines')
      .update({ activo: false })
      .eq('activo', true)

    // Activar el boletín seleccionado
    const { data: boletin, error } = await supabase
      .from('boletines')
      .update({ activo: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      ...boletin,
      mesNombre: MESES[boletin.mes]
    })
  } catch (error) {
    console.error('Error activating boletin:', error)
    return NextResponse.json(
      { error: 'Error al activar boletín' },
      { status: 500 }
    )
  }
}
