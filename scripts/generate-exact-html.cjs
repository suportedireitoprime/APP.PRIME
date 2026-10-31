const fs = require('fs');

// Ler o arquivo original do Drive intacto
let html = fs.readFileSync('scratch/aula.html', 'utf8');

// 1. Mapear URLs de imagens para o Cloudflare R2
const R2_BASE = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia';

// Substituir assets/img/ por URLs do R2
html = html.replace(/assets\/img\/([a-zA-Z0-9_-]+\.webp)/g, `${R2_BASE}/imagens/$1`);

// Substituir áudio por URLs do R2
html = html.replace(
  'function audioSrc(i){ return "assets/audio/s" + pad(i+1) + ".mp3"; }',
  `function audioSrc(i){ return "${R2_BASE}/audio/s" + pad(i+1) + ".mp3"; }`
);

// 2. Substituir o corpo do HTML:
// Tirar o .playerdock da lateral e colocar o player dentro do footer, entre os botões
const oldBodyPattern = /<body>[\s\S]*?<script>/;

const newBody = `<body>
    <div class="stage">
    <div class="phone" id="phone">
      <header>
        <div class="header-wrap">
          <div class="hrow">
            <span class="subject">DIREITO PENAL</span>
            <span class="design">TEMA VERMELHO</span>
          </div>
          <h1>Crimes Contra a Família</h1>
          <p class="etapa" id="etapaLabel">Etapa 1 de 32</p>
          <div class="track"><div class="fill" id="progressFill" style="width:3.13%"></div></div>
          <div class="sealrow"><span class="blockseal" id="blockSeal">Bloco 1 de 3 · O terreno da família</span></div>
        </div>
      </header>
      
      <div class="scroll" id="scrollArea" tabindex="0"></div>

      <footer>
        <div class="footer-wrap">
          <button class="navbtn" id="btnPrev" type="button">← Anterior</button>

          <!-- Player Centralizado no Rodapé -->
          <div class="audio" id="audioBox" title="Ouvir a narração desta etapa">
            <button class="playbtn" id="playBtn" type="button" aria-label="Ouvir ou pausar a narração">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>
            </button>
            <div class="acontrol">
              <div class="arow">
                <span class="alabel">NARRAÇÃO · VOZ FEMININA</span>
                <span class="atime" id="aTime">0:00 / 0:00</span>
              </div>
              <div class="atrack" id="aTrack"><div class="afill" id="aFill"></div></div>
            </div>
          </div>

          <button class="navbtn next" id="btnNext" type="button">Próximo →</button>
        </div>
      </footer>
    </div>
    </div>

    <script>`;

html = html.replace(oldBodyPattern, newBody);

