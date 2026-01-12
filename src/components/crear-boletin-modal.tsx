"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"

const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
]

interface CrearBoletinModalProps {
  isOpen: boolean
  onClose: () => void
  onCrear: (data: { numero: number; anio: number; mes: number; activo: boolean }) => Promise<void>
}

export function CrearBoletinModal({ isOpen, onClose, onCrear }: CrearBoletinModalProps) {
  const currentDate = new Date()
  const [numero, setNumero] = useState("")
  const [anio, setAnio] = useState(currentDate.getFullYear().toString())
  const [mes, setMes] = useState((currentDate.getMonth() + 1).toString())
  const [activo, setActivo] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!numero || !anio || !mes) {
      setError("Todos los campos son requeridos")
      return
    }

    setIsLoading(true)
    try {
      await onCrear({
        numero: parseInt(numero),
        anio: parseInt(anio),
        mes: parseInt(mes),
        activo,
      })
      // Reset form
      setNumero("")
      setAnio(currentDate.getFullYear().toString())
      setMes((currentDate.getMonth() + 1).toString())
      setActivo(true)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear boletín")
    } finally {
      setIsLoading(false)
    }
  }

  // Generar opciones de años (últimos 5 años y próximos 2)
  const anios = Array.from({ length: 8 }, (_, i) => currentDate.getFullYear() - 5 + i)

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-900">Crear Nuevo Boletín</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="numero">Número de Boletín</Label>
            <Input
              id="numero"
              type="number"
              placeholder="Ej: 1731"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="anio">Año</Label>
              <Select value={anio} onValueChange={setAnio}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  {anios.map((a) => (
                    <SelectItem key={a} value={a.toString()}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mes">Mes</Label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="activo" className="text-base">Marcar como activo</Label>
              <p className="text-sm text-slate-500">
                Las nuevas resoluciones irán a este boletín
              </p>
            </div>
            <Switch
              id="activo"
              checked={activo}
              onCheckedChange={setActivo}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#416b9d] hover:bg-[#355a87]"
            >
              {isLoading ? "Creando..." : "Crear Boletín"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

