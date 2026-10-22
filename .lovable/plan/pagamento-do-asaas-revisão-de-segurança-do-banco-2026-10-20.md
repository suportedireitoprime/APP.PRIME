# Pagamento do Asaas + revisão de segurança do banco

## 1. Corrigir o recebimento de pagamentos do Asaas (causa do corte indevido)
Hoje, quando o Asaas avisa que alguém pagou, o app calcula o próximo vencimento a partir da data de vencimento da cobrança. Quem paga uma cobrança atrasada (ex.: venceu 13/09, pagou 13/10) recebe um vencimento já quase vencido e é cortado poucos dias depois, mesmo pagando em dia.

Correção:
- O próximo vencimento passa a contar a partir do dia em que o pagamento foi confirmado (ou do vencimento, o que for mais tarde), somando o ciclo do plano (mensal 34 dias, semestral 190, anual 370).
- Quem paga nunca fica com a assinatura como "cancelada": a assinatura volta a ativa e a marcação de assinante do perfil é ligada.
- A pessoa é localizada pelo e-mail quando não houver vínculo direto com a conta.
- O código dessa parte vem do seu GitHub para este projeto e é publicado de novo no servidor do Supabase. Só essa parte muda; o resto continua igual.

Depois de publicar:
- Envio um aviso de teste de pagamento para confirmar que a data sai certa.
- Faço uma varredura final pelo e-mail para achar outros assinantes com pagamento recente e acesso cortado, e devolvo o acesso deles.

## 2. Revisar os 178 avisos de segurança do banco
Os avisos se dividem assim:
- **153 avisos sobre funções internas que visitantes sem login ou usuários logados conseguem acionar diretamente.** Vou revisar uma por uma. Funções só de administrador ou de uso interno deixam de poder ser chamadas de fora. As que o app usa (ex.: checagem de cargo, contadores) continuam liberadas para quem precisa.
- **12 funções sem caminho de busca fixo.** Vou fixar o caminho em todas (correção sem efeito visível).
- **8 tabelas com proteção ligada mas sem regra de acesso.** Hoje ninguém consegue ler essas tabelas pelo app. Vou confirmar se isso é intencional (uso interno), e só crio regras onde o app precisar delas.
- **4 extensões instaladas na área pública.** É um alerta comum; mover essas extensões pode quebrar buscas, então só deixo registrado.
- **1 aviso de proteção contra senhas vazadas desligada.** Essa opção só se liga no painel do Supabase (Authentication → Policies), e eu te passo o caminho.

Antes de bloquear qualquer função, confiro se o app ou o servidor a usa, para não quebrar nenhuma tela.

## Detalhes técnicos
- Copiar `asaas-webhook` + `_shared/evolution.ts` + `_shared/horus-plan.ts` (e dependências) para `supabase/functions/`; `proximo = max(venc, now) + diasCiclo` quando `pago`; manter a verificação do token do webhook; deploy com `supabase--deploy_edge_functions`.
- Segurança: `REVOKE EXECUTE ... FROM anon, public` (e `authenticated` quando for admin-only) nas funções SECURITY DEFINER não usadas pelo cliente, depois de `rg` em `src/` e nas edge functions por `.rpc('<nome>'`; `ALTER FUNCTION ... SET search_path = public` nas 12; rodar o linter de novo para confirmar a redução.
