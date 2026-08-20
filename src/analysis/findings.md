# Hallazgos, diagnóstico y recomendaciones

## Estado del documento

Este documento define la estructura para transformar los resultados técnicos del EDA y del mecanismo analítico en decisiones de negocio.

Los campos entre corchetes deben completarse con valores obtenidos del dataset procesado. No deben presentarse ejemplos o hipótesis como resultados reales.

## 1. Propósito

Convertir los resultados de actividad, retención y monetización de TRIP en conclusiones comprensibles para el dueño del negocio, el responsable de producto y el responsable de marketing.

El análisis debe responder:

- ¿Qué está ocurriendo?
- ¿Por qué podría estar ocurriendo?
- ¿Qué impacto tiene para TRIP?
- ¿Qué decisión se recomienda?
- ¿Cómo se medirá si la acción funciona?

## 2. Fuentes de evidencia

| Evidencia | Archivo o fuente | Estado |
| --- | --- | --- |
| Perfiles | `data/processed/profiles.csv` | Disponible |
| Productos | `data/processed/products.csv` | Disponible |
| Compras | `data/processed/purchases.csv` | Pendiente de exportar |
| Partidas | `data/processed/game_matches.csv` | Pendiente de exportar |
| Calidad | `data/processed/quality_report.md` | Disponible |
| EDA | `notebooks/eda.ipynb` | Preparado; requiere compras y partidas |
| KPI | `docs/kpis.pdf` | Definido; resultados pendientes |
| Segmentación | Sección de mecanismo analítico del notebook | Preparada; requiere actividad |

Mientras falten compras y partidas, solo pueden describirse limitaciones de cobertura. No es válido concluir que la retención, los ingresos o la actividad son cero.

## 3. Método para redactar un hallazgo

Cada hallazgo debe contener:

1. **Resultado:** valor, porcentaje, periodo o segmento observado.
2. **Comparación:** diferencia frente a otro periodo, mapa, producto o segmento.
3. **Significado:** impacto para el negocio.
4. **Posible causa:** explicación compatible con los datos.
5. **Limitación:** qué no puede afirmarse con la evidencia disponible.
6. **Decisión:** acción concreta que podría tomar el negocio.
7. **KPI relacionado:** indicador que permitirá dar seguimiento.

### Ejemplo de estructura

> Durante [periodo], [segmento o producto] presentó [resultado], frente a [comparación]. Esto significa [impacto]. Una posible explicación es [causa respaldada o hipótesis]. Los datos no permiten afirmar [limitación]. Se recomienda [acción]. El resultado se seguirá mediante [KPI].

## 4. Hallazgos principales

### Hallazgo 1: Retención

- **Pregunta relacionada:** ¿Qué proporción de usuarios regresa en D1, D7 y D30?
- **Resultado:** [retención D1, D7 y D30]
- **Comparación:** [cohorte, periodo o segmento de comparación]
- **Significado:** [impacto en permanencia]
- **Posible causa:** [causa respaldada por datos o hipótesis]
- **Limitación:** [limitación]
- **Decisión:** [acción concreta]
- **KPI:** Retención D1, D7 o D30

### Hallazgo 2: Actividad y recurrencia

- **Pregunta relacionada:** ¿Cómo cambia el comportamiento entre jugadores nuevos y recurrentes?
- **Resultado:** [partidas promedio, usuarios activos o distribución de segmentos]
- **Comparación:** [jugadores nuevos frente a recurrentes]
- **Significado:** [impacto en experiencia y permanencia]
- **Posible causa:** [causa]
- **Limitación:** [limitación]
- **Decisión:** [acción]
- **KPI:** Usuarios activos mensuales o partidas por jugador

### Hallazgo 3: Mapas y dificultad

- **Pregunta relacionada:** ¿Qué mapas concentran actividad o abandono?
- **Resultado:** [mapa con mayor actividad, duración o tasa de muerte]
- **Comparación:** [comparación entre mapas]
- **Significado:** [impacto para contenido y dificultad]
- **Posible causa:** [causa]
- **Limitación:** Una asociación entre mapa y abandono no demuestra causalidad por sí sola.
- **Decisión:** [revisar dificultad, instrucciones, balance o contenido]
- **KPI:** Tasa de muerte, duración promedio o partidas por mapa

### Hallazgo 4: Conversión a compra

- **Pregunta relacionada:** ¿Qué proporción de jugadores realiza compras?
- **Resultado:** [tasa de conversión]
- **Comparación:** [periodo o segmento]
- **Significado:** [impacto en monetización]
- **Posible causa:** [causa]
- **Limitación:** La conversión no demuestra por sí misma satisfacción o causalidad.
- **Decisión:** [acción comercial o de experiencia]
- **KPI:** Tasa de conversión a compra

### Hallazgo 5: Productos e ingresos

