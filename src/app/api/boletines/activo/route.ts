import { NextResponse } from 'next/server'
import { createClient } from '@/lib/db'

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export async function GET() {
  try {
    const supabase = await createClient()

    // Obtener boletín activo
    const { data: boletin, error: boletinError } = await supabase
      .from('boletines')
      .select('*')
      .eq('activo', true)
      .single()

    if (boletinError || !boletin) {
      return NextResponse.json(null)
    }

    // Obtener resoluciones del boletín
    const { data: resoluciones, error: resolucionesError } = await supabase
      .from('resoluciones')
      .select('*')
      .eq('boletin_id', boletin.id)
      .order('tipo', { ascending: true })
      .order('numero', { ascending: true })

    if (resolucionesError) throw resolucionesError

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
    console.error('Error fetching active boletin:', error)
    return NextResponse.json(
      { error: 'Error al obtener boletín activo' },
      { status: 500 }
    )
  }
}
