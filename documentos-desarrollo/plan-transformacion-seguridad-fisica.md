# Evolución del CSM de Seguridad Física

## Objetivo

Construir una herramienta sencilla para que el equipo de seguridad física pueda vigilar países y sedes, revisar señales públicas relevantes y recibir avisos útiles. La experiencia CSM debe abrir directamente en esa tarea, sin ruido de funciones generales de WorldMonitor.

**Resultado inicial:** un responsable configura un país y un período de viaje; el equipo autorizado recibe avisos de señales relevantes, con fuente, fecha, ubicación, vigencia y límites de confianza visibles.

Las noticias y las inferencias son señales para revisar, no incidentes confirmados. No se enviarán avisos de riesgo basados en ubicación desconocida, información vencida o fuentes sin procedencia trazable.

## Decisión de producto: CSM enfocado

El CSM tendrá su propia variante y una lista permitida pequeña de pantallas. El menú inicial se limita a:

1. **Resumen y mapa:** países vigilados, sedes autorizadas, señales y estado de las fuentes.
2. **Países y viajes:** vigilancia temporal por país, fechas, categorías y severidad mínima.
3. **Alertas:** señales enviadas, evidencia, responsable, reconocimiento y cierre.
4. **Fuentes:** catálogo aprobado, atribución, frescura y estado de disponibilidad.
5. **Sedes:** solo sedes de la organización y solo para usuarios autorizados.

Se retirarán de la experiencia CSM los paneles, menús, accesos comerciales, pantallas de suscripción, barreras PRO y flujos de autenticación propios de WorldMonitor que no ayuden a estas tareas. Se hará mediante configuración/variante CSM; no se borrarán módulos compartidos de WorldMonitor ni se alterarán las variantes generales sin una necesidad concreta. La autenticación de usuarios la proporciona la capa externa administrada por el propietario del fork. Los datos privados de sedes y vigilancia no se guardarán en el bootstrap ni en cachés públicas.

## Alcance funcional

### Señales y fuentes

- Reutilizar primero fuentes y servicios ya disponibles: noticias curadas, avisos oficiales, señales de riesgo por país, desastres y el feed de Telegram seleccionado.
- Un canal de Telegram añadido por un usuario no se considera automáticamente fuente corporativa ni genera avisos. Las fuentes que puedan alertar las aprueba un responsable y se registran con propietario, finalidad, método de acceso y estado.
- No incorporar una fuente nueva por volumen. Debe cubrir un riesgo o país que hoy esté insuficientemente cubierto, permitir atribución y fecha confiables, y tener condiciones de acceso y uso aceptables.
- Mantener por señal: identificador/origen, título y evidencia original, fuente o canal, fechas de publicación y captura, país, ubicación y precisión si existen, categoría, vigencia, estado de corroboración y enlace.
- La IA podrá ayudar a clasificar, traducir o resumir, pero no alterará la evidencia ni enviará por sí sola alertas críticas en la primera versión.

### Vigilancia de viaje por país

La primera función operativa será una **vigilancia temporal de país**:

- País mediante código ISO-3166-1 alpha-2.
- Inicio y fin de vigilancia, con expiración automática.
- Categorías acotadas: conflicto/violencia, disturbios, terrorismo/amenazas, desastres y avisos oficiales de viaje.
- Severidad mínima y miembros o roles autorizados que deben recibir avisos.
- La persona responsable del viaje y el itinerario nominal quedan fuera del CSM inicial. No se requiere rastreo GPS.
- Las coincidencias se calculan solo con señales dentro del período y país vigilado. La ausencia de atribución geográfica no se tratará como coincidencia.

### Alertas y seguimiento

- Entregar solo señales que superen las reglas acordadas, con enlace a evidencia y razón legible de la prioridad.
- Evitar duplicados, respetar expiración, severidad y horarios configurados; identificar cuándo una fuente está degradada.
- Registrar envío, destinatario, reconocimiento, asignación y cierre.
- Un responsable humano decide qué constituye un incidente y qué acción tomar.
- Reutilizar canales de entrega existentes cuando sea posible. La administración de destinatarios de equipo y organización debe permanecer en el ámbito privado del CSM; las reglas personales actuales de WorldMonitor no equivalen a permisos corporativos.

