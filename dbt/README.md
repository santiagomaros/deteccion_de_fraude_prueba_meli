# dbt — capa SQL de features

Construye, a partir de los datos crudos, la tabla de features que consume el `processor`
(`ml/modelo_fraude_meli/processor`). Local: DuckDB lee el CSV. Producción (referencia): el mismo SQL sobre
Athena/Glue (ver `profiles.yml`).

```
source raw.fraude ──► stg_fraude ──► int_fraude_senales ──► mart_fraude_features
   (CSV, texto)       tipado y       centinelas e            features sin estado
                      limpieza       indicadores             (contrato con el processor)
```

## Reparto de responsabilidades con el `processor`

| dbt (sin estado, parámetros fijos del EDA) | `processor` (aprende de train) |
|---|---|
| Tipado; coma de miles en `monto`, `q`, `r`; vacíos como NULL | Mediana de `c`, imputación |
| `-1` de `b` y `s` → NULL + `b_neg1`, `s_neg1` | Cortes de cuartiles de `monto` |
| `c_falta`, `k_falta`; `x_gt0` en a, d, e, g, h, o, q, r | Codificadores (one-hot, categorías no vistas) y escalado |
| `m_cap4`, `n_cap3`, `p_cap5`, `l_cat`, `j_grp` (6 países + OTRO) | Partición 80/20 estratificada y validación cruzada |
| `log1p_*` de `monto`, `c`, `q`, `a`, `d`, `e`, `h`, `r` | Guardar el preprocesador ajustado para `inference` |

**Regla:** nada que use estadísticas de todo el dataset (medianas, cuantiles, frecuencias, la etiqueta)
puede ir en dbt; sería fuga hacia test y desfase entre entrenamiento e inferencia. Los parámetros fijos
(países, topes) están en `vars` de `dbt_project.yml` y salen del EDA.

## Cómo ejecutarlo

Desde la raíz del proyecto, con el `.venv` activo y el CSV en la raíz (no se versiona):

```bash
cd dbt
mkdir -p target
dbt build --profiles-dir .      # modelos + pruebas + prueba unitaria
```

La ruta del CSV y la base DuckDB se pueden cambiar con `FRAUDE_CSV_PATH` y `DBT_DUCKDB_PATH`.
El resultado queda en `target/fraude.duckdb`, tabla `mart_fraude_features` (47 columnas, 16.880 filas).

## Pruebas

- **Genéricas** (`_staging.yml`, `_marts.yml`): `row_id` único, objetivo en {0, 1}, valores permitidos de `j_grp`,
  `l_cat`, `m_cap4`, `n_cap3`, `p_cap5` (los topes del EDA como contrato).
- **Singulares** (`tests/`): valores válidos (solo `-1` negativo en `b` y `s`; `f`, `g` en [0, 1]; `monto` > 0),
  el mart conserva las filas, los indicadores coinciden con su definición y guardia de tasa de fraude (aviso).
- **Unitaria** (`_marts.yml`): topes, categorías, países y `log1p` sobre filas construidas a mano.

Si una prueba falla, `dbt build` no ejecuta los modelos que dependen de ella: en Airflow la tarea falla y el
`processor` no se ejecuta con datos malos.
