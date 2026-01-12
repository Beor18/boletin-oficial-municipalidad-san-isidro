import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const resolucion = await db.resolucion.findUnique({
      where: { id },
    })

    if (!resolucion) {
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
    const body = await request.json()

    const resolucion = await db.resolucion.update({
      where: { id },
      data: {
        lugar: body.lugar,
        fecha: new Date(body.fecha),
        tipo: body.tipo,
        numero: body.numero,
        anio: body.anio,
        titulo: body.titulo,
        visto: body.visto || null,
        considerando: body.considerando || null,
        articulos: body.articulos,
        cierre: body.cierre || null,
      },
    })

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

    await db.resolucion.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting resolucion:', error)
    return NextResponse.json(
      { error: 'Error al eliminar resolución' },
      { status: 500 }
    )
  }
}
