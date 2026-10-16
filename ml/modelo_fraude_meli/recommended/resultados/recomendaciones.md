# Recomendaciones de prevención de fraude

Modelo `b0953c27` (LightGBM con país). Evaluación sobre test (3,376 operaciones, 27.3% de fraude).

> La muestra está enriquecida con fraudes (27,3%); las precisiones y los volúmenes no se trasladan a producción.

## Política

| Acción | Umbral de score | Precisión acumulada objetivo | Precisión acumulada real en test | % de operaciones con score ≥ umbral |
|---|---|---|---|---|
| autenticacion_adicional | 0.221 | 50% | 51.9% | 42.1% |
| revision_manual | 0.483 | 70% | 70.5% | 19.0% |
| rechazar | 0.770 | 90% | 92.4% | 8.6% |

Los umbrales salen de predicciones fuera de muestra sobre train; la columna «real en test» es la comprobación independiente.

## Resultado por acción (test)

| Acción | Operaciones | % operaciones | Tasa de fraude | Fraudes | % del fraude capturado | % del monto de fraude |
|---|---|---|---|---|---|---|
| aprobar | 1,955 | 57.9% | 9.5% | 185 | 20.1% | 24.5% |
| autenticacion_adicional | 778 | 23.0% | 36.5% | 284 | 30.8% | 26.4% |
| revision_manual | 354 | 10.5% | 52.5% | 186 | 20.2% | 21.1% |
| rechazar | 289 | 8.6% | 92.4% | 267 | 29.0% | 28.1% |

«Aprobar» incluye el fraude que se escapa: su tasa de fraude y su % del fraude son el riesgo residual de la política.

## Qué empuja más el score (importancia media absoluta, log-odds)

| Variable | Importancia |
|---|---|
| b | 0.619 |
| s | 0.376 |
| j_grp_MX | 0.291 |
| c | 0.288 |
| monto | 0.286 |
| j_grp_ES | 0.174 |
| p | 0.139 |
| k | 0.123 |
| j_grp_UY | 0.102 |
| m | 0.086 |

## Por país (test)

| País | Operaciones | Tasa de fraude | Score medio | % en revisión o rechazo |
|---|---|---|---|---|
| AR | 1,836 | 28.9% | 0.285 | 19.0% |
| BR | 908 | 23.9% | 0.242 | 16.4% |
| ES | 73 | 90.4% | 0.951 | 98.6% |
| MX | 478 | 9.2% | 0.090 | 1.5% |
| OTRO | 9 | 0.0% | 0.050 | 0.0% |
| US | 36 | 80.6% | 0.805 | 86.1% |
| UY | 36 | 100.0% | 0.983 | 100.0% |

## Ejemplos de motivos (operaciones rechazadas con mayor score)

- fila 594: score 0.999 → j_grp_ES=1 (+3.92); b=20 (+1.53); c=87534 (+1.52)
- fila 667: score 0.998 → j_grp_ES=1 (+4.25); c=269372 (+2.20); b=13 (+0.77)
- fila 74: score 0.998 → j_grp_UY=1 (+4.28); p=7 (+2.05); b=12 (+0.45)

## Recomendaciones

1. **Aplicar la política por bandas** con los umbrales de arriba como punto de partida; en producción reajustarlos con la prevalencia real, la capacidad de revisión manual y el costo de cada decisión.
2. **Priorizar la revisión manual** en la banda intermedia: concentra operaciones con riesgo alto pero no concluyente; los motivos orientan al analista.
3. **Tratar el país con cautela:** 3 de las 10 variables más influyentes son categorías de país y puede reflejar cómo se armó la muestra (EDA, [H10]); validar con datos reales antes de basar reglas en él.
4. **Monitorear** la distribución del score, la tasa por banda y la deriva de las variables más influyentes; reentrenar si se degradan.
