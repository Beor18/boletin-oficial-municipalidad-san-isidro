import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white shadow-sm z-10">
        <div className="px-0 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Skeleton className="h-24 w-24 rounded" />
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="w-64 flex-shrink-0 bg-slate-50 border-r">
          <div className="p-4 border-b bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="p-2 space-y-2">
            {/* Año */}
            <Skeleton className="h-8 w-full" />
            {/* Meses */}
            <div className="ml-4 space-y-1">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
            {/* Otro año */}
            <Skeleton className="h-8 w-full" />
          </div>
        </div>

        {/* Content Area Skeleton */}
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Header del boletín */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-36" />
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-36" />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <Skeleton className="h-10 w-44" />
              <Skeleton className="h-10 w-40" />
            </div>

            {/* Sección de documentos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-6 w-28" />
              </div>
              <div className="grid gap-3">
                {/* Cards de resoluciones */}
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-6 w-20 mb-1" />
                          <Skeleton className="h-4 w-full max-w-md" />
                        </div>
                        <div className="flex gap-1">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Skeleton className="h-3 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="px-6 py-3 text-center">
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </footer>
    </div>
  );
}