## Fuera de alcance

No construir en esta etapa:

- Integraciones con videovigilancia, control de accesos, sensores, BMS, PACS o centros de mando.
- Acciones automáticas sobre puertas, ventilación, evacuación u otros sistemas físicos.
- Seguimiento GPS continuo, censos de presencia de empleados o tratamiento de itinerarios personales.
- Clerk, autenticación propia de WorldMonitor, entitlement PRO, suscripciones o checkout dentro de la experiencia CSM.
- Kafka, Flink, un CEP distribuido o una nueva plataforma de datos si los flujos actuales bastan.
- Un motor de predicción autónoma o puntuaciones opacas. La prioridad debe poder explicarse con reglas pequeñas y datos observables.
- Directorios automáticos de autoridades/contactos o proveedores comerciales de inteligencia antes de demostrar una carencia real.
- Añadir decenas de paneles o fuentes a la interfaz corporativa.

## Arquitectura prevista

- **WorldMonitor** conserva la adquisición y los servicios públicos reutilizables.
- **CSM privado** conserva organizaciones, miembros, sedes, vigilancias, configuración de destinatarios y auditoría en su base PostgreSQL.
- Una capa fina del CSM consulta señales existentes y produce coincidencias de vigilancia. No se duplicarán feeds completos ni datos públicos sin necesidad.
- La evaluación empieza con reglas deterministas sobre categoría, severidad, fecha, país, precisión y estado de la fuente. Cada aviso muestra los factores que lo activaron.
- La aplicación no implementa un segundo login: se publica solo detrás del proxy/VPN/SSO externo del propietario. El servicio privado no se expone directamente. Si CSM necesita identidad para separar organizaciones o destinatarios, solo acepta identidad afirmada por el proxy confiable a través de una ruta protegida; nunca confía en cabeceras de identidad enviadas directamente por el navegador.
- Las respuestas con datos corporativos son privadas y no-cache.
- Una fuente fallida o obsoleta se presenta como degradada; no se sustituuye por datos inventados ni se interpreta vacío como “sin riesgo”.

## Inventario inicial de claves para el CSM

Esta lista se limita a capacidades potencialmente útiles para seguridad física. Las claves son secretos de servidor: nunca deben incluirse en `VITE_*`, navegador, Git, capturas ni logs. “Implementar nosotros” significa operar el adaptador/servicio dentro del fork; no fabricar credenciales ni saltarse límites o términos del proveedor.

