# Sincronización anónima entre dispositivos

La web continúa siendo una exportación estática en Render. Supabase aloja únicamente identidad anónima, revisiones completadas y vínculos temporales. No se necesitan claves privadas en el navegador ni un servidor Node adicional.

## Activación en Supabase y Render

1. Supabase > Authentication > Sign In / Providers: habilitar Anonymous Sign-Ins.
2. Supabase > SQL Editor > New query: pegar el contenido completo de [supabase/sync.sql](../supabase/sync.sql) y ejecutar Run. El script es transaccional y se puede volver a ejecutar sin borrar el progreso.
3. Configurar localmente `.env.local`, tomando como referencia `.env.example`. Las variables son `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Render > servicio de la app > Environment: configurar esas mismas dos variables con los valores públicos del proyecto. Crear un nuevo deploy para incorporarlas en el build estático. `render.yaml` declara las variables sin incluir sus valores.
5. Abrir la app live en ambos equipos. En cada uno, desplegar «Sincronizar dispositivos» y activar. Antes de modificar o borrar almacenamiento local, comprobar la vinculación y una revisión en ambas direcciones.

La URL y la publishable key son públicas y no otorgan acceso directo al progreso. No poner contraseñas de PostgreSQL, `service_role` ni claves `sb_secret_*` en variables `NEXT_PUBLIC_*`, archivos públicos o Git. `.env.local` y todos los PDF están ignorados; `.env.example` solo contiene placeholders.

## Cómo vincular

- La computadora que se quiere agregar muestra su QR con «Mostrar QR para vincular este dispositivo».
- El teléfono que ya tiene el progreso escanea el QR. El enlace abre la app y solicita confirmación explícita.
- También se puede copiar el enlace y pegarlo en «Enlace o código recibido» desde el equipo existente.
- Al confirmar, se combinan los avances. Ninguno reemplaza simplemente al otro.
- El QR vence en cinco minutos, se consume una vez, y se puede cancelar. Generar otro invalida el anterior.

Se conserva una identidad de Supabase diferente por navegador. La vinculación une sus permisos sobre un mismo perfil; no copia access tokens ni refresh tokens entre dispositivos. El token del vínculo viaja en el fragmento `#vincular/...`, se retira del historial visible después de leerlo y solo se envía al confirmar. El texto pegado debe ser un token válido o un enlace del mismo origen de la app. Quien confirma debe reconocer el QR como propio: confirma que el equipo mostrado pueda leer y actualizar su progreso.

En el primer uso se crea una identidad anónima al activar, no por visitar la página. El proyecto real se comprobó mediante una consulta de lectura a `/auth/v1/settings`; esa comprobación no crea usuarios ni ejecuta el SQL. Las pruebas automatizadas usan JWT simulados y PostgreSQL temporal local, nunca escriben en el proyecto real.

## Qué se comparte

- Preguntas revisadas de todas las materias: logro/pendiente, intentos y fecha del último estado.
- El progreso local anterior se importa sin borrar el avance existente en la nube.
- Las nuevas revisiones se transmiten tras una breve espera y se consulta el perfil cada 15 segundos mientras la página está visible. También se reintenta al volver a la pestaña o recuperar conexión.

No se comparten respuestas escritas en curso, orden/posición de un parcialito, marcas de láminas ni selecciones de unidades de parciales. Se mantienen las limitaciones de sesión existentes. No se suben PDF ni datos de pacientes. La app ya abierta permite completar revisiones sin conexión y conserva una cola local; no se incorporó un service worker que permita abrir desde cero el sitio sin red.

## Combinación e idempotencia

El agregado local anterior no contiene un historial de eventos. Dos dispositivos pueden tener copias de los mismos intentos antiguos; sumarlos duplicaría revisiones. Por eso el import inicial conserva el máximo de intentos previos por pregunta y combina el estado más reciente. No es posible reconstruir exactamente cuántos intentos distintos hubo en ambos equipos antes de activar la sincronización.

