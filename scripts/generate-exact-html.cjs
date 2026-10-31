const fs = require('fs');

// Ler o arquivo original do Drive intacto
let html = fs.readFileSync('scratch/aula.html', 'utf8');

const R2_BASE = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia';

// 1. Substituir URLs de imagens e áudio para R2
html = html.replace(/assets\/img\/([a-zA-Z0-9_-]+\.webp)/g, `${R2_BASE}/imagens/$1`);
html = html.replace(
  'function audioSrc(i){ return "assets/audio/s" + pad(i+1) + ".mp3"; }',
  `function audioSrc(i){ return "${R2_BASE}/audio/s" + pad(i+1) + ".mp3"; }`
);

// 2. Substituir o corpo do HTML (colocar o player dentro do footer-wrap)
const oldBodyPattern = /<body>[\s\S]*?<script>/;

const newBody = `<body>
    <div class="stage">
    <div class="phone" id="phone">
      <header>
        <div class="header-wrap">
          <p class="etapa" id="etapaLabel">Etapa 1 de 32 · Crimes Contra a Família</p>
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
                <span class="alabel">NARRAÇÃO</span>
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

// 3. Substituir CSS inicial
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
        min-height:100vh;
        min-height:100dvh;
        overflow-x:hidden;
        overflow-y:auto;
        scrollbar-width:none;
        -ms-overflow-style:none;
      }
      body::-webkit-scrollbar, html::-webkit-scrollbar{
        display:none;width:0;height:0;
      }
      .stage{
        display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;
        width:100%;min-height:100%;flex:1 0 auto;
      }
      .phone{
        position:relative;
        width:100%;max-width:100%;min-width:0;
        min-height:100%;flex:1 0 auto;
        background:linear-gradient(180deg,#26060f 0%,var(--phone) 30%);
        display:flex;flex-direction:column;
        overflow-x:hidden;
        border-radius:0;border:none;box-shadow:none;
      }
      header{
        position:sticky !important;
        top:0 !important;
        padding:8px 12px 6px !important;
        border-bottom:1px solid rgba(226,62,87,.25) !important;
        background:rgba(20,4,9,.97) !important;
        backdrop-filter:blur(14px);
        -webkit-backdrop-filter:blur(14px);
        width:100% !important;
        box-sizing:border-box !important;
        z-index:50 !important;
      }
      .header-wrap{
        max-width:860px;
        margin:0 auto;
        width:100%;
        box-sizing:border-box !important;
      }
      .etapa{color:var(--muted);font-size:12px;margin:0 0 5px;font-weight:600}
      .etapa b{color:var(--ink);font-weight:700}
      .track{height:4px;border-radius:99px;background:rgba(255,255,255,.09);overflow:hidden;margin-bottom:5px}
      .fill{height:100%;background:linear-gradient(90deg,#8f1020,var(--red),var(--gold));border-radius:99px;transition:width .45s ease}

      /* Área de leitura no fluxo natural da página inteira */
      .scroll{
        flex:1 0 auto;
        padding:16px 14px 20px;
        width:100%;
        box-sizing:border-box !important;
      }
      .scroll > *{
        max-width:860px;
        margin-left:auto;
        margin-right:auto;
        box-sizing:border-box !important;
      }

      /* Rodapé no final do conteúdo (rola junto com a tela toda) */
      footer{
        margin-top:auto !important;
        padding:16px 8px calc(24px + env(safe-area-inset-bottom)) !important;
        border-top:1px solid rgba(226,62,87,.25) !important;
        background:rgba(20,4,9,.97) !important;
        backdrop-filter:blur(16px);
        -webkit-backdrop-filter:blur(16px);
        width:100% !important;
        max-width:100% !important;
        overflow:hidden !important;
        box-sizing:border-box !important;
        z-index:30;
      }
      .footer-wrap{
        max-width:860px;
        margin:0 auto;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:6px;
        width:100%;
        box-sizing:border-box !important;
      }
      .navbtn{
        flex:0 0 auto !important;
        width:auto !important;
        min-width:64px !important;
        height:42px !important;
        font-size:12px !important;
        font-weight:700 !important;
        padding:0 8px !important;
        border-radius:10px !important;
        cursor:pointer;
        display:inline-flex !important;
        align-items:center;
        justify-content:center;
        border:1px solid rgba(226,62,87,.3) !important;
        background:rgba(46,15,24,.75) !important;
        color:var(--ink) !important;
        white-space:nowrap !important;
        transition:all .15s ease;
        box-sizing:border-box !important;
      }
      .navbtn:hover{background:rgba(56,18,30,.9) !important}
      .navbtn:active{transform:scale(0.96)}
      .navbtn.next{
        background:linear-gradient(135deg,#ff7a8a,#c8102e) !important;
        border:1px solid rgba(255,255,255,.25) !important;
        color:#fff !important;
        box-shadow:0 4px 14px rgba(226,62,87,.4) !important;
      }
      .navbtn.next:hover{filter:brightness(1.1) !important}
      .navbtn:disabled{opacity:.35 !important;pointer-events:none}

      /* Player Centralizado Responsivo */
      .audio{
        flex:1 1 auto !important;
        min-width:0 !important;
        height:42px !important;
        margin:0 !important;
        background:linear-gradient(90deg,rgba(46,15,24,.92),rgba(33,10,17,.96)) !important;
        border:1px solid rgba(226,62,87,.45) !important;
        border-radius:10px !important;
        padding:3px 8px !important;
        cursor:pointer;
        display:flex !important;
        flex-direction:row !important;
        align-items:center !important;
        gap:6px !important;
        box-shadow:0 4px 14px rgba(0,0,0,.4);
        box-sizing:border-box !important;
        overflow:hidden !important;
      }
      .playbtn{
        flex:0 0 30px !important;
        width:30px !important;
        height:30px !important;
        border-radius:50% !important;
        background:linear-gradient(135deg,#ff7a8a,#c8102e) !important;
        border:1px solid rgba(255,255,255,.25) !important;
        cursor:pointer;
        display:flex !important;
        align-items:center;
        justify-content:center;
        box-shadow:0 3px 10px rgba(226,62,87,.45);
        transition:transform .15s ease;
        padding:0 !important;
      }
      .playbtn:hover{transform:scale(1.08)}
      .playbtn:active{transform:scale(0.92)}
      .playbtn svg{width:13px;height:13px;fill:#fff}

      .acontrol{
        flex:1 1 auto !important;
        min-width:0 !important;
        display:flex !important;
        flex-direction:column !important;
        justify-content:center !important;
        gap:2px !important;
        overflow:hidden !important;
        box-sizing:border-box !important;
      }
      .arow{
        display:flex !important;
        flex-direction:row !important;
        justify-content:space-between !important;
        align-items:center !important;
        width:100% !important;
        min-width:0 !important;
        margin:0 !important;
        line-height:1.1 !important;
        gap:4px !important;
      }
      .alabel{
        color:var(--red2) !important;
        font-size:9px !important;
        font-weight:700 !important;
        letter-spacing:1px !important;
        white-space:nowrap !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
        text-transform:uppercase;
        flex:1 1 auto !important;
        min-width:0 !important;
      }
      .atime{
        color:var(--muted) !important;
        font-size:10px !important;
        font-variant-numeric:tabular-nums !important;
        font-weight:600 !important;
        white-space:nowrap !important;
        flex:0 0 auto !important;
        margin-left:auto !important;
      }
      .atrack{
        position:relative;
        width:100% !important;
        height:4px !important;
        border-radius:99px !important;
        background:rgba(255,255,255,.14) !important;
        overflow:hidden !important;
        cursor:pointer;
        margin:0 !important;
      }
      .afill{
        height:100% !important;
        width:0%;
        background:linear-gradient(90deg,var(--red),var(--gold)) !important;
        border-radius:99px !important;
        transition:width .1s linear;
      }

      @media (max-width:480px){
        header{padding:8px 10px 5px !important}
        .etapa{font-size:11px !important}
        .footer-wrap{gap:4px !important}
        .navbtn{min-width:60px !important;font-size:11px !important;padding:0 6px !important;height:38px !important}
        .audio{padding:2px 6px !important;height:38px !important}
        .playbtn{flex:0 0 28px !important;width:28px !important;height:28px !important}
        .playbtn svg{width:11px !important;height:11px !important}
        .alabel{font-size:8px !important;letter-spacing:0.5px !important}
        .atime{font-size:9.5px !important}
      }
      .banner{`;

