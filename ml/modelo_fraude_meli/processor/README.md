# processor

Del mart de dbt a datos listos para modelar (`procesar.py`).

- Lee `mart_fraude_features` desde DuckDB (generado por `dbt build`, ver `dbt/README.md`).
- Parte train/test: 80/20 estratificado, semilla 42. Es **la misma partición del EDA** (se comprobó que coincide fila a fila).
- Define dos preprocesadores que aprenden de train: `lineal` (mediana, escalado, cuartiles de `monto`, one-hot) y
  `arboles` (valores limpios; los NaN los manejan los modelos), cada uno con y sin la variable país.
- Se ajustan solo con train. En validación cruzada van dentro del `Pipeline` y se reajustan en cada fold.

```bash
python -m ml.modelo_fraude_meli.processor.procesar   # ajusta con todo train y guarda artefactos para inference
```

Los artefactos (`artefactos/`) no se versionan.
