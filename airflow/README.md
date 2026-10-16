# airflow — orquestación

`dags/fraude_meli_diario.py`: un DAG diario (06:00 UTC) que encadena todo el flujo.

```
dbt_build ─► publicar_features_s3 ─► crawler_glue ─► processor ─► ¿lunes? ─┬─► torneo ───────┐
                                                                           └─► omitir_torneo ┤
                                                                inference ◄──────────────────┘
                                                                    └─► recommended ─► fin
```

- **dbt_build** ejecuta modelos y pruebas; si una prueba falla, no corre nada más (no se puntúa con datos malos).
- **processor, torneo, inference y recommended** son *SageMaker Processing jobs* que ejecutan los módulos de
  `ml/modelo_fraude_meli` dentro de la imagen del proyecto. SageMaker crea y destruye las máquinas en cada ejecución.
- **Reentrenamiento semanal:** el torneo corre los lunes; los demás días se usa el campeón vigente
  (`trigger_rule = none_failed_min_one_success` en `inference`).
- Los buckets, el rol, la imagen y el crawler son Variables de Airflow (`fraude_*`) que se cargan desde las salidas
  de Terraform (`iac/`).

## Verificación

```bash
python airflow/tests/verificar_dag.py
```

Importa el DAG con un Airflow simulado y comprueba tareas, dependencias, la regla de ejecución y la rama de los lunes.
**Es una simulación:** el DAG no se ejecutó en un Airflow real, y los módulos de `ml/` leen archivos locales (DuckDB);
para correr en SageMaker habría que cambiar esa entrada y salida por las rutas montadas desde S3 (`/opt/ml/processing/...`).
