# Psicobiología Experimental

Sección independiente de Psicología Experimental, disponible en `/#subject/psicobiologia-experimental`.

Fuente: resumen local **Resumen Expe Express 2026 Parcial 2 Full.pdf**, 70 páginas. El banco cubre exclusivamente las unidades 4 (pp. 2–18), 5 (pp. 19–32) y 6 (pp. 33–70), correspondientes al segundo parcial. No representa el programa completo ni un modelo oficial de examen.

Las actividades de `content/psicobio.ts` incluyen elección múltiple, verdadero/falso, desarrollo, casos didácticos y tarjetas orales, con explicaciones, criterios de autoevaluación y referencias a páginas del archivo. Se conservan las atribuciones en debates de Charney, Moncrieff, Hengartner, Penchaszadeh y Pedrero Pérez. Los casos inventados se identifican como didácticos y las asociaciones no se presentan como pruebas causales.

La interfaz reutiliza sesiones de 10, 20 o todas las actividades, orden variable, filtros por tema, accesos por unidad y pendientes de repaso. El progreso se guarda localmente con identificadores `psicobio-`, independientes de las otras materias. Las unidades de este material están disponibles sin configurar un corte de parcial.

El PDF permanece local: su ruta está en `.gitignore`, no se copia a `public` ni se requiere para ejecutar o desplegar la aplicación. La extracción de trabajo queda en `.scratch/`, también ignorada. Antes de un push se puede verificar con `git check-ignore "Resumen Expe Express 2026 Parcial 2 Full.pdf"` y `git ls-files '*.pdf'`.

Validación: `npm run lint`, `npm run build` y `npm test`. Los tests de Psicobiología verifican cobertura, referencias, filtros, las cinco modalidades, autoevaluación y persistencia de pendientes en escritorio y móvil.