| Capacidad | Clave o requisito observado en el código | Situación y decisión inicial |
|---|---|---|
| Acceso a rutas Premium de WorldMonitor, incluidas algunas rutas de análisis | `WORLDMONITOR_API_KEY`/`WORLDMONITOR_VALID_KEYS`, o entitlement PRO mediante Clerk/Convex | Es autorización comercial del servicio WorldMonitor, no una clave de modelo. Quitar el cartel PRO no habilita las rutas. Para el fork, sustituir esas comprobaciones por una política propia de servidor y cuotas antes de usarlas; no pedir una clave comercial como solución permanente. |
| Resumen, clasificación y análisis con IA | `OPENROUTER_API_KEY`; también existe proveedor local `OLLAMA_API_URL`/`OLLAMA_MODEL` y proveedor genérico `LLM_API_URL`/`LLM_API_KEY`/`LLM_MODEL`. Anthropic está como proveedor opcional en algunas rutas/relay con `ANTHROPIC_API_KEY`. | Hay adaptadores reutilizables. Primera opción a evaluar: Ollama Cloud mediante el adaptador OpenAI-compatible (`LLM_API_URL`, `LLM_API_KEY`, `LLM_MODEL`), sujeto a validar endpoint, modelo, calidad, latencia y coste. La clave queda en el servidor. La IA no será requisito para mostrar evidencia ni decidir sola una alerta crítica. |
| Ingesta del relay de canales públicos de Telegram | `TELEGRAM_API_ID`, `TELEGRAM_API_HASH` y `TELEGRAM_SESSION` (sesión MTProto del relay) | Ya existe `ais-relay` con ingesta y canales seleccionados. Reutilizarlo con una lista corporativa aprobada; no construir scraping nuevo en el navegador. Si el relay no forma parte del despliegue, esta función no está disponible hasta operarlo/configurarlo. |
| Entrega de avisos por bot de Telegram | `TELEGRAM_BOT_TOKEN` y configuración/destino de chat | El relay de notificaciones ya sabe enviar por bot, pero la gestión actual de suscripciones y reglas está ligada a usuarios/entitlements. Reutilizar el transporte y crear configuración privada de destinatarios de equipo para el fork. |
| Conflictos/protestas con detalle ACLED | `ACLED_EMAIL` + `ACLED_PASSWORD`, o `ACLED_ACCESS_TOKEN`; `UCDP_ACCESS_TOKEN` para la fuente UCDP | Adaptadores y seeders existentes; solicitar/administrar credenciales del proveedor legítimamente. ACLED es opcional y el sistema tiene coberturas alternativas parciales; publicar disponibilidad real si falta. |
| Detecciones satelitales de incendios | `NASA_FIRMS_API_KEY` | Seeder ya implementado; clave gratuita sujeta al registro de NASA FIRMS. Reutilizar solo si fuego es categoría prioritaria para viajes/sedes. |
| Terremotos, desastres globales y algunas alertas oficiales | Sin clave para los lectores actuales de USGS/GDACS; otros avisos pueden tener límites propios | Reutilizar primero. No añadir scraping ni integración propia salvo que falte cobertura demostrable. |

### Evaluación inicial

- **Ya implementado y reutilizable:** adaptadores de proveedores LLM, Telegram relay, ACLED/UCDP, FIRMS y lectores sin clave. Esto no demuestra que estén configurados o activos en el despliegue del fork.
- **Requiere adaptación propia:** reemplazar la dependencia de Clerk/Convex/PRO para uso privado, cuotas y auditoría; mantener claves de proveedor en el servidor; conectar destinos de notificación a roles/equipos del CSM.
- **No requiere construir una IA propia:** probar el adaptador existente de Ollama Cloud con un conjunto pequeño de señales revisadas por una persona. Para esa prueba, usar `gpt-oss:20b-cloud` como referencia económica y `deepseek-v4.1-flash:cloud` como modelo retador de mayor capacidad/contexto. No se elige ganador por tamaño ni benchmarks del proveedor: medir extracción de país/fecha/categoría, justificación, falsos positivos, salida estructurada, latencia y coste con los mismos ejemplos. Si gpt-oss alcanza el umbral acordado, preferirlo; cambiar a DeepSeek solo si una brecha medida lo justifica.
- **No se decide todavía:** qué fuentes externas se activarán y qué presupuesto operativo tendrán. Esas decisiones van después de la limpieza y del inventario del despliegue.

## Fases y aceptación

### Fase 0 — Limpieza de la experiencia CSM

