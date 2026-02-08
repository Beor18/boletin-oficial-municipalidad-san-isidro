"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Plus, Calendar, FileText, Circle, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Boletin {
  id: string
  numero: number
  anio: number
  mes: number
  mesNombre: string
  activo: boolean
  cerrado?: boolean
  cantidadResoluciones?: number
  _count?: {
    resoluciones: number
  }
}

interface BoletinesPorAnio {
  [anio: number]: Boletin[]
}

interface BoletinSidebarProps {
  boletines: Boletin[]
  boletinesPorAnio: BoletinesPorAnio
  boletinSeleccionado: string | null
  onSelectBoletin: (id: string) => void
  onCrearBoletin: () => void
}

export function BoletinSidebar({
  boletinesPorAnio,
  boletinSeleccionado,
  onSelectBoletin,
  onCrearBoletin,
}: BoletinSidebarProps) {
  const [aniosExpandidos, setAniosExpandidos] = useState<Set<number>>(() => {
    // Por defecto expandir el año actual
    return new Set([new Date().getFullYear()])
  })

  const toggleAnio = (anio: number) => {
    const newSet = new Set(aniosExpandidos)
    if (newSet.has(anio)) {
      newSet.delete(anio)
    } else {
      newSet.add(anio)
    }
    setAniosExpandidos(newSet)
  }

  const anios = Object.keys(boletinesPorAnio)
    .map(Number)
    .sort((a, b) => b - a) // Orden descendente

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r">
      {/* Header del sidebar */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-[#416b9d]" />
          <h2 className="font-semibold text-slate-800">Boletines</h2>
        </div>
        <Button 
          onClick={onCrearBoletin} 
          size="sm" 
          className="w-full gap-2 bg-[#416b9d] hover:bg-[#355a87]"
        >
          <Plus className="h-4 w-4" />
          Nuevo Boletín
        </Button>
      </div>

      {/* Lista de boletines */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {anios.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay boletines</p>
              <p className="text-xs mt-1">Crea uno para comenzar</p>
            </div>
          ) : (
            anios.map((anio) => (
              <div key={anio} className="mb-1">
                {/* Año */}
                <button
                  onClick={() => toggleAnio(anio)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  {aniosExpandidos.has(anio) ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                  <span>{anio}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {boletinesPorAnio[anio].length}
                  </Badge>
                </button>

                {/* Meses del año */}
                {aniosExpandidos.has(anio) && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {boletinesPorAnio[anio]
                      .sort((a, b) => b.mes - a.mes)
                      .map((boletin) => {
                        const cantidad = boletin.cantidadResoluciones ?? boletin._count?.resoluciones ?? 0
                        const isSelected = boletin.id === boletinSeleccionado
                        
                        return (
                          <button
                            key={boletin.id}
                            onClick={() => onSelectBoletin(boletin.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-md transition-colors",
                              isSelected
                                ? "bg-[#416b9d] text-white"
                                : "text-slate-600 hover:bg-slate-100"
                            )}
                          >
                            {boletin.cerrado ? (
                              <Archive className={cn(
                                "h-3 w-3",
                                isSelected ? "text-slate-300" : "text-slate-500"
                              )} />
                            ) : boletin.activo ? (
                              <Circle className={cn(
                                "h-2 w-2 fill-current",
                                isSelected ? "text-green-300" : "text-green-500"
                              )} />
                            ) : (
                              <span className="w-3" />
                            )}
                            <span className="flex-1">{boletin.mesNombre}</span>
                            {cantidad > 0 && (
                              <Badge 
                                variant={isSelected ? "outline" : "secondary"} 
                                className={cn(
                                  "text-xs",
                                  isSelected && "border-white/50 text-white"
                                )}
                              >
                                {cantidad}
                              </Badge>
                            )}
                            {boletin.cerrado ? (
                              <Badge 
                                className={cn(
                                  "text-xs",
                                  isSelected 
                                    ? "bg-slate-400 text-slate-900" 
                                    : "bg-slate-100 text-slate-600"
                                )}
                              >
                                Archivado
                              </Badge>
                            ) : boletin.activo ? (
                              <Badge 
                                className={cn(
                                  "text-xs",
                                  isSelected 
                                    ? "bg-green-400 text-green-900" 
                                    : "bg-green-100 text-green-700"
                                )}
                              >
                                Activo
                              </Badge>
                            ) : null}
                          </button>
                        )
                      })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

