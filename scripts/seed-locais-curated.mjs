import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SEED_LOCAIS = [
  // DELEGACIAS
  { categoria: 'delegacias', nome: '1ª Delegacia de Polícia - Centro', endereco: 'Rua Castro Alves, 60 - Liberdade', cidade: 'São Paulo', uf: 'SP', lat: -23.5615, lng: -46.6385, telefone: '(11) 3208-4111', fonte: 'curated' },
  { categoria: 'delegacias', nome: 'Delegacia de Defesa da Mulher (1ª DDM)', endereco: 'Rua Bittencourt da Silva, 140 - Bela Vista', cidade: 'São Paulo', uf: 'SP', lat: -23.5512, lng: -46.6381, telefone: '(11) 3242-4290', fonte: 'curated' },
  { categoria: 'delegacias', nome: 'Superintendência Regional da Polícia Federal em SP', endereco: 'Rua Hugo D\'Antola, 95 - Lapa de Baixo', cidade: 'São Paulo', uf: 'SP', lat: -23.5185, lng: -46.6853, telefone: '(11) 3538-5000', fonte: 'curated' },
  { categoria: 'delegacias', nome: '1ª DP - Praça Mauá', endereco: 'Praça Mauá, 5 - Centro', cidade: 'Rio de Janeiro', uf: 'RJ', lat: -22.8961, lng: -43.1814, telefone: '(21) 2332-6831', fonte: 'curated' },
  { categoria: 'delegacias', nome: 'DEAM - Delegacia de Atendimento à Mulher Centro', endereco: 'Rua Visconde do Rio Branco, 12 - Centro', cidade: 'Rio de Janeiro', uf: 'RJ', lat: -22.9083, lng: -43.1842, telefone: '(21) 2332-9994', fonte: 'curated' },
  { categoria: 'delegacias', nome: '1ª Delegacia de Polícia Civil - Centro-Sul', endereco: 'Rua Carangola, 54 - Santo Antônio', cidade: 'Belo Horizonte', uf: 'MG', lat: -19.9372, lng: -43.9412, telefone: '(31) 3253-2700', fonte: 'curated' },
  { categoria: 'delegacias', nome: 'Superintendência Regional da Polícia Federal no DF', endereco: 'SAUS Quadra 6 Lote 1 - Asa Sul', cidade: 'Brasília', uf: 'DF', lat: -15.7981, lng: -47.8825, telefone: '(61) 2024-8000', fonte: 'curated' },
  { categoria: 'delegacias', nome: 'Delegacia Especial de Atendimento à Mulher (DEAM I)', endereco: 'EQS 204/205 - Asa Sul', cidade: 'Brasília', uf: 'DF', lat: -15.8085, lng: -47.8925, telefone: '(61) 3207-6172', fonte: 'curated' },
  { categoria: 'delegacias', nome: '1ª Delegacia de Polícia de Porto Alegre', endereco: 'Rua Professor Annes Dias, 295 - Centro Histórico', cidade: 'Porto Alegre', uf: 'RS', lat: -30.0321, lng: -51.2254, telefone: '(51) 3288-2100', fonte: 'curated' },
  { categoria: 'delegacias', nome: '1ª Delegacia de Polícia Civil de Curitiba', endereco: 'Rua Pedro Ivo, 155 - Centro', cidade: 'Curitiba', uf: 'PR', lat: -25.4332, lng: -49.2691, telefone: '(41) 3326-3400', fonte: 'curated' },

  // OAB
  { categoria: 'oab', nome: 'OAB SP - Conselho Secional de São Paulo', endereco: 'Rua Maria Paula, 35 - Bela Vista', cidade: 'São Paulo', uf: 'SP', lat: -23.5532, lng: -46.6391, telefone: '(11) 3291-8100', site: 'https://www.oabsp.org.br', fonte: 'curated' },
  { categoria: 'oab', nome: 'OAB RJ - Secional do Rio de Janeiro', endereco: 'Avenida Marechal Câmara, 150 - Centro', cidade: 'Rio de Janeiro', uf: 'RJ', lat: -22.9095, lng: -43.1706, telefone: '(21) 2730-6525', site: 'https://www.oabrj.org.br', fonte: 'curated' },
  { categoria: 'oab', nome: 'OAB MG - Secional de Minas Gerais', endereco: 'Rua Albita, 250 - Cruzeiro', cidade: 'Belo Horizonte', uf: 'MG', lat: -19.9431, lng: -43.9261, telefone: '(31) 2102-5800', site: 'https://www.oabmg.org.br', fonte: 'curated' },
  { categoria: 'oab', nome: 'Conselho Federal da OAB (CFOAB)', endereco: 'SAUS Quadra 5 Lote 1 Bloco M - Asa Sul', cidade: 'Brasília', uf: 'DF', lat: -15.7994, lng: -47.8839, telefone: '(61) 2193-9600', site: 'https://www.oab.org.br', fonte: 'curated' },
  { categoria: 'oab', nome: 'OAB RS - Secional do Rio Grande do Sul', endereco: 'Rua Washington Luiz, 1110 - Centro Histórico', cidade: 'Porto Alegre', uf: 'RS', lat: -30.0356, lng: -51.2289, telefone: '(51) 3287-1800', site: 'https://www.oabrs.org.br', fonte: 'curated' },
  { categoria: 'oab', nome: 'OAB PR - Secional do Paraná', endereco: 'Rua Brasilino Moura, 253 - Ahú', cidade: 'Curitiba', uf: 'PR', lat: -25.4091, lng: -49.2663, telefone: '(41) 3250-5700', site: 'https://www.oabpr.org.br', fonte: 'curated' },
  { categoria: 'oab', nome: 'OAB BA - Secional da Bahia', endereco: 'Rua Portão da Piedade, 16 - Piedade', cidade: 'Salvador', uf: 'BA', lat: -12.9812, lng: -38.5134, telefone: '(71) 3329-8900', site: 'https://www.oab-ba.org.br', fonte: 'curated' },
  { categoria: 'oab', nome: 'OAB PE - Secional de Pernambuco', endereco: 'Rua Imperador Dom Pedro II, 346 - Santo Antônio', cidade: 'Recife', uf: 'PE', lat: -8.0631, lng: -34.8775, telefone: '(81) 3424-1012', site: 'https://www.oabpe.org.br', fonte: 'curated' },

  // DEFENSORIA PÚBLICA
  { categoria: 'defensoria', nome: 'Defensoria Pública do Estado de SP - Sede Boa Vista', endereco: 'Avenida Liberdade, 32 - Liberdade', cidade: 'São Paulo', uf: 'SP', lat: -23.5539, lng: -46.6338, telefone: '(11) 3105-0100', site: 'https://www.defensoria.sp.def.br', fonte: 'curated' },
  { categoria: 'defensoria', nome: 'Defensoria Pública da União em SP (DPU SP)', endereco: 'Rua São Bento, 380 - Centro', cidade: 'São Paulo', uf: 'SP', lat: -23.5468, lng: -46.6345, telefone: '(11) 3313-4000', site: 'https://www.dpu.def.br', fonte: 'curated' },
  { categoria: 'defensoria', nome: 'Defensoria Pública do Estado do Rio de Janeiro (DPERJ)', endereco: 'Avenida Marechal Câmara, 314 - Centro', cidade: 'Rio de Janeiro', uf: 'RJ', lat: -22.9108, lng: -43.1702, telefone: '(21) 2332-6224', site: 'https://www.defensoria.rj.def.br', fonte: 'curated' },
  { categoria: 'defensoria', nome: 'Defensoria Pública do Estado de Minas Gerais (DPMG)', endereco: 'Rua dos Guajajaras, 1707 - Barro Preto', cidade: 'Belo Horizonte', uf: 'MG', lat: -19.9238, lng: -43.9482, telefone: '(31) 3304-2000', site: 'https://www.defensoria.mg.def.br', fonte: 'curated' },
  { categoria: 'defensoria', nome: 'Defensoria Pública do Distrito Federal (DPDF)', endereco: 'SGAN 909 Lote C Bloco B - Asa Norte', cidade: 'Brasília', uf: 'DF', lat: -15.7584, lng: -47.8891, telefone: '(61) 2196-4300', site: 'https://www.defensoria.df.gov.br', fonte: 'curated' },
  { categoria: 'defensoria', nome: 'Defensoria Pública do Estado do RS (DPERGS)', endereco: 'Rua Sete de Setembro, 666 - Centro Histórico', cidade: 'Porto Alegre', uf: 'RS', lat: -30.0298, lng: -51.2274, telefone: '(51) 3210-9300', site: 'https://www.defensoria.rs.def.br', fonte: 'curated' },

  // MINISTÉRIO PÚBLICO
  { categoria: 'ministerio_publico', nome: 'Procuradoria Geral de Justiça de SP (MPSP)', endereco: 'Rua Riachuelo, 115 - Sé', cidade: 'São Paulo', uf: 'SP', lat: -23.5501, lng: -46.6361, telefone: '(11) 3119-9000', site: 'https://www.mpsp.mp.br', fonte: 'curated' },
  { categoria: 'ministerio_publico', nome: 'Procuradoria Geral da República (PGR)', endereco: 'SAF Sul Quadra 4 Conjunto C - Asa Sul', cidade: 'Brasília', uf: 'DF', lat: -15.8089, lng: -47.8682, telefone: '(61) 3105-5100', site: 'https://www.mpf.mp.br', fonte: 'curated' },
  { categoria: 'ministerio_publico', nome: 'Procuradoria Geral de Justiça do RJ (MPRJ)', endereco: 'Praça Dom Luís de Castro Nunes, s/n - Centro', cidade: 'Rio de Janeiro', uf: 'RJ', lat: -22.9098, lng: -43.1701, telefone: '(21) 2550-9000', site: 'https://www.mprj.mp.br', fonte: 'curated' },
  { categoria: 'ministerio_publico', nome: 'Procuradoria Geral de Justiça de MG (MPMG)', endereco: 'Avenida Álvares Cabral, 1690 - Santo Agostinho', cidade: 'Belo Horizonte', uf: 'MG', lat: -19.9328, lng: -43.9471, telefone: '(31) 3337-1100', site: 'https://www.mpmg.mp.br', fonte: 'curated' },
  { categoria: 'ministerio_publico', nome: 'Procuradoria Geral de Justiça do RS (MPRS)', endereco: 'Avenida Aurélio Reis, 173 - Passo d\'Areia', cidade: 'Porto Alegre', uf: 'RS', lat: -30.0152, lng: -51.1712, telefone: '(51) 3295-1100', site: 'https://www.mprs.mp.br', fonte: 'curated' },
  { categoria: 'ministerio_publico', nome: 'Procuradoria Geral de Justiça do PR (MPPR)', endereco: 'Marechal Hermes, 751 - Centro Cívico', cidade: 'Curitiba', uf: 'PR', lat: -25.4168, lng: -49.2685, telefone: '(41) 3250-4000', site: 'https://mppr.mp.br', fonte: 'curated' },
];

async function seed() {
  console.log('Inserting seed items for missing categories...');
  const rows = SEED_LOCAIS.map(l => ({
    ...l,
    osm_id: `seed_${l.categoria}_${l.uf}_${l.cidade.replace(/\s+/g, '')}_${Math.random().toString(36).substring(7)}`,
  }));

  const { data, error } = await supabase.from('locais_juridicos').insert(rows).select('id, categoria');
  if (error) {
    console.error('Error seeding:', error);
  } else {
    console.log(`Successfully inserted ${data.length} locations across all 4 missing categories!`);
  }
}

seed();
