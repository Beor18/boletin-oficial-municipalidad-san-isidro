import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsPDF } from "jspdf";
import { readFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, boletinId, formato = "a4" } = body; // formato: "a4" | "legal"

    const resoluciones = await db.resolucion.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      orderBy: [{ tipo: "asc" }, { anio: "asc" }, { numero: "asc" }],
    });

    if (resoluciones.length === 0) {
      return NextResponse.json(
        { error: "No hay resoluciones para generar el boletín" },
        { status: 400 }
      );
    }

    // Leer logo oficial de la municipalidad (escudo/emblema)
    let logoBase64: string | null = null;
    try {
      // Intentar cargar el logo oficial desde diferentes ubicaciones posibles
      const logoPaths = [
        join(process.cwd(), "public", "logo-municipalidad.png"),
        join(process.cwd(), "upload", "Group 5 (2).png"),
      ];

      for (const logoPath of logoPaths) {
        try {
          const logoBuffer = await readFile(logoPath);
          logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
          console.log(`Logo cargado desde: ${logoPath}`);
          break;
        } catch (err) {
          continue;
        }
      }

      if (!logoBase64) {
        console.warn(
          "No se encontró el logo oficial. El encabezado se generará sin logo."
        );
      }
    } catch (error) {
      console.error("Error cargando logo:", error);
    }

    // Obtener datos del boletín
    let anioBoletin = new Date().getFullYear();
    let numeroBoletin = 1;
    let mesBoletin = new Date().getMonth() + 1;

    if (boletinId) {
      const boletin = await db.boletin.findUnique({
        where: { id: boletinId },
      });
      if (boletin) {
        anioBoletin = boletin.anio;
        numeroBoletin = boletin.numero;
        mesBoletin = boletin.mes;
      }
    }

    const meses = [
      "ENERO",
      "FEBRERO",
      "MARZO",
      "ABRIL",
      "MAYO",
      "JUNIO",
      "JULIO",
      "AGOSTO",
      "SEPTIEMBRE",
      "OCTUBRE",
      "NOVIEMBRE",
      "DICIEMBRE",
    ];
    const nombreMes = meses[mesBoletin - 1];

    // Formatos: A4 (210x297mm) o Legal/Oficio (216x356mm)
    const pdf = new jsPDF({
      unit: "mm",
      format: formato === "legal" ? "legal" : "a4",
      orientation: "portrait",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    const headerHeight = 27.8; // 2.78 cm según especificación
    let currentY = margin + headerHeight;

    const ensureSpace = (minHeight: number) => {
      if (currentY + minHeight > pageHeight - margin - footerHeight) {
        pdf.addPage();
        currentY = margin + headerHeight;
        drawHeader();
      }
    };

    const drawCover = () => {
      // Fondo azul institucional
      pdf.setFillColor(65, 107, 157);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      // Logo centrado
      if (logoBase64) {
        const logoSize = 45;
        const logoX = (pageWidth - logoSize) / 2;
        const logoY = 55;

        pdf.addImage(
          logoBase64,
          "PNG",
          logoX,
          logoY,
          logoSize,
          logoSize,
          undefined,
          "FAST"
        );
      }

      pdf.setTextColor(255, 255, 255);

      // MUNICIPALIDAD
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("MUNICIPALIDAD DE SAN ISIDRO", pageWidth / 2, 120, {
        align: "center",
      });

      // Dirección
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text(
        "Av. Julián Urquijo y Av. Primer Intendente",
        pageWidth / 2,
        130,
        { align: "center" }
      );

      // Provincia
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("PROVINCIA DE CORRIENTES", pageWidth / 2, 140, {
        align: "center",
      });

      // Espacio grande
      let y = 175;

      // Año y boletín
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.text(
        `AÑO ${anioBoletin}  BOLETÍN OFICIAL N° ${numeroBoletin}`,
        pageWidth / 2,
        y,
        { align: "center" }
      );

      y += 12;

      // Mes
      pdf.text(`MES ${mesBoletin} / ${nombreMes}`, pageWidth / 2, y, {
        align: "center",
      });

      // Restaurar color negro para el resto del documento
      pdf.setTextColor(0, 0, 0);
    };

    // Función para dibujar el encabezado exacto según la referencia
    const drawHeader = () => {
      // Color azul de fondo #416b9d (RGB: 65, 107, 157)
      pdf.setFillColor(65, 107, 157);
      pdf.rect(0, 0, pageWidth, headerHeight, "F");

      // Agregar logo oficial (escudo/emblema) a la izquierda
      const logoMarginLeft = 4; // Margen izquierdo del logo
      const logoSize = 22; // Tamaño del logo proporcional al nuevo alto
      if (logoBase64) {
        try {
          const logoX = logoMarginLeft;
          const logoY = (headerHeight - logoSize) / 2;
          pdf.addImage(
            logoBase64,
            "PNG",
            logoX,
            logoY,
            logoSize,
            logoSize,
            undefined,
            "FAST"
          );
        } catch (error) {
          console.error("Error agregando logo:", error);
        }
      }

      // Configurar color de texto blanco para todo el encabezado
      pdf.setTextColor(255, 255, 255);

      // Posiciones verticales ajustadas al nuevo alto
      const linea1Y = 10; // Línea superior: "MUNICIPALIDAD" y "AÑO/BOLETIN"
      const linea2IzquierdaY = 16; // Línea media izquierda: "Dirección"
      const linea2DerechaY = 18; // Línea media derecha: "MES"
      const linea3Y = 20; // Línea inferior: "PROVINCIA"

      // === IZQUIERDA ===
      // Posición X después del logo
      const textoPrincipalX = logoBase64 ? logoMarginLeft + logoSize + 0 : 10;

      // Texto principal: "MUNICIPALIDAD DE SAN ISIDRO" - grande, bold, blanco
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      const textoPrincipal = "MUNICIPALIDAD DE SAN ISIDRO";
      pdf.text(textoPrincipal, textoPrincipalX, linea1Y);

      // Calcular ancho del texto principal para centrar los textos debajo
      const textoPrincipalWidth = pdf.getTextWidth(textoPrincipal);
      const textoCentradoX = textoPrincipalX + textoPrincipalWidth / 2;

      // Texto secundario: "Av. Julián Urquijo y Av. Primer Intendente" - normal, pequeño, CENTRADO
      pdf.setFontSize(8.4);
      pdf.setFont("helvetica", "normal");
      const direccion = "Av. Julián Urquijo y Av. Primer Intendente";
      const direccionWidth = pdf.getTextWidth(direccion);
      const direccionX = textoCentradoX - direccionWidth / 2;
      pdf.text(direccion, direccionX, linea2IzquierdaY);

      // Texto: "PROVINCIA DE CORRIENTES" - normal, pequeño, CENTRADO
      pdf.setFontSize(8.4);
      pdf.setFont("helvetica", "bold");
      const provincia = "PROVINCIA DE CORRIENTES";
      const provinciaWidth = pdf.getTextWidth(provincia);
      const provinciaX = textoCentradoX - provinciaWidth / 2;
      pdf.text(provincia, provinciaX, linea3Y);

      // === DERECHA ===
      // Posición X para el bloque derecho (ajustado para coincidir con la captura)
      const textoDerechaInicioX = pageWidth - 68;

      // Línea 1: "AÑO [año]" (normal) + " BOLETIN OFICIAL N° [número]" (bold)
      const textoAnio = `AÑO ${anioBoletin} `;
      const textoBoletin = `BOLETIN OFICIAL N° ${numeroBoletin}`;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      const textoAnioWidth = pdf.getTextWidth(textoAnio);

      // "AÑO [año]" (normal)
      pdf.text(textoAnio, textoDerechaInicioX, linea1Y);

      // "BOLETIN OFICIAL N° [número]" (bold)
      pdf.setFont("helvetica", "bold");
      pdf.text(textoBoletin, textoDerechaInicioX + textoAnioWidth, linea1Y);

      // Línea 2: "MES [mes] / [nombre del mes]" - normal
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      const textoDerecha2 = `MES ${mesBoletin} / ${nombreMes}`;
      pdf.text(textoDerecha2, textoDerechaInicioX, linea2DerechaY);

      // Restaurar color de texto negro para el contenido
      pdf.setTextColor(0, 0, 0);
    };

    // Altura del pie de página
    const footerHeight = 25;

    // Función para dibujar el pie de página con línea decorativa y número de página
    const drawFooter = (pageNumber: number) => {
      const footerY = pageHeight - footerHeight;

      // Fondo azul del pie de página (mismo color que el encabezado)
      pdf.setFillColor(65, 107, 157);
      pdf.rect(0, footerY, pageWidth, footerHeight, "F");

      // Configurar color blanco para los elementos
      pdf.setDrawColor(255, 255, 255);
      pdf.setFillColor(255, 255, 255);
      pdf.setTextColor(255, 255, 255);

      // Posición central y de la línea
      const centerX = pageWidth / 2;
      const lineY = footerY + 8;
      const lineWidth = 80; // Ancho de la línea decorativa

      // Dibujar línea izquierda
      pdf.setLineWidth(0.3);
      pdf.line(centerX - lineWidth, lineY, centerX - 12, lineY);

      // Dibujar línea derecha
      pdf.line(centerX + 12, lineY, centerX + lineWidth, lineY);

      // 🔵 CÍRCULO CENTRAL (faltaba este)
      pdf.circle(centerX, lineY, 1, "F");

      // Dibujar ornamentos decorativos laterales
      const ornamentSize = 1.5;

      // Ornamento izquierdo
      pdf.circle(centerX - 8, lineY, ornamentSize, "F");

      // Ornamento central izquierdo
      pdf.circle(centerX - 4, lineY, ornamentSize * 0.8, "F");

      // Ornamento central derecho
      pdf.circle(centerX + 4, lineY, ornamentSize * 0.8, "F");

      // Ornamento derecho
      pdf.circle(centerX + 8, lineY, ornamentSize, "F");

      // Número de página centrado debajo de la línea
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      const pageText = `${pageNumber}`;
      const pageTextWidth = pdf.getTextWidth(pageText);
      pdf.text(pageText, centerX - pageTextWidth / 2, lineY + 8);

      // Restaurar colores
      pdf.setDrawColor(0, 0, 0);
      pdf.setFillColor(0, 0, 0);
      pdf.setTextColor(0, 0, 0);
    };

    const drawSeparatorLine = () => {
      const separatorHeight = 18;
      const lineY = currentY + 6;

      // Control de espacio
      if (lineY + separatorHeight > pageHeight - margin - footerHeight) {
        pdf.addPage();
        currentY = margin + headerHeight;
        drawHeader();
        return;
      }

      const centerX = pageWidth / 2;

      // Estilo institucional
      pdf.setDrawColor(65, 107, 157);
      pdf.setLineWidth(0.6);

      // Líneas laterales
      pdf.line(margin, lineY, centerX - 4, lineY);
      pdf.line(centerX + 4, lineY, pageWidth - margin, lineY);

      // 🔵 CÍRCULO CENTRAL (relleno)
      pdf.setFillColor(65, 107, 157);
      pdf.circle(centerX, lineY, 2, "F");

      currentY += separatorHeight;
    };

    // ===== TAPA =====
    drawCover();

    // ===== PÁGINA 2 → CONTENIDO =====
    pdf.addPage();
    currentY = margin + headerHeight;
    drawHeader();

    // Función helper para formatear fecha en mayúsculas
    const formatDate = (date: Date) => {
      const d = new Date(date);
      const months = [
        "ENERO",
        "FEBRERO",
        "MARZO",
        "ABRIL",
        "MAYO",
        "JUNIO",
        "JULIO",
        "AGOSTO",
        "SEPTIEMBRE",
        "OCTUBRE",
        "NOVIEMBRE",
        "DICIEMBRE",
      ];
      return `${d.getDate()} DE ${months[d.getMonth()]} DEL ${d.getFullYear()}`;
    };

    // Función helper para agregar texto con word wrap
    const addText = (
      text: string,
      fontSize: number,
      isBold: boolean = false,
      isUnderline: boolean = false
    ) => {
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", isBold ? "bold" : "normal");

      if (isUnderline) {
        const textWidth = pdf.getTextWidth(text);
        pdf.line(margin, currentY, margin + textWidth, currentY + 0.5);
      }

      const lines = pdf.splitTextToSize(text, contentWidth);
      lines.forEach((line: string) => {
        // Verificar si hay espacio considerando el pie de página
        if (currentY > pageHeight - margin - footerHeight) {
          pdf.addPage();
          currentY = margin + headerHeight;
          drawHeader();
        }
        pdf.text(line, margin, currentY);
        currentY += fontSize * 0.5;
      });
    };

    // Separar promulgaciones y resoluciones, ordenar promulgaciones primero
    const promulgaciones = resoluciones.filter(
      (r) => r.tipo === "PROMULGACIÓN"
    );
    const resolucionesNormales = resoluciones.filter(
      (r) => r.tipo === "RESOLUCIÓN"
    );
    const resolucionesOrdenadas = [...promulgaciones, ...resolucionesNormales];

    // Función para dibujar el título de sección
    const drawTituloSeccion = (tipoSeccion: string) => {
      // Título de sección: "DEPARTAMENTO EJECUTIVO MUNICIPAL" - centrado
      pdf.setFontSize(17);
      pdf.setFont("helvetica", "bold");
      const tituloDepartamento = "DEPARTAMENTO EJECUTIVO MUNICIPAL";
      const tituloDepartamentoWidth = pdf.getTextWidth(tituloDepartamento);
      const tituloDepartamentoX = (pageWidth - tituloDepartamentoWidth) / 2;
      pdf.text(tituloDepartamento, tituloDepartamentoX, currentY);
      currentY += 10;

      // Cuadro con tipo: "RESOLUCIONES" o "PROMULGACIONES"
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");

      const tipoSeccionWidth = pdf.getTextWidth(tipoSeccion);
      const tipoSeccionX = (pageWidth - tipoSeccionWidth) / 2;

      const paddingX = 8;
      const rectHeight = 8;
      const rectX = tipoSeccionX - paddingX;
      const rectY = currentY - rectHeight + 2;
      const rectWidth = tipoSeccionWidth + paddingX * 2;

      // Rectángulo
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(rectX, rectY, rectWidth, rectHeight);

      // Texto perfectamente centrado
      const textY = rectY + rectHeight / 2 + 1.5;
      pdf.text(tipoSeccion, tipoSeccionX, textY);

      currentY += rectHeight + 6;
    };

    // Variable para rastrear si ya se mostró el título de cada sección
    let tituloPromulgacionesMostrado = false;
    let tituloResolucionesMostrado = false;

    let yaHuboPromulgacion = false;
    let yaHuboResolucion = false;

    // Generar contenido para cada resolución
    resolucionesOrdenadas.forEach((resolucion, index) => {
      // if (index > 0) {
      //   pdf.addPage();
      //   currentY = margin + headerHeight;
      //   drawHeader();
      // }

      // Mostrar título de sección cuando corresponda
      if (resolucion.tipo === "PROMULGACIÓN" && !tituloPromulgacionesMostrado) {
        drawTituloSeccion("PROMULGACIONES");
        tituloPromulgacionesMostrado = true;
      } else if (
        resolucion.tipo === "RESOLUCIÓN" &&
        !tituloResolucionesMostrado
      ) {
        // 🔴 FORZAR página nueva
        pdf.addPage();
        currentY = margin + headerHeight;
        drawHeader();

        drawTituloSeccion("RESOLUCIONES");
        tituloResolucionesMostrado = true;
      }

      //drawSeparatorLine();

      if (
        (resolucion.tipo === "PROMULGACIÓN" && yaHuboPromulgacion) ||
        (resolucion.tipo === "RESOLUCIÓN" && yaHuboResolucion)
      ) {
        drawSeparatorLine();
      }

      // Lugar y fecha - ALINEADO A LA DERECHA
      const textoFecha = `${resolucion.lugar}, ${formatDate(resolucion.fecha)}`;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      const textoFechaWidth = pdf.getTextWidth(textoFecha);
      const textoFechaX = pageWidth - margin - textoFechaWidth; // Alineado a la derecha
      pdf.text(textoFecha, textoFechaX, currentY);
      ensureSpace(12);
      currentY += 12;

      // Tipo, número y año - ALINEADO A LA IZQUIERDA
      // Formato: RESOLUCIÓN Nº1771/25. (año con 2 dígitos)
      const anioCorto = resolucion.anio.toString().slice(-2);
      const textoResolucion = `RESOLUCIÓN D.E.M. Nº${resolucion.numero}/${anioCorto}.`;
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(textoResolucion, margin, currentY);

      // Subrayado
      const resolWidth = pdf.getTextWidth(textoResolucion);
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(0, 0, 0);
      pdf.line(margin, currentY + 1, margin + resolWidth, currentY + 1);

      currentY += 12; // Salto de línea adicional

      // ===== TÍTULO — negrita + subrayado (multilínea seguro) =====
      const titulo = resolucion.titulo.toUpperCase().trim();
      const lineasTitulo = pdf.splitTextToSize(titulo, contentWidth);

      lineasTitulo.forEach((linea: string) => {
        ensureSpace(10);

        // 🔒 Blindar estado SIEMPRE
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setDrawColor(0, 0, 0);

        pdf.text(linea, margin, currentY);

        const width = pdf.getTextWidth(linea);
        pdf.setLineWidth(0.4);
        pdf.line(margin, currentY + 1, margin + width, currentY + 1);

        currentY += 6;
      });

      currentY += 8;

      // ===== VISTO =====
      if (resolucion.visto) {
        ensureSpace(14);

        const encabezado = "VISTO:";
        const texto = resolucion.visto.trim();

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");

        pdf.text(encabezado, margin, currentY);

        // Subrayado
        const headerWidth = pdf.getTextWidth(encabezado);
        pdf.setLineWidth(0.4);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(margin, currentY + 0.9, margin + headerWidth, currentY + 0.9);

        pdf.setFont("helvetica", "normal");

        // 👉 MISMA LÍNEA si es corto
        if (!texto.includes("\n") && texto.length < 180) {
          const startX = margin + headerWidth + 2;
          const availableWidth = pageWidth - margin - startX;

          const lines = pdf.splitTextToSize(texto, availableWidth);

          lines.forEach((line, index) => {
            pdf.text(line, index === 0 ? startX : margin, currentY);
            currentY += 5;
          });
        }
        // 👉 ABAJO si es largo
        else {
          currentY += 6;
          addText(texto, 10);
        }

        currentY += 6;
      }

      // CONSIDERANDO (si existe)
      if (resolucion.considerando) {
        ensureSpace(16);

        const encabezado = "CONSIDERANDO:";
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");

        // Encabezado
        pdf.text(encabezado, margin, currentY);

        // Subrayado
        const headerWidth = pdf.getTextWidth(encabezado);
        pdf.setLineWidth(0.4);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(margin, currentY + 0.9, margin + headerWidth, currentY + 0.9);

        const texto = resolucion.considerando.trim();
        const tieneVinetas = texto.includes("•");

        pdf.setFont("helvetica", "normal");

        if (!tieneVinetas) {
          // === CASO SIMPLE (una sola línea) ===
          const startX = margin + headerWidth + 2;
          const availableWidth = pageWidth - margin - startX;

          const lines = pdf.splitTextToSize(texto, availableWidth);

          lines.forEach((line, index) => {
            if (currentY > pageHeight - margin - footerHeight) {
              pdf.addPage();
              currentY = margin + headerHeight;
              drawHeader();
              pdf.setFont("helvetica", "normal");
            }

            pdf.text(line, index === 0 ? startX : margin, currentY);
            currentY += 5;
          });
        } else {
          // === CASO CON VIÑETAS (BLINDADO) ===
          currentY += 6;

          const items = texto
            .split("•")
            .map((t) => t.trim())
            .filter(Boolean);

          items.forEach((item) => {
            ensureSpace(12);

            // 🔒 BLINDAR ESTADO SIEMPRE
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            pdf.setDrawColor(0, 0, 0);

            const bullet = "• ";
            const bulletWidth = pdf.getTextWidth(bullet);

            // viñeta
            pdf.text(bullet, margin, currentY);

            const startX = margin + bulletWidth + 1;
            const availableWidth = pageWidth - margin - startX;

            const lines = pdf.splitTextToSize(item, availableWidth);

            lines.forEach((line, index) => {
              // 🔒 REAFIRMAR en cada línea (clave)
              pdf.setFontSize(10);
              pdf.setFont("helvetica", "normal");

              pdf.text(line, index === 0 ? startX : margin, currentY);
              currentY += 5;
            });

            currentY += 3; // espacio entre viñetas
          });
        }

        currentY += 4;
      }

      // Texto de transición
      const tipoTexto =
        resolucion.tipo === "RESOLUCIÓN" ? "RESUELVE:" : "PROMULGA:";

      const espacioMinimoBloque = 40;
      if (currentY + espacioMinimoBloque > pageHeight - margin - footerHeight) {
        pdf.addPage();
        currentY = margin + headerHeight;
        drawHeader();
      }

      // ===== BLOQUE POR ELLO / RESUELVE / PROMULGA (jerarquizado) =====

      // Espacio superior
      currentY += 10;

      // "POR ELLO,"
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("POR ELLO,", margin, currentY);
      currentY += 12;

      // Texto central principal
      const textoIntendente = "EL INTENDENTE MUNICIPAL DE SAN ISIDRO";
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");

      const textoIntendenteWidth = pdf.getTextWidth(textoIntendente);
      const textoIntendenteX = (pageWidth - textoIntendenteWidth) / 2;

      pdf.text(textoIntendente, textoIntendenteX, currentY);

      // Subrayado
      pdf.setLineWidth(0.4);
      pdf.line(
        textoIntendenteX,
        currentY + 1,
        textoIntendenteX + textoIntendenteWidth,
        currentY + 1
      );

      currentY += 10;

      // RESUELVE / PROMULGA
      pdf.setFontSize(15);
      pdf.setFont("helvetica", "bold");

      const tipoTextoWidth = pdf.getTextWidth(tipoTexto);
      const tipoTextoX = (pageWidth - tipoTextoWidth) / 2;

      pdf.text(tipoTexto, tipoTextoX, currentY);

      // Subrayado
      pdf.setLineWidth(0.5);
      pdf.line(
        tipoTextoX,
        currentY + 1.2,
        tipoTextoX + tipoTextoWidth,
        currentY + 1.2
      );

      // Espacio inferior
      currentY += 14;

      // Artículos
      const articulos = JSON.parse(resolucion.articulos);
      articulos.forEach((articulo: string) => {
        const textoCompleto = articulo.trim();

        ensureSpace(6);

        // 1️⃣ Detectar ARTÍCULO
        const match = textoCompleto.match(
          /^(ART[IÍ]CULO\s+\d+\s*[º°])(\s*(?:\.-|\.)?\s*)([\s\S]*)$/i
        );

        if (!match) {
          addText(textoCompleto, 10);
          currentY += 4;
          return;
        }

        const encabezado = (match[1] + (match[2] || "")).trim();
        const cuerpo = (match[3] || "").trim();

        // === ENCABEZADO ARTÍCULO ===
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(encabezado, margin, currentY);

        const headerWidth = pdf.getTextWidth(encabezado);
        pdf.setLineWidth(0.35);
        pdf.line(margin, currentY + 0.9, margin + headerWidth, currentY + 0.9);

        //currentY += 6;

        const lineas = cuerpo
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);

        // 👉 PRIMERA línea continúa en la MISMA línea
        if (lineas.length > 0) {
          pdf.setFont("helvetica", "normal");

          const headerWidth = pdf.getTextWidth(encabezado);
          const startX = margin + headerWidth + 2;
          const availableWidth = pageWidth - margin - startX;

          const firstLines = pdf.splitTextToSize(lineas[0], availableWidth);

          firstLines.forEach((line, index) => {
            pdf.text(line, index === 0 ? startX : margin, currentY);
            currentY += 5;
          });
        }

        // resto del texto en líneas normales
        lineas.slice(1).forEach((linea) => {
          // INCISOS
          if (/^[a-z]\)/i.test(linea)) {
            currentY += 2;
            addText(linea, 10);
            currentY += 4;
          } else {
            addText(linea, 10);
            currentY += 3;
          }
        });

        currentY += 4;
      });

      // Cierre administrativo
      if (resolucion.cierre) {
        currentY += 4;
        addText(resolucion.cierre.toUpperCase(), 10, true);
      }

      // Marcar que ya se imprimió una resolución/promulgación
      if (resolucion.tipo === "PROMULGACIÓN") {
        yaHuboPromulgacion = true;
      } else if (resolucion.tipo === "RESOLUCIÓN") {
        yaHuboResolucion = true;
      }
    });

    // Agregar pie de página a todas las páginas
    const totalPages = pdf.getNumberOfPages();
    let pageNumber = 1;

    for (let i = 1; i <= totalPages; i++) {
      // Saltar tapa
      if (i === 1) continue;

      pdf.setPage(i);
      drawFooter(pageNumber);
      pageNumber++;
    }

    // Generar el PDF como buffer
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="boletin-oficial-${
          new Date().toISOString().split("T")[0]
        }.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generando PDF:", error);
    return NextResponse.json(
      { error: "Error al generar el PDF del boletín" },
      { status: 500 }
    );
  }
}
