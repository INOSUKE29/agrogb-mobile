SELECT
    SCHEMA_NAME,
    relname,
    table_size
  FROM
    (SELECT
      pg_catalog.pg_namespace.nspname AS SCHEMA_NAME,
      relname,
      pg_relation_size(pg_catalog.pg_class.oid) AS table_size
    FROM pg_catalog.pg_class
    JOIN pg_catalog.pg_namespace ON relnamespace = pg_catalog.pg_namespace.oid
    ) t
  WHERE SCHEMA_NAME NOT LIKE 'pg_%'
  ORDER BY table_size DESC
  LIMIT 25