- Inventariar los paneles, accesos, textos promocionales y contenidos de ejemplo que aparecen al iniciar la variante CSM.
- Retirar de la interfaz CSM las funciones que no sean necesarias para vigilancia de países, sedes, señales, fuentes y alertas. Eliminar también datos de muestra, tarjetas de demo y ejemplos que puedan confundirse con información real.
- Adaptar Ajustes a esa lista permitida: conservar preferencias operativas, selección de paneles CSM y fuentes aprobadas; quitar facturación, suscripciones, API Keys de cuenta WorldMonitor, embeds/MCP comerciales y la pantalla personal de notificaciones ligada a PRO. La configuración de alertas corporativas se incorpora en Fase 3. No trasladar claves de proveedor al navegador; las integraciones se configuran en servidor.
- En la fase de transición, el selector de fuentes CSM se limita a noticias mundiales/regionales e inteligencia. Seguir en ese selector solo significa que un feed está disponible para el operador; no lo convierte en fuente aprobada ni elegible para alertas de equipo.
- La primera integración de fuentes públicas expone GDELT (noticias en inglés de las últimas 72 horas que mencionan el país; la mención no demuestra geolocalización del hecho) y Telegram público por tema (sin filtrado por país). Las selecciones persistentes de panel, fuente, país y tema deben gobernar las peticiones y el contenido mostrado.
- Presentar estados explícitos de carga, fuente desactivada, error, obsolescencia y ausencia de resultados. La disponibilidad en la interfaz no equivale a aprobación corporativa ni a habilitación de alertas.
- El fork ofrece una única edición completa: retirar en la variante CSM los bloqueos de interfaz y límites de paneles ligados a Free/PRO. Esto no elimina la autenticación externa ni los controles privados del despliegue.
- Mantener las otras variantes de WorldMonitor intactas. No borrar fixtures ni datos de prueba usados por tests; deben seguir identificados como tales y fuera de la experiencia CSM.
- No sustituir muestras retiradas por datos inventados. Si aún no hay datos reales, mostrar un estado vacío que indique qué fuente o configuración falta.
- **Aceptación:** el arranque y Ajustes de CSM no muestran módulos ajenos, CTA/login PRO, facturación, claves de cuenta WorldMonitor, topes Free, datos de demostración ni señales ficticias; solo aparecen preferencias y controles operativos de CSM. Las selecciones persistentes controlan el contenido de las dos fuentes y todos sus estados degradados/vacíos son comprensibles. Las variantes generales conservan su comportamiento. La aceptación del catálogo completo y la disponibilidad operativa de proveedores se revisan por separado; no se simulan datos vivos.

### Fase 1 — Base y límites de despliegue

- Confirmar qué commit/imagen responde en la LAN, inventariar puertos, volúmenes y servicios Docker, y verificar la ruta de acceso antes de desplegar.
- Mantener separados el directorio público de oficinas aproximadas y el inventario privado con coordenadas verificadas.
- Retirar Clerk/PRO y el login propio de CSM; confirmar dónde termina la autenticación externa y qué identidad/roles entrega al servicio.
- Verificar que el proxy elimina cabeceras de identidad entrantes y que las rutas privadas no son accesibles directamente por LAN, Internet ni un puerto publicado del contenedor.
- Completar permisos, gestión de secretos, HTTPS, copias y restauración antes de introducir datos reales.
- **Aceptación:** se conoce el estado real del despliegue, la experiencia no solicita login ni muestra PRO/suscripciones, el proxy externo es el único acceso a rutas privadas y no se interfiere con servicios o volúmenes ajenos. Sin SSH verificado, esta fase queda pendiente y no se afirma que el LXC esté actualizado.

### Fase 2 — Entrada CSM operativa

- Mostrar solo las pantallas aprobadas en “Decisión de producto”.
- Permitir encontrar las sedes visibles para la organización y consultar las señales disponibles por país.
- Incorporar una gestión privada de ubicaciones: alta y edición de oficinas, almacenes, plantas y otros puntos de interés; conservar identificador, organización, tipo, dirección, coordenadas, precisión, procedencia y fecha de verificación. La incorporación y cualquier corrección requieren una persona autorizada; los centros de ciudad no se marcarán como coordenadas verificadas de un edificio.
- Limitar la gestión a responsables autorizados, registrar autor, fecha y cambios en auditoría y mantener las ubicaciones privadas fuera del directorio público y de las cachés compartidas. La consulta seguirá los permisos de cada organización; no se habilitará el uso de datos reales hasta cumplir los controles de la Fase 1.
- Permitir revisar y corregir ubicaciones existentes y distinguir las verificadas de las que estén pendientes. La importación desde un inventario corporativo, si existe, debe ofrecer una previsualización de altas, cambios y errores antes de aplicar datos, y conservar la procedencia de cada registro.
- Mostrar fuente, hora/frescura, precisión y estado degradado de cada conjunto de datos.
- **Aceptación:** un operador abre el CSM y llega a mapa, país o sede sin configurar el dashboard general; no ve paneles generales irrelevantes ni ubicaciones públicas presentadas como coordenadas exactas.

