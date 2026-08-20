# Proceso ETL y reporte de calidad

## Propósito

El proceso ETL de TRIP extrae archivos CSV exportados desde Supabase, transforma los datos para homologar tipos y textos, valida relaciones y rangos, y carga los resultados en `data/processed/`.

El script se encuentra en [src/etl/run_etl.py](../src/etl/run_etl.py).

## Flujo

```text
 data/raw/*.csv
       |
       v
 Extracción y perfilado
       |
       v
 Normalización y transformación
       |
       v
 Validación de fechas, rangos e integridad
       |
       v
 data/processed/*.csv
       |
       v
 quality_report.md y quality_report.csv
```

## Fuentes de entrada

El ETL busca estos archivos:

| Archivo | Obligatorio | Contenido |
| --- | --- | --- |
| `profiles.csv` | Sí | Perfiles, roles y fechas de registro |
| `products.csv` | Sí | Catálogo y precios |
| `purchases.csv` | Para monetización | Compras y precio pagado |
| `game_matches.csv` | Para EDA de juego | Partidas y resultados |
| `progress.csv` | No | Progreso del jugador |

Los archivos deben exportarse desde Supabase y colocarse en `data/raw/`. El raw nunca debe modificarse manualmente.

## Transformaciones

### Todas las fuentes

- Se normalizan nombres de columnas a minúsculas.
- Se eliminan espacios sobrantes en textos.
- Las fechas se convierten a UTC.
- Las columnas numéricas se convierten con errores como nulos para poder reportarlos.

### Perfiles

- Se eliminan filas sin `id`.
- Se eliminan duplicados por `id`.
- Se normaliza `role` a minúsculas.

### Productos

- Se eliminan filas sin `id`.
- Se eliminan duplicados por `id`.
- Se convierten precios a número.
- Se excluyen precios negativos.
- Se normaliza el tipo de producto.

### Compras

- Se convierten `price_paid` y `created_at`.
- Se valida que el usuario exista en `profiles`.
- Se valida que el producto exista en `products`.
- Se valida que el precio no sea negativo.
- Se valida que la compra no sea anterior al registro del usuario.
- Se eliminan duplicados por `id`.

### Partidas

- Se convierten fechas, duración, consumos, mapa, vida y daño.
- Se valida que el usuario exista.
- Se excluyen partidas sin fecha válida o futuras.
- Se excluyen valores negativos.
- Se valida que `max_health_end` no supere 100.
- Se valida que la partida no ocurra antes del registro del jugador.

## Ejecución

Desde la raíz del proyecto:

```bash
python src/etl/run_etl.py
```

Si se utiliza el entorno virtual local en Windows:

```powershell
.venv\Scripts\python.exe src\etl\run_etl.py
```

El script genera:

```text
data/processed/
├── profiles.csv
├── products.csv
├── purchases.csv
├── game_matches.csv
├── progress.csv
├── quality_report.csv
└── quality_report.md
```

Los archivos de tablas sin registros no se crean como dataset procesado, pero sí aparecen en el reporte con estado `missing` o con cero filas.

## Reporte de calidad

`quality_report.md` registra por tabla:

- fuente de entrada;
- estado de disponibilidad;
- filas raw;
- filas procesadas;
- filas rechazadas;
- duplicados en raw;
- nulos restantes en processed.

`quality_report.csv` conserva la misma información en formato tabular para utilizarla en el notebook o dashboard.

## Reglas de validación

| Regla | Acción |
| --- | --- |
| Identificador obligatorio | Se rechaza la fila sin identificador |
| Identificador duplicado | Se conserva una fila por entidad |
| Usuario inexistente | Se rechaza compra o partida |
| Producto inexistente | Se rechaza compra |
| Precio negativo | Se rechaza compra o producto |
| Fecha inválida | Se rechaza el registro cuando es necesaria |
| Fecha futura | Se rechaza compra o partida |
| Actividad anterior al registro | Se rechaza compra o partida |
| Duración, daño o consumo negativo | Se rechaza la partida |
| Vida final mayor a 100 | Se rechaza la partida |

## Interpretación de la calidad

Un registro rechazado no se borra del raw. La diferencia entre `raw_rows` y `processed_rows` permite explicar la pérdida de registros. Los valores nulos que no violan una regla no se eliminan automáticamente; deben analizarse según el significado del campo.

## Limitaciones

- El ETL trabaja con CSV exportados, no con una conexión directa a Supabase.
- `progress` se copia sin transformaciones porque su estructura completa todavía debe confirmarse.
- No se calculan utilidad ni margen porque no existe el costo del producto.
- La exportación de compras y partidas requiere una sesión con permisos RLS adecuados.

