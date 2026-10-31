const fs = require('fs');

// Ler o html base
let html = fs.readFileSync('scratch/aula01_standalone_r2.html', 'utf8');

// 1. Substituir o bloco body com o player no rodapé centralizado entre os botões Anterior e Próximo
const oldBodyPattern = /<body>[\s\S]*?<script>/;

const newBody = `<body>
    <div class="phone" id="phone">
      <header>
        <div class="header-inner">
          <div class="top-row">
            <div class="top-left">
              <span class="subject">DIREITO PENAL</span>
              <span class="dot">•</span>
              <span class="etapa" id="etapaLabel">Etapa 1 de 32</span>
              <div class="sealrow" style="margin:0;display:inline-block"><span class="blockseal" id="blockSeal">Bloco 1 de 3</span></div>
            </div>
            <h1 id="aulaTitulo">Crimes Contra a Família</h1>
          </div>
          <div class="track"><div class="fill" id="progressFill" style="width:3.13%"></div></div>
        </div>
      </header>

      <div class="scroll" id="scrollArea" tabindex="0"></div>

      <footer>
        <div class="footer-bar">
          <button class="navbtn prev" id="btnPrev" type="button">
            <svg viewBox="0 0 24 24" class="navbtn-svg" aria-hidden="true"><path d="M15 19l-7-7 7-7"/></svg>
            <span>Anterior</span>
          </button>

          <!-- Player Centralizado no Rodapé -->
          <div class="footer-player audio" id="audioBox" title="Ouvir a narração desta etapa">
            <button class="playbtn" id="playBtn" type="button" aria-label="Ouvir ou pausar a narração">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>
            </button>
            <div class="footer-player-body">
              <div class="footer-player-labels arow">
                <span class="alabel">NARRAÇÃO</span>
                <span class="atime" id="aTime">0:00 / 0:00</span>
              </div>
              <div class="atrack" id="aTrack"><div class="afill" id="aFill"></div></div>
            </div>
          </div>

          <button class="navbtn next" id="btnNext" type="button">
            <span>Próximo</span>
            <svg viewBox="0 0 24 24" class="navbtn-svg" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </footer>
    </div>

    <script>`;

html = html.replace(oldBodyPattern, newBody);

