# iac — Terraform (simulación)

Infraestructura de AWS que necesitaría este pipeline. **Es una simulación**: se validó con `terraform validate`
(sintaxis y coherencia), pero no se aplicó ni se hizo `plan` (no hay credenciales de AWS).

```
                       ┌──────────────── S3 ────────────────┐
 dbt (features) ─────► │ datos      modelos      resultados │ ◄── jobs de SageMaker
                       └───┬────────────┬────────────┬──────┘     (processor, tournament,
                           │            │            │             inference, recommended)
                  Glue crawler    registro de     scores y
                  + catálogo      modelos         recomendaciones
                  (Athena)        (SageMaker)
                                      ▲
 EC2 (Airflow, opcional) ─── lanza jobs, endpoint serverless opcional
```

| Archivo | Qué crea |
|---|---|
| `s3.tf` | 3 buckets (`datos`, `modelos`, `resultados`) con versionado, cifrado AES256, acceso público bloqueado y ciclo de vida: STANDARD_IA a los 30 días, GLACIER a los 90, expiración a los 365 (los modelos y sus metadatos **no** expiran; solo las versiones antiguas, a los 90 días) |
| `iam.tf` | Roles de mínimo privilegio: SageMaker (S3 del proyecto, logs, ECR), Glue (lee las features) y Airflow (lanza jobs, pasa el rol de SageMaker, arranca el crawler) |
| `glue.tf` | Base de datos del catálogo y crawler diario sobre `s3://<datos>/features/` |
| `sagemaker.tf` | Grupo del registro de modelos (versiones del campeón con su metadato), grupo de logs y, **opcional**, un endpoint serverless de inferencia en tiempo real |
| `ec2.tf` | **Opcional**: instancia EC2 donde corre Airflow (IMDSv2, disco cifrado, sin acceso entrante salvo los CIDR indicados) |
| `outputs.tf` | Nombres de buckets, ARN del rol, grupo del registro, crawler, etc. (se cargan como Variables de Airflow) |

Los jobs de ML no necesitan un clúster permanente: Airflow los lanza como *SageMaker Processing jobs* y AWS crea y
destruye las máquinas en cada ejecución (`instancia_jobs_ml`). Lo único que persiste son los buckets, el registro de
modelos y, si se activan, el endpoint y la EC2.

## Uso (referencia)

```bash
cd iac
cp terraform.tfvars.example terraform.tfvars     # ajustar valores (no se versiona)
terraform init
terraform plan
terraform apply
```

`crear_endpoint` y `crear_ec2_airflow` están en `false` por defecto porque cuestan dinero mientras existan.
