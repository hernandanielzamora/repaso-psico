# Núcleo de estudio

Web app de repaso para Psicología, UNC. Experimental conserva las 12 preguntas originales del resumen (9 choice y 3 desarrollos) y agrega 1 pregunta visual: 13 en total. Es un banco inicial, no una cobertura exhaustiva de las 26 páginas del PDF.

Psicología Sanitaria (Sani) incluye 95 actividades basadas en las cinco unidades de `Sani Final PDF.pdf`: choice, verdadero/falso, desarrollo, casos, tarjetas orales y análisis de esquemas. Cada actividad tiene explicación y páginas de referencia. PsicoPato sigue siendo una demo; su imagen geométrica no es una lámina de Rorschach.

## Preparar Sani

Elegir **Primer parcial**, **Segundo parcial** o **Final**. El PDF no establece qué unidades corresponden a cada parcial: la app permite seleccionarlas y guarda ambas selecciones por separado en el navegador. El final incluye las cinco unidades y seis consignas integradoras.

Se puede filtrar por tema o modalidad, practicar hasta 10 o 20 actividades o todas, variar el orden y repasar únicamente pendientes. Las sesiones cortas distribuyen actividades entre las unidades elegidas. Las tarjetas orales permiten responder mentalmente o en voz alta antes de revelar la guía; no graban audio ni califican automáticamente.

Mapa de fuentes, criterios editoriales y cobertura: [docs/SANI.md](docs/SANI.md).

## Funcionalidad

- Elección de modalidad y tema, sesiones mixtas y práctica por tema.
- Choice con corrección, explicación y respuesta correcta.
- Desarrollo e imágenes con respuesta escrita, guía y autoevaluación.
- Imágenes locales con ampliación y descripción alternativa.
- Sesiones finitas, resultados y repaso de pendientes.
- Progreso real por pregunta, guardado en localStorage y validado al leer.
- Navegación con fragmentos de URL compatible con el botón Atrás y hosting estático.
- Interfaz adaptable a celular y computadora, con controles de teclado.

El progreso mide preguntas revisadas; no garantiza dominio. No hay cuentas ni sincronización entre dispositivos. Las revisiones completadas se guardan; la sesión y el texto escrito se reinician al salir o recargar. Los desarrollos no tienen corrección automática.

## Desarrollo

Usar Node.js 22.13 o superior en la rama 22, o Node.js 24. El entorno original tenía 22.12 y npm advertía sobre el requisito de eslint-visitor-keys.

```bash
npm ci
npm run dev
```

Abrir http://localhost:3000. En PowerShell con scripts deshabilitados, usar `npm.cmd`.

## Verificación y vista previa

```bash
npm run lint
npm run test:e2e
npm start
```

`test:e2e` compila y ejecuta Playwright sobre la exportación de producción. Requiere Google Chrome instalado; si falta: `npx playwright install chrome`. `npm test` ejecuta solo las pruebas, con build previo.

`npm start` sirve `out/` en 127.0.0.1:3000; requiere `npm run build` previo. Puerto alternativo: `npm start -- 3100`. Se reemplazó `next start`, incompatible con la exportación estática.

## Agregar contenido

`data.ts` reúne el catálogo y el banco de preguntas; `content/sani.ts` contiene el contenido de Sanitaria. Cada materia declara un ID estable de letras, números y guiones, nombre, descripción, temas, modalidades y presentación (`accent`, `soft`, `mark`). `demo: true` la excluye del progreso académico global. `units` agrega organización por unidades y preparación por examen.

Cada pregunta requiere ID único y estable, `subjectId`, `type`, `topic`, `difficulty`, consigna, explicación y fuente. Choice/verdadero-falso requieren `options` y el índice correcto en `answer`. Desarrollo, casos, imágenes y tarjetas orales requieren `rubric`. Las imágenes usan `media` con `src`, `alt`, dimensiones, descripción y crédito. Los archivos van en `public/images`. En Sani, `unit` y `sourcePages` ubican el contenido en el PDF; `finalOnly` reserva una consigna integradora para el final.

Las cantidades se calculan desde el banco. Las pruebas validan IDs, pertenencia a materias, respuestas, rúbricas y recursos.

## Render

El proyecto exporta a `out/`. `render.yaml` configura:

- Build: `npm ci && npm run build`.
- Directorio publicado: `./out`.
- Root Directory: `estudio-psico` si esta carpeta está dentro del repositorio.

No requiere backend. Para sincronizar entre dispositivos habrá que incorporar cuentas y almacenamiento remoto.

## Fuentes

PDF aportado: «Psicología Experimental – Resumen de estudio (RMf, salmón muerto y tES)», 26 páginas. Resume Aparicio (2012), González-García, Tudela y Ruz (2014), y Hemmerich, Luna, Lupiáñez y Martín-Arévalo (2020).

El esquema de vigilancia deriva de las páginas 19–20: representa relaciones cualitativas, sin valores numéricos, y no reproduce la figura original.

Hallazgos y límites: [AUDITORIA.md](AUDITORIA.md).
