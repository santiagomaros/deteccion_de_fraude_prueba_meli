-- Señales: centinelas e indicadores. Todo es por fila (sin estado): nada depende de otras filas.
--  * B y S usan -1 como "no disponible" (EDA, pasos 2 y 7): se pasa a NULL y se conserva el indicador.
--  * C y K tienen faltantes informativos (EDA, paso 4): indicadores c_falta y k_falta.
--  * Variables con >= 84% de ceros: indicador x > 0 en lugar de transformarlas (EDA, paso 5).

select
    row_id,
    a,
    case when b = -1 then null else b end   as b,
    c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r,
    case when s = -1 then null else s end   as s,
    monto,
    fraude,

    {{ ind('b = -1') }}      as b_neg1,
    {{ ind('s = -1') }}      as s_neg1,
    {{ ind('c is null') }}   as c_falta,
    {{ ind('k is null') }}   as k_falta,
    {{ ind('a > 0') }}       as a_gt0,
    {{ ind('d > 0') }}       as d_gt0,
    {{ ind('e > 0') }}       as e_gt0,
    {{ ind('g > 0') }}       as g_gt0,
    {{ ind('h > 0') }}       as h_gt0,
    {{ ind('o > 0') }}       as o_gt0,
    {{ ind('q > 0') }}       as q_gt0,
    {{ ind('r > 0') }}       as r_gt0
from {{ ref('stg_fraude') }}
