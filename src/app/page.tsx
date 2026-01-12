"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FilePlus,
  Edit2,
  Trash2,
  FileText,
  Download,
  Plus,
  Loader2,
  Eye,
  X,
  CheckCircle,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { BoletinSidebar } from "@/components/boletin-sidebar";
import { CrearBoletinModal } from "@/components/crear-boletin-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Schema de validación
const articuloSchema = z.object({
  numero: z.string().min(1, "El número es requerido"),
  texto: z.string().min(1, "El texto del artículo es requerido"),
});

const resolucionSchema = z.object({
  lugar: z.string().min(1, "El lugar es requerido"),
  fecha: z.string().min(1, "La fecha es requerida"),
  tipo: z.enum(["RESOLUCIÓN", "PROMULGACIÓN"]),
  numero: z.string().min(1, "El número es requerido"),
  anio: z.string().min(1, "El año es requerido"),
  titulo: z.string().min(1, "El título es requerido"),
  visto: z.string().optional(),
  considerando: z.string().optional(),
  articulos: z.array(articuloSchema).min(1, "Debe haber al menos un artículo"),
  cierre: z.string().optional(),
});

type ResolucionFormValues = z.infer<typeof resolucionSchema>;
type Articulo = z.infer<typeof articuloSchema>;

interface Resolucion {
  id: string;
  lugar: string;
  fecha: string;
  tipo: string;
  numero: number;
  anio: number;
  titulo: string;
  visto?: string;
  considerando?: string;
  articulos: string;
  cierre?: string;
  boletinId?: string;
}

interface Boletin {
  id: string;
  numero: number;
  anio: number;
  mes: number;
  mesNombre: string;
  activo: boolean;
  cantidadResoluciones?: number;
  _count?: {
    resoluciones: number;
  };
  promulgaciones?: Resolucion[];
  resoluciones?: Resolucion[];
  totalPromulgaciones?: number;
  totalResoluciones?: number;
}

interface BoletinesPorAnio {
  [anio: number]: Boletin[];
}

