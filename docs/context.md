# Contexto, problema y objetivos analíticos

## 1. Información del proyecto

- **Proyecto:** TRIP
- **Giro:** Videojuego narrativo 2D y negocio digital de entretenimiento.
- **Programa educativo:** Ingeniería en Entornos Virtuales y Negocios Digitales.
- **Cuatrimestre:** Noveno.
- **Modalidad:** Proyecto colaborativo.

## 2. Descripción del negocio

TRIP es un videojuego narrativo 2D desarrollado por Pixel Path. La aplicación permite que los usuarios creen una cuenta, jueguen partidas, consulten su progreso y adquieran contenido digital mediante una tienda integrada.

### Productos y servicios

- Videojuego narrativo 2D.
- Contenido digital para el videojuego.
- Productos de tipo `mesh`, `juego`, `asset` y `otro`.
- Estadísticas personales de juego.
- Ranking de mejores tiempos.

### Clientes

- Jugadores registrados.
- Jugadores recurrentes.
- Compradores de contenido digital.
- Usuarios que prueban el videojuego sin realizar compras.

### Canales

- Aplicación web.
- Tienda digital integrada.
- Dashboard del jugador.
- Dashboard administrativo.

### Ingresos

El modelo actual genera ingresos mediante la venta de productos y contenido digital dentro de la tienda de TRIP. El modelo todavía no incluye costos, utilidad ni margen.

### Procesos principales

1. Registro y autenticación del jugador.
2. Creación y actualización del perfil.
3. Inicio y desarrollo de partidas.
4. Almacenamiento de resultados y progreso.
5. Consulta de estadísticas personales.
6. Administración del catálogo.
7. Compra de contenido digital.
8. Consulta de métricas generales.
9. Simulación de datos para análisis.

### Alcance geográfico

El proyecto se encuentra en fase académica y de prototipo web. El alcance geográfico debe definirse por el equipo antes de la entrega. La base actual no contiene una variable geográfica analítica confirmada.

### Herramientas digitales

- React.
- Vite.
- React Router.
- Supabase Auth.
- Supabase PostgreSQL.
- Supabase Storage.
- Supabase Realtime.
- Recharts.
- Python, Pandas y Matplotlib para ETL y EDA.

## 3. Problema de negocio

El equipo necesita comprender cómo interactúan los jugadores con el videojuego y cómo esa interacción se relaciona con la monetización.

Actualmente no es suficiente conocer el número total de usuarios o compras. Se requiere identificar:

- qué jugadores regresan después de registrarse;
- qué mapas concentran la actividad;
- cuándo disminuye la participación;
- qué productos generan más compras e ingresos;
- qué segmentos presentan oportunidades de retención;
- qué proporción de jugadores se convierte en comprador.

### Formulación del problema

TRIP cuenta con datos de perfiles, partidas, productos y compras, pero necesita integrarlos y analizarlos de forma reproducible para detectar patrones de actividad, retención y monetización que permitan tomar decisiones de producto y negocio.

## 4. Stakeholders

| Stakeholder | Necesidad de información | Decisiones o beneficios |
| --- | --- | --- |
| Dueño del negocio | Estado general, ingresos, ventas y retención | Priorizar acciones de negocio |
| Administrador | Operación del catálogo y simulación | Gestionar productos y datos de prueba |
| Responsable de producto | Mapas, duración, dificultad y progreso | Mejorar contenido y experiencia |
| Responsable de marketing | Registros, recurrencia y conversión | Diseñar acciones de retención y compra |
| Jugador | Progreso, partidas y gasto personal | Comprender su relación con TRIP |
| Desarrollador | Rendimiento, errores e integración | Mantener y mejorar la aplicación |
| Analista de datos | Calidad, fuentes y KPI | Validar resultados y recomendaciones |

## 5. Preguntas de negocio

1. ¿Cuántos usuarios están activos durante cada mes?
2. ¿Qué proporción de usuarios regresa durante los días 1, 7 y 30?
3. ¿Cómo evolucionan las compras y los ingresos a través del tiempo?
4. ¿Qué productos son los más vendidos?
5. ¿Qué mapas concentran más partidas?
6. ¿En qué días y horarios se concentra la actividad?
7. ¿Cómo cambia el comportamiento entre jugadores nuevos y recurrentes?
8. ¿Qué proporción de jugadores realiza al menos una compra?
9. ¿Qué segmentos combinan mayor actividad y gasto?
10. ¿Qué oportunidades existen para mejorar la retención y la monetización?

## 6. Objetivo general

Procesar, analizar e interpretar la información del videojuego TRIP mediante herramientas de analítica de datos para identificar tendencias, patrones, métricas e indicadores que apoyen la toma de decisiones del negocio digital.

## 7. Objetivo analítico

Analizar el comportamiento de los jugadores, sus partidas y sus compras mediante datos almacenados en Supabase para identificar patrones de actividad, retención y monetización que apoyen decisiones de producto, contenido y comercialización.

## 8. Objetivos específicos

- Describir el comportamiento de los jugadores y sus sesiones de juego.
- Integrar perfiles, productos, compras y partidas para el análisis.
- Identificar patrones de retención D1, D7 y D30.
- Comparar jugadores nuevos, ocasionales, recurrentes y comprometidos.
- Analizar la relación entre participación en el juego y compras digitales.
- Identificar mapas, horarios y productos relevantes para el negocio.
- Definir KPI con fórmula, fuente, meta, alerta y responsable.
- Proponer recomendaciones sustentadas en los resultados.

## 9. Alcance

El análisis considera:

- Perfiles y fechas de registro.
- Productos y precios.
- Compras y precio pagado.
- Partidas y fechas de juego.
- Mapas, duración, consumos, daño y tipos de muerte.
- Retención y actividad temporal.
- Segmentación descriptiva de jugadores.
- Dashboards para administrador y jugador.

## 10. Limitaciones

- La simulación utiliza `random()` de PostgreSQL sin semilla controlada.
- Las compras y partidas requieren exportación autorizada desde Supabase.
- Los resultados simulados no representan necesariamente a jugadores reales.
- El modelo actual no contiene costos, utilidad ni margen.
- No se cuenta con campañas, dispositivos, regiones ni sesiones independientes confirmadas.
- Una correlación no demuestra causalidad.
- Las metas de KPI deben ajustarse después de observar la línea base.

## 11. Relación con el análisis

```text
Problema de retención y monetización
              |
              v
Perfiles, partidas, productos y compras
              |
              v
ETL y validación de calidad
              |
              v
EDA y segmentación de jugadores
              |
              v
KPI y dashboards
              |
              v
Diagnóstico y recomendaciones
```

## 12. Evidencias

- [x] Contexto del negocio.
- [x] Planteamiento del problema.
- [x] Objetivo general.
- [x] Objetivo analítico.
- [x] Objetivos específicos.
- [x] Preguntas de negocio.
- [x] Stakeholders.
- [x] Alcance y limitaciones.
- [x] Nombres definitivos de integrantes.

