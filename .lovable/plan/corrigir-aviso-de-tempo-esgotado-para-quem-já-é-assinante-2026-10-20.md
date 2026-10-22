# Corrigir aviso de "tempo esgotado" para quem já é assinante

## O que encontrei (caso da Larissa)
- A assinatura mensal dela no Asaas está como **CANCELADA** desde 17/10. Ela só aparece como assinante (a coroa) porque a marcação "premium" do perfil dela continua ligada. Ou seja: o app tem duas informações que não batem.
- Ao abrir o app, a checagem de assinatura faz 6 consultas antes de responder. **Enquanto essa resposta não chega, o app trata todo mundo como usuário grátis.** Nesse meio-tempo:
  - O "Me Explique" usa o limite grátis (1 minuto por mês). Se a pessoa já tinha usado esse minuto, ele mostra na hora "Tempo Limite Atingido" e encerra a conversa, mesmo ela sendo assinante.
  - As telas bloqueadas podem mostrar por um instante "Seu teste de 3 dias acabou".
- Isso atinge qualquer assinante, principalmente com internet lenta ou na primeira abertura do dia.
- Números gerais: 171 assinaturas ativas no Asaas, das quais 16 estão sem a marcação premium no perfil; 24 assinaturas do Google Play continuam marcadas como ativas, mas venceram há mais de 7 dias.

## O que vou corrigir
1. **Esperar a checagem antes de bloquear.** Nenhum aviso de limite, de teste encerrado ou de assinatura aparece enquanto o app ainda está confirmando se a pessoa é assinante. Nesse intervalo aparece só um carregando discreto.
2. **Me Explique.** O contador de tempo só começa e só encerra a conversa depois de saber o plano certo. O aviso "Tempo Limite Atingido" nunca vai usar o limite grátis para um assinante, e se o plano mudar o contador é recalculado.
3. **"Seu teste de 3 dias acabou".** Esse aviso só aparece quando a checagem terminou e confirmou que a pessoa não tem plano.
4. **Lembrar o último plano.** Se o assinante já foi confirmado antes neste aparelho, o app libera na hora e confere em segundo plano.

## Para você decidir depois (não mexo agora)
- A assinatura da Larissa está cancelada no Asaas. Se ela pagou de novo por outro caminho (Pix, por exemplo), o pagamento não chegou ao app. Confira no Asaas. Se ela não deve mais ter acesso, a marcação premium do perfil dela precisa ser desligada.
- As 24 assinaturas vencidas do Google Play podem ser revisadas.

## Detalhes técnicos
- `useSubscription`: expor `loading` de forma confiável (já existe); o cache em localStorage hidrata `isPremium` imediatamente.
- `useMeExpliqueCota`: retornar `carregandoPlano`; `limiteAtingido` = false enquanto carrega; recalcular `tempoUsado` quando `isPremium` muda; o timer não inicia durante o loading.
- `MeExpliqueLiveChatView`: o efeito de encerrar por cota e o `conectar` aguardam `!cota.carregandoPlano`.
- `PremiumGate` / `TrialExpiredModal` / `useFeatureLimit`: `blocked` e `isTrialExpired` passam a ser false enquanto `loading`; renderizar o gate só depois de resolvido.
- Verificação: Playwright simulando consulta lenta (rota interceptada) para confirmar que nenhum aviso aparece durante o carregamento.
