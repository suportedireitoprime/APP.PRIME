-- Mostrar consultas ativas ou travadas em blog_edicao_posts
SELECT pid, state, wait_event_type, wait_event, query_start, age(clock_timestamp(), query_start), query
FROM pg_stat_activity
WHERE state != 'idle' AND pid <> pg_backend_pid();

-- Cancelar/terminar conexões que estão travadas ou em idle in transaction há mais de 1 minuto
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE (state = 'idle in transaction' OR query ILIKE '%blog_edicao_posts%')
  AND pid <> pg_backend_pid()
  AND age(clock_timestamp(), state_change) > interval '10 seconds';
