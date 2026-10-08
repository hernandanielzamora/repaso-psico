# Psicología Sanitaria: banco de repaso

Fuente: **Sani Final PDF.pdf**, 107 páginas escaneadas aportadas por el usuario. Fecha de incorporación: 8 de octubre de 2026. El texto se extrajo localmente mediante OCR; se contrastaron visualmente los encabezados de las cinco unidades. Las referencias corresponden al número de página del archivo, no a una edición de los textos originales.

## Cobertura

| Unidad | Páginas del PDF | Ejes de repaso | Actividades por unidad |
|---|---|---|---:|
| 1 | 1–20 | Psicología Sanitaria, complejidad, interdisciplina, equidad y salud colectiva | 17 |
| 2 | 21–61 | Estado y bienestar, APS, sistema de salud, derechos, acompañamiento terapéutico | 21 |
| 3 | 62–77 | Diagnóstico comunitario, métodos, diseños y epidemiología crítica | 17 |
| 4 | 78–87 | Promoción, prevención, Ottawa, participación y medicalización | 14 |
| 5 | 88–107 | Psicología de la salud, intervención, programación y evaluación | 20 |

Se agregan **6 consignas integradoras de final**, para un total de **95 actividades**: 32 choice, 16 verdadero/falso, 18 desarrollos, 14 casos, 11 tarjetas orales y 4 análisis visuales. Las seis integradoras están incluidas en esos totales por modalidad.

El banco recorre los ejes principales de las cinco unidades. No afirma cubrir cada dato, autor, fecha o párrafo del resumen ni predecir las preguntas de la cátedra.

## Mapa de lecturas

- pp. 1–4: área de Psicología Sanitaria, objeto, vida cotidiana y rol profesional.
- pp. 5–7: integración de la Psicología al equipo e interdisciplina; campo y núcleo.
- pp. 8–11: equidad, determinantes, cadena causal y participación.
- pp. 12–14: modelos causales, anillos y niveles de vida cotidiana.
- pp. 15–17: modelo tutelar, derechos y disputas de paradigmas.
- pp. 18–20: Casallas, medicina social y salud colectiva latinoamericana.
- pp. 21–25: Berra y Herranz; Foucault, Estado, bienestar y neoliberalismo.
- pp. 26–28: APS, niveles de atención y aportes de Psicología.
- pp. 29–32: reforma de salud mental y dispositivos sustitutivos.
- pp. 33–37: contexto de políticas públicas, pobreza y problemas sociosanitarios.
- pp. 38–39: Spinelli, campo de salud y capitales.
- pp. 40–42: presentación de la Ley Nacional de Salud Mental.
- pp. 43–45: presentación de la ley provincial de acompañamiento terapéutico.
- pp. 46–48: derechos humanos, reconocimiento y ejercicio efectivo.
- pp. 49–51: acompañamiento terapéutico, vínculo y vida cotidiana.
- pp. 52–54: estructura y fragmentación del sistema de salud argentino.
- pp. 55–57: APS, renovación, salud mental y barreras.
- pp. 58–61: Yoma, derechos sociales, padecimiento y externación.
- pp. 62–65: Gofin y Levav, examen preliminar y diagnóstico comunitario.
- pp. 66–68: comunidad, contexto cultural, redes y métodos cualitativos.
- pp. 69–71: introducción a epidemiología, frecuencia y diseños.
- pp. 72–77: Breilh, crítica del riesgo, reproducción social y triangulación.
- pp. 78–81: Marchiori Buss, promoción, prevención y Ottawa.
- pp. 82–84: salud mental comunitaria, usuarios, familiares y recursos.
- pp. 85–87: crítica de Carpintero a la medicalización.
- pp. 88–91: Morales Calatayud, Psicología de la Salud, APS y hospitales.
- pp. 92–94: Videla y aportes a la intervención comunitaria.
- pp. 95–97: Programación Local Participativa.
- pp. 98–101: herramientas de planificación y evaluación.
- pp. 102–107: Planificar para transformar, diseño, actores e indicadores.

## Organización por examen

El PDF identifica cinco unidades, pero no explicita el corte entre parciales. No se asignó un corte supuesto. Cada usuario elige las unidades del primer y del segundo parcial; pueden superponerse si su cátedra así lo dispone. Las selecciones se guardan por separado bajo `nucleo-exams-v1`. El final usa todas las unidades y habilita las integradoras.

Una combinación sin actividades explica el motivo y no permite iniciar una sesión vacía. Los accesos por unidad respetan las unidades del examen, la duración y el filtro de pendientes, con todas las modalidades. Las sesiones cortas distribuyen la selección entre unidades para evitar que siempre se estudie el comienzo del PDF.

## Criterios editoriales

- Consignas y explicaciones reformuladas a partir del resumen; no se agregó bibliografía externa como si proviniera del PDF.
- Casos identificados como ficticios. Los ejemplos numéricos y gráficos no representan datos reales de salud.
- Las cuatro imágenes son esquemas originales de estudio basados en conceptos del material; no copias de figuras originales ni láminas clínicas.
- La guía escrita/oral orienta autoevaluación: no realiza diagnóstico, evaluación clínica ni calificación automática.
- Las posiciones críticas se atribuyen al marco de los autores; no se transforman en indicaciones de tratamiento.
- Se evitó preguntar cifras ilegibles, datos epidemiológicos históricos como si fueran actuales y plazos o artículos que aparecen de forma inconsistente. Por ejemplo, el resumen presenta diferencias en fechas legales entre las pp. 15, 30 y 40; no se usaron como respuestas de memorización.
- El contenido jurídico reproduce conceptos estudiados en el resumen, sin afirmar haber actualizado normativa.
- Se evitó la equivalencia confusa entre grupo operativo, ECRO y sus vectores en p. 93, y las atribuciones metodológicas inconsistentes entre pp. 62–65 y p. 104.

Los IDs viejos `sani-demo-*` se retiraron del banco. El lector de progreso descarta esos registros; el progreso de Experimental se conserva. PsicoPato continúa como demo separada.

## Verificación reproducible

`npm run lint` y `npm run test:e2e`. Las pruebas cubren integridad y páginas, modalidades, selecciones independientes de parciales, persistencia, exclusión de integradoras en parciales, distribución por unidades, casos, verdadero/falso, tarjetas orales, ampliación de imágenes, pendientes y pantallas de 320 px, además de los recorridos existentes de Experimental y PsicoPato.
