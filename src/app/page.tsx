'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FilePlus, Edit2, Trash2, FileText, Download, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Schema de validación
const articuloSchema = z.object({
  numero: z.string().min(1, 'El número es requerido'),
  texto: z.string().min(1, 'El texto del artículo es requerido'),
})

const resolucionSchema = z.object({
  lugar: z.string().min(1, 'El lugar es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  tipo: z.enum(['RESOLUCIÓN', 'PROMULGACIÓN']),
  numero: z.string().min(1, 'El número es requerido'),
  anio: z.string().min(1, 'El año es requerido'),
  titulo: z.string().min(1, 'El título es requerido'),
  visto: z.string().optional(),
  considerando: z.string().optional(),
  articulos: z.array(articuloSchema).min(1, 'Debe haber al menos un artículo'),
  cierre: z.string().optional(),
})

type ResolucionFormValues = z.infer<typeof resolucionSchema>
type Articulo = z.infer<typeof articuloSchema>

interface Resolucion {
  id: string
  lugar: string
  fecha: string
  tipo: string
  numero: number
  anio: number
  titulo: string
  visto?: string
  considerando?: string
  articulos: string // JSON string
  cierre?: string
}

export default function Home() {
  const [resoluciones, setResoluciones] = useState<Resolucion[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Cargar resoluciones existentes
  useEffect(() => {
    loadResoluciones()
  }, [])

  const form = useForm<ResolucionFormValues>({
    resolver: zodResolver(resolucionSchema),
    defaultValues: {
      lugar: 'San Isidro (Ctes.)',
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'RESOLUCIÓN',
      numero: '',
      anio: new Date().getFullYear().toString(),
      titulo: '',
      visto: '',
      considerando: '',
      articulos: [{ numero: '1', texto: '' }],
      cierre: 'Comuníquese, regístrese, publíquese y archívese.',
    },
  })

  const articulos = form.watch('articulos')

  const loadResoluciones = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/resoluciones')
      if (response.ok) {
        const data = await response.json()
        setResoluciones(data)
      }
    } catch (error) {
      console.error('Error al cargar resoluciones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addArticulo = () => {
    const newNumero = (articulos.length + 1).toString()
    form.setValue('articulos', [...articulos, { numero: newNumero, texto: '' }])
  }

  const removeArticulo = (index: number) => {
    const nuevosArticulos = articulos.filter((_, i) => i !== index)
    form.setValue('articulos', nuevosArticulos)
  }

  const updateArticuloNumero = (index: number, value: string) => {
    const nuevosArticulos = [...articulos]
    nuevosArticulos[index].numero = value
    form.setValue('articulos', nuevosArticulos)
  }

  const updateArticuloTexto = (index: number, value: string) => {
    const nuevosArticulos = [...articulos]
    nuevosArticulos[index].texto = value
    form.setValue('articulos', nuevosArticulos)
  }

  const onSubmit = async (data: ResolucionFormValues) => {
    try {
      const payload = {
        ...data,
        fecha: new Date(data.fecha).toISOString(),
        numero: parseInt(data.numero),
        anio: parseInt(data.anio),
        articulos: JSON.stringify(data.articulos),
      }

      let response
      if (editingId) {
        response = await fetch(`/api/resoluciones/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/resoluciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) throw new Error('Error al guardar')

      const saved = await response.json()
      
      if (editingId) {
        setResoluciones(resoluciones.map(r => r.id === editingId ? saved : r))
        toast.success('Resolución actualizada correctamente')
      } else {
        setResoluciones([...resoluciones, saved])
        toast.success('Resolución guardada correctamente')
      }

      resetForm()
    } catch (error) {
      toast.error('Error al guardar la resolución')
      console.error(error)
    }
  }

  const handleEdit = (resolucion: Resolucion) => {
    const articulosParsed = JSON.parse(resolucion.articulos) as Articulo[]

    form.reset({
      lugar: resolucion.lugar,
      fecha: new Date(resolucion.fecha).toISOString().split('T')[0],
      tipo: resolucion.tipo as 'RESOLUCIÓN' | 'PROMULGACIÓN',
      numero: resolucion.numero.toString(),
      anio: resolucion.anio.toString(),
      titulo: resolucion.titulo,
      visto: resolucion.visto || '',
      considerando: resolucion.considerando || '',
      articulos: articulosParsed,
      cierre: resolucion.cierre || '',
    })

    setEditingId(resolucion.id)
    setIsFormVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/resoluciones/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Error al eliminar')

      setResoluciones(resoluciones.filter(r => r.id !== id))
      toast.success('Resolución eliminada correctamente')
    } catch (error) {
      toast.error('Error al eliminar la resolución')
      console.error(error)
    }
  }

  const resetForm = () => {
    form.reset({
      lugar: 'San Isidro (Ctes.)',
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'RESOLUCIÓN',
      numero: '',
      anio: new Date().getFullYear().toString(),
      titulo: '',
      visto: '',
      considerando: '',
      articulos: [{ numero: '1', texto: '' }],
      cierre: 'Comuníquese, regístrese, publíquese y archívese.',
    })
    setEditingId(null)
    setIsFormVisible(false)
  }

  const generarPDF = async () => {
    if (resoluciones.length === 0) {
      toast.error('No hay resoluciones para generar el boletín')
      return
    }

    try {
      const response = await fetch('/api/boletin/generar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: resoluciones.map(r => r.id) }),
      })

      if (!response.ok) throw new Error('Error al generar PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `boletin-oficial-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF generado correctamente')
    } catch (error) {
      toast.error('Error al generar el PDF')
      console.error(error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Boletín Oficial Municipal</h1>
              <p className="text-muted-foreground mt-1">Sistema de gestión y generación de documentos oficiales</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsFormVisible(!isFormVisible)}
                variant={isFormVisible ? "outline" : "default"}
              >
                {isFormVisible ? (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Lista
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Resolución
                  </>
                )}
              </Button>
              {resoluciones.length > 0 && (
                <Button onClick={generarPDF} className="gap-2">
                  <Download className="h-4 w-4" />
                  Generar Boletín PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        {isFormVisible ? (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>
                {editingId ? 'Editar Resolución/Promulgación' : 'Nueva Resolución/Promulgación'}
              </CardTitle>
              <CardDescription>
                Complete los datos para agregar un documento al boletín oficial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Datos básicos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lugar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lugar</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="San Isidro (Ctes.)" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fecha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Documento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione el tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="RESOLUCIÓN">RESOLUCIÓN</SelectItem>
                              <SelectItem value="PROMULGACIÓN">PROMULGACIÓN</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="1731" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="anio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Año</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="2025" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título o Asunto</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="DISPONIENDO LA RECONSTRUCCIÓN DEL EXPEDIENTE ADMINISTRATIVO..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* VISTO */}
                  <FormField
                    control={form.control}
                    name="visto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VISTO (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="La constancia de denuncia penal labrada ante..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CONSIDERANDO */}
                  <FormField
                    control={form.control}
                    name="considerando"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CONSIDERANDO (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Que la documentación sustraída resulta de carácter esencial..."
                            rows={5}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Artículos */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Artículos</h3>
                      <Button type="button" onClick={addArticulo} variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Artículo
                      </Button>
                    </div>

                    {articulos.map((articulo, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex gap-4">
                          <div className="w-24 flex-shrink-0">
                            <Input
                              value={articulo.numero}
                              onChange={(e) => updateArticuloNumero(index, e.target.value)}
                              placeholder="N°"
                            />
                          </div>
                          <div className="flex-1">
                            <Textarea
                              value={articulo.texto}
                              onChange={(e) => updateArticuloTexto(index, e.target.value)}
                              placeholder="Disponer la inmediata reconstrucción..."
                              rows={2}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeArticulo(index)}
                            disabled={articulos.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Separator />

                  {/* Cierre */}
                  <FormField
                    control={form.control}
                    name="cierre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cierre Administrativo (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Comuníquese, regístrese, publíquese y archívese."
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingId ? 'Actualizar' : 'Guardar'} Resolución
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {isLoading ? (
              <Card className="max-w-2xl mx-auto">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Cargando resoluciones...</p>
                </CardContent>
              </Card>
            ) : resoluciones.length === 0 ? (
              <Card className="max-w-2xl mx-auto">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No hay resoluciones cargadas</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Comience agregando una resolución o promulgación para generar el boletín oficial.
                  </p>
                  <Button onClick={() => setIsFormVisible(true)}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Agregar Primera Resolución
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    Resoluciones ({resoluciones.length})
                  </h2>
                </div>

                {resoluciones.map((resolucion) => {
                  const articulosParsed = JSON.parse(resolucion.articulos) as Articulo[]
                  return (
                    <Card key={resolucion.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{resolucion.tipo}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {resolucion.lugar}, {formatDate(resolucion.fecha)}
                              </span>
                            </div>
                            <CardTitle className="text-xl">
                              {resolucion.tipo} Nº {resolucion.numero}/{resolucion.anio}
                            </CardTitle>
                            <CardDescription className="text-base mt-1">
                              {resolucion.titulo}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(resolucion)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(resolucion.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          {resolucion.visto && (
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1">VISTO:</p>
                              <p className="text-muted-foreground">{resolucion.visto.slice(0, 150)}...</p>
                            </div>
                          )}
                          {resolucion.considerando && (
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1">CONSIDERANDO:</p>
                              <p className="text-muted-foreground">{resolucion.considerando.slice(0, 150)}...</p>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-muted-foreground mb-1">
                              Artículos ({articulosParsed.length}):
                            </p>
                            <p className="text-muted-foreground">
                              {articulosParsed.map(a => a.texto).slice(0, 1)}...
                            </p>
                          </div>
                          {resolucion.cierre && (
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1">Cierre:</p>
                              <p className="text-muted-foreground">{resolucion.cierre}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>Municipalidad de San Isidro - Sistema de Boletín Oficial © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}
