import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';

export function getAulaFallbackHtml(aula: AulaItem): string {
  const isPenal = aula.disciplinaId === 'penal';
  const isConst = aula.disciplinaId === 'constitucional';
  const isTrab = aula.disciplinaId === 'trabalho';
  const isAdm = aula.disciplinaId === 'administrativo';

  // Configurações cromáticas oficiais e luxuosas por disciplina
  let config = {
    nome: 'DIREITO PENAL',
    bg: '#120409',
    radial1: '#3a0f1c',
    radial2: '#2b0812',
    phone: '#1d0810',
    panel: '#2e1219',
    panel2: '#250d14',
    accent: '#e23e57',
    accentLight: '#ff8296',
    gold: '#d4af37',
    gold2: '#e9cd6d',
    ink: '#f8edef',
    muted: '#c9a7ad',
    line: 'rgba(226,62,87,.3)',
    progressGradient: 'linear-gradient(90deg, #8f1020, #e23e57, #ff8296)',
    nextGradient: 'linear-gradient(135deg, #c8102e, #8a081c)',
    nextColor: '#ffffff',
    playGradient: 'linear-gradient(135deg, #ff5e78, #c8102e)',
    playerBg: 'rgba(46,15,24,.75)',
    playerBorder: 'rgba(226,62,87,.35)'
  };

  if (isAdm) {
    config = {
      nome: 'DIREITO ADMINISTRATIVO',
      bg: '#140e02',
      radial1: '#3a2808',
      radial2: '#2b1d06',
      phone: '#1d1508',
      panel: '#2e2410',
      panel2: '#251a0a',
      accent: '#d9a00a',
      accentLight: '#ffe38a',
      gold: '#d4af37',
      gold2: '#e9cd6d',
      ink: '#fdf6e3',
      muted: '#c9b083',
      line: 'rgba(212,175,55,.3)',
      progressGradient: 'linear-gradient(90deg, #8f1020, #d9a00a, #ffe38a)',
      nextGradient: 'linear-gradient(135deg, #ffe38a, #d9a00a)',
      nextColor: '#140e02',
      playGradient: 'linear-gradient(135deg, #ffe38a, #d9a00a)',
      playerBg: 'rgba(46,36,16,.75)',
      playerBorder: 'rgba(217,160,10,.35)'
    };
  } else if (isConst) {
    config = {
      nome: 'DIREITO CONSTITUCIONAL',
      bg: '#05140b',
      radial1: '#0d3d20',
      radial2: '#082414',
      phone: '#081d11',
      panel: '#0d2e1b',
      panel2: '#082214',
      accent: '#22c55e',
      accentLight: '#4ade80',
      gold: '#10b981',
      gold2: '#6ee7b7',
      ink: '#ecfdf5',
      muted: '#a7f3d0',
      line: 'rgba(34,197,94,.3)',
      progressGradient: 'linear-gradient(90deg, #065f46, #22c55e, #4ade80)',
      nextGradient: 'linear-gradient(135deg, #4ade80, #16a34a)',
      nextColor: '#ffffff',
      playGradient: 'linear-gradient(135deg, #4ade80, #15803d)',
      playerBg: 'rgba(14,41,22,.75)',
      playerBorder: 'rgba(34,197,94,.35)'
    };
  } else if (isTrab) {
    config = {
      nome: 'DIREITO DO TRABALHO',
      bg: '#0f051a',
      radial1: '#3b1263',
      radial2: '#1f0736',
      phone: '#180929',
      panel: '#270e42',
      panel2: '#1c0a30',
      accent: '#a855f7',
      accentLight: '#c084fc',
      gold: '#9333ea',
      gold2: '#d8b4fe',
      ink: '#faf5ff',
      muted: '#e9d5ff',
      line: 'rgba(168,85,247,.3)',
      progressGradient: 'linear-gradient(90deg, #581c87, #a855f7, #c084fc)',
      nextGradient: 'linear-gradient(135deg, #c084fc, #7e22ce)',
      nextColor: '#ffffff',
      playGradient: 'linear-gradient(135deg, #c084fc, #9333ea)',
      playerBg: 'rgba(37,18,61,.75)',
      playerBorder: 'rgba(168,85,247,.35)'
    };
  }

  const safeTitulo = aula.titulo.replace(/"/g, '&quot;');
  const safeCapa = aula.capaUrl || '';

  const etapasJson = JSON.stringify([
    {
      etapa: 1,
      bloco: 'Bloco 1 de 5 · Fundamentos & Origens',
      tipo: 'Abertura & Visão Geral',
      titulo: `Fundamentos de ${safeTitulo}`,
      corpo: `
        <img class="coverimg" src="${safeCapa}" alt="${safeTitulo}" onerror="this.style.display='none'" />
        <p class="kicker">${config.nome} · ${aula.numeroAula}</p>
        <h2 class="covertitle">${safeTitulo}</h2>
        <div class="coverrule"></div>
        <div class="content-box">
          <h3>Visão Geral e Contextualização</h3>
          <p><span class="kara-sent on">Bem-vindo à aula interativa sobre ${safeTitulo}.</span> <span class="kara-sent">Esta aula foi concebida no método de fixação ativa em três atos para assegurar domínio completo do conteúdo exigido em provas e na prática profissional.</span></p>
          <p><span class="kara-sent">Neste primeiro bloco, analisamos a gênese do instituto, seus princípios vetores e como a doutrina clássica e contemporânea delimitam o tema.</span></p>
        </div>
      `,
      narracao: `Bem-vindo à aula interativa sobre ${safeTitulo}. Esta aula foi concebida no método de fixação ativa em três atos para assegurar domínio completo do conteúdo exigido em provas e na prática profissional. Neste primeiro bloco, analisamos a gênese do instituto, seus princípios vetores e como a doutrina clássica e contemporânea delimitam o tema.`
    },
    {
      etapa: 2,
      bloco: 'Bloco 2 de 5 · Aprofundamento Dogmático',
      tipo: 'Doutrina & Teoria Geral',
      titulo: 'Estrutura Dogmática e Requisitos Legais',
      corpo: `
        <img class="coverimg" src="${safeCapa}" alt="${safeTitulo}" onerror="this.style.display='none'" />
        <p class="kicker">Aprofundamento Dogmático</p>
        <h2 class="covertitle">Conceitos Estruturais e Aplicação</h2>
        <div class="coverrule"></div>
        <div class="content-box">
          <h3>Classificação e Elementos Tipificadores</h3>
          <p><span class="kara-sent on">A doutrina especializada estabelece que o instituto de ${safeTitulo} demanda observância estrita aos postulados da legalidade, proporcionalidade e segurança jurídica.</span> <span class="kara-sent">É fundamental diferenciar as vertentes subjetivas e objetivas deste conceito para evitar equívocos conceituais frequentes em bancas de alto nível.</span></p>
          <p><span class="kara-sent">Observe com atenção: os requisitos intrínsecos operam de modo cumulativo, vinculando a atuação do aplicador do Direito às balizas do ordenamento pátrio.</span></p>
        </div>
      `,
      narracao: `A doutrina especializada estabelece que o instituto de ${safeTitulo} demanda observância estrita aos postulados da legalidade, proporcionalidade e segurança jurídica. É fundamental diferenciar as vertentes subjetivas e objetivas deste conceito para evitar equívocos conceituais frequentes em bancas de alto nível. Observe com atenção: os requisitos intrínsecos operam de modo cumulativo, vinculando a atuação do aplicador do Direito às balizas do ordenamento pátrio.`
    },
    {
      etapa: 3,
      bloco: 'Bloco 3 de 5 · Jurisprudência & Tribunais Superiores',
      tipo: 'Precedentes & Entendimentos',
      titulo: 'Posicionamento do STF, STJ e TST',
      corpo: `
        <img class="coverimg" src="${safeCapa}" alt="${safeTitulo}" onerror="this.style.display='none'" />
        <p class="kicker">Jurisprudência Vinculante</p>
        <h2 class="covertitle">Precedentes e Teses Fixadas</h2>
        <div class="coverrule"></div>
        <div class="content-box">
          <h3>Controvérsias e Teses de Repercussão</h3>
          <p><span class="kara-sent on">A pacificação jurisprudencial sobre ${safeTitulo} sedimentou critérios determinantes que orientam os julgamentos em todo o país.</span> <span class="kara-sent">Os precedentes das Cortes Superiores consagram a primazia do interesse público e a salvaguarda dos direitos fundamentais envolvidos.</span></p>
          <p><span class="kara-sent">Fique atento aos julgados recentes: teses firmadas sob a sistemática de recursos repetitivos trazem diretrizes mandatórias indispensáveis para a resolução de casos complexos.</span></p>
        </div>
      `,
      narracao: `A pacificação jurisprudencial sobre ${safeTitulo} sedimentou critérios determinantes que orientam os julgamentos em todo o país. Os precedentes das Cortes Superiores consagram a primazia do interesse público e a salvaguarda dos direitos fundamentais envolvidos. Fique atento aos julgados recentes: teses firmadas sob a sistemática de recursos repetitivos trazem diretrizes mandatórias indispensáveis para a resolução de casos complexos.`
    },
    {
      etapa: 4,
      bloco: 'Bloco 4 de 5 · Síntese & Fixação Ativa',
      tipo: 'Mapa Mental & Memorização',
      titulo: 'Pontos Cardeais para Memorização',
      corpo: `
        <img class="coverimg" src="${safeCapa}" alt="${safeTitulo}" onerror="this.style.display='none'" />
        <p class="kicker">Síntese Estratégica</p>
        <h2 class="covertitle">Mapa Conceitual de ${safeTitulo}</h2>
        <div class="coverrule"></div>
        <div class="content-box">
          <h3>Principais Pontos de Fixação</h3>
          <p><span class="kara-sent on">1. <b>Fundamento Normativo:</b> base constitucional e legal indissociável.</span></p>
          <p><span class="kara-sent">2. <b>Critério Teórico:</b> distinção categórica entre conceitos conexos e institutos afins.</span></p>
          <p><span class="kara-sent">3. <b>Entendimento Pretoriano:</b> aplicação uniforme balizada pelas Cortes de vértice.</span></p>
          <p><span class="kara-sent">4. <b>Pegadinhas Recorrentes:</b> inversão de prazos, exceções e hipóteses de presunção legal.</span></p>
        </div>
      `,
      narracao: 'Primeiro: fundamento normativo indissociável. Segundo: critério teórico com distinção entre conceitos conexos. Terceiro: entendimento pretoriano das cortes de vértice. Quarto: atenção redobrada às pegadinhas de inversão de prazos e hipóteses de presunção legal.'
    },
    {
      etapa: 5,
      bloco: 'Bloco 5 de 5 · Questão Prática Comentada',
      tipo: 'Treinamento & Validação',
      titulo: 'Desafio de Fixação Imediata',
      corpo: `
        <img class="coverimg" src="${safeCapa}" alt="${safeTitulo}" onerror="this.style.display='none'" />
        <p class="kicker">Questão de Fixação</p>
        <h2 class="covertitle">Teste Seus Conhecimentos</h2>
        <div class="coverrule"></div>
        <div class="content-box">
          <h3>Caso Prático Comentado</h3>
          <p>Em relação à disciplina jurídica aplicável a <b>${safeTitulo}</b>, assinale a alternativa juridicamente correta conforme a doutrina majoritária e os precedentes dos Tribunais:</p>
          <div id="questoesBox" style="margin-top:14px;">
            <button class="opt-btn" onclick="responder(this, false)"><span class="opt-letter">A</span><span>A aplicação independe de previsão normativa expressa, operando de forma ilimitada por critério puramente discricionário.</span></button>
            <button class="opt-btn" onclick="responder(this, true)"><span class="opt-letter">B</span><span>Vincula-se aos princípios da legalidade e proporcionalidade, exigindo conformidade material e procedimental com o ordenamento.</span></button>
            <button class="opt-btn" onclick="responder(this, false)"><span class="opt-letter">C</span><span>Encontra-se superada pela jurisprudência contemporânea, que veda categoricamente a sua invocação judicial.</span></button>
            <button class="opt-btn" onclick="responder(this, false)"><span class="opt-letter">D</span><span>Opera exclusivamente no plano fático, sendo dispensável a análise de seus pressupostos dogmáticos.</span></button>
          </div>
          <div id="respostaFeedback" style="margin-top:12px; font-weight:700; font-size:14.5px; display:none;"></div>
        </div>
      `,
      narracao: `Em relação à disciplina jurídica aplicável a ${safeTitulo}, analise as alternativas e selecione a assertiva correta para consolidar seu aprendizado.`
    }
  ]);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="color-scheme" content="dark" />
  <title>${safeTitulo} · ${config.nome}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: ${config.bg};
      --phone: ${config.phone};
      --panel: ${config.panel};
      --panel2: ${config.panel2};
      --accent: ${config.accent};
      --accent-light: ${config.accentLight};
      --gold: ${config.gold};
      --gold2: ${config.gold2};
      --ink: ${config.ink};
      --muted: ${config.muted};
      --line: ${config.line};
      --progress-gradient: ${config.progressGradient};
      --next-gradient: ${config.nextGradient};
      --next-color: ${config.nextColor};
      --play-gradient: ${config.playGradient};
      --player-bg: ${config.playerBg};
      --player-border: ${config.playerBorder};
      color-scheme: dark;
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    
    html, body {
      margin: 0; padding: 0;
      font-family: "Source Sans 3", system-ui, -apple-system, sans-serif;
      background:
        radial-gradient(1100px 600px at 20% -10%, ${config.radial1} 0%, transparent 60%),
        radial-gradient(900px 500px at 100% 100%, ${config.radial2} 0%, transparent 55%),
        var(--bg);
      color: var(--ink);
      display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start;
      width: 100vw; height: 100vh; height: 100dvh; overflow: hidden;
      scrollbar-width: none; -ms-overflow-style: none;
    }
    body::-webkit-scrollbar, html::-webkit-scrollbar { display: none; width: 0; height: 0; }

    .stage {
      display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start;
      width: 100%; height: 100%; flex: 1 1 auto; min-height: 0;
    }

    .phone {
      position: relative; width: 100%; max-width: 100%; min-width: 0;
      flex: 1 1 auto; height: 100%; min-height: 0; background: transparent;
      display: flex; flex-direction: column; overflow: hidden;
    }

    /* Subheader idêntico às aulas oficiais */
    header {
      padding: 10px 16px 8px;
      border-bottom: 1px solid var(--line);
      background: rgba(18, 4, 9, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      flex: 0 0 auto; width: 100%; z-index: 30;
    }
    .header-inner { max-width: 860px; margin: 0 auto; width: 100%; }
    .top-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
    .top-left { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .subject { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--accent-light); }
    .dot { color: rgba(255,255,255,.3); font-size: 10px; }
    .etapa { font-size: 11.5px; font-weight: 700; color: var(--muted); }
    .etapa b { color: var(--ink); }
    .blockseal {
      font-size: 10px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase;
      padding: 2px 7px; border-radius: 99px; background: rgba(255,255,255,.07);
      border: 1px solid var(--line); color: var(--gold2); display: inline-block;
    }
    .track { height: 4px; border-radius: 99px; background: rgba(255,255,255,.1); overflow: hidden; }
    .fill { height: 100%; background: var(--progress-gradient); border-radius: 99px; transition: width .4s cubic-bezier(0.16, 1, 0.3, 1); }

    /* Área de leitura com rolagem suave e sem barra cinza */
    .scroll {
      flex: 1 1 auto !important; min-height: 0 !important;
      overflow-y: auto !important; overflow-x: hidden !important;
      padding: 18px 16px 28px; width: 100%; box-sizing: border-box !important;
      scrollbar-width: none; -ms-overflow-style: none; overscroll-behavior: contain;
    }
    .scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
    .scroll-inner { max-width: 760px; margin: 0 auto; width: 100%; }

    /* Capa com animação de zoom cinemático */
    @keyframes imageCinematicZoom {
      0% { transform: scale(1); }
      100% { transform: scale(1.055); }
    }
    .coverimg {
      width: 100% !important; min-height: 230px !important; max-height: 380px !important;
      aspect-ratio: 16/10 !important; object-fit: cover !important; object-position: center 35% !important;
      border-radius: 18px !important; border: 1px solid var(--line) !important;
      box-shadow: 0 20px 45px rgba(0,0,0,.65), 0 0 30px rgba(0,0,0,.4) !important;
      margin-bottom: 20px !important; display: block;
      animation: imageCinematicZoom 9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      will-change: transform;
    }

    .kicker { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: var(--accent-light); margin: 0 0 6px; }
    .covertitle { font-family: "Playfair Display", Georgia, serif; font-size: 26px; font-weight: 800; line-height: 1.25; margin: 0 0 14px; color: #fff; }
    .coverrule { width: 50px; height: 3px; background: var(--accent); border-radius: 2px; margin-bottom: 18px; }

    /* Caixas de conteúdo e estudo */
    .content-box {
      background: var(--panel); border: 1px solid var(--line);
      border-radius: 16px; padding: 20px; margin-bottom: 18px;
      box-shadow: 0 10px 25px rgba(0,0,0,.35);
    }
    .content-box h3 { font-family: "Playfair Display", Georgia, serif; font-size: 19px; font-weight: 700; color: #fff; margin: 0 0 12px; }
    .content-box p { font-size: 16px; line-height: 1.8; color: #e4d7db; margin: 0 0 14px; }
    .content-box p:last-child { margin-bottom: 0; }
    .term { color: var(--gold2); font-weight: 700; }
    b { color: #fff; }

    /* Karaokê universal interativo */
    .kara-sent {
      border-radius: 6px; padding: 2px 4px; margin: 0 1px; cursor: pointer; display: inline;
      transition: background 0.28s ease, color 0.28s ease, border 0.28s ease;
      border-bottom: 2px solid transparent;
    }
    .kara-sent.on {
      background: rgba(255, 255, 255, 0.18) !important;
      color: #ffffff !important;
      text-shadow: 0 0 10px var(--accent-light) !important;
      border-bottom: 2px solid var(--accent-light) !important;
      font-weight: 600 !important;
    }

    /* Questão interativa */
    .opt-btn {
      width: 100%; text-align: left; padding: 12px 14px; margin-bottom: 8px; border-radius: 12px;
      background: var(--panel2); border: 1px solid rgba(255,255,255,.1); color: var(--ink);
      font-size: 14.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 10px;
      transition: all .2s ease;
    }
    .opt-btn:hover { background: rgba(255,255,255,.1); border-color: var(--accent-light); }
    .opt-btn.correct { background: rgba(62,207,122,.2) !important; border-color: #3ecf7a !important; color: #fff; }
    .opt-btn.wrong { background: rgba(255,122,122,.2) !important; border-color: #ff7a7a !important; color: #fff; }
    .opt-letter {
      width: 26px; height: 26px; border-radius: 8px; background: rgba(255,255,255,.12);
      display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #fff;
    }

    /* Rodapé idêntico ao oficial com player central */
    footer {
      padding: 10px 14px calc(14px + env(safe-area-inset-bottom, 16px));
      border-top: 1px solid var(--line);
      background: rgba(18, 4, 9, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      flex: 0 0 auto; width: 100%; z-index: 30;
    }
    .footer-bar {
      max-width: 860px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%;
    }
    .navbtn {
      flex: 0 0 auto; min-width: 90px; font-size: 13px; font-weight: 700;
      padding: 10px 14px; border-radius: 12px; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); color: var(--ink);
      transition: all .15s ease;
    }
    .navbtn:disabled { opacity: 0.35; cursor: not-allowed; }
    .navbtn:not(:disabled):hover { background: rgba(255,255,255,.12); }
    .navbtn:not(:disabled):active { transform: scale(0.96); }
    .navbtn.next {
      background: var(--next-gradient); border: 1px solid rgba(255,255,255,.2); color: var(--next-color);
      box-shadow: 0 4px 14px rgba(0,0,0,.5);
    }
    .navbtn-svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

    /* Player Central no rodapé */
    .footer-player {
      flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 10px;
      background: var(--player-bg); border: 1px solid var(--player-border);
      border-radius: 12px; padding: 6px 12px; cursor: pointer; transition: background .2s ease;
    }
    .footer-player:hover { background: rgba(255,255,255,.08); }
    .playbtn {
      flex: 0 0 32px; width: 32px; height: 32px; border-radius: 50%;
      background: var(--play-gradient); border: 1px solid rgba(255,255,255,.3);
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,.4); transition: transform .15s ease;
    }
    .playbtn:hover { transform: scale(1.08); }
    .playbtn:active { transform: scale(0.92); }
    .playbtn svg { width: 13px; height: 13px; fill: #fff; }
    .footer-player-body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .footer-player-labels { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
    .alabel { color: var(--accent-light); font-size: 9.5px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; }
    .atime { color: var(--muted); font-size: 10.5px; font-variant-numeric: tabular-nums; font-weight: 600; }
    .atrack { height: 4px; border-radius: 99px; background: rgba(255,255,255,.1); overflow: hidden; width: 100%; position: relative; }
    .afill { height: 100%; background: var(--accent-light); border-radius: 99px; width: 0%; transition: width .2s linear; }
  </style>
</head>
<body>
  <div class="stage">
    <div class="phone" id="phone">
      <header>
        <div class="header-inner">
          <div class="top-row">
            <div class="top-left">
              <span class="subject">${config.nome}</span>
              <span class="dot">•</span>
              <span class="etapa" id="etapaLabel">Etapa 1 de 5</span>
              <span class="blockseal" id="blockSeal">Bloco 1 de 5</span>
            </div>
          </div>
          <div class="track"><div class="fill" id="progressFill" style="width:20%"></div></div>
        </div>
      </header>

      <div class="scroll" id="scrollArea" tabindex="0">
        <div class="scroll-inner" id="slideContent">
          <!-- Conteúdo gerado dinamicamente -->
        </div>
      </div>

      <footer>
        <div class="footer-bar">
          <button class="navbtn prev" id="btnPrev" type="button" disabled>
            <svg viewBox="0 0 24 24" class="navbtn-svg" aria-hidden="true"><path d="M15 19l-7-7 7-7"/></svg>
            <span>Anterior</span>
          </button>

          <!-- Player Centralizado no Rodapé -->
          <div class="footer-player" id="audioBox" title="Ouvir a narração interativa">
            <button class="playbtn" id="playBtn" type="button" aria-label="Ouvir narração">
              <svg viewBox="0 0 24 24" aria-hidden="true" id="playIcon"><path d="M7 4.5v15l13-7.5z"/></svg>
            </button>
            <div class="footer-player-body">
              <div class="footer-player-labels">
                <span class="alabel">NARRAÇÃO INTERATIVA</span>
                <span class="atime" id="aTime">0:00 / 0:45</span>
              </div>
              <div class="atrack"><div class="afill" id="aFill"></div></div>
            </div>
          </div>

          <button class="navbtn next" id="btnNext" type="button">
            <span id="btnNextText">Próximo</span>
            <svg viewBox="0 0 24 24" class="navbtn-svg" id="btnNextIcon" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </footer>
    </div>
  </div>

  <script>
    var ETAPAS = ${etapasJson};
    var idxAtual = 0;
    var totalEtapas = ETAPAS.length;
    var synth = window.speechSynthesis;
    var utterThis = null;
    var isPlaying = false;
    var intervalTimer = null;
    var elapsedSec = 0;

    var etapaLabel = document.getElementById("etapaLabel");
    var blockSeal = document.getElementById("blockSeal");
    var progressFill = document.getElementById("progressFill");
    var slideContent = document.getElementById("slideContent");
    var scrollArea = document.getElementById("scrollArea");
    var btnPrev = document.getElementById("btnPrev");
    var btnNext = document.getElementById("btnNext");
    var btnNextText = document.getElementById("btnNextText");
    var playBtn = document.getElementById("playBtn");
    var playIcon = document.getElementById("playIcon");
    var aTime = document.getElementById("aTime");
    var aFill = document.getElementById("aFill");

    function renderEtapa(i) {
      idxAtual = Math.max(0, Math.min(totalEtapas - 1, i));
      var s = ETAPAS[idxAtual];

      etapaLabel.innerHTML = "Etapa <b>" + (idxAtual + 1) + " de " + totalEtapas + "</b>";
      blockSeal.textContent = s.bloco;
      progressFill.style.width = (((idxAtual + 1) / totalEtapas) * 100) + "%";

      slideContent.innerHTML = s.corpo;
      scrollArea.scrollTop = 0;

      btnPrev.disabled = idxAtual === 0;
      if (idxAtual === totalEtapas - 1) {
        btnNextText.textContent = "✓ Concluir Aula";
      } else {
        btnNextText.textContent = "Próximo";
      }

      stopAudio();

      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: "AULA_INTERATIVA_PROGRESSO",
            etapaAtual: idxAtual + 1,
            totalEtapas: totalEtapas,
            aulaId: "${aula.id}"
          }, "*");
        }
      } catch (err) {}
    }

    function responder(btn, correto) {
      var box = document.getElementById("questoesBox");
      var btns = box.querySelectorAll(".opt-btn");
      btns.forEach(function(b) { b.disabled = true; });

      var fb = document.getElementById("respostaFeedback");
      if (correto) {
        btn.classList.add("correct");
        fb.style.display = "block";
        fb.style.color = "#3ecf7a";
        fb.innerHTML = "🎉 Parabéns! Alternativa B correta. A conformidade aos princípios da legalidade e proporcionalidade é indispensável.";
      } else {
        btn.classList.add("wrong");
        btns[1].classList.add("correct");
        fb.style.display = "block";
        fb.style.color = "#ff7a7a";
        fb.innerHTML = "⚠️ A alternativa correta é a B. O instituto vincula-se formal e materialmente às balizas constitucionais e legais.";
      }
    }

    function stopAudio() {
      if (synth) { synth.cancel(); }
      clearInterval(intervalTimer);
      isPlaying = false;
      elapsedSec = 0;
      playIcon.innerHTML = '<path d="M7 4.5v15l13-7.5z"/>';
      aFill.style.width = "0%";
      aTime.textContent = "0:00 / 0:45";
    }

    function toggleAudio() {
      if (isPlaying) {
        stopAudio();
        return;
      }
      var s = ETAPAS[idxAtual];
      if (!s || !s.narracao) return;

      if (!synth) {
        alert("Áudio sintetizado não suportado neste navegador.");
        return;
      }

      utterThis = new SpeechSynthesisUtterance(s.narracao);
      utterThis.lang = 'pt-BR';
      utterThis.rate = 1.05;
      utterThis.pitch = 1.0;

      var totalDurSec = Math.max(12, Math.round(s.narracao.length / 14));

      utterThis.onstart = function() {
        isPlaying = true;
        playIcon.innerHTML = '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>';
        elapsedSec = 0;
        intervalTimer = setInterval(function() {
          elapsedSec++;
          var pct = Math.min(100, Math.round((elapsedSec / totalDurSec) * 100));
          aFill.style.width = pct + "%";
          var m = Math.floor(elapsedSec / 60);
          var sc = elapsedSec % 60;
          aTime.textContent = m + ":" + (sc < 10 ? "0" + sc : sc) + " / " + Math.floor(totalDurSec / 60) + ":" + (totalDurSec % 60 < 10 ? "0" + (totalDurSec % 60) : totalDurSec % 60);

          var spans = slideContent.querySelectorAll(".kara-sent");
          if (spans.length > 0) {
            var curFraseIdx = Math.min(spans.length - 1, Math.floor((elapsedSec / totalDurSec) * spans.length));
            spans.forEach(function(sp, si) {
              sp.classList.toggle("on", si === curFraseIdx);
            });
          }

          if (elapsedSec >= totalDurSec) {
            stopAudio();
          }
        }, 1000);
      };

      utterThis.onend = function() { stopAudio(); };
      utterThis.onerror = function() { stopAudio(); };

      synth.speak(utterThis);
    }

    btnPrev.addEventListener("click", function() {
      if (idxAtual > 0) renderEtapa(idxAtual - 1);
    });

    btnNext.addEventListener("click", function() {
      if (idxAtual < totalEtapas - 1) {
        renderEtapa(idxAtual + 1);
      } else {
        alert("🎉 Parabéns! Você concluiu com excelência esta lição. Os Flashcards e Questões foram destravados!");
      }
    });

    playBtn.addEventListener("click", function(ev) {
      ev.stopPropagation();
      toggleAudio();
    });

    document.getElementById("audioBox").addEventListener("click", function() {
      toggleAudio();
    });

    renderEtapa(0);
  </script>
</body>
</html>`;
}
