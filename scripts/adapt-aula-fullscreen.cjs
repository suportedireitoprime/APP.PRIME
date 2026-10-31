const fs = require('fs');

let html = fs.readFileSync('scratch/aula01_standalone_r2.html', 'utf8');

// 1. Substituir bloco HTML do body (removendo .stage e .playerdock e integrando .audio no header)
const oldBodyPattern = /<body>[\s\S]*?<script>/;

const newBody = `<body>
    <div class="phone" id="phone">
      <header>
        <div class="header-inner">
          <div class="hrow">
            <span class="subject">DIREITO PENAL</span>
            <span class="design">AULA INTERATIVA</span>
          </div>
          <h1>Crimes Contra a Família</h1>
          <div class="hmeta">
            <p class="etapa" id="etapaLabel">Etapa 1 de 32</p>
            <div class="sealrow"><span class="blockseal" id="blockSeal">Bloco 1 de 3 · O terreno da família</span></div>
          </div>
          <div class="track"><div class="fill" id="progressFill" style="width:3.13%"></div></div>

          <!-- Player de Narração Horizontal Integrado -->
          <div class="audio" id="audioBox" title="Ouvir a narração desta etapa">
            <div class="arow">
              <span class="alabel">NARRAÇÃO · VOZ FEMININA</span>
              <span class="atime" id="aTime">0:00 / 0:00</span>
            </div>
            <div class="acontrol">
              <button class="playbtn" id="playBtn" type="button" aria-label="Ouvir ou pausar a narração">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>
              </button>
              <div class="atrack" id="aTrack"><div class="afill" id="aFill"></div></div>
            </div>
          </div>
        </div>
      </header>

      <div class="scroll" id="scrollArea" tabindex="0"></div>

      <footer>
        <div class="footer-inner">
          <button class="navbtn" id="btnPrev" type="button">← Anterior</button>
          <button class="navbtn next" id="btnNext" type="button">Próximo →</button>
        </div>
      </footer>
    </div>

    <script>`;

html = html.replace(oldBodyPattern, newBody);

// 2. Ajustar CSS da página
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
        padding:12px 20px 10px;
        border-bottom:1px solid rgba(226,62,87,.22);
        background:rgba(20,4,9,.85);
        backdrop-filter:blur(14px);
        -webkit-backdrop-filter:blur(14px);
        flex:0 0 auto;
        width:100%;
        z-index:20;
      }
      .header-inner{
        max-width:860px;
        margin:0 auto;
        width:100%;
        display:flex;flex-direction:column;gap:5px;
      }
      .hrow{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
      .subject{color:var(--red2);font-weight:700;font-size:11.5px;letter-spacing:2.4px}
      .design{color:var(--muted);font-size:11px;letter-spacing:1.4px;font-weight:600;white-space:nowrap}
      h1{font-family:"Playfair Display",Georgia,serif;font-size:20px;line-height:1.2;margin:2px 0;font-weight:800}
      .hmeta{display:flex;align-items:center;justify-content:space-between;gap:8px}
      .etapa{color:var(--muted);font-size:12.5px;margin:0}
      .etapa b{color:var(--ink);font-weight:600}
      .track{height:5px;border-radius:99px;background:rgba(255,255,255,.09);overflow:hidden;margin:2px 0 6px}
      .fill{height:100%;background:linear-gradient(90deg,#8f1020,var(--red),var(--gold));border-radius:99px;transition:width .45s ease}
      .audio{
        margin:4px 0 2px;
        background:linear-gradient(90deg,rgba(46,15,24,.85),rgba(33,10,17,.92));
        border:1px solid rgba(226,62,87,.45);
        border-radius:14px;
        padding:8px 14px;
        cursor:pointer;
        box-shadow:0 6px 18px rgba(0,0,0,.35);
      }
      .audio .arow{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
      .audio .alabel{color:var(--red2);font-size:11px;font-weight:700;letter-spacing:1.8px}
      .audio .atime{color:var(--muted);font-size:11.5px;font-variant-numeric:tabular-nums;font-weight:600}
      .audio .acontrol{display:flex;align-items:center;gap:12px}
      .playbtn{
        flex:0 0 auto;width:38px;height:38px;border-radius:50%;
        background:linear-gradient(135deg,#ff5e78,#c8102e);
        border:1px solid rgba(255,255,255,.2);cursor:pointer;display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 14px rgba(226,62,87,.45);
        transition:transform .15s ease;
      }
      .playbtn:hover{transform:scale(1.05)}
      .playbtn:active{transform:scale(0.95)}
      .playbtn svg{width:18px;height:18px;fill:#fff}
      .atrack{flex:1;height:6px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden;cursor:pointer}
      .afill{height:100%;width:0%;background:linear-gradient(90deg,var(--red),var(--gold));transition:width .15s linear}
      .scroll{
        flex:1 1 auto;overflow-y:auto;overflow-x:hidden;
        padding:20px 20px 30px;
        scrollbar-width:thin;scrollbar-color:rgba(226,62,87,.6) rgba(255,255,255,.04);
        overscroll-behavior:contain;
        width:100%;
      }
      .scroll::-webkit-scrollbar{width:6px}
      .scroll::-webkit-scrollbar-track{background:rgba(255,255,255,.04);border-radius:99px}
      .scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,var(--red),#7d0c1e);border-radius:99px}
      .scroll > *{
        max-width:860px;
        margin-left:auto;
        margin-right:auto;
      }
      footer{
        padding:12px 20px calc(12px + env(safe-area-inset-bottom));
        border-top:1px solid rgba(226,62,87,.22);
        background:rgba(20,4,9,.88);
        backdrop-filter:blur(14px);
        -webkit-backdrop-filter:blur(14px);
        flex:0 0 auto;
        width:100%;
        z-index:20;
      }
      .footer-inner{
        max-width:860px;
        margin:0 auto;
        display:flex;gap:14px;
        width:100%;
      }
      .navbtn{
        flex:1;
        font-size:15px;font-weight:700;
        padding:12px 16px;border-radius:12px;
        cursor:pointer;
        transition:all .15s ease;
      }
      .banner{`;

html = html.replace(cssHeaderRegex, newCSSHeader);

fs.writeFileSync('scratch/aula01_fullscreen.html', html, 'utf8');
console.log('Sucesso! Arquivo gerado em scratch/aula01_fullscreen.html com tamanho:', html.length);
