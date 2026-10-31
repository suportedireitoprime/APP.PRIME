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
        padding:10px 16px 8px;
        border-bottom:1px solid rgba(226,62,87,.2);
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
      .hrow{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
      .subject{color:var(--red2);font-weight:700;font-size:11px;letter-spacing:2.2px}
      .design{color:var(--muted);font-size:10.5px;letter-spacing:1.2px;font-weight:600;white-space:nowrap}
      h1{font-family:"Playfair Display",Georgia,serif;font-size:19px;line-height:1.2;margin:3px 0 2px;font-weight:800}
      .etapa{color:var(--muted);font-size:12px;margin:0 0 6px}
      .etapa b{color:var(--ink);font-weight:600}
      .track{height:4px;border-radius:99px;background:rgba(255,255,255,.09);overflow:hidden;margin-bottom:6px}
      .fill{height:100%;background:linear-gradient(90deg,#8f1020,var(--red),var(--gold));border-radius:99px;transition:width .45s ease}

      /* Área de leitura centralizada SEM barra de scroll */
      .scroll{
        flex:1 1 auto;overflow-y:auto;overflow-x:hidden;
        padding:16px 16px 24px;
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
        padding:8px 12px calc(8px + env(safe-area-inset-bottom)) !important;
        border-top:1px solid rgba(226,62,87,.22) !important;
        background:rgba(20,4,9,.95) !important;
        backdrop-filter:blur(14px);
        -webkit-backdrop-filter:blur(14px);
        flex:0 0 auto !important;
        width:100% !important;
        z-index:30;
      }
      .footer-wrap{
        max-width:860px;
        margin:0 auto;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        width:100%;
      }
      .navbtn{
        flex:0 0 auto !important;
        width:auto !important;
        min-width:80px !important;
        max-width:96px !important;
        height:44px !important;
        font-size:13px !important;
        font-weight:700 !important;
        padding:0 10px !important;
        border-radius:12px !important;
        cursor:pointer;
        display:inline-flex !important;
        align-items:center;
        justify-content:center;
        border:1px solid rgba(226,62,87,.3) !important;
        background:rgba(46,15,24,.75) !important;
        color:var(--ink) !important;
        white-space:nowrap !important;
        transition:all .15s ease;
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
        height:44px !important;
        margin:0 !important;
        background:linear-gradient(90deg,rgba(46,15,24,.92),rgba(33,10,17,.96)) !important;
        border:1px solid rgba(226,62,87,.45) !important;
        border-radius:12px !important;
        padding:4px 10px !important;
        cursor:pointer;
        display:flex !important;
        flex-direction:row !important;
        align-items:center !important;
        gap:8px !important;
        box-shadow:0 4px 14px rgba(0,0,0,.4);
      }
      .playbtn{
        flex:0 0 32px !important;
        width:32px !important;
        height:32px !important;
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
      .playbtn svg{width:14px;height:14px;fill:#fff}

      .acontrol{
        flex:1 1 auto !important;
        min-width:0 !important;
        display:flex !important;
        flex-direction:column !important;
        justify-content:center !important;
        gap:3px !important;
        width:calc(100% - 40px) !important;
      }
      .arow{
        display:flex !important;
        flex-direction:row !important;
        justify-content:space-between !important;
        align-items:center !important;
        width:100% !important;
        margin:0 !important;
        line-height:1.2 !important;
      }
      .alabel{
        color:var(--red2) !important;
        font-size:9.5px !important;
        font-weight:700 !important;
        letter-spacing:1.2px !important;
        white-space:nowrap !important;
        text-transform:uppercase;
      }
      .atime{
        color:var(--muted) !important;
        font-size:10.5px !important;
        font-variant-numeric:tabular-nums !important;
        font-weight:600 !important;
        white-space:nowrap !important;
      }
      .atrack{
        position:relative;
        width:100% !important;
        height:4px !important;
        border-radius:99px;
        background:rgba(255,255,255,.14) !important;
        overflow:hidden;
        cursor:pointer;
        margin:0 !important;
      }
      .afill{
        height:100% !important;
        width:0%;
        background:linear-gradient(90deg,var(--red),var(--gold)) !important;
        border-radius:99px;
      }

      @media (max-width:480px){
        .navbtn{min-width:74px !important;font-size:12px !important;padding:0 6px !important}
        .alabel{font-size:8.5px !important;letter-spacing:0.8px !important}
        .atime{font-size:9.5px !important}
        header{padding:8px 12px 6px}
        h1{font-size:17px}
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

fs.writeFileSync('scratch/aula01_exata.html', html, 'utf8');
fs.copyFileSync('scratch/aula01_exata.html', 'scratch/aula01_standalone_r2.html');
console.log('HTML refinado e blindado com sucesso! Tamanho:', html.length);
