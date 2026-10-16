{{ config(severity='warn') }}
-- Guardia de volumen/deriva: avisa si la tasa de fraude sale del rango esperado (EDA: 27,3%).
select round(avg(fraude), 4) as tasa_fraude
from {{ ref('mart_fraude_features') }}
having avg(fraude) < {{ var('tasa_fraude_min') }} or avg(fraude) > {{ var('tasa_fraude_max') }}
