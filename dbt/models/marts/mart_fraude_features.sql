-- Mart de features: una fila por operación, listo para el `processor` (ml/modelo_fraude_meli/processor).
-- Contrato: solo transformaciones SIN ESTADO y con parámetros fijos (ver vars en dbt_project.yml).
-- Lo que se aprende de los datos (medianas, cuartiles, codificadores, escalado) y la partición
-- train/test NO van aquí: los ajusta el `processor` solo con train.

select
    row_id,
    fraude,

    -- valores limpios (B y S con NULL donde había -1; C y K con NULL donde faltan)
    a, b, c, d, e, f, g, h, i, k, l, m, n, o, p, q, r, s, monto, j,

    -- agrupaciones con parámetros fijos del EDA
    case when j in ({% for pais in var('paises_modelo') %}'{{ pais }}'{% if not loop.last %}, {% endif %}{% endfor %}) then j else 'OTRO' end as j_grp,
    case when l = 0 then '0' when l = 1 then '1' when l = 2 then '2' else '3+' end                  as l_cat,
    least(m, {{ var('tope_m') }})                                                                    as m_cap4,
    least(n, {{ var('tope_n') }})                                                                    as n_cap3,
    least(p, {{ var('tope_p') }})                                                                    as p_cap5,

    -- transformaciones sin estado (para modelos lineales o redes; los árboles no las necesitan)
    ln(1 + monto)   as log1p_monto,
    ln(1 + c)       as log1p_c,
    ln(1 + q)       as log1p_q,
    ln(1 + a)       as log1p_a,
    ln(1 + d)       as log1p_d,
    ln(1 + e)       as log1p_e,
    ln(1 + h)       as log1p_h,
    ln(1 + r)       as log1p_r,

    -- indicadores
    b_neg1, s_neg1, c_falta, k_falta,
    a_gt0, d_gt0, e_gt0, g_gt0, h_gt0, o_gt0, q_gt0, r_gt0
from {{ ref('int_fraude_senales') }}
