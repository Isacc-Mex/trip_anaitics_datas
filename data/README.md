# Datos del proyecto

## Separación raw y processed

El proyecto conserva dos versiones de los datos:

- `data/raw/`: exportaciones originales desde Supabase. No se modifican manualmente.
- `data/processed/`: datos generados por el ETL después de normalizar y validar.

```text
data/
├── raw/
│   ├── profiles.csv
│   ├── products.csv
│   ├── purchases.csv
│   └── game_matches.csv
│ 
└── processed/
    ├── profiles.csv
    ├── products.csv
    ├── purchases.csv
    ├── game_matches.csv
    ├── progress.csv
    ├── quality_report.csv
    └── quality_report.md
```

Los archivos que todavía no existan deben exportarse desde Supabase antes de ejecutar el EDA completo. No se deben crear filas ficticias manualmente dentro de los CSV.

## Procedimiento

1. Exporta las tablas desde Supabase.
2. Guarda las exportaciones originales en `data/raw/` con los nombres esperados.
3. Ejecuta el ETL:

   ```powershell
   .venv\Scripts\python.exe src\etl\run_etl.py
   ```

4. Revisa `data/processed/quality_report.md`.
5. Comprueba cuántas filas fueron procesadas y rechazadas.
6. Ejecuta el notebook `notebooks/eda.ipynb` usando los datos procesados o las fuentes raw según la sección de carga.
7. Conserva la fecha de extracción, el script utilizado y el reporte de calidad como evidencia.

## Estado actual

| Dataset | Raw | Processed | Estado |
| --- | ---: | ---: | --- |
| Perfiles | 1,033 filas | 1,033 filas | Disponible |
| Productos | 17 filas | 17 filas | Disponible |
| Compras | 0 filas | Pendiente | Falta exportar o generar |
| Partidas | 0 filas | Pendiente | Falta exportar o generar |
| Progreso | 0 filas | Pendiente | Fuente opcional aún no exportada |

El dataset original y el procesado se consideran completos para la entrega únicamente después de incluir las fuentes necesarias para responder las preguntas de negocio: perfiles, productos, compras y partidas.

## Regla de trazabilidad

Una fila procesada debe poder relacionarse con una fuente raw y con una transformación documentada. El ETL no sobrescribe los archivos raw; genera sus resultados en `data/processed/`.
