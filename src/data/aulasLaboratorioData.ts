import { AULAS_CONTEUDO_REAL } from './aulasConteudoRealData';
import { AulaItem } from './aulasInterativasCatalogoCompleto';
import { AulaData, SlideItem } from '@/types/aulaInterativa';

// Catálogo exclusivo do Laboratório de Inovação Visual
export const AULAS_LABORATORIO_CATALOGO: AulaItem[] = [
  {
    id: 'lab-penal-01-01',
    disciplinaId: 'penal',
    materiaId: 'penal-mat-01',
    numeroAula: 'AULA TESTE',
    titulo: 'Crimes Contra a Família (Laboratório de Layout)',
    descricao: 'Protótipo experimental de alta retenção visual: Slide 10 totalmente diagramado com Árvore de Decisão com Setas, Tabela Sinóptica do Artigo 235, Grid do Tripé e Card Jurisprudencial.',
    topicosQtd: 4,
    slug: 'lab-penal-01-01',
    etapas: 32,
    audioQtd: 32,
    imagensQtd: 32,
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/capa-3x4.webp',
    status: 'pronto',
    urlJsonR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/aula.json'
  }
];

// Conteúdo diagramado do Slide 10 (Sem dolo, sem crime: o erro de tipo)
const CORPO_SLIDE_10_LABORATORIO = `
<p class="lead">O elemento subjetivo da bigamia é o <b>dolo</b>: o agente precisa ter <b>consciência do impedimento</b>, saber que é casado e, mesmo assim, contrair o novo casamento. Sem essa consciência, a história muda de figura.</p>

<p>Quem casa de novo sem saber do impedimento incorre em <b class="term">erro de tipo</b>: uma falsa percepção em relação à realidade. A pessoa enxerga o mundo de um jeito, mas o mundo é de outro. E o erro de tipo <b>exclui o dolo</b>; sem dolo, <b>não há crime de bigamia</b>.</p>

<!-- 1. FLUXOGRAMA DE DECISÃO COM SETAS DIRECIONAIS -->
<div class="fluxo-container">
  <div class="fluxo-header">
    <span class="fluxo-tag">⚡ ÁRVORE DE DECISÃO JURÍDICA</span>
    <h4 class="fluxo-titulo">Conduta: Contrair Novo Matrimônio</h4>
  </div>

  <div class="fluxo-pergunta">
    <div class="fluxo-icon-box">⚖️</div>
    <div>
      <p class="fluxo-pergunta-label">ELEMENTO SUBJETIVO ESSENCIAL</p>
      <p class="fluxo-pergunta-txt">O agente possui consciência real do impedimento matrimonial anterior?</p>
    </div>
  </div>

  <div class="fluxo-setas-split">
    <div class="seta-lado seta-esq">
      <span class="seta-label sim">SIM · COM CONSCIÊNCIA</span>
      <span class="seta-glyph">↓</span>
    </div>
    <div class="seta-lado seta-dir">
      <span class="seta-label nao">NÃO · SEM CONSCIÊNCIA</span>
      <span class="seta-glyph">↓</span>
    </div>
  </div>

  <div class="fluxo-grid">
    <!-- Ramo 1: Dolo / Crime -->
    <div class="fluxo-card crime">
      <div class="fluxo-card-badge red">🎯 DOLO ATIVO</div>
      <h5 class="fluxo-card-title">Crime de Bigamia (Art. 235)</h5>
      <p class="fluxo-card-desc">Sabe que o casamento anterior é válido e ainda assim contrai nova união formal.</p>
      <div class="fluxo-card-footer red">
        <span>Sanção: <b>Reclusão de 2 a 6 anos</b></span>
      </div>
    </div>

    <!-- Ramo 2: Erro de Tipo / Fato Atípico -->
    <div class="fluxo-card atipico">
      <div class="fluxo-card-badge green">🛡️ ERRO DE TIPO (Art. 20, CP)</div>
      <h5 class="fluxo-card-title">Conduta Atípica (Sem Crime)</h5>
      <p class="fluxo-card-desc">Falsa percepção da realidade. Acreditava sinceramente que a união anterior já havia sido desfeita.</p>
      <div class="fluxo-card-footer green">
        <span>Efeito: <b>Exclui o Dolo</b> · Sem crime culposo</span>
      </div>
    </div>
  </div>
</div>

<!-- 2. CARD PENSE ASSIM (ANALOGIA VISUAL ILUMINADA) -->
<div class="card-insight">
  <div class="card-insight-header">
    <div class="card-insight-icon">💡</div>
    <div>
      <span class="card-insight-tag">PENSE ASSIM · ANALOGIA PRÁTICA</span>
      <h5 class="card-insight-title">A falha na leitura da realidade</h5>
    </div>
  </div>
  <p class="card-insight-text">
    É como <b>assinar um documento novo</b> confiando de boa-fé que o anterior foi cancelado, quando, na verdade, o cancelamento nunca aconteceu. A sua <b>intenção era agir certo</b>; o que falhou foi a sua leitura da realidade.<br>
    <span class="card-insight-destaque">O Direito Penal não pune quem foi induzido a erro pela própria percepção sensorial.</span>
  </p>
</div>

<!-- 3. TABELA SINÓPTICA COMPARATIVA DO ARTIGO 235 -->
<div class="tabela-sinoptica-wrap">
  <div class="tabela-header">
    <span class="tabela-tag">QUADRO SINÓPTICO COMPARATIVO</span>
    <h5 class="tabela-title">Regime das Penas e Sujeitos no Artigo 235 do Código Penal</h5>
  </div>
  <table class="tabela-sinoptica">
    <thead>
      <tr>
        <th>Sujeito Ativo</th>
        <th>Circunstância Subjetiva</th>
        <th>Enquadramento Legal</th>
        <th>Consequência Penal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><b>Pessoa Já Casada</b><br><span class="sub-txt">Autor Principal</span></td>
        <td>Consciência de vínculo matrimonial civil prévio</td>
        <td><span class="badge-art">Art. 235, Caput</span></td>
        <td><span class="badge-pena red">Reclusão, 2 a 6 anos</span></td>
      </tr>
      <tr>
        <td><b>Pessoa Solteira</b><br><span class="sub-txt">Partícipe Necessário</span></td>
        <td><b>Sabia</b> que o noivo(a) já era formalmente casado</td>
        <td><span class="badge-art">Art. 235, § 1º</span></td>
        <td><span class="badge-pena orange">Reclusão/detenção, 1 a 3 anos</span></td>
      </tr>
      <tr>
        <td><b>Pessoa Solteira</b><br><span class="sub-txt">Enganada / De Boa-fé</span></td>
        <td><b>Não sabia</b> do casamento prévio do companheiro</td>
        <td><span class="badge-art">Erro de Tipo (Art. 20)</span></td>
        <td><span class="badge-pena green">Vítima (Conduta impune)</span></td>
      </tr>
      <tr>
        <td><b>Sentença Civil</b><br><span class="sub-txt">Nulidade do 1º Casamento</span></td>
        <td>Primeiro matrimônio judicialmente declarado nulo</td>
        <td><span class="badge-art">Art. 235, § 2º</span></td>
        <td><span class="badge-pena blue">Crime Inexistente (Extinção)</span></td>
      </tr>
    </tbody>
  </table>
</div>

<!-- 4. GRID DO TRIPÉ DA BIGAMIA (3 PILARES DOURADOS) -->
<div class="bloco-tripe-section">
  <div class="tripe-header">
    <span class="tripe-tag">MÉTODO DE RETENÇÃO ACELERADA</span>
    <h4 class="tripe-title">O Tripé Indispensável da Bigamia</h4>
    <p class="tripe-sub">Com esses três pilares interligados você resolve qualquer questão ou caso prático:</p>
  </div>
  <div class="grid-tripe">
    <div class="card-tripe">
      <div class="tripe-num">1</div>
      <div class="tripe-icon">🏛️</div>
      <h5 class="tripe-card-title">Casamento Civil</h5>
      <p class="tripe-card-desc">A bigamia <b>mora no casamento civil formal</b>. União estável, namoro qualificado ou rito religioso sem registro não configuram o tipo penal.</p>
    </div>
    <div class="card-tripe">
      <div class="tripe-num">2</div>
      <div class="tripe-icon">🎯</div>
      <h5 class="tripe-card-title">Dolo Específico</h5>
      <p class="tripe-card-desc">Exige <b>consciência plena</b> do impedimento. Se houve falsa percepção fática escusável, o erro de tipo elimina a tipicidade subjetiva.</p>
    </div>
    <div class="card-tripe">
      <div class="tripe-num">3</div>
      <div class="tripe-icon">⚖️</div>
      <h5 class="tripe-card-title">Anulação Civil</h5>
      <p class="tripe-card-desc">Se a <b>sentença civil derruba</b> o primeiro matrimônio por nulidade, o crime é expressamente considerado inexistente pelo § 2º.</p>
    </div>
  </div>
</div>

<!-- 5. CARD DE CASO REAL / JULGADO DE TRIBUNAL -->
<div class="card-caso-real">
  <div class="caso-header">
    <div class="caso-badge-wrapper">
      <span class="caso-badge">⚖️ CASO REAL · JULGADO DE FAMÍLIA</span>
      <span class="caso-data">28 de Agosto de 2023</span>
    </div>
    <h5 class="caso-origem">2ª Vara de Família e Sucessões de Novo Hamburgo / RS</h5>
  </div>
  <div class="caso-body">
    <p>A Vara de Família reconheceu judicialmente uma <b>união estável poliamorosa entre um homem e duas mulheres</b> (três pessoas), revestida de publicidade, continuidade e afetividade, com o objetivo de constituir família e buscar a felicidade. Os dois autores que eram casados pediram o divórcio, para o imediato reconhecimento, por sentença, da relação entre os três.</p>
    <div class="caso-tese-box">
      <span class="tese-label">💡 APLICAÇÃO DIRETA AO DIREITO PENAL:</span>
      <p class="tese-text">O caso trata estritamente de <b>união estável</b>, e não de casamento civil formal. <b>União estável não gera bigamia</b>, confirmando a regra de que o Direito Penal tutela com sanção privativa de liberdade apenas o casamento civil solene.</p>
    </div>
  </div>
</div>

<!-- 6. CHECKLIST DE FECHAMENTO VISUAL -->
<div class="fimbloco-visual">
  <div class="fimbloco-head">
    <span class="fimbloco-icon">✓</span>
    <span class="fimbloco-label">NESTE BLOCO VOCÊ DOMINOU</span>
  </div>
  <div class="fimbloco-cards">
    <div class="fimbloco-item">
      <span class="fim-num">01</span>
      <div>
        <b>Bigamia (Art. 235, Caput):</b> Novo casamento de quem já é casado, com reclusão de 2 a 6 anos.
      </div>
    </div>
    <div class="fimbloco-item">
      <span class="fim-num">02</span>
      <div>
        <b>Partícipe Sabedor (§ 1º):</b> Quem, não sendo casado, casa com pessoa casada sabendo disso, responde de 1 a 3 anos.
      </div>
    </div>
    <div class="fimbloco-item">
      <span class="fim-num">03</span>
      <div>
        <b>Erro de Tipo e Anulação (§ 2º):</b> Anulado o primeiro casamento, o crime é inexistente; sem consciência, não há dolo nem crime.
      </div>
    </div>
  </div>
</div>
`;

// Carregador de dados da aula teste do laboratório
export function getAulaLaboratorioData(aulaId: string): AulaData | null {
  if (aulaId !== 'lab-penal-01-01') return null;

  const original = AULAS_CONTEUDO_REAL['penal-01-01'];
  if (!original || !original.slides) return null;

  // Clona os slides e injeta o layout revolucionário no Slide 10 (índice 9)
  const slidesComLayoutRefatorado: SlideItem[] = original.slides.map((s, idx) => {
    if (idx === 9) {
      return {
        ...s,
        corpo: CORPO_SLIDE_10_LABORATORIO
      };
    }
    return s;
  });

  return {
    ...original,
    aulaId: 'lab-penal-01-01',
    titulo: 'Crimes Contra a Família (Laboratório de Layout)',
    slides: slidesComLayoutRefatorado,
    audioBaseUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/assets/audio/s'
  };
}
