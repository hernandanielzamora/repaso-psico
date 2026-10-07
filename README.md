# Núcleo de estudio

Web app personal para preparar el parcial de Psicología Experimental de la Facultad de Psicología, UNC. El banco inicial se construye a partir del resumen de la unidad sobre RMf, el salmón muerto y tES.

## Qué incluye

- Elección múltiple con feedback inmediato y explicación conceptual.
- Preguntas de desarrollo con respuesta escrita y rúbrica de corrección.
- Filtros por RMf, estadística, tES e integración.
- Progreso y racha guardados en `localStorage`.
- Preguntas versionadas en `data.ts`, con fuente indicada en cada explicación.

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

Crear un servicio **Web Service** conectado al repositorio con estos valores:

- **Root Directory:** `estudio-psico` si el repositorio conserva el PDF en la raíz.
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment:** Node

Render asigna automáticamente `PORT`; Next.js lo utiliza al iniciar con `npm start`.

## Próxima fase: backend

Esta primera versión no necesita backend: el banco es contenido estático y el progreso es personal. Si se agregan cuentas, sincronización entre dispositivos o edición desde la app, la opción simple es Supabase free con tablas para `questions`, `sources`, `attempts` y `users`. Conviene migrar después de probar el método de estudio y revisar el banco con la cátedra.

## Fuentes base

- Aparicio (2012), «Lo que el IRMf de un salmón muerto nos puede enseñar…», Psyciencia.
- González-García, Tudela y Ruz (2014), «Resonancia magnética funcional: análisis crítico…», Revista de Neurología.
- Hemmerich, Luna, Lupiáñez y Martín-Arévalo (2020), «Estimulación eléctrica transcraneal: funcionamiento y usos en investigación», Ciencia Cognitiva.