// 2. Substituir o CSS garantindo:
// - Sem barra de rolagem (hidden scrollbars)
// - Player no rodapé centralizado
// - 100% tela cheia
const cssHeaderRegex = /body\s*\{[\s\S]*?\.banner\s*\{/;

const newCSSHeader = `body{
        margin:0;
        font-family:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif;
        background:
          radial-gradient(1100px 600px at 20% -10%, #3a0f1c 0%, transparent 60%),
          radial-gradient(900px 500px at 100% 100%, #2b0812 0%, transparent 55%),
          var(--bg);
        color:var(--ink);
        display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;
        padding:0;
        width:100vw;
        height:100vh;
        height:100dvh;
        overflow:hidden;
        scrollbar-width:none;
        -ms-overflow-style:none;
      }
      body::-webkit-scrollbar, html::-webkit-scrollbar{
        display:none;width:0;height:0;
      }
      .phone{
        position:relative;
        width:100%;max-width:100%;min-width:0;
        flex:1 1 auto;height:100%;min-height:0;
        background:transparent;
        display:flex;flex-direction:column;
        overflow:hidden;
        border-radius:0;border:none;box-shadow:none;
      }
      header{
        padding:10px 16px 8px;
        border-bottom:1px solid rgba(226,62,87,.25);
        background:rgba(18,4,9,.94);
        backdrop-filter:blur(16px);
        -webkit-backdrop-filter:blur(16px);
        flex:0 0 auto;
        width:100%;
        z-index:30;
      }
      .header-inner{
        max-width:860px;
        margin:0 auto;
        width:100%;
        display:flex;flex-direction:column;gap:5px;
      }
      .top-row{
        display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;
      }
      .top-left{
        display:flex;align-items:center;gap:8px;flex-wrap:wrap;
      }
      .subject{color:var(--red2);font-weight:800;font-size:11px;letter-spacing:2px}
      .dot{color:rgba(255,255,255,.25);font-size:10px}
      .etapa{color:var(--muted);font-size:11.5px;font-weight:600;margin:0}
      .etapa b{color:var(--ink);font-weight:600}
      .blockseal{
        background:rgba(212,175,55,.12);
        border:1px solid rgba(212,175,55,.3);
        color:var(--gold2);
        font-size:10px;font-weight:700;letter-spacing:1px;
        padding:1px 7px;border-radius:99px;text-transform:uppercase;
      }
      h1{
        font-family:"Playfair Display",Georgia,serif;
        font-size:15px;line-height:1.2;margin:0;font-weight:700;color:#fff;
      }
      .track{height:3px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:2px}
      .fill{height:100%;background:linear-gradient(90deg,#8f1020,var(--red),var(--gold));border-radius:99px;transition:width .45s ease}
      
      /* Área de Conteúdo SEM barra de scroll */
      .scroll{
        flex:1 1 auto;overflow-y:auto;overflow-x:hidden;
        padding:20px 20px 30px;
        scrollbar-width:none;
        -ms-overflow-style:none;
        overscroll-behavior:contain;
        width:100%;
      }
      .scroll::-webkit-scrollbar{
        display:none;width:0;height:0;
      }
      .scroll > *{
        max-width:860px;
        margin-left:auto;
        margin-right:auto;
      }

      /* Rodapé com Player Centralizado e Botões nas Pontas */
      footer{
        padding:10px 14px calc(10px + env(safe-area-inset-bottom));
        border-top:1px solid rgba(226,62,87,.25);
        background:rgba(18,4,9,.95);
        backdrop-filter:blur(16px);
        -webkit-backdrop-filter:blur(16px);
        flex:0 0 auto;
        width:100%;
        z-index:30;
      }
      .footer-bar{
        max-width:860px;
        margin:0 auto;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        width:100%;
      }
      .navbtn{
        flex:0 0 auto;
        min-width:92px;
        font-size:13.5px;font-weight:700;
        padding:10px 14px;border-radius:12px;
        cursor:pointer;
        display:inline-flex;align-items:center;justify-content:center;gap:5px;
        border:1px solid rgba(255,255,255,.12);
        background:rgba(255,255,255,.06);
        color:var(--ink);
        transition:all .15s ease;
      }
      .navbtn:hover{background:rgba(255,255,255,.12)}
      .navbtn:active{transform:scale(0.96)}
      .navbtn.next{
        background:linear-gradient(135deg,#c8102e,#8a081c);
        border:1px solid rgba(255,255,255,.2);
        color:#fff;
        box-shadow:0 3px 12px rgba(200,16,46,.35);
      }
      .navbtn.next:hover{filter:brightness(1.1)}
      .navbtn:disabled{opacity:.35;pointer-events:none}
      .navbtn-svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}

      /* Player Centralizado */
      .footer-player{
        flex:1 1 auto;
        min-width:0;
        display:flex;
        align-items:center;
        gap:10px;
        background:rgba(46,15,24,.75);
        border:1px solid rgba(226,62,87,.35);
        border-radius:12px;
        padding:5px 10px;
        cursor:pointer;
        transition:background .2s ease;
      }
      .footer-player:hover{background:rgba(56,18,30,.9)}
      .playbtn{
        flex:0 0 32px;width:32px;height:32px;border-radius:50%;
        background:linear-gradient(135deg,#ff5e78,#c8102e);
        border:1px solid rgba(255,255,255,.3);cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 8px rgba(226,62,87,.4);
        transition:transform .15s ease;
      }
      .playbtn:hover{transform:scale(1.08)}
      .playbtn:active{transform:scale(0.92)}
      .playbtn svg{width:14px;height:14px;fill:#fff}
      .footer-player-body{
        flex:1 1 auto;min-width:0;
        display:flex;flex-direction:column;gap:3px;
      }
      .footer-player-labels{
        display:flex;justify-content:space-between;align-items:center;gap:6px;
      }
      .alabel{color:var(--red2);font-size:9.5px;font-weight:800;letter-spacing:1.4px}
      .atime{color:var(--muted);font-size:10.5px;font-variant-numeric:tabular-nums;font-weight:600}
      .atrack{
        position:relative;height:5px;border-radius:99px;
        background:rgba(255,255,255,.12);overflow:hidden;cursor:pointer;
      }
      .afill{height:100%;width:0%;background:linear-gradient(90deg,var(--red),var(--gold));border-radius:99px}

      @media (max-width: 480px){
        .navbtn{min-width:76px;padding:9px 10px;font-size:12px}
        .alabel{font-size:8.5px}
        .atime{font-size:9.5px}
      }
      .banner{`;

html = html.replace(cssHeaderRegex, newCSSHeader);

// 3. Corrigir o audioSrc para carregar a URL real do Cloudflare R2
const oldAudioSrc = /function audioSrc\(i\)\{\s*return\s*\"assets\/audio\/s\"\s*\+\s*pad\(i\+1\)\s*\+\s*\"\.mp3\";\s*\}/;
const newAudioSrc = `var AUDIO_BASE_URL = "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/audio/";
    function audioSrc(i){ return AUDIO_BASE_URL + "s" + pad(i+1) + ".mp3"; }`;

html = html.replace(oldAudioSrc, newAudioSrc);

fs.writeFileSync('scratch/aula01_fullscreen.html', html, 'utf8');
fs.copyFileSync('scratch/aula01_fullscreen.html', 'scratch/aula01_standalone_r2.html');
console.log('HTML atualizado com sucesso com player no rodapé e URLs R2 de áudio! Tamanho:', html.length);