- **Pregunta relacionada:** ¿Qué productos generan más compras e ingresos?
- **Resultado:** [producto, cantidad e ingreso]
- **Comparación:** [producto o periodo de comparación]
- **Significado:** [impacto en catálogo]
- **Posible causa:** [causa]
- **Limitación:** El ingreso no equivale a utilidad porque todavía no hay costos.
- **Decisión:** [acción sobre catálogo, precio o promoción]
- **KPI:** Ingresos totales, compras o ticket promedio

### Hallazgo 6: Horarios de actividad

- **Pregunta relacionada:** ¿En qué días y horarios se concentra la actividad?
- **Resultado:** [día y hora de mayor actividad]
- **Comparación:** [periodos con menor actividad]
- **Significado:** [impacto en eventos, soporte o contenido]
- **Posible causa:** [causa]
- **Limitación:** La hora registrada depende de la zona horaria utilizada en la exportación.
- **Decisión:** [acción]
- **KPI:** Usuarios activos o partidas por hora

## 5. Diagnóstico ejecutivo

### Situación actual

[Describir el estado general de actividad, retención y monetización con datos validados.]

### Fortalezas

- La aplicación registra perfiles, partidas y compras en Supabase cuando las fuentes están disponibles.
- Existen dashboards diferenciados para administrador y jugador.
- La simulación incorpora segmentos, temporalidad y abandono progresivo por mapa.
- El ETL conserva los datos raw y genera una salida processed.
- El notebook permite reproducir el análisis exploratorio.

### Problemas

- [Problema de retención comprobado].
- [Problema de monetización comprobado].
- [Problema de actividad o experiencia comprobado].
- [Problema de calidad de datos comprobado].

### Riesgos

- Confundir datos simulados con comportamiento real.
- Tomar decisiones con compras o partidas incompletas.
- Interpretar correlaciones como causas.
- Evaluar rentabilidad sin costos, utilidad ni margen.
- Exponer información personal en tablas o rankings.

### Oportunidades

- Mejorar la experiencia de los jugadores nuevos.
- Revisar mapas con mayor abandono o dificultad.
- Crear acciones diferenciadas para cada segmento.
- Mejorar productos con alta demanda.
- Incorporar costos, margen, campañas y dispositivos al modelo.

## 6. Recomendaciones priorizadas

| Prioridad | Hallazgo | Recomendación | Impacto | Costo | Urgencia | KPI de seguimiento | Responsable |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | [hallazgo] | [acción concreta] | Alto/medio/bajo | Alto/medio/bajo | Alta/media/baja | [KPI] | [responsable] |
| 2 | [hallazgo] | [acción concreta] | Alto/medio/bajo | Alto/medio/bajo | Alta/media/baja | [KPI] | [responsable] |
| 3 | [hallazgo] | [acción concreta] | Alto/medio/bajo | Alto/medio/bajo | Alta/media/baja | [KPI] | [responsable] |
| 4 | [hallazgo] | [acción concreta] | Alto/medio/bajo | Alto/medio/bajo | Alta/media/baja | [KPI] | [responsable] |
| 5 | [hallazgo] | [acción concreta] | Alto/medio/bajo | Alto/medio/bajo | Alta/media/baja | [KPI] | [responsable] |

### Acciones posibles

Estas acciones solo deben conservarse si el EDA las respalda:

- Diseñar una experiencia de segunda partida si la retención inicial es baja.
- Revisar el mapa donde se concentra el abandono.
- Crear recomendaciones de contenido para jugadores recurrentes.
- Ofrecer promociones a jugadores activos que aún no compran.
- Priorizar productos con alta frecuencia de compra.
- Incorporar costos antes de recomendar cambios de precio.
- Programar eventos en los horarios de mayor actividad.
- Crear alertas cuando la retención, conversión o actividad disminuyan.

## 7. Plan de seguimiento

| Acción | KPI inicial | Meta | Periodo de revisión | Resultado posterior |
| --- | --- | --- | --- | --- |
| [acción] | [KPI] | [meta] | [fecha o periodo] | [pendiente] |
| [acción] | [KPI] | [meta] | [fecha o periodo] | [pendiente] |
| [acción] | [KPI] | [meta] | [fecha o periodo] | [pendiente] |

## 8. Conclusiones

1. [Conclusión sobre retención].
2. [Conclusión sobre actividad y mapas].
3. [Conclusión sobre compras y monetización].
4. [Conclusión sobre calidad y limitaciones].
5. [Decisión prioritaria para el negocio].

## 9. Lista de validación

- [ ] Se analizaron al menos cinco hallazgos.
- [ ] Cada hallazgo tiene un valor o comparación verificable.
- [ ] Las causas están separadas de las hipótesis.
- [ ] Las recomendaciones se relacionan con hallazgos concretos.
- [ ] Cada recomendación tiene KPI de seguimiento.
- [ ] Las acciones están priorizadas por impacto, costo y urgencia.
- [ ] Se documentaron limitaciones.
- [ ] Los resultados coinciden con el notebook EDA.
- [ ] Los hallazgos fueron incorporados al reporte ejecutivo.
- [ ] El equipo puede defender las conclusiones.
