-- Staging: tipado y limpieza, sin lógica de negocio.
--  * El CSV trae coma de miles en Monto, Q y R (p. ej. "12,538.44") y celdas vacías en C y K.
--  * row_id sigue el orden del archivo (no hay identificador en los datos).
--  * Nombres en minúsculas (convención SQL); el `processor` los consume tal cual.

with fuente as (

    select row_number() over () as row_id, *
    from {{ source('raw', 'fraude') }}

)

select
    row_id,
    {{ parse_num('"A"', dbt.type_int()) }}     as a,
    {{ parse_num('"B"', dbt.type_int()) }}     as b,
    {{ parse_num('"C"', dbt.type_int()) }}     as c,
    {{ parse_num('"D"', dbt.type_int()) }}     as d,
    {{ parse_num('"E"', dbt.type_int()) }}     as e,
    {{ parse_num('"F"', tipo_decimal()) }}   as f,
    {{ parse_num('"G"', tipo_decimal()) }}   as g,
    {{ parse_num('"H"', dbt.type_int()) }}     as h,
    {{ parse_num('"I"', dbt.type_int()) }}     as i,
    nullif(trim("J"), '')                      as j,
    {{ parse_num('"K"', tipo_decimal()) }}   as k,
    {{ parse_num('"L"', dbt.type_int()) }}     as l,
    {{ parse_num('"M"', dbt.type_int()) }}     as m,
    {{ parse_num('"N"', dbt.type_int()) }}     as n,
    {{ parse_num('"O"', dbt.type_int()) }}     as o,
    {{ parse_num('"P"', dbt.type_int()) }}     as p,
    {{ parse_num('"Q"', tipo_decimal()) }}   as q,
    {{ parse_num('"R"', tipo_decimal()) }}   as r,
    {{ parse_num('"S"', tipo_decimal()) }}   as s,
    {{ parse_num('"Monto"', tipo_decimal()) }}  as monto,
    {{ parse_num('"Fraude"', dbt.type_int()) }}   as fraude
from fuente
