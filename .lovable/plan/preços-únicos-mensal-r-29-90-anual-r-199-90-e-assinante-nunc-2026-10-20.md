# Preços únicos (Mensal R$29,90 / Anual R$199,90) e assinante nunca ver checkout

## Regras (a salvar na memória do projeto)
- Só existem 2 planos: **Mensal R$ 29,90/mês** e **Anual R$ 199,90/ano** (anual parcelável em até 6x, com o juro do Asaas somado ao cliente).
- Sem Vitalício, sem promoção "de R$199,90 por R$149,90", sem desconto no Pix.
- Cobrança apenas pelo Asaas (Google Play e Apple desativados para venda).
- Quem já tem assinatura ativa nunca deve ser mandado para a tela de compra.

## O que foi encontrado
- Telas do app mostram anual a **R$ 149,90** (Assinatura, PricingCards, CheckoutModal, HorusPromoModal) e ainda oferecem **Vitalício R$ 149,90 (até 4x)**.
- A função de cobrança no Asaas (`asaas-checkout`) cobra **R$ 149,90** no anual e no vitalício; tem comentário falando em R$ 249,90; aceita planos `vitalicio`, `vitalicio_pix`, `promocao`, `anual_pix`.
- Juros do parcelamento no app são uma tabela fixa inventada (2x 5,8%, 3x 8,3%, 4x 10,8%), não o juro real do Asaas.
- Relatórios usam vitalício R$ 499,90 e anual iOS R$ 238,80.
- **Ana Clara**: assinatura mensal ATIVA no Asaas até 03/11. Hoje às 17:16 ela entrou, apareceu o pedido de avaliação, e logo em seguida abriu a tela de assinatura, clicou "teste/plano" e iniciou checkout. Ou seja, algum aviso/botão levou uma assinante à compra. Os pontos que levam a `/assinatura` sem checar assinatura incluem: PremiumGate (botões de plano/trial), TrialExpiredModal, PlanoCard do Perfil, SideMenu, DesktopSidebar, MinhaCota, HorusPromoModal, e a própria página Assinatura não redireciona assinantes.

## O que vou fazer
1. **Preços únicos em um só lugar**: criar um arquivo de preços (mensal 29,90; anual 199,90; máx. 6x) usado por todas as telas e relatórios.
2. **Telas de compra**: remover Vitalício, promo e "à vista no Pix com desconto"; anual mostra R$ 199,90 e "até 6x com juros do Asaas"; Pix e cartão no mesmo preço.
3. **Juros reais do Asaas**: o parcelamento passa a usar o cálculo do Asaas (o cliente paga o juro). Antes de implementar, consulto na API do Asaas da conta as taxas de parcelamento configuradas; se a API não expuser, uso a opção nativa do Asaas de repassar juros ao comprador em vez de tabela fixa.
4. **Função de cobrança `asaas-checkout`**: aceitar só `mensal`, `mensal_pix`, `anual`, `anual_pix`; valores 29,90 e 199,90 fixados no servidor (ignora preço vindo do app); parcelas 1–6 só no anual; recusar qualquer plano antigo. Publicar a função.
5. **Relatórios/admin**: trocar 499,90 / 238,80 / 149,90 pelos dois preços oficiais (histórico de pagamentos antigos continua mostrando o valor real pago).
6. **Assinante nunca vai para compra**:
   - Página Assinatura: se a pessoa tem assinatura ativa, mostra "Minha assinatura" (plano, vencimento) em vez dos planos e do checkout.
   - Todos os botões/avisos listados acima: checar assinatura antes; para assinantes, esconder ou levar para "Minha assinatura".
   - Remover avisos de trial/promo (TrialExpiredModal, HorusPromoModal) para assinantes, e esperar a checagem terminar antes de mostrar qualquer aviso de compra (evita o "piscar" enquanto carrega).
   - Descobrir pelo histórico de eventos qual tela exata abriu a Assinatura para a Ana Clara e confirmar que foi coberta.
7. **Testes**: preços (29,90; 199,90; máx 6x; planos antigos recusados) e regra "assinante ativo não vê checkout".

## Detalhes técnicos
- Fonte única: `src/lib/precos.ts`; consumido por Assinatura.tsx, CheckoutModal, PricingCards, appEvents.ts, admin.
- Edge function vive em `/tmp/src-repo/supabase/functions/asaas-checkout` (origem do repo); copiar para `supabase/functions/` do projeto, ajustar e implantar; também revisar `asaas-webhook` para mapear qualquer pagamento a mensal/anual.
- Planos antigos já existentes no banco (vitalícios antigos) continuam valendo — não serão cortados.
- Guard de assinante: hook `useSubscription` (isPremium && !loading) envolvendo navegações para `/assinatura`.
