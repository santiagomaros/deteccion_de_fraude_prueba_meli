# Prueba técnica — Clasificador de fraude (Mercado Libre)

Candidato: Jhair Santiago Martinez Osorio
Cargo: Machine Learning Engineer — Fraud Prevention Payments

## Objetivo

Entrenar al menos tres algoritmos para predecir si una operación es fraudulenta, comparar su desempeño, elegir y justificar el modelo para producción, y documentarlo en un informe (ver [ejercicio.md](ejercicio.md)).

## Resultado

Se compararon cuatro algoritmos (regresión logística, Random Forest, XGBoost y LightGBM), cada uno con y sin la variable país, con validación cruzada anidada sobre train (80%) y una única evaluación en test (20%).

| Modelo (con país) | PR-AUC validación | PR-AUC test |
|---|---|---|
| **LightGBM (elegido)** | 0,696 ± 0,023 | **0,715** |
| XGBoost | 0,691 | 0,708 |
| Random Forest | 0,667 | 0,666 |
| Regresión logística | 0,648 | 0,643 |

La línea base de un clasificador aleatorio es 0,273 (prevalencia). La tabla completa está en [torneo.md](ml/modelo_fraude_meli/tournament/resultados/torneo.md). El modelo se traduce en una política por cuatro bandas (aprobar, autenticación adicional, revisión manual y rechazar) en [recomendaciones.md](ml/modelo_fraude_meli/recommended/resultados/recomendaciones.md). La variable país puede ser un artefacto del muestreo: sin ella, LightGBM llega a 0,640 en test.

## Estructura

```
prueba/
├── dbt/                                   # Capa SQL: features sin estado (DuckDB en desarrollo) y sus pruebas
├── airflow/                               # Orquestación: DAG diario con torneo semanal
├── iac/                                   # Terraform (simulación): S3, IAM, Glue, SageMaker, EC2 opcional
├── ml/modelo_fraude_meli/                 # Jobs de SageMaker
│   ├── processor/                         #   mart de dbt -> particiones y preprocesadores (aprende solo de train)
│   ├── tournament/                        #   validación anidada, 4 algoritmos, selección del campeón
│   ├── inference/                         #   scores por operación con la versión del modelo
│   └── recommended/                       #   acción y motivos por operación
├── src/eda/                               # Cuaderno del análisis exploratorio (pasos 0 a 9)
└── reports/                               # Informe final, figuras y scripts que los generan
```

Cada carpeta tiene su propio `README.md` con el detalle.

## Ramas

`feature/Santiago_M_prueba` → `dev` → `release` → `main` (promoción mediante pull requests).

## Cómo reproducir

El dataset no se versiona: copiar `mercadolibre_fraud_dataset_data.csv` en la raíz del proyecto. Desde la raíz:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt          # Python 3.14; en macOS: brew install libomp (XGBoost y LightGBM)
```

```bash
# 1. Features con dbt (modelos + 27 pruebas)
cd dbt && mkdir -p target && dbt build --profiles-dir . && cd ..

# 2. Processor, torneo, inference y recommended
python -m ml.modelo_fraude_meli.processor.procesar
python -m ml.modelo_fraude_meli.tournament.torneo          # --rapido para una prueba de humo
python -m ml.modelo_fraude_meli.inference.inferir
python -m ml.modelo_fraude_meli.recommended.recomendar
```

El EDA está en `src/eda/eda.ipynb` (ejecutar de arriba abajo). Los modelos y las bases intermedias quedan en `ml/modelo_fraude_meli/artefactos/` y no se versionan.

## Qué se verificó y qué no

- **Ejecutado:** dbt (pruebas y paridad con pandas), processor, torneo, inference (reproduce la métrica del torneo) y recommended.
- **Solo validado de forma estática:** el DAG de Airflow se verifica por estructura (`airflow/tests/verificar_dag.py`) y la IaC con `terraform validate`. No se ejecutaron en Airflow ni en AWS.
- **Pendiente:** adaptar la entrada y salida de los módulos de `ml/` a S3, y la fase de post-producción (monitoreo, históricos y reentrenamientos), descrita solo como diseño en el informe.
