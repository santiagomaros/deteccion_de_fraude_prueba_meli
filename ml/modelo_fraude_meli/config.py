"""Configuración común del modelo de fraude: rutas, semilla y columnas del mart de dbt."""
import os
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
MODELO_DIR = RAIZ / "ml" / "modelo_fraude_meli"

# Mart generado por dbt (ver dbt/README.md). Se puede cambiar con la variable MART_DUCKDB.
DUCKDB = Path(os.environ.get("MART_DUCKDB", RAIZ / "dbt" / "target" / "fraude.duckdb"))
TABLA_MART = "mart_fraude_features"

ARTEFACTOS = MODELO_DIR / "artefactos"                  # modelos y preprocesadores (no se versionan)
RESULTADOS = MODELO_DIR / "tournament" / "resultados"   # tablas del torneo (JSON y Markdown, sí se versionan)

SEED = 42
TEST_SIZE = 0.20
TARGET = "fraude"
ID = "row_id"

# Campeón del torneo (ver tournament/resultados/torneo.md): LightGBM con la variable país.
CAMPEON_ARCHIVO = ARTEFACTOS / "modelo_campeon.joblib"
RESULTADOS_DB = ARTEFACTOS / "resultados.duckdb"        # tablas de salida: scores_fraude y recomendaciones
