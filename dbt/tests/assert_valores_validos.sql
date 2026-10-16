-- Falla si algún valor rompe lo observado en el EDA: los únicos negativos son los -1 de B y S;
-- el resto de variables no es negativo; F y G son proporciones en [0, 1]; Monto > 0.
select row_id
from {{ ref('stg_fraude') }}
where (b < 0 and b <> -1)
   or (s < 0 and s <> -1)
   or a < 0 or c < 0 or d < 0 or e < 0 or h < 0 or i < 0 or q < 0 or r < 0
   or monto <= 0
   or f < 0 or f > 1
   or g < 0 or g > 1
