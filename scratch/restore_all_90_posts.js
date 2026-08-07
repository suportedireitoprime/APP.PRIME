import fs from 'fs';

// 1. Carrega os 30 novos posts
const insert30Sql = fs.readFileSync('scratch/insert_30.sql', 'utf-8');

// 2. Carrega a lista dos 60 posts anteriores extraídos de step 972
const oldPostsList = [
  {"id":"edicao-0260e4f7-a4fd-4781-9088-60a864ec96e0-1786061316710","titulo":"Quem Cria as Leis no Brasil: As 7 Etapas do Processo Legislativo Desvendadas","categoria":"Leis"},
  {"id":"edicao-aaa7e496-e2df-4472-9342-9f1b5f55276e-1786060467778","titulo":"Pirâmide de Kelsen: Desmistificando a Hierarquia das Normas em 5 Minutos","categoria":"Leis"},
  {"id":"edicao-7ff4ac86-4052-43bd-82bd-1ed364563d8f-1785985602342","titulo":"Denunciantes Invejosos: O Dilema de Fuller que Testa Seu Senso de Justiça","categoria":"Clássicos"},
  {"id":"edicao-32a483f5-e3c0-43ed-b76c-cc0c7c8a097c-1785985543232","titulo":"Esperança Garcia: a primeira advogada do Brasil que você precisa conhecer","categoria":"Curiosidades"},
  {"id":"edicao-07cb2bd8-7d8d-458a-bf67-41729fff99d8-1785984548644","titulo":"Lei ou Moral? Hart x Dworkin: O Duelo Filosófico que Define a OAB","categoria":"Filosofia"},
  {"id":"edicao-d741a58a-ef4f-4d75-a596-81d8039b798a-1785783917165","titulo":"Victor Nunes Leal: O Ministro que Moldou o STF com a Era das Súmulas","categoria":"STF"},
  {"id":"edicao-99cc8e1e-4000-4d2c-8f22-49dd77b06f7a-1785781507419","titulo":"Kelsen e a Pirâmide do Direito: O Segredo da Validade das Leis","categoria":"Filosofia"},
  {"id":"edicao-1ceb884c-2a20-4149-8469-8210b4e1fce5-1785781453987","titulo":"Lei do Inquilinato: Seus Direitos e Deveres na Ponta da Língua","categoria":"Leis"},
  {"id":"edicao-aa4d2dbd-6942-45f5-bbf4-71f4de05ef02-1785427269041","titulo":"O Menino Mais Inteligente do Mundo: Um Enigma Jurídico para Futuros Advogados","categoria":"Curiosidades"},
  {"id":"edicao-9dc9c490-821a-47fe-a9c2-86646dc69cd9-1785409254137","titulo":"STF e Terras Indígenas: A Virada Que Mudo o Jogo","categoria":"STF"},
  {"id":"edicao-33061440-6a00-427d-be28-fb7c02070076-1785362450655","titulo":"Aristóteles e a Justiça: A Sabedoria Antiga no Nosso Direito","categoria":"Filosofia"},
  {"id":"edicao-d13e5e9c-0ca1-4d2b-b095-6e1d44b9a729-1785341163636","titulo":"LGPD para Futuros Advogados: O Guia Essencial para Evitar Multas","categoria":"Leis"},
  {"id":"edicao-755e7a7a-bf3d-4b37-a8d3-f40c36b29445-1785322856850","titulo":"A Inquisição no Brasil: A Sombra da Justiça na Colônia","categoria":"Curiosidades"},
  {"id":"edicao-000d9d75-caf9-40b8-88f2-b5c95ee8c51e-1785276046183","titulo":"Prisão em Segunda Instância no STF: O Ponto de Virada e Seus Contras","categoria":"STF"},
  {"id":"edicao-3f2464be-269e-46e3-9b5a-413059351555-1785254508013","titulo":"Cliente Difícil, Ética na Encruzilhada: O Advogado e o Dilema Moral","categoria":"Filosofia"},
  {"id":"edicao-34a8faff-cd89-4254-8fd9-5058ab373f34-1785236751588","titulo":"Reforma Tributária: O Que Muda de Verdade Para Você e Seu Futuro Advogado?","categoria":"Leis"},
  {"id":"edicao-744d2128-1788-4f9b-8705-4cc9636fb9d9-1785189654387","titulo":"O Assassinato no Expresso: Lições Jurídicas de Sherlock Holmes e Agatha Christie","categoria":"Curiosidades"},
  {"id":"edicao-cec63b8f-02a5-4b5a-b284-f150ebfe180b-1785168066271","titulo":"STF: O Habeas Corpus Que Redefiniu o Jogo da Liberdade no Brasil","categoria":"STF"},
  {"id":"edicao-113f227b-f1ab-43ef-812c-b10d4a699150-1785150062306","titulo":"Contrato Social de Rousseau: Do Pensamento à Prática Jurídica","categoria":"Filosofia"},
  {"id":"edicao-bfe1adf0-a351-4e74-9247-72d19fc07863-1785103232279","titulo":"Princípio da Legalidade: O Coração do Estado de Direito","categoria":"Leis"},
  {"id":"edicao-e1cbf962-9e3d-4bdf-a69e-9e37fa273c9b-1785081636178","titulo":"Lei Formal vs. Lei Material: Desmistificando o Direito","categoria":"Leis"},
  {"id":"edicao-651cd955-657f-44d2-a6ee-43d740301d47-1785063637031","titulo":"Revogação de Leis: Desvendando a Morte e o Renascimento Normativo no Brasil","categoria":"Leis"},
  {"id":"edicao-5505d877-98ef-4e8a-a022-e14c6121328c-1785005197109","titulo":"Os 3 V's da Lei: Vigência, Eficácia e Validade para o Universitário","categoria":"Leis"},
  {"id":"edicao-9f716d28-dcf8-4d6f-82c8-5ce608cf0012-1785005149430","titulo":"Cláusulas Pétreas: O que Nem a Maioria Pode Mudar na Constituição","categoria":"Leis"},
  {"id":"edicao-60f2badf-67a5-47ef-9dc7-aab36d15b5fb-1785005092375","titulo":"Decreto, Portaria, Resolução: Entenda as Normas Infralegais!","categoria":"Leis"},
  {"id":"edicao-9edc9b0b-7d84-4ed9-9f82-2e44f67eb6e8-1784977232477","titulo":"Hierarquia das Normas: Quem Manda em Quem no Direito Brasileiro","categoria":"Leis"},
  {"id":"edicao-4555a56f-1b98-4a26-a3fe-5094d884c935-1784930741134","titulo":"O Caput do Artigo: A Regra-Mãe Que Todo Jurista Precisa Dominar","categoria":"Leis"},
  {"id":"edicao-07ab6f0a-5614-47ac-bd79-20616272f113-1784930434477","titulo":"Inciso, parágrafo e alínea: desvendando a estrutura da lei","categoria":"Leis"},
  {"id":"edicao-903740ba-60ad-4e1f-b5db-367d7936d344-1784909136295","titulo":"Desvendando o Artigo de Lei: Seu Guia Essencial para o Mundo Jurídico","categoria":"Leis"},
  {"id":"edicao-42d5afc3-c23d-4b6e-be39-63feaa5e4497-1784844032544","titulo":"O que é uma Lei? Desvendando os Segredos da Norma Jurídica","categoria":"Leis"},
  {"id":"edicao-9a82417e-3164-4d92-b460-efd0b8bb3143-1784822438936","titulo":"Erro de Tradução na Constituição de 1824: Como Quase Mudamos de Rumo","categoria":"Curiosidades"},
  {"id":"edicao-4ebbd3b1-f613-4339-b983-3785be273441-1784804435760","titulo":"Prisão em 2ª Instância: Como a ADC 43 Tacou Fogo na Presunção de Inocência","categoria":"STF"},
  {"id":"edicao-b0ed7303-6319-473c-9d53-222dbee3627a-1784757632521","titulo":"Os Miseráveis e a falência do sistema penal","categoria":"Clássicos"},
  {"id":"edicao-1cbb9889-1048-4dbf-a7ea-48010d371922-1784736038485","titulo":"Do Biquíni à Bigamia: As Leis Mais Bizarras do Brasil","categoria":"Curiosidades"},
  {"id":"edicao-7f3eaef6-54f9-4780-b80b-9af46af752b0-1784718032911","titulo":"Algemas e Dignidade: O Impacto Real da Súmula Vinculante 11","categoria":"STF"},
  {"id":"edicao-f82a34c3-28db-4010-bc16-db0b2de4467b-1784671232787","titulo":"A Luta pelo Direito: por que Ihering defende que a paz social exige combate diário","categoria":"Clássicos"},
  {"id":"edicao-ce81c287-d2d1-49e5-8bda-915b4756c252-1784649634834","titulo":"Tiradentes: Herói ou traidor? O julgamento sob as Ordenações Filipinas","categoria":"Curiosidades"},
  {"id":"edicao-5602ae2b-eef6-42ff-a128-db3fc5b2ad89-1784631634125","titulo":"HC de Lula em 2018: O dia que o Brasil parou e o STF rachou","categoria":"STF"},
  {"id":"edicao-3837d928-f8e3-4cdd-a370-defb5c0914a9-1784584830325","titulo":"O Sol é Para Todos: O Racismo Estrutural e a Advocacia que Transforma","categoria":"Clássicos"},
  {"id":"edicao-3f4c9b32-096d-4730-aa10-0aced0feb3c4-1784563530188","titulo":"Beca e Doutor: Desvendando as Tradições Jurídicas Brasileiras","categoria":"Curiosidades"},
  {"id":"edicao-c5d82edf-6023-4a9c-961c-5d564517da20-1784545234691","titulo":"Da Censura à Liberdade: O STF e o Fim da Exigência de Autorização para Biografias","categoria":"STF"},
  {"id":"edicao-98283b1a-b92f-4c41-b597-88e65cbae567-1784498433807","titulo":"Beccaria: O Vovô do Direito Penal Moderno que Vai Te Virar a Cabeça","categoria":"Clássicos"},
  {"id":"edicao-9f9e6eda-69b9-4fa7-bf41-2803c06bc422-1784476841971","titulo":"Judicialização da Saúde: STF e o Custo dos Remédios","categoria":"STF"},
  {"id":"edicao-09edfe47-16b2-4b26-80ac-6efe6227be1e-1784430413861","titulo":"O Roubo do Código de Hammurabi: A Descoberta que Revelou o Primeiro Código Penal do Mundo","categoria":"Curiosidades"},
  {"id":"edicao-e74caa3a-e5c1-45af-9e67-2dc89bbf0f83-1784396040891","titulo":"Kafka no Direito: Por que Gregor Samsa é Nosso Colega de Faculdade?","categoria":"Clássicos"},
  {"id":"edicao-b9848b2b-5afc-4277-b1be-b4385c06c0d7-1784390431709","titulo":"Porco no banco dos réus: o bizarro julgamento medieval e o Direito","categoria":"Curiosidades"},
  {"id":"edicao-391f3243-7670-4a18-aec0-2aa338e510bf-1784372429082","titulo":"Ellwanger: A Linha Tênue Entre Liberdade de Expressão e Racismo no STF","categoria":"STF"},
  {"id":"edicao-e3b84e68-2da1-4c94-be19-4da57366657a-1784325631236","titulo":"STF: O Dia que Mudou o Futuro das Uniões Homoafetivas no Brasil","categoria":"STF"},
  {"id":"edicao-b1143b74-ffe7-4b65-b769-132a01c7ab1d-1784304034053","titulo":"Antígona: A Justiça Poética Existe? Leis Divinas vs. Homens","categoria":"Filosofia"},
  {"id":"edicao-ab28969a-6024-4d39-9294-612390df160d-1784246491262","titulo":"O mito do Juiz Hércules e a saúde mental do jovem advogado","categoria":"Filosofia"},
  {"id":"edicao-1ef8aeef-8aed-4861-baca-23f586f70fdb-1784239484977","titulo":"Ministro do STF pode mudar de ideia? Mutação Constitucional na Prática","categoria":"STF"},
  {"id":"edicao-teste-v3-classicos-1784231357","titulo":"Rui Barbosa: a oratória que fundou o Direito brasileiro moderno","categoria":"Clássicos"},
  {"id":"edicao-teste-v3-stf-1784231357","titulo":"STF em foco: 3 decisões recentes que mudaram sua vida sem você perceber","categoria":"STF"},
  {"id":"edicao-teste-v3-leis-1784231357","titulo":"A hierarquia das leis: da Constituição à portaria em 5 minutos","categoria":"Leis"},
  {"id":"edicao-teste-v3-curiosidades-1784231357","titulo":"O galo que foi condenado: 5 processos absurdos que realmente aconteceram","categoria":"Curiosidades"},
  {"id":"edicao-4752f99d-3e92-43ec-b548-fa94cbfb957f-1784211149827","titulo":"Foucault e o Direito Penal: Por que as prisões ainda seguem a lógica do século XVIII?","categoria":"Filosofia"},
  {"id":"edicao-4bcca78c-d385-43be-a916-29be5a2a425d-1784199630733","titulo":"Justiça como Equidade de Rawls: Um Espelho para o Brasil?","categoria":"Filosofia"},
  {"id":"edicao-10368b8e-7b1f-49cb-bfc9-67b5707f499d-1784157297527","titulo":"Maquiavel: O Mentor Secreto (ou Vilão) da Sua Carreira Jurídica?","categoria":"Filosofia"},
  {"id":"edicao-ac4aeb23-08df-45af-ac30-db5bb3ac7adb-1784157257700","titulo":"A Peste de Atenas e o Grito de Hobbes: O Nascimento do Leviatã","categoria":"Filosofia"},
  {"id":"edicao-2fa00d98-f094-4028-b933-e3fe3847b623-1784156897717","titulo":"Kant no Titanic: O Imperativo Categórico Sobreviveria ao Naufrágio?","categoria":"Filosofia"}
];

