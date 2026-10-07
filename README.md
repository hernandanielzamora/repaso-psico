# Núcleo de estudio

Web app personal para preparar el parcial de Psicología Experimental de la Facultad de Psicología, UNC. El banco inicial se construye a partir del resumen de la unidad sobre RMf, el salmón muerto y tES.

## Qué incluye

- Elección múltiple con feedback inmediato y explicación conceptual.
- Preguntas de desarrollo con respuesta escrita y rúbrica de corrección.
- Filtros por RMf, estadística, tES e integración.
- Progreso y racha guardados en `localStorage`.
- Preguntas versionadas en `data.ts`, con fuente indicada en cada explicación.
- Modelo extensible de materias, unidades, tipos de pregunta y recursos visuales.

## Agregar una materia

En `data.ts`, agregar una entrada en `subjects`:

```ts
{
	id: "rorschach",
	name: "Evaluación psicológica: Rorschach",
	shortName: "Rorschach",
	description: "Láminas, consignas y criterios de análisis.",
	questionTypes: ["choice", "development", "image-analysis"],
	topics: ["Administración", "Codificación", "Interpretación"]
}
```

Luego, cada pregunta debe indicar `subjectId` y su `type`. Para una lámina o imagen de estímulo se puede usar `media`:

```ts
media: {
	type: "image",
	src: "/images/rorschach/lamina-i.webp",
	alt: "Lámina I del material de estudio",
	width: 1200,
	height: 900,
	caption: "Observar primero la respuesta global y luego los detalles.",
	credit: "Material autorizado para uso académico"
}
```

Las imágenes deben guardarse en `public/images`. Para Rorschach conviene cargar únicamente material con permiso de uso o provisto por la cátedra, y diseñar las preguntas de imagen con contexto, zoom, alt text, fuente y criterios de respuesta antes de publicar.

## Desarrollo local

Requiere Node.js 22.13 o superior.

```bash
npm install
npm run dev
```

Abrir http://localhost:3000.

Antes de publicar:

```bash
npm run lint
npm run build
```

## Deploy en Render

La versión actual no necesita servidor: es una **Static Site** porque el banco es estático y el progreso se guarda en el navegador. Crear un servicio **Static Site** conectado al repositorio con estos valores:

- **Root Directory:** `estudio-psico` si el repositorio conserva el PDF en la raíz.
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `out`
- **Environment:** Node

La configuración ya está declarada en `render.yaml`, por lo que Render puede detectarla al crear un Blueprint.

## Próxima fase: backend

Esta primera versión no necesita backend: el banco es contenido estático y el progreso es personal. Si se agregan cuentas, sincronización entre dispositivos o edición desde la app, la opción simple es Supabase free con tablas para `questions`, `sources`, `attempts` y `users`. En ese momento se puede mantener este Static Site y conectar una API externa, o volver a un Web Service si se incorpora un servidor Next.js.

## Fuentes base

- Aparicio (2012), «Lo que el IRMf de un salmón muerto nos puede enseñar…», Psyciencia.
- González-García, Tudela y Ruz (2014), «Resonancia magnética funcional: análisis crítico…», Revista de Neurología.
- Hemmerich, Luna, Lupiáñez y Martín-Arévalo (2020), «Estimulación eléctrica transcraneal: funcionamiento y usos en investigación», Ciencia Cognitiva.
