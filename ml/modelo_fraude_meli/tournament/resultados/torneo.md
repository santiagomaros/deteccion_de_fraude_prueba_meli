# Resultados del torneo

Línea base (clasificador aleatorio): PR-AUC = 0.273.

## Fase 1 — validación cruzada anidada sobre train (media ± desv. de los folds externos)

| Variante | Modelo | PR-AUC | ROC-AUC | F1 máx. | Recall a precisión 80% | Brier | Seg. |
|---|---|---|---|---|---|---|---|
| con_pais | lightgbm | 0.6964 ± 0.0227 | 0.8273 ± 0.0121 | 0.6247 ± 0.0152 | 0.3651 ± 0.0536 | 0.1378 ± 0.0055 | 22.5 |
| con_pais | xgboost | 0.6909 ± 0.0203 | 0.8268 ± 0.0099 | 0.6259 ± 0.0128 | 0.3426 ± 0.0554 | 0.1563 ± 0.0108 | 12.6 |
| con_pais | random_forest | 0.6673 ± 0.0206 | 0.8129 ± 0.0115 | 0.6079 ± 0.0123 | 0.3017 ± 0.0404 | 0.1472 ± 0.0030 | 59.6 |
| con_pais | regresion_logistica | 0.6476 ± 0.0214 | 0.8028 ± 0.0124 | 0.6023 ± 0.0114 | 0.2445 ± 0.0391 | 0.1601 ± 0.0176 | 1.9 |
| sin_pais | lightgbm | 0.6042 ± 0.0281 | 0.7841 ± 0.0137 | 0.5785 ± 0.0155 | 0.1694 ± 0.0624 | 0.1559 ± 0.0055 | 21.8 |
| sin_pais | xgboost | 0.5939 ± 0.0333 | 0.7809 ± 0.0132 | 0.5794 ± 0.0123 | 0.1588 ± 0.1025 | 0.1688 ± 0.0144 | 12.0 |
| sin_pais | random_forest | 0.5756 ± 0.0238 | 0.7726 ± 0.0115 | 0.5755 ± 0.0148 | 0.1022 ± 0.0408 | 0.1616 ± 0.0029 | 54.7 |
| sin_pais | regresion_logistica | 0.5332 ± 0.0193 | 0.7523 ± 0.0098 | 0.5586 ± 0.0113 | 0.0474 ± 0.0314 | 0.1665 ± 0.0033 | 1.0 |

**Campeón (mayor PR-AUC media): con_pais / lightgbm**

## Fase 2 — modelos reajustados con todo train y evaluados una vez en test

| Variante | Modelo | PR-AUC | ROC-AUC | F1 máx. | Recall a precisión 80% | Brier |
|---|---|---|---|---|---|---|
| con_pais | lightgbm | 0.7149 | 0.8425 | 0.6440 | 0.3926 | 0.1327 |
| con_pais | xgboost | 0.7080 | 0.8382 | 0.6301 | 0.3796 | 0.1495 |
| con_pais | random_forest | 0.6664 | 0.8140 | 0.6013 | 0.3037 | 0.1467 |
| con_pais | regresion_logistica | 0.6431 | 0.8004 | 0.5914 | 0.2484 | 0.1491 |
| sin_pais | lightgbm | 0.6399 | 0.8070 | 0.5901 | 0.2766 | 0.1473 |
| sin_pais | xgboost | 0.6322 | 0.8022 | 0.5931 | 0.2343 | 0.1661 |
| sin_pais | random_forest | 0.5857 | 0.7791 | 0.5697 | 0.1464 | 0.1599 |
| sin_pais | regresion_logistica | 0.5358 | 0.7552 | 0.5534 | 0.0195 | 0.1660 |
