import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export async function GET() {
  try {
    const boletines = await db.boletin.findMany({
      orderBy: [
        { anio: 'desc' },
        { mes: 'desc' },
      ],
      include: {
        _count: {
          select: { resoluciones: true }
        }
      }
    })

    // Agrupar por año para facilitar la navegación
    const boletinesPorAnio = boletines.reduce((acc, boletin) => {
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
    }, {} as Record<number, typeof boletines>)

    return NextResponse.json({
      boletines,
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
    const body = await request.json()

    // Verificar si ya existe un boletín para ese mes/año
    const existente = await db.boletin.findUnique({
      where: {
        anio_mes: {
          anio: body.anio,
          mes: body.mes
        }
      }
    })

    if (existente) {
      return NextResponse.json(
        { error: `Ya existe un boletín para ${MESES[body.mes]} ${body.anio}` },
        { status: 400 }
      )
    }

    // Si se marca como activo, desactivar los demás
    if (body.activo) {
      await db.boletin.updateMany({
        where: { activo: true },
        data: { activo: false }
      })
    }

    const boletin = await db.boletin.create({
      data: {
        numero: body.numero,
        anio: body.anio,
        mes: body.mes,
        activo: body.activo || false,
      },
    })

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