### Fase 3 — Vigilancia temporal de viaje y alertas de equipo (primera entrega operativa)

- Crear, editar, expirar y cancelar una vigilancia por país, período, categoría y severidad mínima.
- Vincular destinatarios por organización/rol sin exponer reglas de otra organización.
- Conectar señales existentes de noticias, avisos, riesgo-país y Telegram seleccionado; no añadir nuevas fuentes en esta fase.
- Enviar una alerta con evidencia, fecha, país, fuente y explicación; deduplicar y registrar su ciclo de vida.
- **Aceptación:** fixtures prueban coincidencias correctas y ausencia de aviso para otros países, fuera del período, datos vencidos, país desconocido, fuente caída y duplicados. Solo destinatarios autorizados ven/reciben la alerta y el historial registra entrega y reconocimiento.

### Fase 4 — Señales cercanas a sedes

- Relacionar señales geolocalizadas con sedes privadas usando ubicación, precisión y radio específico por categoría de riesgo.
- Mantener “coincidencia aproximada” distinta de “afecta a la sede”; no aplicar radios a eventos sin posición suficiente.
- **Aceptación:** fixtures cubren límites de distancia, baja precisión, coordenadas ausentes, fuentes obsoletas y recuperación tras fallo.

### Fase 5 — Ampliaciones justificadas

- Revisar cobertura por país y categoría a partir de ausencias observadas y casos reales.
- Añadir una fuente o resumen asistido solo si cubre una brecha documentada y conserva atribución y evidencia.
- Migrar progresivamente la visualización cartográfica del CSM a CesiumJS, tomando como referencia la vista 3D de God's Eye: globo/terreno e imagery 3D, con los límites políticos por encima como capa legible, y las sedes y señales como capas independientes con selección, etiquetas y detalle. Empezar con un piloto aislado que reproduzca el flujo actual y compare proveedor de imagery, licencias, atribuciones, credenciales, cuotas, coste y cobertura antes de elegirlo. No retirar MapLibre/deck.gl hasta aceptar el piloto; conservar una alternativa para móviles y equipos sin capacidad gráfica suficiente. Medir carga, fluidez, memoria, precisión de cámara y legibilidad de límites y marcadores en escritorio y móvil. La migración visual no acredita la ubicación de edificios ni habilita datos privados: estos siguen sujetos a las Fases 1–2 y a un inventario autorizado.
- **Aceptación:** cada ampliación identifica la brecha que resuelve, coste/operación, límites de cobertura, licencia/acceso y prueba de fallo/recuperación.

## Orden de trabajo

1. Limpiar la interfaz CSM de funciones y muestras irrelevantes (Fase 0).
2. Confirmar la base y los límites de despliegue (Fase 1).
3. Cerrar y verificar la experiencia CSM operativa (Fase 2), preservando el trabajo local existente.
4. Especificar e implementar solo la vigilancia temporal por país y la ruta de aviso de equipo (Fase 3).
5. Verificar la ruta completa de configuración → señal existente → regla → destinatario autorizado → reconocimiento.
6. Pasar a proximidad por sede únicamente después de que la vigilancia por país funcione de extremo a extremo.

Cada fase se acepta antes de iniciar la siguiente. No se desplegará ni se incorporarán datos reales hasta tener autenticación, permisos, almacenamiento, copias y restauración comprobados. No hacer push, merge ni despliegue sin autorización explícita.

## Estado conocido al actualizar este documento

