# Rorschach: parcialitos y práctica escrita

Fuente curricular: apartado de Rorschach de `Resumen Completo Proyectivas.pdf`, pp. 40–76. Referencias por página del archivo. Los casos son ficticios originales, no protocolos clínicos ni preguntas oficiales. El PDF permanece fuera del sitio público.

Se retiraron del módulo los 13 desarrollos de fundamentos generales, técnicas gráficas, Desiderativo y TRO. Se conservan los desarrollos, cuadros, láminas y fenómenos anteriores de Rorschach con sus IDs. El módulo conserva su identificador técnico `proyectivas` para mantener enlaces y progreso, y se presenta como **Rorschach**.

## Cobertura

| Modalidad | Actividades | Alcance |
|---|---:|---|
| Cuadros de modos aperceptivos y determinantes | 19 | 57 respuestas con localización e interrogatorio |
| Desarrollo | 10 | Administración, localizaciones, determinantes, contenidos y cálculo |
| Significación de láminas | 10 | Las diez tarjetas y su lectura según el resumen |
| Fenómenos especiales a desarrollar | 30 | Definición, fundamento, diferenciación y límites |
| Total | 69 | Sin choice ni verdadero/falso |

Los tres bloques restantes (u5, u6, u7) conservan sus IDs. Las actividades anteriores de otras materias permanecen en sus módulos.

## Generador de parcialitos

Cada generación selecciona sin reemplazo y presenta en este orden:

1. Un cuadro de modos aperceptivos y determinantes.
2. Tres preguntas a desarrollar.
3. Una lámina aleatoria para aspectos tranquilizadores, perturbadores y valor significativo.
4. Dos preguntas de fenómenos especiales a desarrollar.

Total: **siete actividades**. Los tres desarrollos y los dos fenómenos tienen IDs distintos dentro del parcialito. Se usa todo el banco de Rorschach; los filtros de práctica libre no alteran esta composición, y la interfaz lo aclara.

La tarjeta de significación cambia respecto de la generación anterior cuando hay alternativas. Se recuerda en `sessionStorage` de la pestaña, con respaldo en memoria si el almacenamiento no está disponible. La selección no modifica el banco original. Si falta alguna modalidad, no comienza un parcialito incompleto y se explica el motivo.

La práctica libre conserva filtros por tema/modalidad, duración 10/20/todas y pendientes. Repetir una sesión conserva su selección para revisarla. Para obtener otro parcialito se vuelve al generador.

## Cuadro de cuatro columnas

La primera columna se completa con **Modos Aperceptivos**; las tres siguientes contienen hasta tres determinantes, un código por celda. Las columnas sobrantes de determinantes quedan vacías.

Las verbalizaciones del paciente ficticio, la localización y el interrogatorio se muestran fuera del cuadro, numeradas por respuesta y área. El visor permite seleccionar el área correspondiente, girar, ampliar y dibujar marcas.

Se conservan los 11 cuadros originales (33 respuestas), enriquecidos con la localización explícita y su clave de modo. Se agregan ocho cuadros (24 respuestas) que incluyen:

- W global y D detalle usual.
- Dd y subtipos Dde externo, Ddi interno, Ddr raro y Ddd diminuto.
- S blanco puro.
- WS/SW y DS/SD: blanco complementario o punto de partida.
- Un caso de Do, explicado como denominación histórica del sistema.

Las claves se fundamentan en pp. 50–56 y en la localización establecida explícitamente para cada caso. **No se deduce una localización normativa D/Dd del rectángulo de la pantalla.** Cuando se practica D, el caso establece editorialmente que es un detalle usual, en vez de presentar esa usualidad como una norma obtenida de la imagen.

Ddi se distingue por ser interior sin tocar borde ni blanco; Dde por usar el borde; Ddr por el recorte no habitual; Ddd por un elemento diminuto independiente. Si el caso solo permite Dd general, no se exige un subtipo inventado. Cuando el subtipo se explicita, se pide ese subtipo.

S no implica por sí mismo color acromático C’. WS/SW y DS/SD no se ordenan alfabéticamente: describen qué inicia la organización perceptiva. El ejemplo informa el punto de partida y el complemento.

## Corrección y devolución

**Cuadros:** se comparan modo y determinantes por separado. Se explican localización errónea, predominio global injustificado, uso exclusivo/complementario del blanco y diferencias de subtipo. Los determinantes conservan mayúsculas y orden interno (FC ≠ Fc, FK ≠ Fk, FM ≠ Fm); solo se normalizan espacios y apóstrofos tipográficos. El orden entre códigos independientes no se penaliza. Se identifican códigos faltantes, sobrantes, repetidos y no reconocidos.

Un modo incorrecto deja el cuadro pendiente aunque los determinantes sean correctos; también ocurre a la inversa. Cada fila muestra las dos claves y fundamentos. La app no evalúa automáticamente la adecuación formal F+/F− ni la precisión del rectángulo dibujado.

