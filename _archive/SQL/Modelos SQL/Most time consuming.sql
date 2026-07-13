-- Most time consuming queries

-- A limit of 100 has been added below

select
    auth.rolname,
    statements.query,
    statements.calls,
    statements.total_exec_time + statements.total_plan_time as total_time,
    to_char(((statements.total_exec_time + statements.total_plan_time)/sum(statements.total_exec_time + statements.total_plan_time) over()) * 100, 'FM90D0') || '%' as prop_total_time
  from pg_stat_statements as statements
    inner join pg_authid as auth on statements.userid = auth.oid
  order by
    total_time desc
  limit
    100;