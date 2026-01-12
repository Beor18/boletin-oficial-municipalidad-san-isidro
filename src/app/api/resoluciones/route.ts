import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const resoluciones = await db.resolucion.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(resoluciones)
  } catch (error) {
    console.error('Error fetching resoluciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener resoluciones' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const resolucion = await db.resolucion.create({
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

    return NextResponse.json(resolucion, { status: 201 })
  } catch (error) {
    console.error('Error creating resolucion:', error)
    return NextResponse.json(
      { error: 'Error al crear resolución' },
      { status: 500 }
    )
  }
}
