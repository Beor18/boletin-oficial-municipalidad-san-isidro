import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/db'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: resoluciones, error } = await supabase
      .from('resoluciones')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

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
    const supabase = await createClient()
    const body = await request.json()

    // Si no se especifica boletin_id, asignar al boletín activo
    let boletinId = body.boletinId || body.boletin_id || null
    if (!boletinId) {
      const { data: boletinActivo } = await supabase
        .from('boletines')
        .select('id')
        .eq('activo', true)
        .single()

      if (boletinActivo) {
        boletinId = boletinActivo.id
      }
    }

    const { data: resolucion, error } = await supabase
      .from('resoluciones')
      .insert({
        lugar: body.lugar,
        fecha: new Date(body.fecha).toISOString(),
        tipo: body.tipo,
        numero: body.numero,
        anio: body.anio,
        titulo: body.titulo,
        visto: body.visto || null,
        considerando: body.considerando || null,
        articulos: body.articulos,
        cierre: body.cierre || null,
        boletin_id: boletinId,
        orden: body.orden || 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(resolucion, { status: 201 })
  } catch (error) {
    console.error('Error creating resolucion:', error)
    return NextResponse.json(
      { error: 'Error al crear resolución' },
      { status: 500 }
    )
  }
}