- La entrega local de Fase 0 incluye limpieza/entrada CSM y selección persistente de panel, fuente, país y tema conectada a un consumidor público de CSM. Las fuentes visibles son GDELT (noticias en inglés de 72 horas con país mencionado, sin geolocalización confirmada) y Telegram público por tema (no filtrado por país). Las selecciones gobiernan las peticiones y el contenido; se implementan estados de carga, fuente desactivada, error, obsolescencia y sin resultados.
- El equipo B reporta 26 pruebas DOM, typecheck, boundaries, Biome, builds general/CSM correctos y verificación en navegador local. No obtuvo datos vivos: GDELT respondió `seed-unavailable` y Telegram no estaba disponible. Esto prueba estados/contratos locales, no operación o frescura de los proveedores.
- Fase 0 está implementada y verificada localmente para la limpieza de la experiencia y estas dos integraciones iniciales. La aceptación completa del catálogo sigue pendiente. La selección o visualización de una fuente no la convierte en fuente aprobada por la organización ni habilita alertas.
- Mapa y geolocalización, sedes privadas, viajes y alertas permanecen en fases posteriores. Esta entrega no los implementa ni implica aprobación corporativa.
- `full` conserva el catálogo general. La capa pública de oficinas SEIDOR utiliza posiciones aproximadas y no equivale al inventario privado ni a una experiencia CSM operativa.
- El repositorio ya dispone de feeds de noticias, Telegram Intel, avisos configurables, reglas de alerta con ámbito de país y señales/briefs de riesgo por país.
- Telegram Intel usa un relay y canales seleccionados; agregar un canal personalizado no lo convierte en fuente corporativa de alertas.
- Existe una base privada `csm/` con tablas de organización, membresía, sedes y auditoría, y rutas de lectura de sedes. El prototipo actual valida tokens OIDC propios; aún no tiene datos reales ni está conectado al panel, Compose o nginx. Ese login propio debe sustituirse por el límite de confianza externo antes de usar datos corporativos.
- Las reglas de aviso existentes son personales. La entrega a un equipo con aislamiento por organización y registro de reconocimiento requiere desarrollo.
- La vista de seguridad corporativa está en desarrollo local. El estado local no prueba qué versión está servida en la LAN.

## Registro de seguimiento y dependencias

Actualizado: 2026-11-07. Rama `feature/corporate-security`, HEAD `99774ec8e` (`Refine CSM shell and office directory`). Hay cambios locales sin commit en la implementación CSM y este roadmap; no se reporta commit, push ni despliegue de la nueva entrega. La referencia `origin` local apunta al HEAD base, lo que no acredita actualización remota ni despliegue. Las fases se aceptan por sus criterios de aceptación, no por la mera presencia de una pantalla o una prueba aislada.

