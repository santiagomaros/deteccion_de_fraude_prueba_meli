-- Cada indicador debe coincidir con la condición que lo define.
select row_id
from {{ ref('mart_fraude_features') }}
where (c_falta = 1) <> (c is null)
   or (k_falta = 1) <> (k is null)
   or (b_neg1 = 1 and b is not null)
   or (s_neg1 = 1 and s is not null)
   or (d_gt0 = 1) <> (d > 0)
   or (h_gt0 = 1) <> (h > 0)
   or (q_gt0 = 1) <> (q > 0)