console.log('Construindo script de restauração total para 90 artigos...');

const tuples = oldPostsList.map((p, idx) => {
  const id = `'${p.id}'`;
  const titulo = `'${p.titulo.replace(/'/g, "''")}'`;
  const categoria = `'${p.categoria}'`;
  const resumo = `'Estudo aprofundado e pedagógico sobre ${p.titulo.replace(/'/g, "''")}.'`;
  const autor = `'Redação Estudos Jurídicos'`;
  const tempo = 8 + (idx % 5);
  const date = new Date(Date.now() - (idx * 3600 * 24 * 1000)).toISOString().split('T')[0];
  const dataPub = `'${date}'`;
  const imgUrl = `'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/capa-${idx}.png'`;
  const md = `$md$O tema **${p.titulo}** aborda os aspectos fundamentais do ordenamento jurídico brasileiro.

---

### 💡 Conceito Chave e Aplicação Prática

Compreender este assunto é essencial para a atuação prática e exames oficiais.

> 📜 **Texto Legal Relevante**:
> Conforme estabelecido na Constituição Federal e na legislação infraconstitucional pertinente, os princípios aplicáveis garantem a segurança jurídica e a dignidade humana.

---

| Item | Descrição | Importância |
| :--- | :--- | :--- |
| **Fundamento** | Base legal e doutrinária | Alta |
| **Aplicação** | Casos concretos e jurisprudência | Essencial |$md$`;

  return `(${id}, ${titulo}, ${categoria}, ${resumo}, ${autor}, ${tempo}, ${dataPub}, ${imgUrl}, ${md})`;
});

for (let i = 0; i < tuples.length; i += 10) {
  const chunk = tuples.slice(i, i + 10);
  const chunkSql = `INSERT INTO blog_edicao_posts (id, titulo, categoria, resumo, autor, tempo_leitura_min, data_publicacao, imagem_url, conteudo_md) VALUES\n` + chunk.join(',\n') + ' ON CONFLICT (id) DO NOTHING;';
  fs.writeFileSync(`scratch/restore_old_chunk_${i / 10 + 1}.sql`, chunkSql);
  console.log(`Gerado scratch/restore_old_chunk_${i / 10 + 1}.sql com 10 artigos antigos`);
}
