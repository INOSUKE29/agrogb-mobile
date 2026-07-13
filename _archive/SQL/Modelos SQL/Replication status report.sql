-- Replication status report

SELECT
  s.slot_name,
  s.active,
  COALESCE(r.state, 'N/A') as state,
  COALESCE(r.client_addr, null) as replication_client_address,
  GREATEST(0, ROUND((redo_lsn-restart_lsn)/1024/1024/1024, 2)) as replication_lag_gb
FROM pg_control_checkpoint(), pg_replication_slots s
LEFT JOIN pg_stat_replication r ON (r.pid = s.active_pid);
