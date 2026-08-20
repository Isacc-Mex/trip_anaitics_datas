# Reporte de calidad de datos

Fecha de ejecucion: 2026-08-20T04:31:48.948006+00:00

Este reporte fue generado automaticamente por `src/etl/run_etl.py`.
Los registros rechazados no se eliminan de los archivos raw; solo se excluyen del dataset procesado.

| Tabla | Estado | Filas raw | Filas procesadas | Rechazadas | Duplicados raw | Nulos procesados |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `profiles` | available | 1007 | 1007 | 0 | 0 | 2005 |
| `products` | available | 17 | 17 | 0 | 0 | 11 |
| `purchases` | available | 682 | 680 | 2 | 0 | 0 |
| `game_matches` | available | 12043 | 1008 | 11035 | 0 | 1450 |
| `progress` | missing | 0 | 0 | 0 | 0 | 0 |

## Transformaciones aplicadas

- Normalizacion de nombres de columnas y textos.
- Conversion de fechas a UTC.
- Conversion de medidas y precios a valores numericos.
- Eliminacion de duplicados por identificador cuando existe.
- Validacion de usuarios y productos referenciados.
- Validacion de fechas no futuras y fechas posteriores al registro.
- Validacion de valores no negativos y vida final entre 0 y 100.

## Interpretacion

Los archivos con estado `missing` requieren exportarse desde Supabase antes de ejecutar el EDA completo. Los nulos que permanecen en el dataset procesado deben analizarse segun el significado del campo; no se eliminan automaticamente.
