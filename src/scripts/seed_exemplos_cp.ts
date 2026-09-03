import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis do .env do projeto
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltam variáveis de ambiente (SUPABASE_URL ou KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const EXEMPLOS_PRATICOS = [
  {
    artigo: 'Art. 1º',
    conteudo: `![Capa](/exemplos/cp/art1.jpg)

### A Lei e o Limite do Poder do Estado

A história do Direito Penal se divide entre o *antes* e o *depois* deste princípio. Sem o princípio da Legalidade, viveríamos o terror do arbítrio estatal, onde um rei, imperador ou juiz poderia inventar um crime simplesmente porque não gostou da sua atitude. 

**Caso Prático**
Imagine que João decide abrir uma empresa para vender "ar enlatado das montanhas da Suíça" por R$ 500,00 a lata, e acaba ficando milionário. Os vizinhos, movidos por inveja, exigem sua prisão por "crime de exploração gananciosa de oxigênio". 
O delegado de polícia é acionado e, por mais que ache a atitude de João imoral, absurda ou antiética, ele consulta o Código Penal e não encontra nenhuma linha que proíba vender ar engarrafado. 
O resultado? O delegado é **obrigado** a mandar João para casa. Não há crime, pois não há lei escrita, anterior e rigorosa que defina a venda de ar como infração penal. O Estado só pode intervir e punir aquilo que está minuciosamente escrito e validado pelo Congresso Nacional.

**Dica de Ouro 🎯**
A máxima latina "*Nullum crimen, nulla poena sine praevia lege*" é o escudo de ouro do cidadão contra o absolutismo do Estado. Lembre-se que não é admitida a criação de crime por Medida Provisória, e muito menos punir alguém por "analogia" (para prejudicar o réu).`
  },
  {
    artigo: 'Art. 2º',
    conteudo: `![Capa](/exemplos/cp/art2.jpg)

### A Abolitio Criminis e o Vento da Liberdade

O tempo avança, a moral evolui e a sociedade muda. O que antes era considerado um crime gravíssimo (como o adultério) hoje pode não ser mais. Quando a lei deixa de considerar um fato como crime, ocorre uma "amnésia" jurídica: o Estado apaga o fato da história criminal.

**Caso Prático**
Tício foi julgado e condenado a 5 anos de prisão no ano de 2000 por cometer o crime de "Sedução" (o antigo art. 217, que punia seduzir mulher virgem, hoje revogado). Em 2005, enquanto Tício já estava no terceiro ano de sua pena atrás das grades, entrou em vigor a Lei 11.106, que revogou totalmente esse crime. 
E agora? Mesmo Tício já tendo sido condenado com "trânsito em julgado" (sem chance de recurso), a nova lei retroage como uma máquina do tempo. O diretor do presídio precisa providenciar o alvará de soltura e Tício sai livre imediatamente. Além disso, a ficha criminal dele volta a ficar "limpa" para esse caso — cessam todos os efeitos penais. Contudo, os efeitos *civis* (se ele devesse indenização) permaneceriam.

**Dica de Ouro 🎯**
A regra fundamental é: a lei penal NUNCA retroage para o passado, **SALVO** para beneficiar o réu. A *abolitio criminis* (abolição do crime) é a rainha das benesses penais, operando de forma retroativa absoluta.`
  },
  {
    artigo: 'Art. 3º',
    conteudo: `![Capa](/exemplos/cp/art3.jpg)

### Lei Excepcional ou Temporária: A Regra do Caos

Quando o país atravessa um período de guerra, uma grave epidemia ou um evento como a Copa do Mundo, a normalidade é suspensa. O Estado cria leis rígidas e severas com um "prazo de validade" ou atreladas à duração da crise. O problema surge quando a crise acaba: os criminosos ganham anistia?

**Caso Prático**
Em 2025, estoura a epidemia do "Vírus Z". O Congresso aprova urgentemente uma Lei Temporária que diz: *"Art. 1º: É crime sair de casa sem uma máscara amarela. Pena: 2 anos de prisão. Esta lei vigora até o dia 31/12/2025"*. 
No dia 30/12/2025, faltando um dia para a lei "morrer", Caio decide ir à padaria sem máscara e é preso em flagrante. 
Em janeiro de 2026, a lei já expirou. Sair sem máscara não é mais crime. O advogado de Caio pede a soltura dele alegando *abolitio criminis* (Art. 2º). 
O Juiz **NEGA** o pedido! Por quê? Porque as leis excepcionais e temporárias possuem o superpoder da **Ultratividade**. Elas continuam punindo quem cometeu o crime *durante* a vigência delas, mesmo após terem "morrido". Se não fosse assim, ninguém respeitaria a lei no seu último mês de validade.

**Dica de Ouro 🎯**
A lei excepcional "revive" como um fantasma para julgar o fato praticado ao seu tempo. Nunca confunda com *abolitio criminis*.`
  },
  {
    artigo: 'Art. 4º',
    conteudo: `![Capa](/exemplos/cp/art4.jpg)

### O Tempo do Crime e a Teoria da Atividade

A biologia e o direito nem sempre caminham juntos na linha do tempo. Quando exatamente um crime acontece? No momento em que o bandido aperta o gatilho (a ação) ou dias depois, quando a vítima finalmente falece no leito de hospital (o resultado)? Essa resposta muda a vida de um réu que estava prestes a completar 18 anos.

**Caso Prático**
Mévio tem 17 anos e 364 dias. No dia 10 de maio, às 23h50 (faltando dez minutos para completar a maioridade penal), ele saca um revólver e dispara contra Tício, seu inimigo (Momento da Ação). 
Tício sobrevive ao disparo inicial, é socorrido, levado à UTI, mas acaba falecendo 15 dias depois (Momento do Resultado). Quando Tício efetivamente morreu, Mévio já tinha 18 anos, já era plenamente maior de idade perante a lei civil e penal!
Como ele será julgado? Ficará preso no sistema adulto (Código Penal) ou cumprirá medida socioeducativa como adolescente (ECA)? 
A resposta: **Medida Socioeducativa (ECA)**. O Brasil adotou a *Teoria da Atividade*, determinando que o tempo do crime é o instante da AÇÃO/OMISSÃO, ignorando quando ocorreu o resultado. Como na hora do disparo Mévio tinha 17 anos, ele é legalmente inimputável.

**Dica de Ouro 🎯**
Lembre-se do mnemônico **LUTA** para provas e exames: 
**L**ugar do crime = **U**biquidade.
**T**empo do crime = **A**tividade.`
  },
  {
    artigo: 'Art. 5º',
    conteudo: `### O Princípio da Territorialidade e as Fronteiras Invisíveis

Onde a lei brasileira tem força? Inicialmente, dentro do nosso território de terra e mar, mas o Brasil adota a chamada *Territorialidade Temperada*. Isso significa que usamos o espaço aéreo, embaixadas, e as "bandeiras" de navios para esticar nosso domínio soberano pelo oceano.

**Caso Prático**
Imagine que um turista Argentino e um Francês estão jogando baralho a bordo de um cruzeiro majestoso. De repente, uma briga explode e o Argentino assassina o Francês. A grande questão é: onde esse navio estava?
Se o navio for mercante/privado e ostentar a bandeira do Brasil, navegando em alto-mar (águas internacionais, sem dono), o navio é considerado uma extensão "flutuante" do Brasil! O Argentino será julgado no Brasil, pelas leis brasileiras (Código Penal Brasileiro) e por um juiz brasileiro, ainda que não haja nenhum brasileiro envolvido. 
Se fosse um navio de guerra (público) da Marinha do Brasil, a lei brasileira o acompanharia até mesmo se ele estivesse atracado no porto de Nova York!

**Dica de Ouro 🎯**
Navios e aeronaves PÚBLICAS do Brasil são território nacional **onde quer que se encontrem**. Navios e aviões PRIVADOS brasileiros só são território nacional se estiverem no Brasil ou em águas/espaço aéreo internacional (alto-mar).`
  },
  {
    artigo: 'Art. 6º',
    conteudo: `### O Lugar do Crime e a Teoria da Ubiquidade

Se um atirador de elite dispara uma bala da fronteira da Argentina e o corpo da vítima cai morta do lado do Brasil, de quem é a jurisdição? Daquele que sofreu a ação, ou daquele que sofreu o resultado trágico? O Brasil resolve isso com a Teoria da Ubiquidade (ou mista).

**Caso Prático**
Alfonso, gênio da engenharia de explosivos, monta uma sofisticada carta-bomba na cidade de Foz do Iguaçu (Paraná - Brasil) e a envia pelo correio para Ciudad del Este (Paraguai). Três dias depois, o pacote é aberto no Paraguai e mata a vítima. 
O Brasil e o Paraguai começam a disputar: onde o crime aconteceu? Para o Brasil, o crime ocorreu **em ambos os lugares**. A Teoria da Ubiquidade diz que considera-se praticado o crime TANTO no lugar em que ocorreu a ação/omissão (Brasil, onde ele montou e postou a bomba), QUANTO onde se produziu o resultado (Paraguai). Logo, a justiça brasileira tem total legitimidade e competência para processar Alfonso, não importando que o cadáver esteja em solo paraguaio.

**Dica de Ouro 🎯**
A diferença clássica para provas: No *Tempo do Crime* (Art. 4) a lei prefere isolar o instante da Ação. No *Lugar do Crime* (Art. 6), a lei é "fominha" e abraça tanto o local da ação quanto o do resultado (Ubiquidade). Lembre da **LUTA**.`
  },
  {
    artigo: 'Art. 7º',
    conteudo: `### Extraterritorialidade: O Braço Longo da Justiça Brasileira

A justiça brasileira não para nas fronteiras territoriais. Existem bens tão preciosos e sagrados para a nossa República que, mesmo se forem atacados lá no fim do mundo, a Polícia Federal e a Justiça Brasileira irão atrás do culpado.

**Caso Prático (Extraterritorialidade Incondicionada)**
O Presidente da República do Brasil viaja para um encontro do G20 em Paris, na França. Durante um jantar, o garçom local (um francês radical) coloca veneno letal na sopa do Presidente brasileiro, tentando matá-lo. 
Esse crime aconteceu em solo soberano francês, por um estrangeiro. Contudo, como o alvo supremo era a vida do Presidente do Brasil, nosso país aplicará a *Extraterritorialidade Incondicionada*. O Brasil abrirá um processo penal contra esse garçom e exigirá a condenação dele segundo a Lei Brasileira, independentemente de a França já tê-lo julgado, condenado ou absolvido. Para o Brasil, esse crime afeta a base do nosso Estado.

**Dica de Ouro 🎯**
Existem 4 casos clássicos incondicionados: Crimes contra a vida/liberdade do **Presidente**; crimes contra o patrimônio de ente da **Administração Pública**; crimes contra a **Administração Pública por quem está a seu serviço**; e o crime de **Genocídio** (se o autor for brasileiro ou morar aqui).`
  },
  {
    artigo: 'Art. 8º',
    conteudo: `### Pena Cumprida no Estrangeiro (A Matemática do Tempo Cumprido)

A regra penal busca evitar o "bis in idem" (punir alguém duas vezes pelo mesmo fato). Se o Brasil, exercendo sua extraterritorialidade, julga alguém que já passou um tempo na prisão lá fora pelo mesmo crime, nós precisamos fazer um acerto de contas matemático!

**Caso Prático**
Robson, brasileiro, comete um homicídio cruel no Uruguai e é sentenciado pelas cortes uruguaias a 2 anos de prisão (uma pena leve). Após cumprir esses 2 anos na cadeia em Montevidéu, ele foge para o Brasil. 
A justiça brasileira, não satisfeita com a pena pequena do Uruguai, decide julgá-lo também por esse homicídio (extraterritorialidade condicionada). O juiz brasileiro aplica uma pena de 10 anos de prisão a Robson. 
Robson terá que ficar 10 anos preso no Brasil? **Não!** As penas idênticas se computam (subtraem). Como ele já cumpriu 2 anos lá fora, nós abatemos (computamos) da pena brasileira. Restará a Robson cumprir apenas 8 anos no Brasil.
*Mas atenção:* se a pena lá fora fosse diferente (ex: multa no Uruguai, mas prisão no Brasil), a pena brasileira seria apenas "atenuada" (o juiz daria um desconto na prisão), pois não dá pra subtrair laranja de maçã.

**Dica de Ouro 🎯**
Penas IGUAIS (Prisão - Prisão) = Computam (subtrai-se diretamente). Penas DIFERENTES (Multa - Prisão) = Atenuam (Juiz dá um "desconto" equitativo).`
  },
  {
    artigo: 'Art. 9º',
    conteudo: `### Eficácia de Sentença Estrangeira (O Carimbo do STJ)

A sentença de um juiz dos Estados Unidos não tem força executiva de prender ou cobrar dívidas de ninguém imediatamente dentro do Brasil, a menos que passe por um rigoroso pedágio diplomático: a Homologação do Superior Tribunal de Justiça (STJ).

**Caso Prático**
Peter, norte-americano, aplicou um golpe de fraude em uma empresa em Nova York, mas fugiu e veio morar disfarçado no Rio de Janeiro com os milhões roubados. A justiça americana condenou Peter ao pagamento de U$ 5 milhões de indenização às vítimas e à pena de prisão. 
Os advogados americanos contratam profissionais no Brasil para recuperar os bens comprados no Rio. Eles não podem simplesmente pedir para a PM invadir a casa de Peter. Primeiro, eles precisam pegar a sentença americana e enviar ao Superior Tribunal de Justiça (STJ) no Brasil para que ela seja *Homologada* (validada). 
Uma vez homologada no STJ, aquela sentença de "reparação do dano" ganha força de título executivo no Brasil e os bens do apartamento no Leblon podem ser leiloados para pagar as vítimas. 

**Dica de Ouro 🎯**
Sentença criminal estrangeira NUNCA é homologada no Brasil para forçar o sujeito a cumprir *prisão* aqui pelo crime lá de fora (a menos que seja transferência de presos, tratado recente). A homologação serve primordialmente para **obrigações civis (indenizar, reparar dano)** e para decretar **medidas de segurança** (internação psiquiátrica). O pedágio homologatório é DE EXCLUSIVIDADE do **STJ**.`
  },
  {
    artigo: 'Art. 10',
    conteudo: `### Contagem de Prazo (A Matemática Pro-Réu)

No Direito Civil (contratos, processos), os prazos costumam pular o primeiro dia e só começar a contar do dia seguinte. No Direito Penal, a pressa de colocar o sujeito em liberdade, ou de a prescrição passar, é o norte. A contagem penal abraça e inclui o dia em que o evento começou.

**Caso Prático**
Caio foi sentenciado a exatos 2 anos de prisão por um crime de furto e entrou na Penitenciária às **23h45** do dia 10 de Agosto de 2024. 
Veja bem: ele ficou na cela apenas 15 minutos no dia 10. Para o Direito Penal e para a matemática da sua soltura, esse dia 10 já é contado como o **Primeiro Dia Cumprido Inteiro** da pena! A lei penal computa o dia do começo como um dia ganho, ignorando frações de horas. Os meses e anos são contados pelo calendário comum. Se ele cumpriu 2 anos a partir do dia 10/08/2024, o seu prazo terminará no dia 09/08/2026, sendo que no primeiro minuto do dia 10/08/2026 ele já estará 100% livre.

**Dica de Ouro 🎯**
Lembrete matador para a OAB: Prazo penal INCLUI o dia do começo (mesmo que restem 2 minutos pro dia acabar). Prazo processual penal EXCLUI o dia do começo e conta do dia útil seguinte.`
  }
];

async function seedExemplos() {
  console.log('Iniciando Seed de Exemplos Práticos do Código Penal (Art 1 ao 10) no Supabase...');
  
  for (const item of EXEMPLOS_PRATICOS) {
    const jsonPayload = JSON.stringify({ markdown: item.conteudo });

    const { error } = await supabase.from('artigo_ai_cache').upsert(
      {
        tabela_codigo: 'CP_CODIGO_PENAL',
        numero_artigo: item.artigo,
        tipo: 'exemplo_pratico',
        conteudo: jsonPayload
      },
      { onConflict: 'tabela_codigo,numero_artigo,tipo' }
    );

    if (error) {
      console.error(`Erro ao inserir ${item.artigo}: `, error.message);
    } else {
      console.log(`✅ Sucesso ao inserir/atualizar a Masterclass de Exemplo Prático para: ${item.artigo}`);
    }
  }

  console.log('Fábrica Finalizada com Sucesso!');
}

seedExemplos();
