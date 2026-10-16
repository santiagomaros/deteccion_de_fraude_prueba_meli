"""Genera las figuras del informe (reports/figuras/) a partir del cuaderno de EDA, el mart de dbt y los resultados del torneo.

Uso (desde la raíz, con el .venv activo y después de dbt, processor, torneo, inference y recommended):
    python reports/generar_figuras.py
"""
import json, sys, os
from pathlib import Path
import matplotlib; matplotlib.use("Agg")
import numpy as np, pandas as pd, duckdb, joblib, warnings
warnings.filterwarnings("ignore")
RAIZ = str(Path(__file__).resolve().parents[1])
OUT = RAIZ + "/reports/figuras/"
os.chdir(RAIZ + "/src/eda"); sys.path.insert(0, RAIZ)

# ---- Estado del cuaderno de EDA (se ejecutan sus celdas para reutilizar sus funciones y sus tablas) ----
nb = json.load(open("eda.ipynb")); ns = {}
src = lambda c: "".join(c["source"])
corte = next(i for i, c in enumerate(nb["cells"]) if c["cell_type"] == "code" and src(c).startswith("# Numéricas vs Fraude (train): Mann-Whitney"))
for c in nb["cells"][:corte + 1]:
    if c["cell_type"] == "code":
        try: exec(compile(src(c), "celda", "exec"), ns)
        except NameError as e: print("aviso: celda con dependencia fuera de orden en el cuaderno ->", e)   # p. ej. la figura por tramos usa `bi`, definida más abajo
plt = ns["plt"]; sns = ns["sns"]; train = ns["train"]; bi = ns["bi"]; corr = ns["corr"]; TARGET = ns["TARGET"]
AZUL, ROJO, VERDE, NAR = "#4C78A8", "#E45756", "#54A24B", "#F58518"
plt.rcParams.update({"font.size": 9, "axes.titlesize": 10, "axes.spines.top": False, "axes.spines.right": False})
def guardar(fig, nombre): fig.savefig(OUT + nombre, dpi=170, bbox_inches="tight"); plt.close(fig); print("ok", nombre)

# f1: objetivo y país
fig, (a, b) = plt.subplots(1, 2, figsize=(9, 3.4), gridspec_kw={"width_ratios": [1, 1.7]})
conteo = train[TARGET].value_counts().sort_index(); n = len(train)
a.bar(["No fraude", "Fraude"], conteo.values, color=[AZUL, ROJO])
for i, v in enumerate(conteo.values): a.text(i, v, f"{v:,}\n({v/n:.1%})", ha="center", va="bottom")
a.set_ylim(0, conteo.max() * 1.22); a.set_title("Variable objetivo (train)"); a.set_ylabel("Filas")
J = train["J"].where(train["J"].isin(["AR", "BR", "MX", "ES", "US", "UY"]), "OTRO")
g = train.groupby(J)[TARGET].agg(["size", "mean"]).sort_values("size", ascending=False)
b.bar(g.index, g["mean"], color=ROJO); b.axhline(train[TARGET].mean(), ls="--", color="k", lw=1)
for x, (idx, r) in enumerate(g.iterrows()): b.text(x, r["mean"] + .02, f"{r['mean']:.0%}\nn={int(r['size']):,}", ha="center", fontsize=8)
b.set_ylim(0, 1.25); b.set_yticks(np.linspace(0, 1, 6)); b.set_title("Tasa de fraude por país (línea: tasa global)"); b.set_ylabel("Tasa de fraude")
guardar(fig, "f1_objetivo_pais.png")

# f2: AUC univariada (Mann-Whitney), coloreada por la señal del cuaderno (significancia tras Benjamini-Hochberg)
d = bi.iloc[::-1]
fig, ax = plt.subplots(figsize=(6.4, 5))
sig = d["señal"] != "no significativa"
ax.scatter(d["AUC"][sig], np.arange(len(d))[sig.to_numpy()], c=ROJO, zorder=3, label="significativa (BH, q < 0,05)")
ax.scatter(d["AUC"][~sig], np.arange(len(d))[(~sig).to_numpy()], c="#9E9E9E", zorder=3, label="no significativa")
for yi, v in enumerate(d["AUC"]): ax.text(v + (.006 if v >= .5 else -.006), yi, f"{v:.3f}", va="center", ha="left" if v >= .5 else "right", fontsize=7)
ax.axvline(.5, ls="--", color="k", lw=1); ax.set_yticks(range(len(d))); ax.set_yticklabels(d.index); ax.set_xlim(.32, .75)
ax.set_xlabel("AUC univariada de Mann-Whitney (0,5 = sin señal)"); ax.set_title("Poder univariado de las variables numéricas"); ax.legend(frameon=False, loc="lower right", fontsize=8)
guardar(fig, "f2_auc_univariada.png")

