SELECT
    a.pid,
    a.usename,
    a.state,
    a.query_start,
    now() - a.query_start AS duration,
    a.wait_event_type,
    a.wait_event,
    l.mode,
    l.locktype,
    l.granted,
    c.relname,
    a.query
FROM pg_stat_activity a
JOIN pg_locks l ON l.pid = a.pid
LEFT JOIN pg_class c ON c.oid = l.relation
WHERE a.pid <> pg_backend_pid()
ORDER BY duration DESC;