| Orden / responsable | Estado observado | Aceptación y dependencia |
| --- | --- | --- |
| Fase 0 — chat B, «Diseñar monitorización y alertas por…» | Implementada y verificada localmente para la limpieza CSM y dos integraciones públicas iniciales. B reporta selección persistente de panel/fuente/país/tema conectada al consumidor CSM; GDELT por mención de país en noticias en inglés de 72 h, y Telegram público por tema sin filtro por país; carga, desactivada, error, obsoleta y sin resultados. Reporta 26 pruebas DOM, typecheck, boundaries, Biome y builds general/CSM correctos, con navegador local verificado. No hubo datos reales en vivo: GDELT devolvió `seed-unavailable` y Telegram no estaba disponible. El árbol tiene cambios sin commit; sin push ni despliegue. | Aceptación completa del catálogo aún pendiente. Revisar evidencia de navegador para el arranque unificado, persistencia y estados; verificar `/dashboard` CSM y `/csm.html`, ausencia de `App`/paneles generales/PRO y variante general intacta. No afirmar disponibilidad operativa de proveedores ni aprobación corporativa de fuentes; la mención de país no es geolocalización. El test de renovación WebMCP sigue siendo un fallo preexistente reportado (token expira 2026-11-17): no presentar la suite PWA/deploy como verde (resultado anterior: 306 pasaron, 9 omitidas, 1 falló). Mapa, sedes privadas (Fase 2), viajes y alertas (Fase 3) permanecen posteriores y no bloquean por sí solos esta fase. |
| Fase 1 — chat A (coordinación/roadmap) | Sin verificar en el destino. No hay resultado actual de acceso remoto ni revisión de la instalación LAN. | Identificar commit/imagen y ruta real; verificar proxy, límites de red, identidad externa, permisos, secretos y copias/restauración. Es prerrequisito para datos privados reales y para sustituir el OIDC propio del prototipo. |
| Fase 2 — chat A integra tras Fases 0–1 | Base de lectura privada existente, no conectada a `csm.html`; sin inventario real. | Integrar señales y sedes privadas con procedencia, frescura y precisión. Incorporar gestión de oficinas/almacenes con permisos por organización, auditoría y previsualización de importación. Depende de la identidad confiable y almacenamiento aceptados en Fase 1. |
| Fase 3 — chat A tras Fase 2 | No iniciada. Las reglas actuales son personales. | Aceptar fixtures de coincidencia/no coincidencia, expiración, duplicados, fuente degradada y entrega/reconocimiento solo a destinatarios autorizados. Depende de señales conectadas y aislamiento organizativo. |
| Fase 4 — chat A tras Fase 3 | No iniciada. | Aceptar precisión y radios por categoría, límites de distancia y ausencia de alertas para posición ausente, imprecisa u obsoleta. Depende del flujo de Fase 3 y de coordenadas privadas revisadas. |
| Fase 5 — chats A y C, después de evidencias de brecha | No iniciada. La migración visual a CesiumJS queda incorporada al roadmap; no hay proveedor elegido ni piloto implementado. | Para la línea cartográfica, aceptar el piloto cuando mantenga límites políticos legibles sobre imagery/terreno 3D, muestre sedes y señales como capas separadas con selección y detalle, y supere comprobaciones de rendimiento y legibilidad en escritorio y móvil. Revisar proveedor, licencias, atribución, credenciales, cuotas, coste y recuperación. Mantener la vista actual como alternativa hasta la aceptación; sin coordenadas autorizadas no afirmar ubicaciones de edificio ni cargar datos privados. Las demás ampliaciones de Fase 5 requieren además una brecha documentada. |
| Preparación de sedes públicas — chat C, «Extraer sedes para el programa» | Chat C comunicó cuatro localidades corregidas y cierre de su tarea focal. El catálogo mantiene 78 registros con precisión `city`; esto no verifica el edificio de cada sede. | Conservar procedencia y precisión de ciudad; cualquier futura mejora de pin exacto requiere validar dirección/edificio y fuente por registro. Esta preparación no acepta fases privadas ni autoriza geocodificar inventario privado. Chat C es el único editor de `src/config/seidor-offices.json` y de la auditoría del directorio. |

**Alcance de aceptación de Fase 0:** evalúa el arranque CSM y Ajustes. Las funciones operativas de vigilancia temporal y alertas de equipo pertenecen a Fase 3; la gestión privada de sedes, a Fase 2. Su ausencia como funciones conectadas no bloquea por sí sola Fase 0, aunque sus placeholders no deben parecer datos reales ni introducir contenido comercial.

**Fase 0 implementada y verificada localmente; aceptación completa pendiente:** B reporta 26 pruebas DOM, typecheck, boundaries, Biome y builds general/CSM correctos, además de verificación en navegador local. Las selecciones persistentes de panel/fuente/país/tema controlan peticiones y contenido del consumidor CSM público. GDELT devuelve noticias en inglés de 72 h que mencionan el país, lo que no confirma ubicación del hecho; Telegram entrega contenido público por tema sin filtrado por país. Están cubiertos los estados de carga, fuente desactivada, error, obsolescencia y sin resultados. En la comprobación no hubo datos en vivo: GDELT respondió `seed-unavailable` y Telegram no estaba disponible. Esto no acredita disponibilidad/frescura operativa ni aprobación corporativa de las fuentes. La aceptación completa del catálogo y la revisión de evidencia del arranque unificado quedan pendientes; verificar persistencia, `/dashboard` CSM, `/csm.html`, ausencia de `App`/paneles generales/PRO y variante general intacta. La entrega es cambio local sin commit/push ni despliegue. El fallo preexistente del test de renovación WebMCP (token expira 2026-11-17) se conserva explícito; el resultado anterior de PWA/deploy fue 306 pass, 9 skip y 1 fallo, no suite verde.

