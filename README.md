# 📰 Sistema de Boletín Oficial Municipal

Sistema de gestión y generación de documentos oficiales para la Municipalidad de San Isidro, Corrientes.

## ✨ Características

- 📝 **Gestión de Resoluciones y Promulgaciones** - Crear, editar y eliminar documentos oficiales
- 📄 **Generación de PDF** - Boletín oficial con encabezado y pie de página institucional
- 👁️ **Vista Previa** - Previsualizar el PDF antes de descargar
- 🎨 **Diseño Institucional** - Encabezado azul con logo municipal y pie de página decorativo
- 📱 **Responsive** - Interfaz adaptable a diferentes dispositivos

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar base de datos
npm run db:generate
npm run db:push

# Cargar datos de ejemplo (opcional)
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── boletin/
│   │   │   └── generar-pdf/
│   │   │       └── route.ts    # Generación del PDF
│   │   └── resoluciones/
│   │       ├── [id]/
│   │       │   └── route.ts    # CRUD individual
│   │       └── route.ts        # Lista y creación
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Interfaz principal
├── components/
│   └── ui/                     # Componentes shadcn/ui
├── hooks/
└── lib/
    ├── db.ts                   # Cliente Prisma
    └── utils.ts

prisma/
├── schema.prisma               # Esquema de base de datos
└── seed.ts                     # Datos de ejemplo

public/
└── logo-municipalidad.png      # Logo institucional
```

## 🗄️ Base de Datos

### Modelo `Resolucion`

| Campo        | Tipo     | Descripción                          |
|-------------|----------|--------------------------------------|
| id          | String   | Identificador único                  |
| lugar       | String   | Lugar de emisión                     |
| fecha       | DateTime | Fecha del documento                  |
| tipo        | String   | RESOLUCIÓN o PROMULGACIÓN            |
| numero      | Int      | Número del documento                 |
| anio        | Int      | Año del documento                    |
| titulo      | String   | Título o asunto                      |
| visto       | String?  | Sección VISTO                        |
| considerando| String?  | Sección CONSIDERANDO                 |
| articulos   | String   | JSON con lista de artículos          |
| cierre      | String?  | Cierre administrativo                |

### Comandos de Base de Datos

```bash
# Generar cliente Prisma
npm run db:generate

# Aplicar esquema a la base de datos
npm run db:push

# Cargar datos de ejemplo
npm run db:seed

# Ejecutar migraciones
npm run db:migrate

# Resetear base de datos
npm run db:reset
```

## 📄 Generación de PDF

El sistema genera un PDF con:

### Encabezado
- Fondo azul (#416b9d)
- Logo de la municipalidad
- "MUNICIPALIDAD DE SAN ISIDRO"
- Dirección y provincia
- Año, número de boletín y mes

### Contenido
- Título de sección: "DEPARTAMENTO EJECUTIVO MUNICIPAL"
- Cuadro con tipo: "PROMULGACIONES" o "RESOLUCIONES"
- Fecha alineada a la derecha
- Número de resolución alineado a la izquierda
- Título, VISTO, CONSIDERANDO
- Texto de transición ("POR ELLO," / "EL INTENDENTE MUNICIPAL...")
- Artículos
- Cierre administrativo

### Pie de Página
- Fondo azul (#416b9d)
- Línea decorativa con ornamentos
- Número de página dinámico

## 🛠️ Tecnologías

- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4
- **Componentes**: shadcn/ui
- **Base de Datos**: SQLite + Prisma ORM
- **PDF**: jsPDF
- **Formularios**: React Hook Form + Zod

## 📝 API Endpoints

### Resoluciones

| Método | Endpoint                    | Descripción              |
|--------|----------------------------|--------------------------|
| GET    | `/api/resoluciones`        | Listar todas             |
| POST   | `/api/resoluciones`        | Crear nueva              |
| GET    | `/api/resoluciones/[id]`   | Obtener por ID           |
| PUT    | `/api/resoluciones/[id]`   | Actualizar               |
| DELETE | `/api/resoluciones/[id]`   | Eliminar                 |

### Boletín

| Método | Endpoint                    | Descripción              |
|--------|----------------------------|--------------------------|
| POST   | `/api/boletin/generar-pdf` | Generar PDF del boletín  |

**Body del POST:**
```json
{
  "ids": ["id1", "id2", "id3"]
}
```

## 🎨 Personalización

### Logo
Reemplazar `public/logo-municipalidad.png` con el logo institucional deseado.

### Colores
Modificar el color del encabezado/pie de página en `src/app/api/boletin/generar-pdf/route.ts`:
```typescript
pdf.setFillColor(65, 107, 157); // RGB del color azul
```

### Textos Institucionales
Editar los textos del encabezado en la función `drawHeader()`:
- Nombre de la municipalidad
- Dirección
- Provincia

## 📋 Scripts Disponibles

```bash
npm run dev        # Desarrollo
npm run build      # Compilar para producción
npm run start      # Iniciar en producción
npm run lint       # Verificar código
npm run db:push    # Sincronizar esquema
npm run db:generate # Generar cliente Prisma
npm run db:seed    # Cargar datos de ejemplo
npm run db:migrate # Ejecutar migraciones
npm run db:reset   # Resetear base de datos
```

---

Desarrollado para la **Municipalidad de San Isidro, Corrientes** 🏛️