# f3: tasa de fraude por tramo en variables clave
tramos, wilson = ns["tramos"], ns["wilson"]; glob = train[TARGET].mean()
fig, axes = plt.subplots(2, 3, figsize=(10, 5.6))
for ax, col in zip(axes.ravel(), ["B", "S", "K", "Monto", "L", "P"]):
    etiq, orden = tramos(train[col], col)
    g = train.groupby(etiq)[TARGET].agg(n="size", k="sum").reindex(orden)
    tasa = (g["k"] / g["n"]).to_numpy(); ic = np.array([wilson(k, n) for k, n in zip(g["k"], g["n"])])
    ax.bar(range(len(orden)), tasa, color=[ROJO if l in ("NA", "-1") else AZUL for l in orden], yerr=[tasa - ic[:, 0], ic[:, 1] - tasa], ecolor="#555", capsize=2)
    ax.axhline(glob, ls="--", color="k", lw=1); ax.set_xticks(range(len(orden)))
    ax.set_xticklabels(orden, rotation=45 if len(orden) > 8 else 0, ha="right" if len(orden) > 8 else "center", fontsize=7)
    ax.set_title(f"{col} · AUC {bi.loc[col, 'AUC']:.3f}", loc="left"); ax.set_ylabel("tasa de fraude")
fig.suptitle("Tasa de fraude por tramo (rojo: faltante o centinela −1; línea: tasa global; barras: IC95% de Wilson)", y=1.0, fontsize=10)
fig.tight_layout(); guardar(fig, "f3_tramos_clave.png")

# f4: correlograma
fig, ax = plt.subplots(figsize=(7.4, 6.2))
sns.heatmap(corr, mask=np.triu(np.ones_like(corr, dtype=bool), k=1), annot=True, fmt=".2f", annot_kws={"size": 5.5}, cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, linewidths=.3, linecolor="white", ax=ax, cbar_kws={"shrink": .7, "label": "ρ de Spearman"})
ax.set_title("Correlograma de Spearman (primera columna: correlación con Fraude)"); guardar(fig, "f4_correlograma.png")

# f5: arquitectura
import matplotlib.patches as mp
fig, ax = plt.subplots(figsize=(10, 3.7)); ax.set_xlim(0, 10); ax.set_ylim(0, 3.7); ax.axis("off")
cajas = [("Datos crudos\n(CSV / S3)", 0.1, "#E8E8E8"), ("dbt\nstg → int → mart\n+ pruebas", 1.75, "#DCEAF7"), ("processor\npartición y\npreprocesadores", 3.4, "#DCEAF7"),
         ("tournament\nCV anidada,\n4 modelos", 5.05, "#DCEAF7"), ("inference\nscores con\nmodelo campeón", 6.7, "#DCEAF7"), ("recommended\nacción + motivos", 8.35, "#DCEAF7")]
for t, x, c in cajas:
    ax.add_patch(mp.FancyBboxPatch((x, 1.35), 1.5, 1.2, boxstyle="round,pad=0.04", fc=c, ec="#4C78A8")); ax.text(x + .75, 1.95, t, ha="center", va="center", fontsize=8)
for x in (1.6, 3.25, 4.9, 6.55, 8.2): ax.annotate("", xy=(x + .15, 1.95), xytext=(x - .03, 1.95), arrowprops=dict(arrowstyle="->", color="#555"))
ax.add_patch(mp.FancyBboxPatch((1.75, 3.0), 7.1, .5, boxstyle="round,pad=0.03", fc="#FFF1DC", ec=NAR)); ax.text(5.3, 3.25, "Airflow: DAG diario (torneo los lunes)  ·  jobs de SageMaker Processing", ha="center", va="center", fontsize=8.5)
ax.add_patch(mp.FancyBboxPatch((0.1, 0.15), 9.75, .75, boxstyle="round,pad=0.03", fc="#E4F3E4", ec=VERDE))
ax.text(4.97, .52, "AWS (Terraform): S3 datos · modelos (+ metadatos) · resultados   |   Glue + catálogo   |   registro de modelos SageMaker   |   IAM   |   EC2/endpoint opcionales", ha="center", va="center", fontsize=7.8)
guardar(fig, "f5_arquitectura.png")