html = html.replace(cssLayoutRegex, newCSSLayout);

// 4. Remover regras legadas duplicadas no meio e final do arquivo que sobrepunham o footer e navbtn
// Remover o bloco antigo de footer no final
html = html.replace(
  /footer\s*\{\s*flex:0 0 auto;\s*display:flex;gap:12px;[\s\S]*?\.navbtn:disabled\{opacity:\.35;cursor:default\}/,
  '/* footer original migrado */'
);

// Remover o bloco antigo de .audio duplicado no meio
html = html.replace(
  /\.audio\{\s*margin:0 0 16px;background:#2c0f18;[\s\S]*?\.afill\{height:100%;width:0%;background:linear-gradient\(90deg,var\(--red\),var\(--gold\)\)\}/,
  '/* .audio original migrado */'
);

// 5. Aprimorar a mecânica do áudio para suporte a clique, toque suave e seek instantâneo
const oldBindAudio = /function bindAudio\(\)\{[\s\S]*?player\.addEventListener\("ended"/;

const newBindAudio = `function bindAudio(){
      var playBtn = document.getElementById("playBtn");
      var box = document.getElementById("audioBox");
      var track = document.getElementById("aTrack");

      function onPlayToggle(ev){
        if(ev){ ev.stopPropagation(); ev.preventDefault(); }
        unlocked = true;
        togglePlay();
      }

      playBtn.addEventListener("click", onPlayToggle);
      playBtn.addEventListener("touchend", onPlayToggle);

      function onSeek(ev){
        if(ev){ ev.stopPropagation(); }
        var r = track.getBoundingClientRect();
        var clientX = ev.clientX;
        if(clientX === undefined && ev.touches && ev.touches[0]){
          clientX = ev.touches[0].clientX;
        }
        if(player.duration && r.width > 0 && clientX !== undefined){
          var pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
          player.currentTime = player.duration * pct;
        }
      }

      track.addEventListener("click", onSeek);
      track.addEventListener("touchstart", onSeek);
    }

    function tryPlay(){
      var p = player.play();
      if(p && p.catch){ p.catch(function(){}); }
    }
    function togglePlay(){
      if(player.paused){ tryPlay(); } else { player.pause(); }
    }

    player.addEventListener("play", function(){
      var b = document.getElementById("playBtn");
      if(b) b.innerHTML = ICON_PAUSE;
    });
    player.addEventListener("pause", function(){
      var b = document.getElementById("playBtn");
      if(b) b.innerHTML = ICON_PLAY;
    });
    player.addEventListener("timeupdate", function(){
      var f = document.getElementById("aFill");
      var t = document.getElementById("aTime");
      if(f && player.duration) f.style.width = (100 * player.currentTime / player.duration) + "%";
      if(t && player.duration) t.textContent = fmt(player.currentTime) + " / " + fmt(player.duration);
      karaSync();
    });
    player.addEventListener("loadedmetadata", function(){
      var t = document.getElementById("aTime");
      if(t && player.duration) t.textContent = "0:00 / " + fmt(player.duration);
    });
    player.addEventListener("ended"`;

html = html.replace(oldBindAudio, newBindAudio);

// 6. Ao trocar de etapa, rolar a página inteira para o topo
html = html.replace(
  /scrollArea\.scrollTop\s*=\s*0;/,
  'scrollArea.scrollTop = 0; try { window.scrollTo({ top: 0, behavior: "instant" }); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; } catch(e){}'
);

fs.writeFileSync('scratch/aula01_exata.html', html, 'utf8');
fs.copyFileSync('scratch/aula01_exata.html', 'scratch/aula01_standalone_r2.html');
console.log('HTML refinado e blindado com sucesso! Tamanho:', html.length);