**Preparación pública de C cerrada, con límite de precisión:** C comunicó cuatro correcciones de localidad y cierre focal; los 78 registros continúan declarados a precisión de ciudad. No equivale a validar ubicación de edificio ni bloquea Fase 0. La gestión privada de sedes y almacenes sigue perteneciendo a Fase 2, tras los controles de Fase 1.

### Límite de despliegue e identidad (Fase 1)

- La conversación identifica el destino previsto como LXC 51 y muestra una visita anterior a `http://192.168.1.51:3000/`; esto no confirma qué revisión o servicio responde ahora, ni que esa dirección sea el destino CSM definitivo.
- El Compose versionado del repositorio publica el servicio general `worldmonitor` en `${WM_PORT:-3000}:8080`, además de `ais-relay`, Redis y `redis-rest`. El endpoint Redis REST se liga a `127.0.0.1:8079`; Redis usa el volumen `redis-data`. No hay en este checkout un servicio CSM en Compose, una ruta nginx de CSM, volúmenes PostgreSQL de CSM ni evidencia que vincule estos puertos al LXC observado.
- `csm/README.md` confirma que el servicio de sedes es separado, no está cableado al Compose/nginx por defecto, no contiene datos reales y conserva OIDC propio. El servicio define lecturas `GET /csm/api/sites` y `GET /csm/api/sites/:id`; su handler valida membresía y rol y sus consultas filtran por organización. Son pruebas de código local, no aceptación del proxy real.
- La configuración SSH local inspeccionada define `occ-leak-acq` → `192.168.1.102` y `gitlab-local` → `192.168.1.240`; ninguno corresponde a `192.168.1.51`. El único alias Colima detectado usa puerto `55480`, sin nombre de host visible en su bloque. No aparece alias LXC 51 ni se infirió/intentó otro usuario, salto o clave.
- Bloqueo concreto para cerrar Fase 1: falta el alias SSH correcto para LXC 51 o la ruta de lectura a través de Proxmox, y confirmar que ese LXC es el que atiende `192.168.1.51:3000`. No se ejecutaron consultas remotas ni se inspeccionaron runtime, puertos, volúmenes, proxy o base del destino.

### Sustitución futura del OIDC propio

No implementar hasta aceptar Fase 0 y documentar/observar el proxy confiable real. El cambio pequeño previsto es: (1) definir las cabeceras de identidad emitidas por el proxy y su lista permitida; (2) limitar el puerto del servicio CSM a la red privada del proxy, sin publicación directa; (3) eliminar cualquier cabecera recibida del cliente en el proxy y añadir las cabeceras autenticadas aguas arriba; (4) en el servicio, aceptar identidad únicamente desde esa frontera de red, exigir sujeto estable e issuer, resolver membresía/rol en `csm_memberships` y filtrar cada consulta por `organization_id`; (5) auditar denegaciones y cambios sin registrar tokens; (6) probar cabeceras falsificadas, acceso directo, usuario sin membresía, roles, cruce entre organizaciones y caída del proxy en el despliegue real. Si el proxy no puede demostrar esa frontera, mantener el OIDC del prototipo aislado y no conectar datos reales.

Dependencias principales: **Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4**. Fase 5 es opcional y necesita una brecha demostrada. La geocodificación pública discurre en paralelo como preparación y no habilita la incorporación ni publicación de datos privados.

## Criterio general de calidad

Una función no se considera terminada porque aparezca en el mapa. Debe conservar procedencia, comportarse correctamente ante datos incompletos/obsoletos y fuentes caídas, respetar los permisos, permitir revisar la evidencia y tener una prueba focal de su flujo real. Si no puede demostrar una coincidencia, debe indicar la limitación o ausencia de datos.