// 3. Ajustar CSS mantendo 100% das cores, tipografias e regras originais,
// apenas tornando responsivo (tela cheia), sem barra de rolagem e estilizando o footer-wrap
const cssLayoutRegex = /body\s*\{[\s\S]*?\.banner\s*\{/;

const newCSSLayout = `body{
        margin:0;
        padding:0;
        font-family:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif;
        background:
          radial-gradient(1100px 600px at 20% -10%, #3a0f1c 0%, transparent 60%),
          radial-gradient(900px 500px at 100% 100%, #2b0812 0%, transparent 55%),
          var(--bg);
        color:var(--ink);
        display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;
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
      .stage{
        display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;
        width:100%;height:100%;flex:1 1 auto;min-height:0;
      }
      .phone{
        position:relative;
        width:100%;max-width:100%;min-width:0;
        flex:1 1 auto;height:100%;min-height:0;
        background:linear-gradient(180deg,#26060f 0%,var(--phone) 30%);
        display:flex;flex-direction:column;
        overflow:hidden;
        border-radius:0;border:none;box-shadow:none;
      }
      header{
        padding:14px 20px 10px;
        border-bottom:1px solid rgba(226,62,87,.18);
        background:rgba(20,4,9,.88);
        backdrop-filter:blur(14px);
        -webkit-backdrop-filter:blur(14px);
        flex:0 0 auto;
        width:100%;
        z-index:20;
      }
      .header-wrap{
        max-width:860px;
        margin:0 auto;
        width:100%;
      }
      .hrow{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
      .subject{color:var(--red2);font-weight:700;font-size:11.5px;letter-spacing:2.4px}
      .design{color:var(--muted);font-size:11px;letter-spacing:1.4px;font-weight:600;white-space:nowrap}
      h1{font-family:"Playfair Display",Georgia,serif;font-size:22px;line-height:1.2;margin:6px 0 2px;font-weight:800}
      .etapa{color:var(--muted);font-size:13px;margin:0 0 8px}
      .etapa b{color:var(--ink);font-weight:600}
      .track{height:5px;border-radius:99px;background:rgba(255,255,255,.09);overflow:hidden}
      .fill{height:100%;background:linear-gradient(90deg,#8f1020,var(--red),var(--gold));border-radius:99px;transition:width .45s ease}

      /* Área de leitura centralizada e SEM barra de scroll */
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

      /* Rodapé com Player Centralizado */
      footer{
        padding:10px 16px calc(10px + env(safe-area-inset-bottom));
        border-top:1px solid rgba(226,62,87,.22);
        background:rgba(20,4,9,.94);
        backdrop-filter:blur(14px);
        -webkit-backdrop-filter:blur(14px);
        flex:0 0 auto;
        width:100%;
        z-index:20;
      }
      .footer-wrap{
        max-width:860px;
        margin:0 auto;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        width:100%;
      }
      .navbtn{
        flex:0 0 auto;
        min-width:96px;
        font-size:14px;font-weight:700;
        padding:11px 16px;border-radius:12px;
        cursor:pointer;
        display:inline-flex;align-items:center;justify-content:center;
        border:1px solid rgba(226,62,87,.3);
        background:rgba(46,15,24,.7);
        color:var(--ink);
        transition:all .15s ease;
      }
      .navbtn:hover{background:rgba(56,18,30,.9)}
      .navbtn:active{transform:scale(0.96)}
      .navbtn.next{
        background:linear-gradient(135deg,#ff7a8a,#c8102e);
        border:1px solid rgba(255,255,255,.2);
        color:#fff;
        box-shadow:0 4px 14px rgba(226,62,87,.4);
      }
      .navbtn.next:hover{filter:brightness(1.1)}
      .navbtn:disabled{opacity:.35;pointer-events:none}

      /* Player Centralizado */
      .audio{
        flex:1 1 auto;
        min-width:0;
        margin:0;
        background:linear-gradient(90deg,rgba(46,15,24,.88),rgba(33,10,17,.94));
        border:1px solid rgba(226,62,87,.45);
        border-radius:14px;
        padding:6px 12px;
        cursor:pointer;
        display:flex;
        align-items:center;
        gap:10px;
        box-shadow:0 6px 18px rgba(0,0,0,.35);
      }
      .playbtn{
        flex:0 0 36px;width:36px;height:36px;border-radius:50%;
        background:linear-gradient(135deg,#ff7a8a,#c8102e);
        border:1px solid rgba(255,255,255,.2);cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 10px rgba(226,62,87,.4);
        transition:transform .15s ease;
      }
      .playbtn:hover{transform:scale(1.08)}
      .playbtn:active{transform:scale(0.92)}
      .playbtn svg{width:16px;height:16px;fill:#fff}
      .acontrol{
        flex:1 1 auto;min-width:0;
        display:flex;flex-direction:column;gap:3px;
      }
      .arow{
        display:flex;justify-content:space-between;align-items:center;
        margin-bottom:0;
      }
      .alabel{color:var(--red2);font-size:10px;font-weight:700;letter-spacing:1.5px}
      .atime{color:var(--muted);font-size:11px;font-variant-numeric:tabular-nums;font-weight:600}
      .atrack{
        position:relative;height:5px;border-radius:99px;
        background:rgba(255,255,255,.14);overflow:hidden;cursor:pointer;
      }
      .afill{height:100%;width:0%;background:linear-gradient(90deg,var(--red),var(--gold));border-radius:99px}

      @media (max-width:480px){
        .navbtn{min-width:76px;padding:9px 10px;font-size:12.5px}
        .alabel{font-size:8.5px}
        .atime{font-size:9.5px}
      }
      .banner{`;

html = html.replace(cssLayoutRegex, newCSSLayout);

fs.writeFileSync('scratch/aula01_exata.html', html, 'utf8');
fs.copyFileSync('scratch/aula01_exata.html', 'scratch/aula01_standalone_r2.html');
console.log('HTML exato gerado com sucesso! Tamanho:', html.length);
