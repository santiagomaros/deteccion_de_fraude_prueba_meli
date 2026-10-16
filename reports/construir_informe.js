// Constructor del informe (docx-js). Uso, desde la raíz: npm install docx && node reports/construir_informe.js reports/Informe_Prueba_ML_Fraude_Mercado_Libre.docx
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, HeadingLevel, AlignmentType,
  LevelFormat, WidthType, ShadingType, BorderStyle, PageBreak, Header, Footer, PageNumber,
} = require("docx");

const RAIZ = require("path").resolve(__dirname, "..");   // raíz del proyecto
const SALIDA = process.argv[2];
const torneo = JSON.parse(fs.readFileSync(`${RAIZ}/ml/modelo_fraude_meli/tournament/resultados/torneo.json`));

const AZUL = "1F3864", AZUL2 = "2F5496", GRIS = "595959";
const ANCHO = 9360; // contenido: carta con márgenes de 1"
const FUENTE = "Calibri";

// ---------- utilidades ----------
function runs(texto, base = {}) {
  const partes = texto.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g).filter(Boolean);
  return partes.map((p) => {
    if (p.startsWith("**")) return new TextRun({ text: p.slice(2, -2), bold: true, ...base });
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return new TextRun({ text: p.slice(1, -1), italics: true, ...base });
    if (p.startsWith("`")) return new TextRun({ text: p.slice(1, -1), font: "Consolas", ...base, size: (base.size || 21) - 2 });
    return new TextRun({ text: p, ...base });
  });
}
const p = (t, o = {}) => new Paragraph({ children: runs(t, o.run || {}), spacing: { after: o.after ?? 120, line: 276 }, alignment: o.align, indent: o.indent, keepNext: o.keepNext });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t })], pageBreakBefore: false });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t })] });
const h3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: t })] });
const bullets = (items, ref = "vinetas") => items.map((t) => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t), spacing: { after: 60, line: 264 } }));
let nNum = 0; const refsNum = [];
const numerada = (items) => { const ref = "num" + (++nNum); refsNum.push(ref);
  return items.map((t) => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t), spacing: { after: 60, line: 264 } })); };
const salto = () => new Paragraph({ children: [new PageBreak()] });
const nota = (t) => new Paragraph({
  children: runs(t, { size: 20 }), spacing: { before: 80, after: 160, line: 264 },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: AZUL2, space: 8 } },
  shading: { type: ShadingType.CLEAR, fill: "EEF3FA" }, indent: { left: 200, right: 100 },
});

const borde = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const bordes = { top: borde, bottom: borde, left: borde, right: borde };
function tabla(encabezados, filas, anchos, o = {}) {
  const suma = anchos.reduce((a, b) => a + b, 0);
  const celda = (txt, i, cab, fila) => new TableCell({
    width: { size: anchos[i], type: WidthType.DXA }, borders: bordes,
    shading: cab ? { type: ShadingType.CLEAR, fill: "DCE6F1" } : (o.resaltar && o.resaltar(fila) ? { type: ShadingType.CLEAR, fill: "FFF4D6" } : undefined),
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    children: [new Paragraph({ alignment: (o.centrar || []).includes(i) ? AlignmentType.CENTER : AlignmentType.LEFT, spacing: { after: 0 },
      children: runs(String(txt), { size: o.tam || 18, bold: cab ? true : undefined }) })],
  });
  return new Table({
    width: { size: suma, type: WidthType.DXA }, columnWidths: anchos,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: encabezados.map((t, i) => celda(t, i, true)) }),
      ...filas.map((f) => new TableRow({ cantSplit: true, children: f.map((t, i) => celda(t, i, false, f)) })),
    ],
  });
}
function dimensionesPng(ruta) {
  const b = fs.readFileSync(ruta);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function fig(archivo, pie, anchoPx = 600) {
  const ruta = `${RAIZ}/reports/figuras/${archivo}`;
  const { w, h } = dimensionesPng(ruta);
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 40 }, keepNext: true,
      children: [new ImageRun({ type: "png", data: fs.readFileSync(ruta), transformation: { width: anchoPx, height: Math.round(anchoPx * h / w) },
        altText: { title: pie, description: pie, name: archivo } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: runs(pie, { size: 18, italics: true, color: GRIS }) }),
  ];
}
const f4 = (x) => x.toFixed(4);
const pm = (m, d) => `${m.toFixed(4)} ± ${d.toFixed(4)}`;
const NOMBRES = { regresion_logistica: "Regresión logística", random_forest: "Random Forest", xgboost: "XGBoost", lightgbm: "LightGBM" };
const VAR = { con_pais: "con país", sin_pais: "sin país" };