Desde la primera activación, cada revisión nueva recibe un UUID y entra en una cola durable. La base tiene una clave única por perfil/evento. Reintentar el mismo lote no suma otra vez sus intentos. Los intentos visibles son el baseline inicial más el número de eventos distintos. La última fecha determina el estado; ante estados exactamente simultáneos se prefiere pendiente. Fechas futuras se limitan al reloj del servidor y no se rejuvenecen en cada reenvío del mismo baseline.

La cola se elimina solo tras una respuesta válida de Supabase. Si una revisión nueva se produce mientras hay un envío en curso, no se elimina junto al lote anterior: se conserva y se aplica a la vista local hasta el próximo envío. Los lotes contienen hasta 200 eventos. Pausar detiene los envíos; las revisiones posteriores siguen en la cola para reanudar.

Al vincular un equipo con su propio perfil inicial, el SQL combina baselines y eventos antes de cambiar su pertenencia. Si ese equipo ya forma parte de otro perfil compartido con más dispositivos, se rechaza el traslado para no mezclar dos grupos inadvertidamente. Para vínculos ya pertenecientes al mismo perfil no se duplica información.

## Permisos

Las cinco tablas tienen RLS habilitado y no conceden acceso directo a `anon` o `authenticated`. Los clientes solo ejecutan RPC concedidas a `authenticated`. Cada RPC obtiene la identidad de `auth.uid()`; no acepta que el navegador elija un usuario o un perfil ajeno.

Las funciones `SECURITY DEFINER` usan `search_path` vacío y nombres de tabla calificados. La función interna de creación de perfiles no se concede al cliente. Los tokens del vínculo se guardan como SHA-256; el token sin hash solo se devuelve al equipo que muestra el QR. El estado solo puede consultarlo su solicitante. La confirmación comprueba autenticación, vencimiento, cancelación, uso previo y que quien confirma sea otro navegador. Hay un límite de diez vínculos por identidad y hora.

La escritura y la combinación se ejecutan en transacciones con bloqueos para no perder actualizaciones concurrentes. Se validan forma y tamaño de los lotes y se rechazan lotes inválidos completos.

## Fallas y recuperación

- SQL ausente: la app explica qué archivo ejecutar. El progreso sigue local.
- Anonymous Sign-Ins desactivado: muestra la configuración que hay que activar.
- Red caída: conserva la cola y reintenta al reconectar.
- Proyecto gratuito pausado: requiere reactivarlo en Supabase; la práctica local no depende de una respuesta del servidor.
- Almacenamiento bloqueado: puede conservar progreso en memoria durante la visita; no garantiza persistencia al cerrar.
- Incógnito o borrado completo de datos: la identidad puede perderse. Si queda otro dispositivo vinculado, se puede abrir un navegador nuevo y vincularlo desde aquel. Si se pierde el acceso en todos, no hay recuperación por correo porque el perfil es anónimo.
- Si solo se pierde o reemplaza la sesión de auth pero queda metadata de una identidad anterior, se informa un error y no se crea silenciosamente un perfil vacío que sustituya el progreso local.

## Verificación

- `npm run test:sync-db`: PostgreSQL embebido (PGlite), migración repetible, aislamiento, permisos directos/RPC, retries, unión de baselines/eventos, propiedad del vínculo, cancelación, vencimiento, consumo único y fechas futuras.
- `npm run test:e2e`: compilación y regresiones de estudio; dos navegadores conectados al SQL real en una base temporal, unión de progreso previo, QR, nueva revisión sin conexión, recuperación y lectura desde el otro equipo.
- `npm run lint`.

Referencias de implementación: [autenticación anónima](https://supabase.com/docs/guides/auth/auth-anonymous), [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [funciones de base de datos](https://supabase.com/docs/guides/database/functions), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [PGlite](https://pglite.dev/docs/).
