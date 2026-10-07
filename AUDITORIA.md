# Auditoría funcional — 6 de octubre de 2026

## Problemas corregidos

- Choice repetía preguntas indefinidamente y su contador podía superar el total. Ahora cada sesión termina con resultados y reintentos de pendientes.
- Las 3 preguntas de desarrollo estaban cargadas pero eran inaccesibles. Ahora se responden por escrito y se revisan con sus rúbricas.
- Faltaba selección de modalidad y tema. Se agregaron filtros y práctica por tema; las combinaciones vacías no permiten iniciar.
- Sani reutilizaba Experimental y PsicoPato no permitía avanzar. Ahora tienen demos propias con recorridos completos.
- Los porcentajes y cantidades de módulos eran ficticios. Ahora se calculan desde el banco y las revisiones reales.
- El README anunciaba guardado inexistente. Se implementó persistencia validada, actualización entre pestañas del navegador y tolerancia a almacenamiento bloqueado.
- La imagen remota dependía de Redbubble y no era material de estudio. Se reemplazó por recursos locales: esquema de vigilancia y figuras geométricas.
- Los títulos y las imágenes podían desbordar pantallas pequeñas. Se ajustaron tamaños, grillas y controles.
- Había controles de perfil y recorrido sin acción. Se retiraron y se implementó navegación funcional, foco de encabezados, radios nativos y ampliación de imágenes con Escape.
- npm start usaba next start pese a exportar un sitio estático. Ahora sirve la exportación localmente.

## Contenido

Se conservan las 12 preguntas originales de Experimental: 9 choice y 3 desarrollos. Se agrega 1 pregunta visual sobre el patrón cualitativo de vigilancia del resumen, pp. 19–20. Incluye fuente y aclaración de que no es la figura original. El banco inicial no cubre exhaustivamente todo el PDF.

## Validación realizada

- Compilación de producción y exportación estática: correctas.
- ESLint: sin errores ni advertencias.
- Playwright: 16 pruebas aprobadas en Chrome, con proyectos de escritorio y móvil.
- Pruebas de integridad del banco, cierre de sesiones, corrección, reintentos, desarrollos, autoevaluación, imágenes, ampliación con teclado, filtros vacíos, navegación Atrás, demos aisladas y persistencia.
- Pruebas con datos guardados corruptos y almacenamiento bloqueado.
- Verificación automática de ausencia de desbordamiento horizontal en pantallas de 320 px.
- npm audit --omit=dev: 0 vulnerabilidades.

Comandos reproducibles: npm run lint, npm run test:e2e, npm audit --omit=dev.

## Pendiente en dependencias de desarrollo

npm audit reportó 5 entradas de severidad alta por una misma cadena:
eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces.

Aviso raíz: GHSA-vfj7-8cjw-p6xm, agotamiento de pila con patrones profundamente anidados. El reporte propuso bajar eslint-config-next a 14.2.35, cambiando de major y perdiendo la alineación con Next 16.4. No se aplicó audit fix --force. Queda pendiente una actualización compatible del tooling. La auditoría de dependencias de producción no reportó vulnerabilidades.

## Límites

- Las respuestas escritas se autoevalúan; no se califican automáticamente.
- El progreso es local al navegador; no hay cuentas ni sincronización entre dispositivos.
- La sesión y el texto escrito se reinician al salir/recargar; las revisiones completadas permanecen.
- Sani y PsicoPato requieren material académico real. No se incorporaron láminas de Rorschach.
- Las pruebas usan Chrome y emulación de pantalla/tacto, no Safari/iOS ni teléfonos físicos.
- No se publicó ni se modificó ningún servicio remoto.
