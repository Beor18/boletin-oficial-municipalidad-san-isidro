import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export async function GET() {
  try {
    const boletin = await db.boletin.findFirst({
      where: { activo: true },
      include: {
        resoluciones: {
          orderBy: [
            { tipo: 'asc' },
            { numero: 'asc' }
          ]
        }
      }
    })

    if (!boletin) {
      return NextResponse.json(null)
    }

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
    console.error('Error fetching active boletin:', error)
    return NextResponse.json(
      { error: 'Error al obtener boletín activo' },
      { status: 500 }
    )
  }
}

