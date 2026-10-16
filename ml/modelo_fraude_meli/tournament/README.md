# tournament

Torneo de modelos (`torneo.py`): regresión logística, Random Forest, XGBoost y LightGBM, cada uno **con y sin** la
variable país (8 candidatos).

**Protocolo** (no hay variable temporal, así que no hay backtesting fuera de tiempo: validación cruzada estratificada):

1. **Selección:** validación cruzada anidada sobre train (5 folds externos, 3 internos, búsqueda aleatoria de
   hiperparámetros optimizando PR-AUC). El campeón es el de mayor PR-AUC media en los folds externos.
2. **Confirmación:** cada candidato se reajusta con todo train y se evalúa **una sola vez** en test. Test no
   interviene en ninguna decisión.

Métrica principal: PR-AUC (línea base 0,273 = prevalencia). También ROC-AUC, F1 máximo, recall a precisión 80% y Brier.

```bash
python -m ml.modelo_fraude_meli.tournament.torneo            # completo
python -m ml.modelo_fraude_meli.tournament.torneo --rapido   # prueba de humo (~40 s)
```

Resultados en `resultados/torneo.md` y `resultados/torneo.json`. El modelo campeón se guarda en `artefactos/` (no versionado).
