# recommended

Convierte los scores de `inference` en recomendaciones de prevención de fraude (`recomendar.py`).

- **Acción** por operación, según bandas de score: `aprobar` < `autenticacion_adicional` (p. ej. 3DS/OTP) <
  `revision_manual` < `rechazar`.
- **Umbrales** a partir de una precisión acumulada objetivo por banda (90% rechazar, 70% revisión, 50% autenticación),
  calculados con predicciones fuera de muestra sobre train. Test solo sirve para evaluar la política.
- **Motivos**: las 3 variables que más suben el riesgo de cada operación marcada (contribuciones exactas de LightGBM).
- **Salida**: tabla `recomendaciones` (DuckDB) y `resultados/recomendaciones.md` (política, resultado por acción en test,
  variables más influyentes, resumen por país) + `resultados/politica.json`.

```bash
python -m ml.modelo_fraude_meli.recommended.recomendar
```

La muestra tiene 27,3% de fraude: precisiones y volúmenes no se trasladan a producción. Allí los umbrales se
reajustan con la prevalencia real, la capacidad de revisión y el costo de cada decisión.
