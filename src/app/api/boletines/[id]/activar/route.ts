import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    // Desactivar todos los boletines
    await db.boletin.updateMany({
      where: { activo: true },
      data: { activo: false }
    })

    // Activar el boletín seleccionado
    const boletin = await db.boletin.update({
      where: { id },
      data: { activo: true },
    })

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