**Fenómenos:** un desarrollo libre, sin campo de nombre de corrección automática. La guía muestra concepto, dato decisivo y confusión cercana. Se revisan tres criterios obligatorios: identificación/definición, fundamento del caso y diferenciación/límites. El nombre no se puntúa por coincidencia de palabras.

**Desarrollos y significación:** respuesta escrita, guía y criterios con explicaciones y confusiones frecuentes. La persona revisa todos los criterios antes de guardar. Los ausentes generan una lista de refuerzo. La app no presenta esa autoevaluación como comprensión semántica automática ni corrección docente.

Si el resumen no identifica un tranquilizador o perturbador específico, la guía lo reconoce en lugar de inventarlo. Popularidad, rasgos del estímulo, reacción del sujeto y significación teórica son dimensiones diferentes. Los contenidos de protocolo de p. 71 no se confunden con aspectos de las láminas.

Se usa `nucleo-progress-v1` para guardar logro/pendiente e intentos. El lector descarta los IDs retirados y preserva los registros de preguntas que siguen vigentes. No se guardan textos ni marcas: se reinician al salir. Los registros de cuadros anteriores se conservan; su estado previo no acredita haber practicado la nueva columna de modos.

## Fuentes y criterio académico

Mapa curricular:

- pp. 40–45: marco y administración.
- pp. 46–49: las diez láminas.
- pp. 50–56: modos aperceptivos, globales, detalles y blanco.
- pp. 57–70: determinantes.
- pp. 71–76: contenidos, fenómenos y fórmulas.

El marco del resumen declara Klopfer y relaciones objetales. No se mezclan automáticamente claves con Exner o R-PAS. Las asociaciones interpretativas se atribuyen al modelo del apunte; no son hechos clínicos universales ni diagnósticos por indicadores aislados. Los ejemplos diferencian MOR/desvitalización, IFF/FFF, respuesta alternativa/contaminación y otros conceptos próximos, sin convertirlos en etiquetas de personas.

Se evitan erratas o formulaciones ambiguas del resumen: fechas discordantes, signo de aumento de M en p. 62, fórmulas incompletas de p. 74 y una referencia a una lámina XX inexistente en p. 76. Los cálculos tienen pesos y denominadores explicitados. Es una cobertura inicial, no un pronóstico del examen ni validación empírica de todas las asociaciones del apunte.

En la búsqueda externa previa no se encontró un parcial público con procedencia institucional verificable. Las consignas son originales. Fuentes de contraste del temario:

- [UNLP, programa de Psicodiagnóstico en Memoria Académica](https://www.memoria.fahce.unlp.edu.ar/programas/pp.6207/pp.6207.pdf): documento institucional histórico, no una clave particular de la UNC.
- [Asociación Argentina de Psicodiagnóstico de Rorschach, catálogo didáctico](https://asoc-arg-rorschach.com.ar/alumnos/material-didactico/): se consultó el catálogo público de localizadores y fichas; no las fichas completas.
- [UNC, programa 2024, anexo I](https://digesto.unc.edu.ar/bitstream/handle/123456789/553493/IF-2024-00934621-UNC-SHCD%23FP%20ANEXO%20I%20PROGRAMA%20T%C3%A9cnicas%20Proyectivas%202024%20Lic.%20y%20Prof.%2086R.pdf?isAllowed=y&sequence=2): contraste mediante índice público; la descarga completa respondió con control de acceso. No se afirma haber leído un parcial oficial o verificado el programa vigente a partir de ese índice.

Estas fuentes no deben presentarse como validación de cada interpretación clínica del resumen. Las convenciones específicas pueden ajustarse mediante revisión docente explícita de las claves.

## Láminas y visor

Se mantienen las diez reproducciones históricas de Hermann Rorschach (1921), descargadas sin alteración desde Wikimedia Commons, con dominio público comprobado en sus fichas. Resoluciones originales entre 690 y 890 píxeles de ancho: la ampliación no añade resolución ni garantiza equivalencia de color con el material físico.

[Manifiesto de procedencia](../public/images/proyectivas/sources.json): autor, ficha, archivo, licencia, dimensiones y SHA-256. Las imágenes se sirven localmente. No se generaron ni reconstruyeron con IA.

Las marcas SVG usan coordenadas normalizadas. Se muestra el área activa, se puede dibujar con mouse/dedo, deshacer, restaurar, ocultar, girar de a 90°, ajustar coordenadas con teclado y ampliar 100–300% con desplazamiento. El modal comparte marcas y transforma coordenadas para conservarlas tras giro/zoom. Son referencias didácticas y no reemplazan un localizador de la escuela.

## Verificación

`npm run lint`, `npm run build` y `npm test`. Se verifican:

- Cobertura exclusivamente Rorschach y conservación de cuadros originales.
- Composición 1+3+1+2, ausencia de duplicados, insuficiencia de banco y variación de lámina.
- Recorrido completo de siete actividades, guía y persistencia de revisión.
- Modos y determinantes: errores independientes y claves de D, Dd/subtipos y blanco.
- Fenómenos como desarrollos con criterios obligatorios.
- Giro, marcado, zoom, error de imagen y 320 px.
- Regresiones de las materias existentes e integridad de imágenes.