// ---------- portada ----------
const portada = [
  new Paragraph({ spacing: { before: 2400, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Detección de fraude en operaciones", size: 52, bold: true, color: AZUL })] }),
  new Paragraph({ spacing: { after: 120 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prueba técnica · Machine Learning Engineer — Fraud Prevention Payments", size: 28, color: AZUL2 })] }),
  new Paragraph({ spacing: { after: 1600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Informe del ejercicio de clasificación (Mercado Libre)", size: 24, color: GRIS })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "Candidato: Jhair Santiago Martinez Osorio", size: 24, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "15 de octubre de 2026", size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "Repositorio: github.com/santiagomaros/deteccion_de_fraude_prueba_meli (privado)", size: 20, color: GRIS })] }),
  salto(),
];
const contenido = [
  h1("Contenido"),
  ...["1. Resumen ejecutivo", "2. Contexto, datos y objetivo", "3. Aproximación y metodología", "4. Análisis exploratorio e hipótesis",
    "5. Preparación de datos y features (dbt y processor)", "6. Entrenamiento de los algoritmos, paso a paso", "7. Resultados y comparación de modelos",
    "8. Modelo elegido para producción y justificación", "9. Scoring y recomendaciones de prevención (inference y recommended)",
    "10. Orquestación e infraestructura (Airflow y Terraform)", "11. Limitaciones, riesgos y próximos pasos", "12. Post-producción (aplicaciones futuras)", "13. Uso de un agente de código (Claude) en el desarrollo", "14. Conclusiones"].map((t) => p(t, { after: 40 })),
  salto(),
];

// ---------- 1. resumen ----------
const f1 = (v, m) => torneo.fase1_seleccion.find((x) => x.variante === v && x.modelo === m);
const f2 = (v, m) => torneo.fase2_confirmacion.find((x) => x.variante === v && x.modelo === m);
const resumenTabla = tabla(
  ["Modelo (con país)", "PR-AUC validación cruzada", "PR-AUC test", "ROC-AUC test"],
  ["lightgbm", "xgboost", "random_forest", "regresion_logistica"].map((m) => [NOMBRES[m], pm(f1("con_pais", m).pr_auc_media, f1("con_pais", m).pr_auc_desv), f4(f2("con_pais", m).test_pr_auc), f4(f2("con_pais", m).test_roc_auc)]),
  [2600, 2900, 1930, 1930], { centrar: [1, 2, 3], resaltar: (f) => f[0] === "LightGBM" });
const politicaTabla = tabla(
  ["Acción", "% de operaciones", "Tasa de fraude en la banda", "% del fraude"],
  [["Rechazar", "8,6%", "92,4%", "29,0%"], ["Revisión manual", "10,5%", "52,5%", "20,2%"],
   ["Autenticación adicional", "23,0%", "36,5%", "30,8%"], ["Aprobar", "57,9%", "9,5%", "20,1% (fraude que se escapa)"]],
  [2800, 1900, 2300, 2360], { centrar: [1, 2, 3] });
const s1 = [
  h1("1. Resumen ejecutivo"),
  p("**Aproximación al problema.** Se abordó como un problema de detección de fraude en transacciones: a partir de los atributos de cada operación se estima la probabilidad de que sea fraudulenta, y esa probabilidad se convierte en una decisión (aprobar, pedir autenticación adicional, enviar a revisión manual o rechazar). Se analizaron 16.880 operaciones (27,3% de fraude): análisis exploratorio, preparación de datos, entrenamiento y comparación de **cuatro algoritmos** (regresión logística, Random Forest, XGBoost y LightGBM, cada uno con y sin la variable país), elección del modelo y diseño de su despliegue. Todo el análisis se hizo sobre el 80% de entrenamiento; el 20% restante se usó una sola vez al final."),
  p("**Resultado.** El modelo elegido es **LightGBM con la variable país**: PR-AUC de 0,696 ± 0,023 en validación cruzada anidada y de **0,715 en test** (línea base de un clasificador aleatorio: 0,273), con ROC-AUC de 0,843 y buena calibración. Los modelos de árboles superan a la regresión logística, y la diferencia entre LightGBM y XGBoost es pequeña pero consistente (LightGBM gana en los 5 folds)."),
  resumenTabla,
  p("", { after: 80 }),
  p("**Hipótesis de trabajo.** Como las variables son anónimas, lo que no se puede verificar se trata como hipótesis:", { after: 60 }),
  ...bullets([
    "**H1:** el `-1` de `B` y `S` significa «no disponible» (con `S = -1` el fraude es 58,0% frente a 27,1%).",
    "**H2:** el país refleja cómo se construyó la muestra más que un riesgo real (UY 100%, ES 95%, US 86% y MX 9% de fraude).",
    "**H3:** `K` es un puntaje derivado de `B` y `S` (ρ = −0,68 y −0,53).",
    "**H4:** `B` y `S` están disponibles en el momento de decidir; si no lo estuvieran, habría fuga de información.",
  ]),
  p("**Hallazgos principales del análisis:**", { after: 60 }),
  ...bullets([
    "Tres variables numéricas concentran la señal: `B` (ρ de Spearman +0,30), `S` (+0,25) y `K` (−0,24, relación inversa). El país es la variable más asociada al fraude (V de Cramér = 0,345).",
    "Hay relaciones no lineales que una correlación no ve: `L` tiene forma de U y `Monto` de U invertida; eso favorece a los modelos de árboles.",
    "Los faltantes son informativos (`K` 76% y `C` 19% faltan, y la ausencia se asocia con menos fraude) y el `-1` de `B` y `S` no es un error.",
    "En esta muestra los valores extremos no son ruido: con `P` por encima del percentil 99 el fraude es 93,2%.",
  ]),
  p("**Estrategia de prevención de fraude derivada de los resultados (stage recommended).** El score del modelo se convierte en una acción por operación con cuatro bandas, cuyos umbrales se calibraron con predicciones fuera de muestra sobre train (nunca con test). Evaluada en test:", { after: 60 }),
  politicaTabla,
  p("", { after: 60 }),
  p("La banda de rechazo concentra operaciones casi seguras (92,4% de fraude) y la de revisión manual, las de riesgo alto pero no concluyente; cada operación marcada incluye los tres motivos que más elevan su riesgo para orientar al analista. La estrategia recomendada es aplicar la política por bandas como punto de partida, priorizar la revisión manual en la banda intermedia, tratar el país con cautela hasta validarlo con datos reales y recalibrar los umbrales con la prevalencia de fraude real y los costos de cada decisión (sección 9)."),
  p("**Riesgos que condicionan el uso del modelo.** Los umbrales y las precisiones dependen de la prevalencia de fraude de la muestra (27,3%), que puede diferir de la de producción; el país puede reflejar cómo se armó la muestra (sin país el PR-AUC cae a 0,604 en validación y 0,640 en test); no hay variable temporal para validar fuera de tiempo; y la búsqueda de hiperparámetros aportó muy poco (+0,003 de PR-AUC sobre los valores por defecto). Se detallan en la sección 11.", { after: 120 }),
  p("**Producción.** El flujo completo está construido: **dbt** (features sin estado, con 27 pruebas), un **processor** que aprende solo de train, el **torneo**, **inference** (scores con la versión del modelo) y **recommended** (acción y motivos por operación). Se añadieron un DAG diario de **Airflow** y una simulación de infraestructura en **Terraform** (S3, IAM, Glue, SageMaker, EC2); ambos se validaron sintácticamente y estructuralmente, pero no se ejecutaron en AWS."),
];

// ---------- 2 y 3 ----------
const s2 = [
  h1("2. Contexto, datos y objetivo"),
  p("El ejercicio pide entrenar al menos tres algoritmos para predecir si una operación es fraudulenta, comparar su desempeño, elegir y sustentar el modelo que se llevaría a producción y concluir. Los datos provienen del sistema de prevención de fraude de Mercado Libre y llegan en un CSV."),
  tabla(["Aspecto", "Descripción"], [
    ["Tamaño", "16.880 filas y 21 columnas: 19 variables anónimas (`A`–`S`), `Monto` y el objetivo `Fraude`."],
    ["Objetivo", "`Fraude` binaria: 4.611 positivos (27,3%); razón de 2,66 operaciones legítimas por cada fraude (desbalance moderado)."],
    ["Variables", "8 continuas y 11 discretas numéricas, más `J` (país, código de 2 letras, 19 valores)."],
    ["Formato numérico", "Punto decimal y coma de miles: 268 celdas (`Monto` 238, `Q` 24, `R` 6) traen coma de miles y se leen con `thousands=','`."],
    ["Faltantes", "Solo `K` (76,1%) y `C` (19,3%). El resto está completo."],
    ["Variables inflacionadas de ceros", "10 variables tienen entre 84,4% y 99,2% de ceros (`A`, `D`, `E`, `F`, `G`, `H`, `I`, `O`, `Q`, `R`) y `L` tiene 64,5%. El cero es el valor más frecuente, no un dato faltante: para ellas se crea un indicador `x > 0` (secciones 4.1 y 5)."],
    ["Estructura", "El archivo viene **ordenado por clase** (las primeras 1.000 filas son 100% fraude), por lo que nunca se parte ni se imputa por posición. Hay 1 par de filas duplicadas."],
    ["Variable temporal", "No existe: no es posible validar fuera de tiempo."],
  ], [2000, 7360]),
];
const s3 = [
  h1("3. Aproximación y metodología"),
  p("El principio rector es el de la **detección de fraude en transacciones**: cada operación debe puntuarse con la información disponible en el momento de decidir, y la decisión sobre ella (aprobar, pedir autenticación adicional, revisar o rechazar) busca capturar la mayor parte del fraude sin rechazar a clientes legítimos. De ahí se derivan las reglas del análisis:"),
  ...numerada([
    "**Solo información disponible al decidir.** Partición 80/20 estratificada (semilla 42) antes de explorar; todo lo que se aprende de los datos (medianas, cuartiles, escalado) está dentro de un `Pipeline` que se reajusta en cada fold, y test se usa una sola vez. Se comprobó, por ejemplo, que la mediana aprendida de `log1p(C)` es la de train (8,738) y no la de todo el conjunto (8,728). Falta confirmar que `B` y `S` están disponibles al decidir (H4).",
    "**La unidad de análisis es la transacción y el fraude es una clase minoritaria.** Las métricas se calculan por operación y son adecuadas al desbalance: la principal es **PR-AUC** (línea base = prevalencia = 0,273), acompañada de ROC-AUC, F1 máximo, recall a precisión fija del 80% y Brier. No se usa *accuracy*: un modelo que siempre dice «no fraude» acierta 72,7%.",
    "**Faltantes, centinelas y valores extremos son señal, no ruido.** En fraude, que falte un dato, un `-1` o un valor extremo suele ser informativo: se estudian explícitamente (indicadores) y no se eliminan outliers.",
    "**Validación cruzada estratificada**, porque no existe variable temporal y no es posible un backtesting fuera de tiempo. Es una limitación que se declara: en producción el desempeño debe vigilarse en el tiempo.",
    "**Tests elegidos por la forma de los datos** (asimétricos y con muchos ceros): pruebas no paramétricas (Mann-Whitney) y chi-cuadrado; con 13.500 filas casi todo sale «significativo», así que importa el tamaño del efecto (ρ de Spearman, V de Cramér) y no el p-valor.",
    "**Reproducibilidad.** Semillas fijas, versiones fijadas y cada cifra del informe proviene de código ejecutado.",
  ]),
];

// ---------- 4 EDA ----------
const s4 = [
  h1("4. Análisis exploratorio e hipótesis"),
  h2("4.1 Calidad de los datos y variable objetivo"),
  p("Los únicos valores negativos son los `-1` de `B` (91 filas en train) y `S` (112). No son errores: con `S = -1` el fraude es 58,0% frente a 27,1% en el resto, y con `B = -1` es 16,5% frente a 27,4%. Se interpretan como «no disponible» (H1) y se conservan con un indicador propio. El desbalance es moderado (razón 2,66:1) y hay variables casi constantes (`O`, `R`, `H`, `G` con ≥ 97% en un valor) que no se descartan por ser raras."),
  p("**Variable J (país) y la categoría OTRO.** `J` tiene 15 países en train y seis concentran casi todas las filas (AR 55,5%, BR 26,1%, MX 14,0%, ES 1,8%, US 1,4% y UY 1,1%); los otros 9 suman solo 24 filas (de 1 a 10 por país) y ninguna es fraude. Se agrupan en la categoría **OTRO** (umbral de 100 filas en train) porque con tan pocas filas cada país por separado daría categorías inestables; se revisó la tasa de cada uno antes de agrupar para no mezclar señales opuestas. Cuatro países (AU, CO, KR y UA) aparecen solo en test, y el pipeline los envía también a OTRO. Con las 15 categorías, 17 de 30 celdas tienen frecuencia esperada < 5 y el chi-cuadrado no es fiable; con 7 niveles (6 países + OTRO) no queda ninguna y la asociación con el fraude es moderada-alta (V de Cramér = 0,345)."),
  p("**Variables inflacionadas de ceros y el indicador x > 0.** Diez variables tienen entre 84,4% (`A`) y 99,2% (`O` y `R`) de ceros. El cero es el valor más frecuente y no un dato faltante, y `log1p` no corrige el problema porque este está en la masa en cero y no en la cola. En la mayoría, el valor distinto de cero se asocia con más fraude (27,2% con `O` = 0 frente a ~46% con `O` > 0; `R` ~42%, `H` ~48%, `Q` ~43%), por lo que se crea un indicador `x > 0` para `A`, `D`, `E`, `G`, `H`, `O`, `Q` y `R`. `F` e `I` no lo reciben: en ambas el valor distinto de cero casi no cambia la tasa de fraude (`I` se descarta por no tener asociación)."),
  ...fig("f1_objetivo_pais.png", "Figura 1. Variable objetivo (train) y tasa de fraude por país (con OTRO).", 600),
  h2("4.2 Datos faltantes"),
  p("`K` falta en el 76,14% de las filas y `C` en el 19,26%. La ausencia es informativa: se aplicó una prueba chi-cuadrado de independencia entre «falta el dato» y el fraude y **se rechaza la independencia en ambas** (χ² = 164,8 para `K` y 156,0 para `C`, p < 1e-35). El fraude es 24,6% con `K` ausente frente a 36,1% con `K` presente, y 17,5% con `C` ausente frente a 29,7%. Se decidió conservar ambas variables, crear los indicadores `K_falta` y `C_falta`, e imputar `C` con la mediana de train (más robusta que la media, porque `C` es muy asimétrica); `K` se deja con valores faltantes para los modelos de árboles."),
  h2("4.3 Distribuciones"),
  p("De las 19 variables numéricas, 17 tienen |asimetría| > 1 (`D` 50,1; `R` 30,6; `Monto` 12,5). En el Q-Q de normalidad, `Monto` se separa mucho de la recta en la cola derecha, `log1p(Monto)` queda casi sobre ella (aproximadamente normal) y `log1p(C)` mejora pero se aparta en los extremos. Los valores extremos **no se eliminan**: en varias variables la cola es la señal (fraude por encima del percentil 99 frente al resto: `P` 93,2% vs 27,1%, `Q` 52,9%, `D` 48,3%, `E` 43,0%; en `Monto`, 23,5% vs 27,4%, sin diferencia significativa)."),
  h2("4.4 Relación con el fraude y entre las variables"),
  p("**Pruebas realizadas.** Para cada variable numérica se calculó la correlación de Spearman con el fraude, y se clasificó su significancia con Mann-Whitney. En las variables discretas se usó chi-cuadrado global y la tendencia de Cochran-Armitage, y en el país chi-cuadrado con V de Cramér."),
  p("**Resultado.** 17 de las 19 variables son significativas (no lo son `L` e `I`), pero solo cinco tienen un efecto relevante: `B` +0,30, `S` +0,25, `K` −0,24 (a mayor `K`, menos fraude), `M` +0,13 y `P` +0,11. Las demás tienen |ρ| ≤ 0,07: son detectables pero débiles por sí solas."),
  p("Los gráficos por tramos revelan que `B`, `S` y `K` son casi monótonas (por ejemplo, `B` sube de 7,6% a 52,4% de fraude). `L` tiene forma de **U** (27,6% con 0, 24,2% con 1, 38,6% con 2 y 47,3% con 3 o más): el chi-cuadrado de la variable discreta es muy significativo (p = 1,6e-20). `Monto` tiene forma de **U invertida** (24,9% → 35,4% → 19,2%). `P` sube de 24,2% a 59,0%."),
  ...fig("f3_tramos_clave.png", "Figura 2. Tasa de fraude por tramo en las variables clave (IC95% de Wilson).", 540),
  p("El **país** es la variable más asociada (V de Cramér = 0,345): el fraude es 9,1% en MX, 25–28% en BR y AR, y 85–100% en US, ES y UY. Esas tasas extremas sugieren que la muestra se construyó con criterios distintos por país (H2)."),
  p("**Colinealidad.** Entre las variables se calculó la correlación de Spearman (Figura 3). Los pares con |ρ| ≥ 0,5 son `E`–`F` (0,84), `D`–`G` (0,69), `K`–`B` (−0,68), `E`–`I` (0,57), `H`–`D` (0,54) y `K`–`S` (−0,53): casi todos son conteos y proporciones dispersas, y `K` se relaciona con las dos variables más predictivas, lo que sugiere que podría ser un puntaje derivado de ellas (H3). No se elimina ninguna variable por colinealidad: los modelos de árboles son robustos a ella y la regresión logística se regulariza."),
  ...fig("f4_correlograma.png", "Figura 3. Correlograma de Spearman entre las variables numéricas y el fraude.", 350),
  h2("4.5 Hipótesis"),
  p("Con variables anónimas, lo que no se puede verificar se marca como hipótesis:", { after: 60 }),
  tabla(["#", "Hipótesis", "Evidencia", "Estado"], [
    ["H1", "El `-1` de `B` y `S` significa «no disponible»", "Tasas de fraude de 58,0% y 16,5% frente a ~27%", "Plausible, no confirmada"],
    ["H2", "El país refleja el muestreo más que un riesgo real", "UY 100%, ES 95%, US 86% y MX 9%", "Riesgo principal del modelo"],
    ["H3", "`K` es un puntaje derivado de `B` y `S`", "ρ = −0,68 con `B` y −0,53 con `S`", "No confirmable"],
    ["H4", "`B` y `S` están disponibles al decidir", "Señal alta (ρ = +0,30 y +0,25)", "Pendiente: confirmar con el dueño de los datos (posible fuga)"],
  ], [600, 3200, 3400, 2160]),
];

// ---------- 5 features ----------
const s5 = [
  h1("5. Preparación de datos y features (dbt y processor)"),
  p("Las decisiones del análisis se implementaron con un reparto explícito entre **dbt** (transformaciones sin estado, con parámetros fijos) y un stage **processor** en Python (todo lo que se aprende de los datos de train). La regla es que nada que use estadísticas del conjunto completo puede ir en dbt: sería fuga hacia test y desfase entre entrenamiento e inferencia."),
  tabla(["Decisión del EDA", "Dónde", "Implementación"], [
    ["Leer la coma de miles; vacíos como nulos", "dbt (staging)", "`stg_fraude`: limpieza y tipado con doble precisión"],
    ["`-1` de `B` y `S` → nulo con indicador", "dbt", "`b_neg1`, `s_neg1`"],
    ["Faltantes informativos", "dbt", "`c_falta`, `k_falta`"],
    ["Variables con ≥ 84% de ceros", "dbt", "Indicadores `a_gt0`, `d_gt0`, `e_gt0`, `g_gt0`, `h_gt0`, `o_gt0`, `q_gt0`, `r_gt0`"],
    ["Topes y categorías fijos", "dbt", "`m_cap4` (≥ 4), `n_cap3` (≥ 3), `p_cap5` (≥ 5), `l_cat` (0, 1, 2, 3+)"],
    ["Agrupar países", "dbt", "`j_grp`: AR, BR, MX, ES, US, UY y OTRO"],
    ["`log1p` para modelos lineales", "dbt", "`log1p_monto`, `log1p_c`, `log1p_q`, `log1p_a`, `log1p_d`, `log1p_e`, `log1p_h`, `log1p_r`"],
    ["Imputar con la mediana; escalar", "processor", "`SimpleImputer(median)` y `StandardScaler`, ajustados solo con train"],
    ["`Monto` por tramos (U invertida)", "processor", "Cuartiles aprendidos de train (`KBinsDiscretizer`)"],
    ["Categóricas", "processor", "One-hot de `l_cat` y `j_grp`, con categorías nuevas ignoradas"],
    ["Partición y validación", "processor / torneo", "80/20 estratificado (semilla 42) y validación cruzada"],
    ["`I` sin asociación", "processor", "Se descarta de todos los modelos"],
  ], [3200, 1500, 4660]),
  p("", { after: 60 }),
  p("La capa dbt (`stg_fraude` → `int_fraude_senales` → `mart_fraude_features`, 47 columnas) tiene 23 pruebas de datos y una prueba unitaria; `dbt build` pasa 27 de 27. Se verificó contra una implementación independiente en pandas (conteos de indicadores, sumas de montos, agrupaciones y logaritmos coinciden) y esa comparación detectó un defecto real: el tipo decimal por defecto de dbt en DuckDB es de 32 bits y distorsionaba los montos (12.538,44 salía como 12.538,4404); se corrigió con una macro de doble precisión. También se comprobó que las pruebas fallan con datos corruptos (un monto negativo, `B = −3` y `Fraude = 2` detuvieron el flujo: 2 pruebas fallan y no se ejecuta ningún modelo posterior)."),
];

// ---------- 6 entrenamiento ----------
const espacios = [
  ["Regresión logística", "10", "`C` log-uniforme 1e-3 a 1e2; `class_weight` {ninguno, balanced}"],
  ["Random Forest", "12", "300 árboles; `max_depth` {sin límite, 6, 10, 16}; `min_samples_leaf` 1–24; `max_features` {sqrt, 0,3, 0,5}; `class_weight` {ninguno, balanced_subsample}"],
  ["XGBoost", "20", "`n_estimators` 100–599; `learning_rate` 0,02–0,3 (log); `max_depth` 3–8; `min_child_weight` 1–10; `subsample` 0,6–1; `colsample_bytree` 0,5–1; `reg_lambda` 0,1–10 (log); `scale_pos_weight` {1; 2,66}"],
  ["LightGBM", "20", "`n_estimators` 100–599; `learning_rate` 0,02–0,3 (log); `num_leaves` 15–63; `min_child_samples` 10–60; `subsample` 0,6–1; `colsample_bytree` 0,5–1; `reg_lambda` 0,1–10 (log); `scale_pos_weight` {1; 2,66}"],
];
const s6 = [
  h1("6. Entrenamiento de los algoritmos, paso a paso"),
  h2("6.1 Candidatos"),
  p("Se compararon cuatro algoritmos, cada uno con y sin la variable país (8 candidatos): **regresión logística** (referencia interpretable y lineal), **Random Forest** (ensamble por bagging), y dos algoritmos de *gradient boosting* de árboles, **XGBoost** y **LightGBM**. Los boosting suelen ser el estándar en datos tabulares de fraude porque capturan no linealidades e interacciones y manejan valores faltantes."),
  h2("6.2 Feature engineering por familia"),
  ...bullets([
    "**Lineal (regresión logística):** mediana para los faltantes y estandarización de las numéricas (con topes y `log1p` de dbt), `Monto` en cuartiles aprendidos de train, one-hot (una columna 0/1 por categoría) de `l_cat` y `j_grp`, y los indicadores.",
    "**Árboles (Random Forest, XGBoost, LightGBM):** valores limpios sin transformar (los faltantes los manejan los propios modelos), one-hot de `j_grp` y los indicadores.",
  ]),
  h2("6.3 Protocolo de validación"),
  p("Sin variable temporal se usó validación cruzada estratificada en dos fases:", { after: 60 }),
  ...numerada([
    "**Selección (Fase 1).** Validación cruzada **anidada** sobre train: 5 folds externos y, dentro de cada uno, una búsqueda aleatoria de hiperparámetros con 3 folds internos que optimiza PR-AUC. La estimación del fold externo se hace con datos que la búsqueda no vio, de modo que no está inflada por haber elegido el mejor. El campeón es el de mayor PR-AUC media en los folds externos.",
    "**Confirmación (Fase 2).** Cada candidato se reajusta con todo train (búsqueda con 5 folds) y se evalúa **una sola vez** en test. Test no interviene en ninguna decisión.",
  ]),
  p("El preprocesador forma parte del `Pipeline`, por lo que se reajusta en cada fold (medianas, cuartiles y escalado nunca ven datos de validación)."),
  h2("6.4 Búsqueda de hiperparámetros"),
  p("Búsqueda aleatoria con semilla fija; el número de configuraciones se ajustó al tamaño de cada espacio:", { after: 60 }),
  tabla(["Modelo", "Config.", "Espacio de búsqueda"], espacios, [1900, 900, 6560], { centrar: [1] }),
  nota("**Límites de la búsqueda.** (1) Aportó poco: LightGBM con hiperparámetros por defecto obtiene 0,6937 ± 0,0226 en los mismos folds, frente a 0,6964 con búsqueda (+0,0026, dentro del ruido). (2) Con semilla fija se muestrean las mismas configuraciones en cada fold, así que la coincidencia de 4 de 5 folds en la configuración elegida no es una verificación independiente de su robustez. (3) El presupuesto no fue igual entre modelos (10, 12, 20 y 20 configuraciones), lo que puede favorecer algo a los boosting. (4) No se usó parada temprana: `n_estimators` y `learning_rate` se buscan juntos."),
];

// ---------- 7 resultados ----------
const ordenado = [...torneo.fase1_seleccion];
const s7 = [
  h1("7. Resultados y comparación de modelos"),
  h2("7.1 Fase 1: validación cruzada anidada"),
  tabla(["Variante", "Modelo", "PR-AUC", "ROC-AUC", "F1 máx.", "Recall a precisión 80%"],
    ordenado.map((x) => [VAR[x.variante], NOMBRES[x.modelo], pm(x.pr_auc_media, x.pr_auc_desv), pm(x.roc_auc_media, x.roc_auc_desv), f4(x.f1_max_media), f4(x.recall_a_precision_80_media)]),
    [1100, 2000, 1900, 1900, 1100, 1360], { centrar: [2, 3, 4, 5], tam: 17, resaltar: (f) => f[0] === "con país" && f[1] === "LightGBM" }),
  p("", { after: 40 }),
  p("Media ± desviación de los 5 folds externos. Línea base de PR-AUC: 0,273.", { run: { size: 18, italics: true, color: GRIS } }),
  ...fig("f6_torneo_cv.png", "Figura 4. PR-AUC por modelo en validación cruzada anidada, con y sin país.", 340),
  h2("7.2 Fase 2: evaluación única en test"),
  tabla(["Variante", "Modelo", "PR-AUC", "ROC-AUC", "F1 máx.", "Recall a precisión 80%", "Brier"],
    [...torneo.fase2_confirmacion].map((x) => [VAR[x.variante], NOMBRES[x.modelo], f4(x.test_pr_auc), f4(x.test_roc_auc), f4(x.test_f1_max), f4(x.test_recall_a_precision_80), f4(x.test_brier)]),
    [1100, 1900, 1250, 1250, 1250, 1500, 1110], { centrar: [2, 3, 4, 5, 6], tam: 17, resaltar: (f) => f[0] === "con país" && f[1] === "LightGBM" }),
  p("", { after: 80 }),
  h2("7.3 Lectura de los resultados"),
  ...bullets([
    "**Los modelos de árboles superan a la regresión logística.** Con país, en validación: LightGBM 0,696, XGBoost 0,691, Random Forest 0,667 y regresión logística 0,648. Es coherente con las no linealidades encontradas en el EDA (`L` en U, `Monto` en U invertida).",
    "**LightGBM y XGBoost están prácticamente empatados**, pero la ventaja de LightGBM es consistente: gana en los 5 folds, con una diferencia media de 0,0055 ± 0,0043 (menor que la variación entre folds, de ~0,02). Es una diferencia pequeña y no debe sobrevalorarse.",
    "**La variable país aporta mucho:** incluirla suma en promedio 0,099 de PR-AUC en validación. Sin ella, el mejor modelo es también LightGBM (0,604 en validación y 0,640 en test).",
    "**Validación y test son coherentes** (LightGBM con país: 0,696 y 0,715), lo que descarta un sobreajuste de la selección. En todos los modelos, el orden en test es el mismo que en validación.",
    "**Costo computacional:** la búsqueda tardó 22 s en LightGBM, 13 s en XGBoost, 60 s en Random Forest y 2 s en la regresión logística.",
  ]),
];

// ---------- 8 elegido ----------
const s8 = [
  h1("8. Modelo elegido para producción y justificación"),
  p("Se lleva a producción **LightGBM con la variable país** (hiperparámetros finales: `learning_rate` 0,044, 598 árboles, 31 hojas, `min_child_samples` 20, `reg_lambda` 2,65, `subsample` 0,91, `colsample_bytree` 0,70 y `scale_pos_weight` 1)."),
  ...bullets([
    "**Mejor desempeño** en validación cruzada anidada (PR-AUC 0,696) y en test (0,715; ROC-AUC 0,843), y el mejor Brier (0,133).",
    "**Probabilidades bien calibradas** sin ajuste posterior (Figura 5): la probabilidad media por decil coincide con la tasa observada, lo que permite fijar umbrales sobre el score.",
    "**Maneja faltantes de forma nativa** y no requiere imputar `K` (76% de faltantes).",
    "**Explicabilidad por operación:** LightGBM entrega las contribuciones exactas de cada variable al score, que se usan como motivos de cada recomendación.",
    "**Eficiente**: entrena y busca hiperparámetros más rápido que Random Forest.",
  ]),
  ...fig("f7_campeon_test.png", "Figura 5. Curva precisión-recall y calibración del modelo elegido en test.", 560),
  nota("**Con o sin país.** Con país el PR-AUC sube ~0,10, pero el EDA señaló que el país puede ser un artefacto del muestreo (H2). Se lleva el modelo con país como principal y se mantiene la versión sin país (LightGBM, 0,640 en test) como línea de seguridad: antes de basar reglas de negocio en el país hay que validarlo con datos reales."),
  p("**Alternativas descartadas.** XGBoost es una alternativa casi equivalente (0,708 en test) y podría sustituir a LightGBM sin cambiar el resto del flujo. Random Forest y la regresión logística quedan por debajo y son más lentos o menos expresivos; la regresión logística conserva valor como modelo de referencia interpretable."),
];

// ---------- 9 producción ----------
const s9 = [
  h1("9. Scoring y recomendaciones de prevención (inference y recommended)"),
  p("El stage **inference** carga el modelo completo (preprocesador + LightGBM), valida que no falten columnas, puntúa todas las operaciones y guarda la tabla `scores_fraude` con la versión (hash) del modelo. Reproduce exactamente el PR-AUC del torneo en test (0,7149), lo que confirma que el modelo guardado es el que se evaluó."),
  p("El stage **recommended** convierte el score en una **acción** y en **motivos**. La política usa cuatro bandas (aprobar, autenticación adicional, revisión manual y rechazar) con umbrales definidos por una precisión acumulada objetivo, calculados con predicciones fuera de muestra sobre train (nunca con test ni con scores en muestra). No se inventaron costos de negocio: con costos reales, el umbral pasaría a depender del monto (rechazar si p > costo del falso positivo / (monto + costo del falso positivo))."),
  tabla(["Acción", "Umbral de score", "Precisión acumulada objetivo", "Precisión real en test"], [
    ["Autenticación adicional", "0,221", "50%", "51,9%"], ["Revisión manual", "0,483", "70%", "70,5%"], ["Rechazar", "0,770", "90%", "92,4%"],
  ], [3000, 1900, 2400, 2060], { centrar: [1, 2, 3] }),
  p("", { after: 60 }),
  p("Las precisiones reales en test cumplen los objetivos, y eso respalda que los umbrales no están ajustados a test. Resultado de la política sobre test (3.376 operaciones):", { after: 60 }),
  tabla(["Acción", "Operaciones", "% operaciones", "Tasa de fraude", "% del fraude capturado", "% del monto de fraude"], [
    ["Aprobar", "1.955", "57,9%", "9,5%", "20,1%", "24,5%"], ["Autenticación adicional", "778", "23,0%", "36,5%", "30,8%", "26,4%"],
    ["Revisión manual", "354", "10,5%", "52,5%", "20,2%", "21,1%"], ["Rechazar", "289", "8,6%", "92,4%", "29,0%", "28,1%"],
  ], [2400, 1300, 1300, 1400, 1560, 1400], { centrar: [1, 2, 3, 4, 5] }),
  p("", { after: 60 }),
  ...fig("f8_politica.png", "Figura 6. Volumen y tasa de fraude por acción en test.", 540),
  p("«Aprobar» contiene el 20,1% del fraude (tasa de 9,5%): es el riesgo residual de la política. Las variables que más mueven el score (importancia media absoluta en log-odds) son `b` (0,62), `s` (0,38), `j_grp_MX` (0,29), `c` (0,29) y `monto` (0,29); tres de las diez primeras son categorías de país. Por país, el modelo envía a revisión o rechazo el 98,6% de las operaciones de ES, el 100% de UY y el 86,1% de US, frente al 1,5% de MX y entre 16% y 19% de BR y AR."),
  p("Cada operación marcada incluye sus tres motivos principales, por ejemplo: «`j_grp_ES=1 (+3,92); b=20 (+1,53); c=87534 (+1,52)`» (score 0,999). **Recomendaciones:** (1) aplicar la política por bandas como punto de partida y reajustar los umbrales con la prevalencia real, la capacidad de revisión manual y el costo de cada decisión; (2) priorizar la revisión manual en la banda intermedia, orientada por los motivos; (3) tratar el país con cautela hasta validarlo con datos reales; (4) vigilar el modelo una vez desplegado (sección 12)."),
];

// ---------- 10 producción ----------
const s10 = [
  h1("10. Orquestación e infraestructura (Airflow y Terraform)"),
  p("Las capas de datos y de modelado de las secciones 5 a 9 se encadenan en un flujo orquestado y se apoyan en una infraestructura que, en este ejercicio, solo se simula."),
  h3("Orquestación (Airflow)"),
  p("Un DAG diario (06:00 UTC) encadena `dbt build` (modelos y pruebas), la publicación de las features en S3, el crawler de Glue, el `processor`, una rama que ejecuta el **torneo solo los lunes** (el resto de los días se usa el campeón vigente), `inference` y `recommended`. Los cuatro módulos de ML corren como *SageMaker Processing jobs*, que crean y destruyen las máquinas en cada ejecución. Si una prueba de dbt falla, no corre nada más: no se puntúa con datos malos."),
  ...fig("f5_arquitectura.png", "Figura 7. Arquitectura del flujo y de la infraestructura simulada.", 500),
  h3("Infraestructura (Terraform, simulación)"),
  ...bullets([
    "**S3:** tres buckets (datos, modelos con sus metadatos y resultados) con versionado, cifrado, acceso público bloqueado y ciclo de vida (a STANDARD_IA a los 30 días, a GLACIER a los 90 y expiración a los 365; los modelos y sus metadatos no expiran).",
    "**IAM:** roles de mínimo privilegio para SageMaker, Glue y Airflow.",
    "**Glue:** base de datos de catálogo y crawler diario sobre las features (consulta con Athena).",
    "**SageMaker:** grupo del registro de modelos (versiones del campeón con su metadato) y, de forma opcional, un endpoint serverless de inferencia en tiempo real.",
    "**EC2 (opcional):** instancia donde corre Airflow, con IMDSv2 y disco cifrado.",
  ]),
  nota("**Qué se verificó y qué no.** dbt y los módulos de ML se ejecutaron (sección 5 y secciones 6 a 9). El DAG se verificó con un Airflow simulado (estructura, dependencias, regla de ejecución y rama de los lunes), pero no en un Airflow real. La infraestructura pasa `terraform validate`, pero no se aplicó ni se hizo `plan` (no hay credenciales de AWS). Para ejecutar los módulos de `ml/` en SageMaker habría que cambiar su entrada y salida de archivos locales (DuckDB) por las rutas montadas desde S3."),
];

// ---------- 11 limitaciones ----------
const s11 = [
  h1("11. Limitaciones, riesgos y próximos pasos"),
  h2("Limitaciones y riesgos"),
  ...bullets([
    "**Prevalencia de la muestra:** el 27,3% de fraude puede diferir de la tasa en producción; las precisiones y los volúmenes por banda dependen de ella y los umbrales deben recalibrarse con la prevalencia real.",
    "**El país como posible artefacto** (H2): es la variable de mayor peso y puede no generalizar.",
    "**Posible fuga en `B` y `S`** (H4): si no están disponibles en el momento de la decisión, el modelo sobreestimaría su desempeño.",
    "**Sin variable temporal:** no hay validación fuera de tiempo ni forma de medir la deriva; la validación cruzada puede ser optimista.",
    "**Optimización de hiperparámetros acotada:** aporta poco y los modelos tuvieron presupuestos distintos.",
    "**Variables anónimas:** las hipótesis no se pueden confirmar y limitan la interpretación de negocio.",
    "**Política sin costos reales:** las bandas usan precisión objetivo, no una función de costo.",
    "**El EDA no incluye** interacciones entre variables, IV/información mutua ni pruebas de estabilidad entre train y test; ninguna conclusión de este informe depende de ellos.",
  ]),
  h2("Próximos pasos antes de producción"),
  ...numerada([
    "Confirmar con el dueño de los datos la disponibilidad de `B` y `S` y el origen del país.",
    "Reemplazar la política por una basada en costos (el umbral depende del monto).",
    "Aplicar la infraestructura en una cuenta de pruebas y adaptar la entrada y salida de los módulos a S3.",
    "Comparar contra XGBoost con más presupuesto de búsqueda y evaluar un ensamble.",
  ]),
  p("Lo que ocurre después del despliegue (monitoreo, histórico de performance y reentrenamiento, incluida la recalibración con la prevalencia real) se describe en la sección 12.", { after: 60 }),
];

// ---------- 12 uso del agente ----------
const sIA = [
  h1("13. Uso de un agente de código (Claude) en el desarrollo"),
  p("Durante el ejercicio se usó **Claude Code** como asistente de programación. El criterio de trabajo fue que el agente acelera la ejecución, pero las decisiones de modelado, la validación de los resultados y la responsabilidad sobre lo entregado son del científico de datos. Por eso el agente trabajó con reglas explícitas, por etapas y con compuertas de verificación."),
  h2("13.1 Cómo se trabajó"),
  ...numerada([
    "**Reglas antes de empezar.** Se definió un archivo de instrucciones del proyecto: datos y enunciado de solo lectura, semilla fija, partición antes de explorar, ninguna cifra que no salga del código ejecutado y registro de cada paso. ",
    "**Arquitectura y plan.** El candidato propuso la estructura del repositorio (dbt, Airflow, Terraform y los cuatro stages de ML) y un plan de EDA por pasos. El plan se revisó y se ajustó antes de implementar: por ejemplo, se decidió usar dbt para las transformaciones sin estado y dejar en el processor lo que aprende de train.",
    "**Implementación por etapas.** Cada etapa (EDA, dbt, processor, torneo, inference, recommended, DAG, IaC e informe) se planeó, se ejecutó y se revisó antes de pasar a la siguiente, con feedback del candidato en cada una.",
    "**Revisión del informe.** El informe se corrigió con una lista de observaciones del candidato, aplicadas y contrastadas de nuevo con el cuaderno.",
    "**Trazabilidad.** Cada prompt se registró, junto con una bitácora de entradas y decisiones técnicas con alternativas y justificación.",
  ]),
  h2("13.2 Qué aportó el agente"),
  ...bullets([
    "**Calidad de código:** la capa de features y los stages quedaron con pruebas desde el inicio (27 pruebas en dbt, paridad con pandas) con módulos pequeños y documentados.",
    "**Errores detectados y corregidos gracias a la verificación:** `to_numeric` convertía en NaN los valores con coma de miles; `type_float()` de dbt perdía precisión.",
    "**Tiempo:** el esqueleto y el código repetitivo (dbt, DAG, Terraform, tablas y figuras del informe) se generaron e iteraron dentro de la misma conversación. El ahorro no se midió formalmente.",
    "**Cobertura y consistencia:** una misma persona pudo cubrir EDA, features, modelado, orquestación, infraestructura e informe con el mismo criterio y vocabulario.",
    "**Reproducibilidad y reutilización:** la trazabilidad completa y un skill que replica el desarrollo en otros proyectos, almacenado en un repositorio aparte.",
  ]),
  h2("13.3 Buenas prácticas y límites"),
  ...bullets([
    "**Verificar siempre contra la ejecución:** una cifra o una conclusión solo entra al informe si sale del código o del cuaderno ejecutado; el agente puede equivocarse con seguridad.",
    "**Trabajar en pasos pequeños y reversibles:** copias de respaldo, ediciones no destructivas y commits solo cuando el candidato lo pide.",
    "**Declarar los límites:** el DAG y la infraestructura no se ejecutaron en Airflow ni en AWS, y la post-producción es solo diseño.",
  ]),
];

// ---------- 13 conclusiones ----------
const s12c = [
  h1("14. Conclusiones"),
  ...numerada([
    "**Qué se hizo.** Se construyó el flujo completo para clasificar fraude sobre 16.880 operaciones (27,3% de fraude): EDA con pruebas estadísticas sobre train, capa de features en dbt, processor, torneo de cuatro algoritmos con validación cruzada anidada, inference y recommended, más un DAG de Airflow y una simulación de infraestructura en Terraform.",
    "**Qué modelo y por qué.** Se lleva a producción LightGBM con la variable país: PR-AUC de 0,696 ± 0,023 en validación y de 0,715 en test (línea base 0,273), ROC-AUC de 0,843 y probabilidades bien calibradas. Los árboles superan a la regresión logística, coherente con las relaciones no lineales del EDA; LightGBM y XGBoost están muy cerca, y la ventaja de LightGBM (0,0055 de PR-AUC, ganando en los 5 folds) es pequeña y no debe sobrevalorarse.",
    "**Qué señal hay en los datos.** `B`, `S` y `K` concentran la señal numérica; los faltantes y el `-1` de `B` y `S` son informativos y los valores extremos no son ruido, por lo que no se eliminaron. El país es la variable más asociada al fraude y también la más frágil: aporta ~0,10 de PR-AUC, pero puede reflejar cómo se armó la muestra (H2), por eso se conserva el modelo sin país (0,640 en test) como línea de seguridad.",
    "**Cómo se usa el score.** La política por bandas (aprobar, autenticación adicional, revisión manual y rechazar) usa umbrales calculados fuera de muestra sobre train y sus precisiones en test cumplen los objetivos (51,9%, 70,5% y 92,4%). Rechazar captura el 29,0% del fraude con 92,4% de precisión, y aprobar deja pasar el 20,1% (riesgo residual, tasa de 9,5%).",
    "**Qué se verificó y qué no.** dbt (27 pruebas y paridad con pandas), el processor, el torneo y la reproducción de la métrica en inference se ejecutaron. El DAG se validó solo por estructura y la infraestructura solo con `terraform validate`: no se ejecutaron en Airflow ni en AWS.",
    "**Qué falta para decidir con confianza.** Confirmar que `B` y `S` están disponibles al decidir (H4) y el origen del país; sustituir las precisiones objetivo por una política con costos reales y recalibrar con la prevalencia de producción; y validar fuera de tiempo cuando exista una variable temporal. La búsqueda de hiperparámetros aportó poco (+0,003 de PR-AUC), así que más mejora vendrá de mejores datos y variables que de más ajuste.",
  ]),
];

// ---------- 13 post-producción ----------
const s12 = [
  h1("12. Post-producción (aplicaciones futuras)"),
  nota("**Alcance.** Diseño propuesto, no implementado. Los umbrales y frecuencias son puntos de partida por calibrar con datos reales."),
  h2("12.1 Monitoreo"),
  tabla(["Qué se vigila", "Cómo", "Alerta inicial"], [
    ["Calidad de datos (esquema, faltantes de `K` y `C`, `-1` de `B` y `S`, países nuevos)", "Pruebas de dbt existentes", "Falla de prueba: no se puntúa"],
    ["Deriva de variables y del score", "PSI y KS contra train", "PSI > 0,10 aviso; > 0,25 crítica"],
    ["Performance (PR-AUC, precisión por banda, calibración)", "Cruce score–etiqueta con etiquetas maduras, ventana de 30 días y por país", "PR-AUC cae más de 0,03 frente a test"],
    ["Señales sin etiquetas y negocio (% por acción, revisión manual, contracargos)", "Diario y semanal desde `scores_fraude`", "Revisión por encima de la capacidad"],
  ], [3800, 3200, 2360], { tam: 17 }),
  p("", { after: 60 }),
  p("El fraude se confirma con demora, así que se combinan señales inmediatas (deriva y proxies) con la medición diferida. Como lo rechazado no tiene etiqueta, se propone un pequeño grupo de control aleatorio de operaciones de bajo riesgo."),
  h2("12.2 Herramientas e histórico"),
  ...bullets([
    "**Herramientas:** Airflow (orquesta) y dbt (métricas y pruebas); Evidently o SageMaker Model Monitor (deriva y performance); CloudWatch y SNS (alarmas); Athena y QuickSight o Grafana (consulta y tableros); SageMaker Model Registry (versiones).",
    "**Histórico:** Parquet particionado por fecha en el bucket de resultados, catalogado en Glue y consultado con Athena. Tablas: `scores_fraude` (existente), `etiquetas_fraude`, `metricas_modelo` (por versión, país y banda, con tamaño de muestra), `deriva_variables` y `modelos_registrados`. El cruce score–etiqueta usa solo operaciones maduras.",
  ]),
  h2("12.3 Reentrenamiento"),
  ...bullets([
    "**Cuándo:** cada mes como punto de partida, y antes si hay un disparador: PSI > 0,25 sostenido, caída de PR-AUC mayor a 0,03, deterioro de la calibración o cambios de esquema o de producto.",
    "**Cómo:** campeón contra retador con el mismo código del torneo y datos de etiqueta madura (con fecha de scoring ya se puede validar fuera de tiempo). El retador debe superar al campeón por más de la variación entre folds (≈ 0,02) sin empeorar en ningún país grande; luego corre en sombra o canario y se promueve con aprobación humana en el registro. Los umbrales de las bandas se recalculan con el nuevo modelo y con la prevalencia real observada y la reversa es volver a la versión anterior en S3.",
  ]),
];

// ---------- documento ----------
const doc = new Document({
  creator: "Jhair Santiago Martinez Osorio",
  title: "Detección de fraude en operaciones — Informe de la prueba técnica",
  styles: {
    default: { document: { run: { font: FUENTE, size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: AZUL, font: FUENTE }, paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: AZUL2, font: FUENTE }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1, keepNext: true } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, color: GRIS, font: FUENTE }, paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2, keepNext: true } },
    ],
  },
  numbering: {
    config: [
      { reference: "vinetas", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      ...refsNum.map((reference) => ({ reference, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] })),
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1300, right: 1440, bottom: 1200, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Detección de fraude · Prueba técnica ML Engineer", size: 16, color: GRIS })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Jhair Santiago Martinez Osorio · Página ", size: 16, color: GRIS }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRIS })] })] }) },
    children: [...portada, ...contenido, ...s1, ...s2, ...s3, ...s4, ...s5, ...s6, ...s7, ...s8, ...s9, ...s10, ...s11, ...s12, ...sIA, ...s12c],
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(SALIDA, buf); console.log("docx escrito:", SALIDA, (buf.length / 1024).toFixed(0), "KB"); });
