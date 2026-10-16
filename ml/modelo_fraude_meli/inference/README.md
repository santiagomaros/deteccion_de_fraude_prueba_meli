# inference

Resultado de producción (`inferir.py`): puntúa operaciones con el modelo campeón (LightGBM con país) y guarda la
tabla `scores_fraude` (`row_id`, `score` = probabilidad de fraude, `particion`, `modelo_version`, `fecha_scoring`) en DuckDB.

- Entrada: la tabla de features de dbt, igual que en entrenamiento. El modelo es un `Pipeline` (preprocesador + LightGBM):
  aplica el mismo preprocesamiento aprendido en train, sin recalcular nada con los datos nuevos.
- Comprueba el esquema (falla si faltan columnas) y que el PR-AUC en test reproduce el del torneo (0,7149).
- Cada score lleva la versión (hash) del modelo que lo generó.

```bash
python -m ml.modelo_fraude_meli.inference.inferir
```
