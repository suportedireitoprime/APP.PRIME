const phone = "555197563340";

const text = `Olá, Isabelle! Tudo bem? 🦉

Primeiramente, já verifiquei sua conta e regularizei a sua assinatura no sistema:
✅ *Sua Assinatura ANUAL está 100% ativa* (válida até 2027).
✅ *Todos os acessos estão liberados*, incluindo a função de *Resumos*, videoaulas, questões e o próprio assistente Horus.
💡 *Dica:* Se no seu aplicativo ainda estiver mostrando mensal em cache, basta fechar totalmente o aplicativo e abri-lo novamente para recarregar as informações atualizadas.

---

Sobre a sua dúvida de Direito das Obrigações, aqui está o resumo completo sobre o *Pagamento Indireto*:

O *pagamento indireto* ocorre quando a obrigação é extinta por meios legais diversos do cumprimento direto da prestação original pactuada. O Código Civil prevê as seguintes modalidades:

• *1. Pagamento em Consignação (arts. 334 a 345):*
Depósito judicial ou em estabelecimento bancário da coisa devida, nos casos em que o credor não puder ou recusar receber o pagamento sem justa causa.

• *2. Pagamento com Sub-rogação (arts. 346 a 351):*
Transferência dos direitos e garantias do credor original para um terceiro que cumpre a obrigação (sub-rogação legal ou convencional).

• *3. Imputação do Pagamento (arts. 352 a 355):*
Ocorre quando a pessoa tem vários débitos da mesma natureza com um único credor e indica qual deles está quitando.

• *4. Dação em Pagamento (arts. 356 a 359):*
Acordo em que o credor aceita receber prestação ou bem diferente daquele que lhe era originalmente devido.

• *5. Novação (arts. 360 a 367):*
Criação de uma nova obrigação com o objetivo expresso de extinguir e substituir a dívida anterior.

• *6. Compensação (arts. 368 a 380):*
Extinção mútua de obrigações até onde se equivalerem, quando duas pessoas forem, reciprocamente, credora e devedora de dívidas líquidas, vencidas e de coisas fungíveis.

• *7. Confusão (arts. 381 a 384):*
Extinção da obrigação quando na mesma pessoa se reúnem as qualidades de credor e devedor (ex.: por herança).

• *8. Remissão de Dívidas (arts. 385 a 388):*
Perdão voluntário e expresso do débito concedido pelo credor, com a concordância do devedor.

Se precisar se aprofundar em qualquer um desses pontos ou tiver qualquer outra dúvida, estou à disposição! Bons estudos! ⚖️`;

const url = `https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/temp-send?phone=${phone}&text=${encodeURIComponent(text)}`;

async function run() {
  console.log("Enviando mensagem para Isabelle via WhatsApp...");
  const res = await fetch(url);
  const data = await res.text();
  console.log("Status:", res.status, "Response:", data);
}

run();