# f6: torneo
r = json.load(open(RAIZ + "/ml/modelo_fraude_meli/tournament/resultados/torneo.json"))
f1 = {(x["variante"], x["modelo"]): x for x in r["fase1_seleccion"]}
modelos = ["regresion_logistica", "random_forest", "xgboost", "lightgbm"]; nombres = ["Regresión\nlogística", "Random\nForest", "XGBoost", "LightGBM"]
fig, ax = plt.subplots(figsize=(7.4, 3.8)); w = .36; x = np.arange(4)
for k, (var, col, lab) in enumerate([("con_pais", AZUL, "con país"), ("sin_pais", "#9ABBD9", "sin país")]):
    m = [f1[(var, mo)]["pr_auc_media"] for mo in modelos]; s = [f1[(var, mo)]["pr_auc_desv"] for mo in modelos]
    ax.bar(x + (k - .5) * w, m, w, yerr=s, capsize=3, color=col, label=lab)
    for xi, v in zip(x + (k - .5) * w, m): ax.text(xi, v + .035, f"{v:.3f}", ha="center", fontsize=8)
ax.axhline(r["linea_base_pr_auc"], ls="--", color="k", lw=1); ax.text(3.45, r["linea_base_pr_auc"] + .01, "línea base 0,273", ha="right", fontsize=8)
ax.set_xticks(x); ax.set_xticklabels(nombres); ax.set_ylabel("PR-AUC (media ± desv., CV anidada)"); ax.set_ylim(0, .85); ax.legend(frameon=False, loc="upper left")
ax.set_title("Torneo: desempeño en validación cruzada anidada"); guardar(fig, "f6_torneo_cv.png")

# f7 y f8: campeón en test
from sklearn.metrics import precision_recall_curve, average_precision_score
con = duckdb.connect(RAIZ + "/ml/modelo_fraude_meli/artefactos/resultados.duckdb", read_only=True)
rec = con.sql("select * from recomendaciones where particion='test'").df(); con.close()
mart = duckdb.connect(RAIZ + "/dbt/target/fraude.duckdb", read_only=True).sql("select row_id, fraude, monto from mart_fraude_features").df()
t = rec.merge(mart, on="row_id")
pr, rc, _ = precision_recall_curve(t["fraude"], t["score"])
fig, (a, b) = plt.subplots(1, 2, figsize=(9, 3.6))
a.plot(rc, pr, color=AZUL, lw=2); a.axhline(t["fraude"].mean(), ls="--", color="k", lw=1)
a.set_xlabel("Recall"); a.set_ylabel("Precisión"); a.set_title(f"Curva precisión-recall en test (PR-AUC {average_precision_score(t['fraude'], t['score']):.3f})")
a.text(.98, t["fraude"].mean() + .02, "línea base 0,273", ha="right", fontsize=8)
t["dec"] = pd.qcut(t["score"], 10, labels=False, duplicates="drop"); cal = t.groupby("dec").agg(p=("score", "mean"), y=("fraude", "mean"))
b.plot([0, 1], [0, 1], ls="--", color="k", lw=1); b.plot(cal["p"], cal["y"], "o-", color=ROJO)
b.set_xlabel("Probabilidad media predicha (por decil)"); b.set_ylabel("Tasa de fraude observada"); b.set_title("Calibración en test")
fig.tight_layout(); guardar(fig, "f7_campeon_test.png")

orden = ["aprobar", "autenticacion_adicional", "revision_manual", "rechazar"]; etq = ["Aprobar", "Autenticación\nadicional", "Revisión\nmanual", "Rechazar"]
g = t.groupby("accion").agg(n=("fraude", "size"), tasa=("fraude", "mean"), fr=("fraude", "sum")).reindex(orden)
fig, (a, b) = plt.subplots(1, 2, figsize=(9, 3.5))
a.bar(etq, g["n"] / len(t), color=[VERDE, "#E8C547", NAR, ROJO]); a.set_title("% de operaciones por acción"); a.set_ylim(0, .72)
for i, v in enumerate(g["n"] / len(t)): a.text(i, v + .012, f"{v:.1%}", ha="center")
b.bar(etq, g["tasa"], color=[VERDE, "#E8C547", NAR, ROJO]); b.axhline(t["fraude"].mean(), ls="--", color="k", lw=1); b.set_title("Tasa de fraude dentro de cada acción (línea: global)"); b.set_ylim(0, 1.08)
for i, v in enumerate(g["tasa"]): b.text(i, v + .02, f"{v:.1%}", ha="center")
fig.tight_layout(); guardar(fig, "f8_politica.png")
