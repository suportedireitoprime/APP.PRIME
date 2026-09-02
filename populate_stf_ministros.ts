import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Configurações do Supabase
const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltam variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ministros = [
  // Vigentes
  { nome: "Roberto Barroso", nome_completo: "Luís Roberto Barroso", status: "vigente", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/barroso-avatar-2023.jpg", indicado_por: "Dilma Rousseff", data_indicacao: "2013-06-26", data_nascimento: "1958-03-11" },
  { nome: "Edson Fachin", nome_completo: "Luiz Edson Fachin", status: "vigente", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/fachin-avatar-2023.jpg", indicado_por: "Dilma Rousseff", data_indicacao: "2015-06-16", data_nascimento: "1958-02-08" },
  { nome: "Gilmar Mendes", nome_completo: "Gilmar Ferreira Mendes", status: "vigente", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/gilmar-avatar-2023.jpg", indicado_por: "Fernando Henrique Cardoso", data_indicacao: "2002-06-20", data_nascimento: "1955-12-30" },
  { nome: "Dias Toffoli", nome_completo: "José Antonio Dias Toffoli", status: "vigente", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/toffoli-avatar-2023.jpg", indicado_por: "Luiz Inácio Lula da Silva", data_indicacao: "2009-10-23", data_nascimento: "1967-11-15" },
  { nome: "Cármen Lúcia", nome_completo: "Cármen Lúcia Antunes Rocha", status: "vigente", genero: "F", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/carmen-avatar-2023.jpg", indicado_por: "Luiz Inácio Lula da Silva", data_indicacao: "2006-06-21", data_nascimento: "1954-04-19" },
  { nome: "Luiz Fux", nome_completo: "Luiz Fux", status: "vigente", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/fux-avatar-2023.jpg", indicado_por: "Dilma Rousseff", data_indicacao: "2011-03-03", data_nascimento: "1953-04-26" },
  { nome: "Alexandre de Moraes", nome_completo: "Alexandre de Moraes", status: "vigente", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/moraes-avatar-2023.jpg", indicado_por: "Michel Temer", data_indicacao: "2017-03-22", data_nascimento: "1968-12-13" },
  { nome: "Nunes Marques", nome_completo: "Kassio Nunes Marques", status: "vigente", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/nunesmarques-avatar-2023.jpg", indicado_por: "Jair Bolsonaro", data_indicacao: "2020-11-05", data_nascimento: "1972-05-16" },
  { nome: "André Mendonça", nome_completo: "André Luiz de Almeida Mendonça", status: "vigente", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/mendonca-avatar-2023.jpg", indicado_por: "Jair Bolsonaro", data_indicacao: "2021-12-16", data_nascimento: "1972-12-27" },
  { nome: "Cristiano Zanin", nome_completo: "Cristiano Zanin Martins", status: "vigente", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/zanin-avatar.jpg", indicado_por: "Luiz Inácio Lula da Silva", data_indicacao: "2023-08-03", data_nascimento: "1975-11-15" },
  { nome: "Flávio Dino", nome_completo: "Flávio Dino de Castro e Costa", status: "vigente", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/dino-avatar.jpg", indicado_por: "Luiz Inácio Lula da Silva", data_indicacao: "2024-02-22", data_nascimento: "1968-04-30" },
  // Aposentados notáveis
  { nome: "Rosa Weber", nome_completo: "Rosa Maria Pires Weber", status: "aposentado", genero: "F", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/rosa-avatar-2023.jpg", indicado_por: "Dilma Rousseff", data_indicacao: "2011-12-19", data_fim: "2023-09-30", data_nascimento: "1948-10-02" },
  { nome: "Ricardo Lewandowski", nome_completo: "Enrique Ricardo Lewandowski", status: "aposentado", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/lewandowski-avatar-2023.jpg", indicado_por: "Luiz Inácio Lula da Silva", data_indicacao: "2006-03-16", data_fim: "2023-04-11", data_nascimento: "1948-05-11" },
  { nome: "Marco Aurélio", nome_completo: "Marco Aurélio Mendes de Farias Mello", status: "aposentado", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/marco_aurelio_2.jpg", indicado_por: "Fernando Collor de Mello", data_indicacao: "1990-06-13", data_fim: "2021-07-12", data_nascimento: "1946-07-12" },
  { nome: "Celso de Mello", nome_completo: "José Celso de Mello Filho", status: "aposentado", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/celso_mello_2.jpg", indicado_por: "José Sarney", data_indicacao: "1989-08-17", data_fim: "2020-10-13", data_nascimento: "1945-11-01" },
  { nome: "Joaquim Barbosa", nome_completo: "Joaquim Benedito Barbosa Gomes", status: "aposentado", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/joaquim_barbosa_2.jpg", indicado_por: "Luiz Inácio Lula da Silva", data_indicacao: "2003-06-25", data_fim: "2014-07-31", data_nascimento: "1954-10-07" },
  { nome: "Ayres Britto", nome_completo: "Carlos Ayres Gomes de Brito", status: "aposentado", genero: "M", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/ayres_britto_2.jpg", indicado_por: "Luiz Inácio Lula da Silva", data_indicacao: "2003-06-25", data_fim: "2012-11-18", data_nascimento: "1942-11-18" },
  { nome: "Ellen Gracie", nome_completo: "Ellen Gracie Northfleet", status: "aposentado", genero: "F", foto_url: "https://portal.stf.jus.br/hotsites/ministros/img/ellen_gracie_2.jpg", indicado_por: "Fernando Henrique Cardoso", data_indicacao: "2000-12-14", data_fim: "2011-08-08", data_nascimento: "1948-02-16" },
  { nome: "Teori Zavascki", nome_completo: "Teori Albino Zavascki", status: "falecido", genero: "M", foto_url: "", indicado_por: "Dilma Rousseff", data_indicacao: "2012-11-29", data_fim: "2017-01-19", data_nascimento: "1948-08-15" }
];

async function populate() {
  console.log(`Inserindo ${ministros.length} ministros notáveis no Supabase...`);
  
  for (let i = 0; i < ministros.length; i += 50) {
    const chunk = ministros.slice(i, i + 50);
    const { data, error } = await supabase.from('stf_ministros').insert(chunk);
    if (error) {
      console.error("Erro inserindo lote:", error);
    } else {
      console.log(`Lote inserido com sucesso (${i + chunk.length})`);
    }
  }
  
  console.log("Processo concluído!");
}

populate();
