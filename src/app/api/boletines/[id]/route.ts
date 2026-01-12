import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const boletin = await db.boletin.findUnique({
      where: { id },
      include: {
        resoluciones: {
          orderBy: [
            { tipo: 'asc' }, // PROMULGACIÓN antes que RESOLUCIÓN
            { numero: 'asc' }
          ]
        }
      }
    })

    if (!boletin) {
      return NextResponse.json(
        { error: 'Boletín no encontrado' },
        { status: 404 }
      )
    }

    // Separar promulgaciones y resoluciones
    const promulgaciones = boletin.resoluciones.filter(r => r.tipo === 'PROMULGACIÓN')
    const resoluciones = boletin.resoluciones.filter(r => r.tipo === 'RESOLUCIÓN')

    return NextResponse.json({
      ...boletin,
      mesNombre: MESES[boletin.mes],
      promulgaciones,
      resoluciones: resoluciones,
      totalPromulgaciones: promulgaciones.length,
      totalResoluciones: resoluciones.length
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
    const body = await request.json()

    const boletin = await db.boletin.update({
      where: { id },
      data: {
        numero: body.numero,
        anio: body.anio,
        mes: body.mes,
      },
    })

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

    // Verificar si tiene resoluciones asociadas
    const boletin = await db.boletin.findUnique({
      where: { id },
      include: {
        _count: {
          select: { resoluciones: true }
        }
      }
    })

    if (!boletin) {
      return NextResponse.json(
        { error: 'Boletín no encontrado' },
        { status: 404 }
      )
    }

    if (boletin._count.resoluciones > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un boletín con resoluciones. Primero elimine o mueva las resoluciones.' },
        { status: 400 }
      )
    }

    await db.boletin.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting boletin:', error)
    return NextResponse.json(
      { error: 'Error al eliminar boletín' },
      { status: 500 }
    )
  }
}