export default function Home() {
  // Boletines state
  const [boletines, setBoletines] = useState<Boletin[]>([]);
  const [boletinesPorAnio, setBoletinesPorAnio] = useState<BoletinesPorAnio>(
    {}
  );
  const [boletinSeleccionado, setBoletinSeleccionado] = useState<string | null>(
    null
  );
  const [boletinActual, setBoletinActual] = useState<Boletin | null>(null);
  const [isCrearBoletinModalOpen, setIsCrearBoletinModalOpen] = useState(false);

  // Resoluciones state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [viewingResolucion, setViewingResolucion] = useState<Resolucion | null>(
    null
  );
  const [formatoPDF, setFormatoPDF] = useState<"a4" | "legal">("a4");

  const form = useForm<ResolucionFormValues>({
    resolver: zodResolver(resolucionSchema),
    defaultValues: {
      lugar: "San Isidro (Ctes.)",
      fecha: new Date().toISOString().split("T")[0],
      tipo: "RESOLUCIÓN",
      numero: "",
      anio: new Date().getFullYear().toString(),
      titulo: "",
      visto: "",
      considerando: "",
      articulos: [{ numero: "1", texto: "" }],
      cierre: "Comuníquese, regístrese, publíquese y archívese.",
    },
  });

  const articulos = form.watch("articulos");

  // Cargar boletines
  const loadBoletines = useCallback(async () => {
    try {
      const response = await fetch("/api/boletines");
      if (response.ok) {
        const data = await response.json();
        setBoletines(data.boletines || []);
        setBoletinesPorAnio(data.boletinesPorAnio || {});

        // Si hay un boletín activo y no hay uno seleccionado, seleccionarlo
        const activo = (data.boletines || []).find((b: Boletin) => b.activo);
        if (activo && !boletinSeleccionado) {
          setBoletinSeleccionado(activo.id);
        }
      }
    } catch (error) {
      console.error("Error al cargar boletines:", error);
    }
  }, [boletinSeleccionado]);

  // Cargar boletín seleccionado con sus resoluciones
  const loadBoletinActual = useCallback(async () => {
    if (!boletinSeleccionado) {
      setBoletinActual(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/boletines/${boletinSeleccionado}`);
      if (response.ok) {
        const data = await response.json();
        setBoletinActual(data);
      }
    } catch (error) {
      console.error("Error al cargar boletín:", error);
    } finally {
      setIsLoading(false);
    }
  }, [boletinSeleccionado]);

  useEffect(() => {
    loadBoletines();
  }, [loadBoletines]);

  useEffect(() => {
    loadBoletinActual();
  }, [loadBoletinActual]);

  const handleCrearBoletin = async (data: {
    numero: number;
    anio: number;
    mes: number;
    activo: boolean;
  }) => {
    const response = await fetch("/api/boletines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al crear boletín");
    }

    const nuevo = await response.json();
    toast.success(
      `Boletín ${nuevo.mesNombre} ${nuevo.anio} creado correctamente`
    );
    await loadBoletines();
    setBoletinSeleccionado(nuevo.id);
  };

  const handleActivarBoletin = async (id: string) => {
    try {
      const response = await fetch(`/api/boletines/${id}/activar`, {
        method: "PUT",
      });

      if (!response.ok) throw new Error("Error al activar boletín");

      toast.success("Boletín activado correctamente");
      await loadBoletines();
      await loadBoletinActual();
    } catch (error) {
      toast.error("Error al activar el boletín");
      console.error(error);
    }
  };

  const handleEliminarBoletin = async (id: string) => {
    try {
      const response = await fetch(`/api/boletines/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar boletín");
      }

      toast.success("Boletín eliminado correctamente");
      if (boletinSeleccionado === id) {
        setBoletinSeleccionado(null);
      }
      await loadBoletines();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar el boletín"
      );
      console.error(error);
    }
  };

  const addArticulo = () => {
    const newNumero = (articulos.length + 1).toString();
    form.setValue("articulos", [
      ...articulos,
      { numero: newNumero, texto: "" },
    ]);
  };

  const removeArticulo = (index: number) => {
    const nuevosArticulos = articulos.filter((_, i) => i !== index);
    form.setValue("articulos", nuevosArticulos);
  };

  const updateArticuloNumero = (index: number, value: string) => {
    const nuevosArticulos = [...articulos];
    nuevosArticulos[index].numero = value;
    form.setValue("articulos", nuevosArticulos);
  };

  const updateArticuloTexto = (index: number, value: string) => {
    const nuevosArticulos = [...articulos];
    nuevosArticulos[index].texto = value;
    form.setValue("articulos", nuevosArticulos);
  };

  const onSubmit = async (data: ResolucionFormValues) => {
    try {
      const payload = {
        ...data,
        fecha: new Date(data.fecha).toISOString(),
        numero: parseInt(data.numero),
        anio: parseInt(data.anio),
        articulos: JSON.stringify(data.articulos),
        boletinId: boletinSeleccionado,
      };

      let response;
      if (editingId) {
        response = await fetch(`/api/resoluciones/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/resoluciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) throw new Error("Error al guardar");

      if (editingId) {
        toast.success("Resolución actualizada correctamente");
      } else {
        toast.success("Resolución guardada correctamente");
      }

      resetForm();
      await loadBoletinActual();
      await loadBoletines();
    } catch (error) {
      toast.error("Error al guardar la resolución");
      console.error(error);
    }
  };

  const handleEdit = (resolucion: Resolucion) => {
    const articulosRaw = JSON.parse(resolucion.articulos);

    const articulosParsed: Articulo[] = articulosRaw.map(
      (art: string | Articulo, index: number) => {
        if (typeof art === "string") {
          const match = art.match(/^ARTÍCULO\s*(\d+)º?\s*[:\s]?\s*(.*)$/i);
          if (match) {
            return { numero: match[1], texto: match[2] };
          }
          return { numero: (index + 1).toString(), texto: art };
        }
        return art;
      }
    );

    form.reset({
      lugar: resolucion.lugar,
      fecha: new Date(resolucion.fecha).toISOString().split("T")[0],
      tipo: resolucion.tipo as "RESOLUCIÓN" | "PROMULGACIÓN",
      numero: resolucion.numero.toString(),
      anio: resolucion.anio.toString(),
      titulo: resolucion.titulo,
      visto: resolucion.visto || "",
      considerando: resolucion.considerando || "",
      articulos: articulosParsed,
      cierre: resolucion.cierre || "",
    });

    setEditingId(resolucion.id);
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/resoluciones/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar");

      toast.success("Resolución eliminada correctamente");
      await loadBoletinActual();
      await loadBoletines();
    } catch (error) {
      toast.error("Error al eliminar la resolución");
      console.error(error);
    }
  };

  const resetForm = () => {
    form.reset({
      lugar: "San Isidro (Ctes.)",
      fecha: new Date().toISOString().split("T")[0],
      tipo: "RESOLUCIÓN",
      numero: "",
      anio: new Date().getFullYear().toString(),
      titulo: "",
      visto: "",
      considerando: "",
      articulos: [{ numero: "1", texto: "" }],
      cierre: "Comuníquese, regístrese, publíquese y archívese.",
    });
    setEditingId(null);
    setIsFormVisible(false);
  };

  const generarPDF = async (download: boolean = true) => {
    if (!boletinActual || !boletinActual.resoluciones?.length) {
      toast.error("No hay resoluciones para generar el boletín");
      return;
    }

    const allResoluciones = [
      ...(boletinActual.promulgaciones || []),
      ...(boletinActual.resoluciones || []),
    ];

    try {
      if (!download) {
        setIsGeneratingPreview(true);
      }

      const response = await fetch("/api/boletin/generar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: allResoluciones.map((r) => r.id),
          boletinId: boletinActual.id,
          formato: formatoPDF,
        }),
      });

      if (!response.ok) throw new Error("Error al generar PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `boletin-oficial-${boletinActual.numero}-${boletinActual.mesNombre}-${boletinActual.anio}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("PDF generado correctamente");
      } else {
        if (pdfPreviewUrl) {
          window.URL.revokeObjectURL(pdfPreviewUrl);
        }
        setPdfPreviewUrl(url);
      }
    } catch (error) {
      toast.error("Error al generar el PDF");
      console.error(error);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const closePreview = () => {
    if (pdfPreviewUrl) {
      window.URL.revokeObjectURL(pdfPreviewUrl);
    }
    setPdfPreviewUrl(null);
  };

  const verResolucion = (resolucion: Resolucion) => {
    setViewingResolucion(resolucion);
  };

  const closeViewResolucion = () => {
    setViewingResolucion(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const ResolucionCard = ({ resolucion }: { resolucion: Resolucion }) => {
    const articulosParsed = JSON.parse(resolucion.articulos) as (
      | string
      | Articulo
    )[];
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{resolucion.tipo}</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDate(resolucion.fecha)}
                </span>
              </div>
              <CardTitle className="text-lg">
                Nº {resolucion.numero}/{resolucion.anio.toString().slice(-2)}
              </CardTitle>
              <CardDescription className="text-sm mt-1 line-clamp-2">
                {resolucion.titulo}
              </CardDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => verResolucion(resolucion)}
                title="Ver detalles"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(resolucion)}
                title="Editar"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(resolucion.id)}
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            {articulosParsed.length} artículo
            {articulosParsed.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white shadow-sm z-10">
        <div className="px-0 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <img
                src="/logo-municipalidad.png"
                alt="Logo Municipalidad"
                className="h-24 w-24 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Boletín Oficial Municipal
                </h1>
                <p className="text-sm text-slate-500">
                  Sistema de gestión de documentos oficiales
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <BoletinSidebar
            boletines={boletines}
            boletinesPorAnio={boletinesPorAnio}
            boletinSeleccionado={boletinSeleccionado}
            onSelectBoletin={setBoletinSeleccionado}
            onCrearBoletin={() => setIsCrearBoletinModalOpen(true)}
          />
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {isFormVisible ? (
            // Formulario de resolución
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>
                  {editingId
                    ? "Editar Resolución/Promulgación"
                    : "Nueva Resolución/Promulgación"}
                </CardTitle>
                <CardDescription>
                  {boletinActual
                    ? `Se agregará al Boletín ${boletinActual.mesNombre} ${boletinActual.anio}`
                    : "Seleccione un boletín primero"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* Datos básicos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="lugar"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lugar</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="San Isidro (Ctes.)"
                              />
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
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione el tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="RESOLUCIÓN">
                                  RESOLUCIÓN
                                </SelectItem>
                                <SelectItem value="PROMULGACIÓN">
                                  PROMULGACIÓN
                                </SelectItem>
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
                              <Input
                                {...field}
                                type="number"
                                placeholder="1731"
                              />
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
                              <Input
                                {...field}
                                type="number"
                                placeholder="2025"
                              />
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
                            <Input
                              {...field}
                              placeholder="DISPONIENDO LA RECONSTRUCCIÓN DEL EXPEDIENTE ADMINISTRATIVO..."
                            />
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
                        <Button
                          type="button"
                          onClick={addArticulo}
                          variant="outline"
                          size="sm"
                        >
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
                                onChange={(e) =>
                                  updateArticuloNumero(index, e.target.value)
                                }
                                placeholder="N°"
                              />
                            </div>
                            <div className="flex-1">
                              <Textarea
                                value={articulo.texto}
                                onChange={(e) =>
                                  updateArticuloTexto(index, e.target.value)
                                }
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
                          <FormLabel>
                            Cierre Administrativo (opcional)
                          </FormLabel>
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={!boletinSeleccionado}>
                        {editingId ? "Actualizar" : "Guardar"} Resolución
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : !boletinSeleccionado ? (
            // Estado sin boletín seleccionado
            <div className="flex items-center justify-center h-full">
              <Card className="max-w-md text-center">
                <CardContent className="pt-6">
                  <FileText className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-slate-700">
                    Seleccione un Boletín
                  </h3>
                  <p className="text-slate-500 mb-6">
                    Elija un boletín del panel izquierdo o cree uno nuevo para
                    comenzar.
                  </p>
                  <Button
                    onClick={() => setIsCrearBoletinModalOpen(true)}
                    className="gap-2 bg-[#416b9d] hover:bg-[#355a87]"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Nuevo Boletín
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : isLoading ? (
            // Loading state
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#416b9d] mb-4" />
                <p className="text-slate-500">Cargando boletín...</p>
              </div>
            </div>
          ) : boletinActual ? (
            // Contenido del boletín
            <div className="space-y-6">
              {/* Header del boletín */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Boletín Oficial N° {boletinActual.numero}
                      </h2>
                      {boletinActual.activo && (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-500">
                      {boletinActual.mesNombre} {boletinActual.anio}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      {(boletinActual.totalPromulgaciones || 0) +
                        (boletinActual.totalResoluciones || 0)}{" "}
                      documentos en total
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!boletinActual.activo && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleActivarBoletin(boletinActual.id)
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como activo
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            handleEliminarBoletin(boletinActual.id)
                          }
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar boletín
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Select
                      value={formatoPDF}
                      onValueChange={(value: "a4" | "legal") =>
                        setFormatoPDF(value)
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="legal">Oficio/Legal</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => generarPDF(false)}
                      variant="outline"
                      className="gap-2"
                      disabled={
                        isGeneratingPreview ||
                        (!boletinActual.promulgaciones?.length &&
                          !boletinActual.resoluciones?.length)
                      }
                    >
                      {isGeneratingPreview ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      Vista Previa
                    </Button>
                    <Button
                      onClick={() => generarPDF(true)}
                      className="gap-2 bg-[#416b9d] hover:bg-[#355a87]"
                      disabled={
                        !boletinActual.promulgaciones?.length &&
                        !boletinActual.resoluciones?.length
                      }
                    >
                      <Download className="h-4 w-4" />
                      Descargar PDF
                    </Button>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    form.setValue("tipo", "PROMULGACIÓN");
                    setIsFormVisible(true);
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Promulgación
                </Button>
                <Button
                  onClick={() => {
                    form.setValue("tipo", "RESOLUCIÓN");
                    setIsFormVisible(true);
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Resolución
                </Button>
              </div>

              {/* Promulgaciones */}
              {boletinActual.promulgaciones &&
                boletinActual.promulgaciones.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                      <Badge variant="outline">
                        {boletinActual.promulgaciones.length}
                      </Badge>
                      Promulgaciones
                    </h3>
                    <div className="grid gap-3">
                      {boletinActual.promulgaciones.map((promulgacion) => (
                        <ResolucionCard
                          key={promulgacion.id}
                          resolucion={promulgacion}
                        />
                      ))}
                    </div>
                  </div>
                )}

              {/* Resoluciones */}
              {boletinActual.resoluciones &&
                boletinActual.resoluciones.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                      <Badge variant="outline">
                        {boletinActual.resoluciones.length}
                      </Badge>
                      Resoluciones
                    </h3>
                    <div className="grid gap-3">
                      {boletinActual.resoluciones.map((resolucion) => (
                        <ResolucionCard
                          key={resolucion.id}
                          resolucion={resolucion}
                        />
                      ))}
                    </div>
                  </div>
                )}

              {/* Estado vacío */}
              {!boletinActual.promulgaciones?.length &&
                !boletinActual.resoluciones?.length && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <FileText className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                      <h3 className="text-xl font-semibold mb-2 text-slate-700">
                        Boletín vacío
                      </h3>
                      <p className="text-slate-500 mb-6">
                        Este boletín aún no tiene documentos. Agregue una
                        promulgación o resolución.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => {
                            form.setValue("tipo", "PROMULGACIÓN");
                            setIsFormVisible(true);
                          }}
                          variant="outline"
                        >
                          <FilePlus className="mr-2 h-4 w-4" />
                          Nueva Promulgación
                        </Button>
                        <Button
                          onClick={() => {
                            form.setValue("tipo", "RESOLUCIÓN");
                            setIsFormVisible(true);
                          }}
                        >
                          <FilePlus className="mr-2 h-4 w-4" />
                          Nueva Resolución
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          ) : null}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="px-6 py-3 text-center text-sm text-slate-500">
          Municipalidad de San Isidro - Sistema de Boletín Oficial ©{" "}
          {new Date().getFullYear()}
        </div>
      </footer>

      {/* Modal Crear Boletín */}
      <CrearBoletinModal
        isOpen={isCrearBoletinModalOpen}
        onClose={() => setIsCrearBoletinModalOpen(false)}
        onCrear={handleCrearBoletin}
      />

      {/* Modal de Vista Previa del PDF */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-slate-50 rounded-t-lg">
              <h2 className="text-lg font-semibold text-slate-900">
                Vista Previa del Boletín Oficial
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => generarPDF(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
                <Button onClick={closePreview} variant="outline" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-2 bg-slate-200">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full rounded border-0"
                title="Vista previa del PDF"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ver Detalles de Resolución */}
      {viewingResolucion && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-slate-50 rounded-t-lg">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {viewingResolucion.tipo} Nº {viewingResolucion.numero}/
                  {viewingResolucion.anio.toString().slice(-2)}
                </h2>
                <p className="text-sm text-slate-600">
                  {viewingResolucion.titulo}
                </p>
              </div>
              <Button
                onClick={closeViewResolucion}
                variant="outline"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="text-right text-slate-600">
                {viewingResolucion.lugar},{" "}
                {new Date(viewingResolucion.fecha).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>

              {viewingResolucion.visto && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">VISTO:</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {viewingResolucion.visto}
                  </p>
                </div>
              )}

              {viewingResolucion.considerando && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    CONSIDERANDO:
                  </h3>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {viewingResolucion.considerando}
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-bold text-slate-900 mb-2">ARTÍCULOS:</h3>
                <div className="space-y-3">
                  {(() => {
                    try {
                      const arts = JSON.parse(viewingResolucion.articulos);
                      return (Array.isArray(arts) ? arts : [arts]).map(
                        (art: string | Articulo, idx: number) => (
                          <p key={idx} className="text-slate-700">
                            {typeof art === "string"
                              ? art
                              : `ARTÍCULO ${art.numero}º: ${art.texto}`}
                          </p>
                        )
                      );
                    } catch {
                      return (
                        <p className="text-slate-700">
                          {viewingResolucion.articulos}
                        </p>
                      );
                    }
                  })()}
                </div>
              </div>

              {viewingResolucion.cierre && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">CIERRE:</h3>
                  <p className="text-slate-700">{viewingResolucion.cierre}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
