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

    // Obtener el boletín actual
    const { data: boletinExistente, error: fetchError } = await supabase
      .from('boletines')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !boletinExistente) {
      return NextResponse.json(
        { error: 'Boletín no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no esté activo
    if (boletinExistente.activo) {
      return NextResponse.json(
        { error: 'No se puede cerrar un boletín activo. Primero desactívelo.' },
        { status: 400 }
      )
    }

    // Verificar que no esté ya cerrado
    if (boletinExistente.cerrado) {
      return NextResponse.json(
        { error: 'El boletín ya está cerrado' },
        { status: 400 }
      )
    }

    // Cerrar el boletín
    const { data: boletin, error } = await supabase
      .from('boletines')
      .update({ cerrado: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      ...boletin,
      mesNombre: MESES[boletin.mes]
    })
  } catch (error) {
    console.error('Error closing boletin:', error)
    return NextResponse.json(
      { error: 'Error al cerrar boletín' },
      { status: 500 }
    )
  }
}
