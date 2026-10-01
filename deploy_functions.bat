@echo off
echo Realizando o deploy das Edge Functions no Supabase...

call npx supabase functions deploy push-aleatorio-audio --project-ref dnjrgpldcwcpoywamorr
call npx supabase functions deploy push-aleatorio-video --project-ref dnjrgpldcwcpoywamorr
call npx supabase functions deploy push-aleatorio-livro --project-ref dnjrgpldcwcpoywamorr
call npx supabase functions deploy push-estudo-madrugada --project-ref dnjrgpldcwcpoywamorr

echo Deploy concluido com sucesso!
pause
