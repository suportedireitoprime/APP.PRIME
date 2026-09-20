/* Fila de prompts para o Google Flow
   Um prompt-base de design fica fixo no topo. Você escolhe quantas imagens
   quer gerar, o painel cria um bloco para cada uma (já preenchido com o
   prompt-base), você ajusta o conteúdo de cada bloco e inicia a fila:
   ele envia um bloco por vez no chat do Flow, esperando um intervalo entre
   cada envio. */

(() => {
  if (window.__ffilaLoaded) return;
  window.__ffilaLoaded = true;

  const STORE_KEY = 'ffila_state';
  const DEFAULT_API_KEY = '';

  const PROMPT_BASE_PADRAO = `PROMPT-BASE FIXO DE DESIGN
Use este bloco em todos os cards, sem mudar o estilo.
Crie um post de carrossel vertical 4:5, em estilo colagem editorial jurídica premium, com aparência semi-realista, forte identidade visual e leitura excelente para Instagram.

ESTILO VISUAL OBRIGATÓRIO
- adotar como linguagem principal um design de colagem recortada premium, inspirado em papel rasgado e cutout editorial, sem cair em foto genérica pura;
- a imagem não deve ser fotorealista comum: ela deve parecer uma mistura sofisticada de ilustração semi-realista + colagem + textura editorial;
- usar fundo vermelho vivo, forte, luminoso e impactante; evitar vermelho vinho triste, marrom apagado ou fundo escuro sem vida;
- o vermelho de base deve parecer mais vibrante e chamativo, feito para parar o scroll;
- manter visual refinado, jurídico, moderno e harmônico, sem poluição;
- usar grão de papel, textura de impressão, halftone sutil, detalhes de gravura/engraving e linguagem de revista premium quando combinar;
- cada elemento principal e secundário pode ter contorno branco grosso, visível e elegante, reforçando o efeito de recorte vazado;
- incluir recortes de papel rasgado com bordas irregulares e acabamento limpo, como se fossem peças montadas manualmente em uma colagem sofisticada;
- evitar excesso de enfeites, excesso de recortes e excesso de microdetalhes; usar apenas o necessário para causar impacto;
- o resultado precisa ser minimalista, forte e autoral, sem parecer genérico.

LEGIBILIDADE E HIERARQUIA DO TEXTO
- a leitura no celular é prioridade máxima;
- o título principal deve ser grande, dominante e de leitura instantânea;
- o texto complementar também deve ser grande o suficiente para leitura confortável;
- nunca usar letras pequenas, comprimidas ou difíceis de ler;
- evitar blocos longos de texto;
- preferir frases curtas, poucos tópicos, boa separação e excelente respiro;
- cada card deve bater o olho e ser entendido rapidamente.

SISTEMA DE COMPOSIÇÃO
- quando houver personagem principal ou cena principal, posicionar o foco fortemente à direita;
- preservar espaço livre e bem resolvido à esquerda para a composição respirar e acomodar o texto;
- usar imagem principal grande, expressiva e dominante;
- usar 2 ou 3 elementos complementares no máximo, em escalas diferentes, levemente sobrepostos/embaralhados, sem poluir;
- todos os elementos secundários devem conversar visualmente com o tema e com a imagem principal;
- quando fizer sentido, usar fragmentos como páginas de lei, recortes de jornal, mapa do Brasil, páginas manuscritas, texturas de mármore, colunas clássicas, selos, arquivos ou símbolos jurídicos simplificados;
- os elementos devem formar uma colagem harmônica, e não uma bagunça visual.

LINGUAGEM DAS IMAGENS
- evitar foto genérica de banco de imagens;
- preferir cenas específicas, expressivas e memoráveis;
- as imagens devem parecer pensadas artisticamente, com identidade própria, e não somente ilustrativas;
- combinar semi-realismo com colagem premium, textura editorial e recortes vazados;
- pode usar leve dramaticidade cinematográfica inspirada em uma energia de “dark justice”, mas sem exagero fantasioso e sem perder a sofisticação;
- quando o tema pedir impacto, usar tensão, medo, dúvida, autoridade, consequência, confronto, decisão, proteção ou urgência por meio da cena e da expressão.

CONTEÚDO E DIDÁTICA
- o card deve ser claro, explicativo e fácil de entender;
- TODO carrossel deve conter pelo menos um card identificado claramente como EXEMPLO PRÁTICO, com situação concreta, personagens ou fatos fáceis de visualizar;
- sempre que possível, transformar conceitos abstratos em cenas reais ou simbólicas bem dirigidas do cotidiano jurídico;
- evitar símbolos jurídicos genéricos soltos sem função;
- se for Direito Penal ou tema criminal, quando fizer sentido usar cenas concretas como ladrão, polícia, prisão, investigação, réu, vítima, medo, flagrante ou consequência do ato;
- se for tema constitucional ou institucional, quando fizer sentido usar Constituição, mapa do Brasil, Congresso, STF, instituições brasileiras ou figuras públicas relacionadas ao tema, sempre com harmonia e sem poluir;
- se for tema civil, trabalhista, consumidor, família ou outros ramos, usar cenas humanas coerentes com o assunto, em vez de ícones vazios;
- quando o conteúdo pedir, incluir exemplo prático, comparação visual, passo a passo, situação-problema ou aplicação no cotidiano;
- se houver base legal mencionada no conteúdo, isso deve aparecer de forma organizada e legível;
- manter coerência com o tema jurídico e com o tipo do card (capa, explicação, exemplo prático, pontos de atenção, resumo, fechamento);
- ser direto ao ponto: menos texto, porém melhor selecionado;
- priorizar a compreensão rápida sem perder a didática.

CAPA — REGRA FIXA DE ALTO IMPACTO
- o PRIMEIRO card é sempre a capa e deve SEMPRE começar com uma PERGUNTA direta, curta e intrigante sobre o tema;
- nunca usar na capa apenas o nome do assunto: transformar o assunto em pergunta que desperte curiosidade, por exemplo “O que é dolo?”, “Quando isso vira crime?”, “Você sabe quando cabe prisão?” ou equivalente fiel ao tema;
- abaixo da pergunta, incluir uma descrição/chamada muito curta, provocativa e chamativa, sem entregar toda a resposta, convidando a pessoa a continuar o carrossel;
- usar pergunta muito grande, dominante e legível instantaneamente no Instagram;
- o fundo da capa deve usar vermelho vivo e impactante, não vinho apagado;
- a capa deve ter composição forte, com imagem principal dominante à direita e recortes complementares bem combinados;
- a expressão do personagem principal deve transmitir intenção clara: dúvida, tensão, autoridade, leve sorriso estratégico, confiança, surpresa ou alerta, conforme o tema;
- a capa deve parecer uma peça editorial feita para interromper o scroll;
- preservar hierarquia: pergunta primeiro, imagem principal em segundo, chamada curta em terceiro.

BRANDING EXTERNO
- não inserir arroba, logo, nome de perfil nem selo azul dentro da arte final;
- deixar apenas uma pequena área respirando no canto superior ou inferior para possível branding externo aplicado depois;
- o design deve funcionar sozinho, sem depender do arroba dentro da imagem.

PALETA
vermelho vivo, vermelho intenso, off-white, branco, bege claro, pergaminho, carvão, preto suave, cinza escuro, marrom sutil e pequenos detalhes em dourado envelhecido quando fizer sentido.

CONTEÚDO DESTA IMAGEM:
`;

  const state = {
    basePrompt: PROMPT_BASE_PADRAO,
    cards: [],          // array de strings, um prompt final por card
    index: 0,
    running: false,
    paused: false,
    intervalo: 3,
    modo: 'auto',        // auto | botao | enter
    seletor: '',
    left: null,
    top: null,
    collapsed: false,
    apiKey: DEFAULT_API_KEY,
    tema: '',
    min: 8,
    max: 12,
    modeloIA: 'gemini-3.1-flash-lite',
    regras: '',
    instaHandle: '@estudosjuridicos.app',
    logoTexto: '',
    generatedImages: [],
    batchBaselineImages: [],
    trackingImages: false,
    expectedImages: 0
  };

  let els = {};
  let abortWait = null;

  /* ---------- armazenamento ---------- */

  function salvar() {
    const { basePrompt, cards, index, intervalo, modo, seletor, left, top, collapsed,
      apiKey, tema, min, max, modeloIA, regras, instaHandle, logoTexto,
      generatedImages, batchBaselineImages, trackingImages, expectedImages } = state;
    try {
      chrome.storage.local.set({
        [STORE_KEY]: { basePrompt, cards, index, intervalo, modo, seletor, left, top, collapsed,
          apiKey, tema, min, max, modeloIA, regras, instaHandle, logoTexto,
          generatedImages, batchBaselineImages, trackingImages, expectedImages }
      });
    } catch (_) {}
  }

  function carregar() {
    return new Promise(resolve => {
      try {
        chrome.storage.local.get(STORE_KEY, res => {
          const salvo = res && res[STORE_KEY];
          if (salvo) {
            Object.assign(state, salvo);
            // Migração da versão anterior: o padrão era 30s e a chave vinha vazia.
            if (state.intervalo === 30) state.intervalo = 3;
            if (!state.apiKey) state.apiKey = DEFAULT_API_KEY;
            state.min = 8;
            state.max = 12;
            if (!state.instaHandle) state.instaHandle = '@estudosjuridicos.app';
          }
          resolve();
        });
      } catch (_) { resolve(); }
    });
  }

  /* ---------- utilidades de DOM ---------- */

  const visivel = el => {
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 12) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
  };

  const meuPainel = el => !!(el.closest && el.closest('#ffila-root'));

  function acharCampo() {
    if (state.seletor) {
      const alvo = document.querySelector(state.seletor);
      if (alvo && visivel(alvo)) return alvo;
    }

    const cands = [...document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"], input[type="text"]')]
      .filter(el => !meuPainel(el) && visivel(el) && !el.disabled && !el.readOnly);

    if (!cands.length) return null;

    const pista = /criar|prompt|descreva|escreva|pergunt|create|describe|imagine/i;
    const porTexto = cands.filter(el => {
      const t = [el.placeholder, el.getAttribute('aria-label'), el.getAttribute('data-placeholder'), el.title]
        .filter(Boolean).join(' ');
      return pista.test(t);
    });
    if (porTexto.length) return porTexto[0];

    return cands.sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (rb.bottom * rb.width) - (ra.bottom * ra.width);
    })[0];
  }

  function acharBotao(campo) {
    let no = campo;
    for (let i = 0; i < 7 && no; i++) {
      const btns = [...no.querySelectorAll('button, [role="button"]')]
        .filter(b => !meuPainel(b) && visivel(b) && !b.disabled && b.getAttribute('aria-disabled') !== 'true');
      if (btns.length) {
        const rotulo = /enviar|send|gerar|generate|submit|criar|seta|arrow/i;
        const marcado = btns.find(b => rotulo.test(
          [b.getAttribute('aria-label'), b.title, b.textContent, b.className].filter(Boolean).join(' ')
        ));
        if (marcado) return marcado;
        const campoR = campo.getBoundingClientRect();
        const naLinha = btns.filter(b => {
          const r = b.getBoundingClientRect();
          return r.left >= campoR.left - 20 && Math.abs(r.top - campoR.top) < campoR.height + 60;
        });
        if (naLinha.length) {
          return naLinha.sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right)[0];
        }
      }
      no = no.parentElement;
    }
    return null;
  }

  function escrever(campo, texto) {
    campo.focus();
    campo.click();

    if (campo.isContentEditable || campo.getAttribute('role') === 'textbox') {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(campo);
      sel.removeAllRanges();
      sel.addRange(range);
      const ok = document.execCommand('insertText', false, texto);
      if (!ok) {
        campo.textContent = texto;
        campo.dispatchEvent(new InputEvent('input', { bubbles: true, data: texto, inputType: 'insertText' }));
      }
      return campo.innerText.trim().length > 0;
    }

    const proto = campo.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(campo, '');
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    setter.call(campo, texto);
    campo.dispatchEvent(new InputEvent('input', { bubbles: true, data: texto, inputType: 'insertText' }));
    campo.dispatchEvent(new Event('change', { bubbles: true }));
    return campo.value === texto;
  }

  function teclarEnter(campo) {
    for (const tipo of ['keydown', 'keypress', 'keyup']) {
      campo.dispatchEvent(new KeyboardEvent(tipo, {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
      }));
    }
  }

  const espera = ms => new Promise(r => setTimeout(r, ms));


  function slugSeguro(s) {
    return String(s || 'arquivo')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'arquivo';
  }

  function montarPromptBaseComBranding() {
    const extras = [];
    const handle = (state.instaHandle || '').trim();

    if (handle) {
      extras.push('', 'BRANDING EXTERNO NO EXPORT');
      extras.push('- NÃO renderizar arroba, selo azul ou identificação do perfil dentro da arte;');
      extras.push('- manter uma pequena área respirando no canto superior ou inferior para branding externo aplicado depois;');
      extras.push('- o arroba será inserido pela extensão apenas no arquivo exportado em ZIP.');
    }

    return (state.basePrompt || PROMPT_BASE_PADRAO).trimEnd() + extras.join('\n');
  }

  function coletarImagensDaPagina() {
    const imgs = [...document.images].filter(img => {
      if (!img || meuPainel(img)) return false;
      const src = (img.currentSrc || img.src || '').trim();
      if (!src || src.startsWith('chrome-extension://')) return false;
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (w < 220 || h < 260) return false;
      if ((w * h) < 100000) return false;
      const proporcao = w / h;
      if (proporcao < 0.58 || proporcao > 1.08) return false;
      const style = getComputedStyle(img);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      return true;
    });

    return imgs.map(img => (img.currentSrc || img.src || '').trim()).filter(Boolean);
  }

  function iniciarRastreamentoDeImagens() {
    state.generatedImages = [];
    state.batchBaselineImages = coletarImagensDaPagina();
    state.trackingImages = true;
    state.expectedImages = Math.max(0, state.cards.length || 0);
    salvar();
    atualizarInfoGeradas();
    log('Rastreamento de imagens iniciado para esta fila. O ZIP baixará apenas as geradas agora.');
  }

  function registrarNovasImagensDaPagina() {
    const atuais = coletarImagensDaPagina();
    const baseline = new Set(state.batchBaselineImages || []);
    const conhecidas = new Set(state.generatedImages || []);
    let adicionadas = 0;

    for (const src of atuais) {
      if (baseline.has(src) || conhecidas.has(src)) continue;
      conhecidas.add(src);
      state.generatedImages.push(src);
      adicionadas++;
    }

    const limite = Math.max(0, state.expectedImages || 0);
    if (limite > 0 && state.generatedImages.length > limite) {
      state.generatedImages = state.generatedImages.slice(-limite);
    }

    if (adicionadas) {
      salvar();
      atualizarInfoGeradas();
    }
    return adicionadas;
  }

  function atualizarInfoGeradas() {
    if (!els.geradasInfo) return;
    const n = (state.generatedImages || []).length;
    const alvo = state.expectedImages || state.index || state.cards.length || 0;
    els.geradasInfo.textContent = alvo ? `${n} imagem(ns) rastreada(s) desta fila · alvo ${alvo}` : `${n} imagem(ns) rastreada(s)`;
    if (els.baixarZip) els.baixarZip.disabled = n === 0 && !(state.index || state.cards.length);
  }

  let observerImgs = null;
  let observerTimer = null;

  function observarImagens() {
    if (observerImgs) return;
    observerImgs = new MutationObserver(() => {
      if (!state.trackingImages) return;
      clearTimeout(observerTimer);
      observerTimer = setTimeout(() => {
        registrarNovasImagensDaPagina();
      }, 600);
    });
    observerImgs.observe(document.documentElement || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  }

  function crc32Tabela() {
    const tab = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      tab[i] = c >>> 0;
    }
    return tab;
  }
  const CRC32_TAB = crc32Tabela();

  function crc32(u8) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < u8.length; i++) crc = (crc >>> 8) ^ CRC32_TAB[(crc ^ u8[i]) & 0xFF];
    return (crc ^ (-1)) >>> 0;
  }

  function le16(n) { return new Uint8Array([n & 255, (n >>> 8) & 255]); }
  function le32(n) { return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]); }
  function juntarArrays(partes) {
    const total = partes.reduce((s, p) => s + p.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const p of partes) { out.set(p, off); off += p.length; }
    return out;
  }

  function dataDosZip(d = new Date()) {
    const ano = Math.max(1980, d.getFullYear());
    const time = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((Math.floor(d.getSeconds() / 2)) & 31);
    const date = (((ano - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
    return { time, date };
  }

  function criarZip(entries) {
    const enc = new TextEncoder();
    const locais = [];
    const centrais = [];
    let offset = 0;

    for (const entry of entries) {
      const nome = enc.encode(entry.name);
      const dados = entry.data;
      const crc = crc32(dados);
      const { time, date } = dataDosZip(new Date());

      const local = juntarArrays([
        le32(0x04034b50), le16(20), le16(0), le16(0), le16(time), le16(date),
        le32(crc), le32(dados.length), le32(dados.length), le16(nome.length), le16(0), nome, dados
      ]);
      locais.push(local);

      const central = juntarArrays([
        le32(0x02014b50), le16(20), le16(20), le16(0), le16(0), le16(time), le16(date),
        le32(crc), le32(dados.length), le32(dados.length), le16(nome.length), le16(0), le16(0),
        le16(0), le16(0), le32(0), le32(offset), nome
      ]);
      centrais.push(central);
      offset += local.length;
    }

    const centralSize = centrais.reduce((s, p) => s + p.length, 0);
    const end = juntarArrays([
      le32(0x06054b50), le16(0), le16(0), le16(entries.length), le16(entries.length),
      le32(centralSize), le32(offset), le16(0)
    ]);

    return new Blob([...locais, ...centrais, end], { type: 'application/zip' });
  }

  function base64ParaBytes(base64) {
    const bin = atob(base64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function pedirBackground(tipo, payload) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: tipo, ...payload }, resp => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!resp || !resp.ok) {
          reject(new Error(resp && resp.erro ? resp.erro : 'Falha desconhecida no serviço da extensão.'));
          return;
        }
        resolve(resp);
      });
    });
  }

  async function obterBytesImagem(url) {
    if (/^https?:\/\//i.test(url)) {
      try {
        const r = await pedirBackground('ffila-fetch-image', { url });
        return { bytes: base64ParaBytes(r.base64), contentType: r.contentType || '' };
      } catch (errBg) {
        try {
          const resp = await fetch(url, { credentials: 'include', cache: 'no-store' });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          return { bytes: new Uint8Array(await resp.arrayBuffer()), contentType: resp.headers.get('content-type') || '' };
        } catch (_) {
          throw errBg;
        }
      }
    }

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Não foi possível ler a imagem (${resp.status}).`);
    return { bytes: new Uint8Array(await resp.arrayBuffer()), contentType: resp.headers.get('content-type') || '' };
  }


  function carregarImagemDeBlob(bytes, contentType) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([bytes], { type: contentType || 'image/png' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível abrir a imagem para aplicar o arroba.')); };
      img.src = url;
    });
  }

  function canvasParaBlob(canvas, type = 'image/png', quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Falha ao exportar o canvas.')), type, quality);
    });
  }

  function arredondado(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  async function aplicarArrobaNoExport(bytes, contentType, handleOriginal) {
    const handleBase = String(handleOriginal || '').trim();
    if (!handleBase) return { bytes, ext: '', contentType };
    const handle = handleBase.startsWith('@') ? handleBase : `@${handleBase}`;
    const img = await carregarImagemDeBlob(bytes, contentType);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    let fontSize = Math.max(24, Math.round(w * 0.035));
    if (fontSize > 46) fontSize = 46;
    ctx.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
    let textWidth = ctx.measureText(handle).width;
    const maxWidth = w * 0.52;
    while (textWidth > maxWidth && fontSize > 18) {
      fontSize -= 1;
      ctx.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
      textWidth = ctx.measureText(handle).width;
    }

    const padX = Math.round(fontSize * 0.7);
    const padY = Math.round(fontSize * 0.48);
    const badgeGap = Math.round(fontSize * 0.45);
    const tickR = Math.round(fontSize * 0.42);
    const pillH = Math.round(fontSize + padY * 2);
    const pillW = Math.round(textWidth + padX * 2 + badgeGap + tickR * 2.2);
    const margin = Math.max(18, Math.round(w * 0.035));
    const x = margin;
    const y = h - margin - pillH;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = Math.round(fontSize * 0.8);
    ctx.shadowOffsetY = Math.round(fontSize * 0.18);
    ctx.fillStyle = 'rgba(17, 17, 20, 0.76)';
    arredondado(ctx, x, y, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.restore();

    ctx.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(handle, x + padX, y + pillH / 2 + 1);

    const tickCx = x + pillW - padX - tickR;
    const tickCy = y + pillH / 2;
    ctx.beginPath();
    ctx.fillStyle = '#1d9bf0';
    ctx.arc(tickCx, tickCy, tickR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.10));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(tickCx - tickR * 0.45, tickCy + tickR * 0.05);
    ctx.lineTo(tickCx - tickR * 0.10, tickCy + tickR * 0.38);
    ctx.lineTo(tickCx + tickR * 0.50, tickCy - tickR * 0.30);
    ctx.stroke();

    const blob = await canvasParaBlob(canvas, 'image/png');
    return { bytes: new Uint8Array(await blob.arrayBuffer()), ext: 'png', contentType: 'image/png' };
  }

  async function baixarGeradasZip() {
    registrarNovasImagensDaPagina();

    const limite = Math.max(0, state.index || state.expectedImages || 0);
    let urls = [...new Set(state.generatedImages || [])];
    if (limite > 0 && urls.length > limite) urls = urls.slice(-limite);

    if (!urls.length) {
      log('Nenhuma imagem desta fila foi rastreada. Inicie a fila antes de baixar.', 'err');
      return;
    }

    els.baixarZip.disabled = true;
    const rotulo = els.baixarZip.textContent;
    els.baixarZip.textContent = `Preparando 0/${urls.length}…`;

    try {
      const entries = [];
      const falhas = [];

      for (let i = 0; i < urls.length; i++) {
        els.baixarZip.textContent = `Preparando ${i + 1}/${urls.length}…`;
        try {
          const original = await obterBytesImagem(urls[i]);
          let { bytes, contentType } = original;
          const tipo = (contentType || '').toLowerCase();
          let ext = 'jpg';
          if (tipo.includes('png') || /\.png([?#]|$)/i.test(urls[i])) ext = 'png';
          else if (tipo.includes('webp') || /\.webp([?#]|$)/i.test(urls[i])) ext = 'webp';
          else if (tipo.includes('gif') || /\.gif([?#]|$)/i.test(urls[i])) ext = 'gif';
          else if (tipo.includes('avif') || /\.avif([?#]|$)/i.test(urls[i])) ext = 'avif';

          const handleExport = (state.instaHandle || '').trim();
          if (handleExport) {
            try {
              const stamped = await aplicarArrobaNoExport(bytes, contentType, handleExport);
              bytes = stamped.bytes;
              contentType = stamped.contentType || contentType;
              ext = stamped.ext || ext || 'png';
            } catch (stampErr) {
              log(`Não consegui aplicar o arroba na imagem ${i + 1}: ${stampErr.message || stampErr}`, 'err');
            }
          }

          const num = String(entries.length + 1).padStart(2, '0');
          entries.push({ name: `imagem-gerada-${num}.${ext}`, data: bytes });
        } catch (err) {
          falhas.push(i + 1);
          log(`Não consegui baixar a imagem rastreada ${i + 1}: ${err.message || err}`, 'err');
        }
      }

      if (!entries.length) throw new Error('As imagens foram localizadas, mas o navegador bloqueou o acesso aos arquivos.');

      const zip = criarZip(entries);
      const href = URL.createObjectURL(zip);
      const a = document.createElement('a');
      const tema = slugSeguro(state.tema || 'carrossel');
      a.href = href;
      a.download = `imagens-geradas-${tema}.zip`;
      a.style.display = 'none';
      document.documentElement.appendChild(a);
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 15000);

      const complemento = falhas.length ? ` (${falhas.length} falha(s))` : '';
      log(`ZIP criado com ${entries.length} imagem(ns) desta fila${complemento}.`, falhas.length ? undefined : 'ok');
    } catch (err) {
      log('Erro ao preparar o ZIP: ' + (err && err.message ? err.message : String(err)), 'err');
    } finally {
      els.baixarZip.disabled = false;
      els.baixarZip.textContent = rotulo;
      atualizarInfoGeradas();
    }
  }

  function limparGeradas() {
    state.generatedImages = [];
    state.batchBaselineImages = coletarImagensDaPagina();
    state.trackingImages = false;
    salvar();
    atualizarInfoGeradas();
    log('Lista de imagens rastreadas foi limpa.');
  }

  /* ---------- envio ---------- */

  async function enviar(texto) {
    const campo = acharCampo();
    if (!campo) return { ok: false, erro: 'Campo de prompt não encontrado. Use "Escolher campo" e clique na caixa de texto do Flow.' };

    if (!escrever(campo, texto)) {
      return { ok: false, erro: 'Não consegui escrever no campo. Tente "Escolher campo" de novo.' };
    }

    await espera(450);

    if (state.modo === 'enter') {
      teclarEnter(campo);
      return { ok: true, via: 'Enter' };
    }

    const botao = acharBotao(campo);
    if (botao) {
      botao.click();
      await espera(350);
      const limpou = campo.isContentEditable ? !campo.innerText.trim() : !campo.value.trim();
      if (limpou || state.modo === 'botao') return { ok: true, via: 'botão' };
    }

    if (state.modo === 'botao') {
      return { ok: false, erro: 'Botão de enviar não encontrado. Troque o envio para "Enter".' };
    }

    teclarEnter(campo);
    return { ok: true, via: botao ? 'botão + Enter' : 'Enter' };
  }

  async function esperarIntervalo(segundos) {
    for (let s = segundos; s > 0; s--) {
      if (!state.running) return;
      while (state.paused && state.running) await espera(300);
      els.restante.textContent = `${s}s`;
      await new Promise(res => { abortWait = res; setTimeout(res, 1000); });
    }
    els.restante.textContent = '—';
  }

  async function rodar() {
    state.running = true;
    state.paused = false;
    pintar();

    while (state.running && state.index < state.cards.length) {
      const n = state.index + 1;
      const texto = state.cards[state.index];
      if (!texto || !texto.trim()) { log(`Bloco ${n} está vazio, pulando.`); state.index++; salvar(); pintar(); continue; }

      log(`${n}/${state.cards.length} · enviando bloco ${n}`);

      const r = await enviar(texto);
      if (!r.ok) { log(r.erro, 'err'); parar(); return; }

      log(`Bloco ${n} enviado (${r.via})`, 'ok');
      state.index++;
      salvar();
      pintar();
      setTimeout(() => { if (state.trackingImages) registrarNovasImagensDaPagina(); }, 2500);

      if (state.index < state.cards.length) await esperarIntervalo(state.intervalo);
    }

    if (state.index >= state.cards.length && state.running) {
      log('Fila concluída.', 'ok');
      parar();
    }
  }

  function parar() {
    state.running = false;
    state.paused = false;
    if (abortWait) { abortWait(); abortWait = null; }
    els.restante.textContent = '—';
    pintar();
  }

  /* ---------- construção dos blocos ---------- */

  function adicionarBlocosEmBranco(qtd) {
    qtd = Math.max(1, Math.min(50, qtd || 1));
    for (let i = 0; i < qtd; i++) state.cards.push(montarPromptFinal(''));
    if (state.index > state.cards.length) state.index = state.cards.length;
    salvar();
    montarCards();
    pintar();
    return qtd;
  }

  function montarPromptFinal(conteudo) {
    const base = montarPromptBaseComBranding();
    if (/CONTEÚDO DESTA IMAGEM:\s*$/i.test(base)) return base + '\n' + conteudo;
    return base + '\n\nCONTEÚDO DESTA IMAGEM:\n' + conteudo;
  }

  function gerarComIA() {
    const apiKey = els.apiKey.value.trim();
    const tema = els.tema.value.trim();
    const min = 8;
    const max = 12;
    els.min.value = min;
    els.max.value = max;
    const modelo = els.modeloIA.value.trim() || 'gemini-3.1-flash-lite';
    const regras = els.regras.value.trim();

    if (!apiKey) {
      els.avancadoBody.hidden = false;
      els.avancadoChev.classList.add('ffila-rot');
      els.apiKey.focus();
      log('Abra "Avançado" e cole sua chave de API do Gemini.', 'err');
      return;
    }
    if (!tema) { log('Escreva o tema do carrossel.', 'err'); return; }

    state.apiKey = apiKey; state.tema = tema; state.min = min; state.max = max;
    state.modeloIA = modelo; state.regras = regras;
    salvar();

    els.gerarIA.disabled = true;
    const rotuloOriginal = els.gerarIA.textContent;
    els.gerarIA.textContent = 'Gerando…';
    log(`Pedindo ao Gemini (${modelo}) um carrossel de ${min} a ${max} imagens sobre "${tema}"…`);

    chrome.runtime.sendMessage(
      { type: 'ffila-gerar-ia', apiKey, modelo, tema, min, max, regras },
      resp => {
        els.gerarIA.disabled = false;
        els.gerarIA.textContent = rotuloOriginal;

        if (chrome.runtime.lastError) {
          log('Erro de comunicação com a extensão: ' + chrome.runtime.lastError.message, 'err');
          return;
        }
        if (!resp || !resp.ok) {
          log('Erro ao gerar com o Gemini: ' + (resp && resp.erro ? resp.erro : 'desconhecido'), 'err');
          return;
        }

        state.cards = resp.itens.map(montarPromptFinal);
        state.index = 0;
        salvar();
        montarCards();
        pintar();
        log(`${resp.itens.length} bloco(s) gerado(s) pelo Gemini a partir do tema "${tema}".`, 'ok');
      }
    );
  }

  function resumoDoCard(texto) {
    const marcador = /CONTEÚDO DESTA IMAGEM:\s*/i;
    const parte = marcador.test(texto) ? texto.split(marcador).pop() : texto;
    const limpo = parte.trim().replace(/\s+/g, ' ');
    return limpo ? (limpo.length > 46 ? limpo.slice(0, 46) + '…' : limpo) : '(vazio)';
  }

  function montarCards() {
    els.cards.innerHTML = '';
    if (!state.cards.length) {
      els.cards.innerHTML = '<p class="ffila-empty">Gere um carrossel com IA ou clique em "+ em branco" para começar.</p>';
      return;
    }
    state.cards.forEach((texto, i) => {
      const card = document.createElement('div');
      card.className = 'ffila-card';
      if (i < state.index) card.classList.add('ffila-done');
      if (i === state.index && state.running) card.classList.add('ffila-active');

      card.innerHTML = `
        <button type="button" class="ffila-card-head">
          <span class="ffila-card-num">${i + 1}</span>
          <span class="ffila-card-titlewrap">
            <span class="ffila-card-title">Imagem ${i + 1} de ${state.cards.length}</span>
            <span class="ffila-card-resumo">${resumoDoCard(texto)}</span>
          </span>
          <span class="ffila-card-chevron">▾</span>
          <span class="ffila-card-remove" title="Remover este bloco">✕</span>
        </button>
        <div class="ffila-card-corpo">
          <textarea spellcheck="false"></textarea>
        </div>`;

      const area = card.querySelector('textarea');
      area.value = texto;
      area.addEventListener('input', () => {
        state.cards[i] = area.value;
        card.querySelector('.ffila-card-resumo').textContent = resumoDoCard(area.value);
        salvar();
      });

      card.querySelector('.ffila-card-head').addEventListener('click', e => {
        if (e.target.closest('.ffila-card-remove')) {
          state.cards.splice(i, 1);
          if (state.index > i) state.index--;
          salvar();
          montarCards();
          pintar();
          return;
        }
        card.classList.toggle('ffila-aberto');
      });

      els.cards.appendChild(card);
    });
  }

  /* ---------- painel ---------- */

  function log(msg, tipo) {
    const linha = document.createElement('div');
    if (tipo) linha.className = tipo === 'err' ? 'ffila-err' : 'ffila-ok';
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    linha.textContent = `${hora} · ${msg}`;
    els.log.prepend(linha);
    while (els.log.childElementCount > 40) els.log.lastElementChild.remove();

    if (els.ultima) {
      els.ultima.textContent = msg;
      els.ultima.className = tipo === 'err' ? 'ffila-err' : tipo === 'ok' ? 'ffila-ok' : '';
    }
  }

  function pintar() {
    const total = state.cards.length;
    els.contagem.innerHTML = `<strong>${Math.min(state.index, total)}</strong> de <strong>${total}</strong>`;
    els.root.classList.toggle('ffila-running', state.running && !state.paused);
    els.iniciar.textContent = state.running ? (state.paused ? 'Retomar' : 'Pausar') : 'Iniciar fila';
    els.iniciar.classList.toggle('ffila-primary', !state.running || state.paused);
    els.iniciar.disabled = !total;
    els.parar.disabled = !state.running && state.index === 0;
    [...els.cards.children].forEach((card, i) => {
      card.classList.toggle('ffila-done', i < state.index);
      const ativo = i === state.index && state.running;
      card.classList.toggle('ffila-active', ativo);
      if (ativo) card.classList.add('ffila-aberto');
    });
  }

  function seletorDe(el) {
    const partes = [];
    while (el && el.nodeType === 1 && partes.length < 6) {
      let s = el.tagName.toLowerCase();
      if (el.id && !/\d{4,}/.test(el.id)) { partes.unshift(s + '#' + CSS.escape(el.id)); break; }
      const cls = [...el.classList].filter(c => !/\d{3,}/.test(c)).slice(0, 2);
      if (cls.length) s += '.' + cls.map(c => CSS.escape(c)).join('.');
      const pai = el.parentElement;
      if (pai) {
        const irmaos = [...pai.children].filter(c => c.tagName === el.tagName);
        if (irmaos.length > 1) s += `:nth-of-type(${irmaos.indexOf(el) + 1})`;
      }
      partes.unshift(s);
      el = pai;
    }
    return partes.join(' > ');
  }

  function escolherCampo() {
    log('Clique na caixa de texto do Flow. Esc cancela.');
    document.body.classList.add('ffila-picking');
    let ultimo = null;

    const sobre = e => {
      if (ultimo) ultimo.classList.remove('ffila-target-outline');
      if (!meuPainel(e.target)) { ultimo = e.target; ultimo.classList.add('ffila-target-outline'); }
    };
    const clique = e => {
      if (meuPainel(e.target)) return;
      e.preventDefault(); e.stopPropagation();
      state.seletor = seletorDe(e.target);
      salvar();
      log('Campo salvo: ' + state.seletor.slice(0, 60), 'ok');
      fim();
    };
    const tecla = e => { if (e.key === 'Escape') { log('Seleção cancelada.'); fim(); } };
    const fim = () => {
      document.body.classList.remove('ffila-picking');
      if (ultimo) ultimo.classList.remove('ffila-target-outline');
      document.removeEventListener('mouseover', sobre, true);
      document.removeEventListener('click', clique, true);
      document.removeEventListener('keydown', tecla, true);
    };

    document.addEventListener('mouseover', sobre, true);
    document.addEventListener('click', clique, true);
    document.addEventListener('keydown', tecla, true);
  }

  function arrastar(cabeca, raiz) {
    let dx = 0, dy = 0, ativo = false;
    cabeca.addEventListener('mousedown', e => {
      if (e.target.closest('.ffila-iconbtn')) return;
      const r = raiz.getBoundingClientRect();
      dx = e.clientX - r.left; dy = e.clientY - r.top; ativo = true;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!ativo) return;
      const x = Math.min(Math.max(0, e.clientX - dx), innerWidth - raiz.offsetWidth);
      const y = Math.min(Math.max(0, e.clientY - dy), innerHeight - 40);
      raiz.style.left = x + 'px';
      raiz.style.top = y + 'px';
      raiz.style.right = 'auto';
      state.left = x; state.top = y;
    });
    document.addEventListener('mouseup', () => { if (ativo) { ativo = false; salvar(); } });
  }

  function montar() {
    const root = document.createElement('div');
    root.id = 'ffila-root';
    root.innerHTML = `
      <div class="ffila-head">
        <span class="ffila-dot"></span>
        <span class="ffila-title">Fila de prompts</span>
        <button class="ffila-iconbtn" id="ffila-recolher" title="Recolher">—</button>
      </div>
      <div class="ffila-body">

        <div class="ffila-section">
          <button type="button" class="ffila-collapsible-head" id="ffila-base-toggle">
            <span>Estilo do post (prompt-base)</span>
            <span class="ffila-chev" id="ffila-base-chev">▾</span>
          </button>
          <div id="ffila-base-body" class="ffila-collapsible-body" hidden>
            <textarea id="ffila-base" spellcheck="false"></textarea>
            <button class="ffila-linkbtn" id="ffila-restaurar" style="margin-top:6px">restaurar padrão</button>
          </div>
        </div>

        <div class="ffila-section">
          <label class="ffila-label" for="ffila-tema">Tema do carrossel</label>
          <input type="text" id="ffila-tema" placeholder="ex: princípios penais">

          <div class="ffila-ai-range" style="margin-top:8px">
            <strong>8 a 12 cards</strong> · a IA escolhe automaticamente a quantidade ideal para o tema.
          </div>
          <input type="hidden" id="ffila-min" value="8">
          <input type="hidden" id="ffila-max" value="12">

          <button type="button" class="ffila-linkbtn" id="ffila-regras-toggle" style="margin-top:8px">+ regras extras para a IA</button>
          <div id="ffila-regras-body" class="ffila-collapsible-body" hidden>
            <textarea id="ffila-regras" spellcheck="false" placeholder="ex: sempre citar o artigo de lei correspondente; título com no máximo 6 palavras"></textarea>
          </div>

          <button class="ffila-btn ffila-ai ffila-wide" id="ffila-gerar-ia" style="margin-top:10px">Gerar carrossel com IA</button>
        </div>

        <div class="ffila-section">
          <div class="ffila-row">
            <div>
              <label class="ffila-label" for="ffila-handle">Arroba aplicado no ZIP</label>
              <input type="text" id="ffila-handle" placeholder="@seuperfil" value="@estudosjuridicos.app">
            </div>
            <div style="display:none">
              <label class="ffila-label" for="ffila-logo">Logo / nome da marca</label>
              <input type="text" id="ffila-logo" placeholder="ex: Estudos Jurídicos">
            </div>
          </div>
          <p class="ffila-minihelp">O arroba não vai para o prompt nem para a geração. Ele será aplicado por fora, automaticamente, nas imagens do ZIP exportado.</p>
          <div class="ffila-actions">
            <button class="ffila-btn" id="ffila-baixar-zip">Baixar geradas (.zip)</button>
            <button class="ffila-btn" id="ffila-limpar-geradas">Limpar geradas</button>
          </div>
          <div class="ffila-status">
            <span id="ffila-geradas-info">0 imagem(ns) rastreada(s)</span>
          </div>
        </div>

        <div class="ffila-section">
          <div class="ffila-labelrow">
            <span class="ffila-label">Blocos</span>
            <span class="ffila-toolsrow">
              <input type="number" id="ffila-qtd" min="1" max="50" value="1" class="ffila-qtdmini">
              <button class="ffila-linkbtn" id="ffila-gerar">+ em branco</button>
              <button class="ffila-linkbtn" id="ffila-abrir-todos">abrir</button>
              <button class="ffila-linkbtn" id="ffila-fechar-todos">fechar</button>
            </span>
          </div>
          <div id="ffila-cards"></div>
        </div>

        <div class="ffila-section">
          <div class="ffila-row">
            <div>
              <label class="ffila-label" for="ffila-intervalo">Intervalo (s)</label>
              <input type="number" id="ffila-intervalo" min="3" max="600" value="3">
            </div>
            <div>
              <label class="ffila-label" for="ffila-modo">Envio</label>
              <select id="ffila-modo">
                <option value="auto">Automático</option>
                <option value="botao">Botão de enviar</option>
                <option value="enter">Tecla Enter</option>
              </select>
            </div>
          </div>
          <div class="ffila-actions">
            <button class="ffila-btn ffila-primary" id="ffila-iniciar">Iniciar fila</button>
            <button class="ffila-btn" id="ffila-parar">Parar</button>
          </div>
          <div class="ffila-status">
            <span id="ffila-contagem"><strong>0</strong> de <strong>0</strong></span>
            <span>próximo em <strong id="ffila-restante">—</strong></span>
          </div>
          <div id="ffila-ultima"></div>
        </div>

        <div class="ffila-section">
          <button type="button" class="ffila-collapsible-head" id="ffila-avancado-toggle">
            <span>Avançado</span>
            <span class="ffila-chev" id="ffila-avancado-chev">▾</span>
          </button>
          <div id="ffila-avancado-body" class="ffila-collapsible-body" hidden>
            <label class="ffila-label" for="ffila-apikey">Chave de API do Gemini</label>
            <input type="password" id="ffila-apikey" placeholder="cole sua chave aqui">
            <button type="button" class="ffila-linkbtn" id="ffila-mostrar-chave" style="margin-top:4px">mostrar chave</button>

            <label class="ffila-label" for="ffila-modeloia" style="margin-top:8px">Modelo</label>
            <input type="text" id="ffila-modeloia" value="gemini-3.1-flash-lite">

            <div class="ffila-actions">
              <button class="ffila-btn" id="ffila-escolher">Escolher campo</button>
              <button class="ffila-btn" id="ffila-zerar">Zerar progresso</button>
            </div>

            <div id="ffila-log"></div>
          </div>
        </div>

        <p class="ffila-hint">A aba precisa ficar aberta. Se o envio falhar, abra "Avançado" → "Escolher campo".</p>
      </div>`;
    document.body.appendChild(root);

    els = {
      root,
      base: root.querySelector('#ffila-base'),
      baseToggle: root.querySelector('#ffila-base-toggle'),
      baseBody: root.querySelector('#ffila-base-body'),
      baseChev: root.querySelector('#ffila-base-chev'),
      restaurar: root.querySelector('#ffila-restaurar'),
      qtd: root.querySelector('#ffila-qtd'),
      gerar: root.querySelector('#ffila-gerar'),
      apiKey: root.querySelector('#ffila-apikey'),
      mostrarChave: root.querySelector('#ffila-mostrar-chave'),
      tema: root.querySelector('#ffila-tema'),
      min: root.querySelector('#ffila-min'),
      max: root.querySelector('#ffila-max'),
      modeloIA: root.querySelector('#ffila-modeloia'),
      regras: root.querySelector('#ffila-regras'),
      regrasToggle: root.querySelector('#ffila-regras-toggle'),
      regrasBody: root.querySelector('#ffila-regras-body'),
      gerarIA: root.querySelector('#ffila-gerar-ia'),
      handle: root.querySelector('#ffila-handle'),
      logo: root.querySelector('#ffila-logo'),
      baixarZip: root.querySelector('#ffila-baixar-zip'),
      limparGeradas: root.querySelector('#ffila-limpar-geradas'),
      geradasInfo: root.querySelector('#ffila-geradas-info'),
      cards: root.querySelector('#ffila-cards'),
      abrirTodos: root.querySelector('#ffila-abrir-todos'),
      fecharTodos: root.querySelector('#ffila-fechar-todos'),
      intervalo: root.querySelector('#ffila-intervalo'),
      modo: root.querySelector('#ffila-modo'),
      iniciar: root.querySelector('#ffila-iniciar'),
      parar: root.querySelector('#ffila-parar'),
      escolher: root.querySelector('#ffila-escolher'),
      zerar: root.querySelector('#ffila-zerar'),
      contagem: root.querySelector('#ffila-contagem'),
      restante: root.querySelector('#ffila-restante'),
      ultima: root.querySelector('#ffila-ultima'),
      avancadoToggle: root.querySelector('#ffila-avancado-toggle'),
      avancadoBody: root.querySelector('#ffila-avancado-body'),
      avancadoChev: root.querySelector('#ffila-avancado-chev'),
      log: root.querySelector('#ffila-log'),
      recolher: root.querySelector('#ffila-recolher')
    };

    els.base.value = state.basePrompt;
    els.qtd.value = 1;
    els.apiKey.value = state.apiKey || '';
    els.tema.value = state.tema || '';
    els.min.value = 8;
    els.max.value = 12;
    els.modeloIA.value = state.modeloIA || 'gemini-3.1-flash-lite';
    els.regras.value = state.regras || '';
    els.handle.value = state.instaHandle || '';
    els.logo.value = state.logoTexto || '';
    els.intervalo.value = state.intervalo;
    els.modo.value = state.modo;
    if (state.left != null) { root.style.left = state.left + 'px'; root.style.top = state.top + 'px'; root.style.right = 'auto'; }
    if (state.collapsed) root.classList.add('ffila-collapsed');

    // abre sozinho o que já tiver sido customizado, pra não esconder ajustes que o usuário já fez
    if (state.basePrompt && state.basePrompt !== PROMPT_BASE_PADRAO) {
      els.baseBody.hidden = false; els.baseChev.classList.add('ffila-rot');
    }
    if (state.regras && state.regras.trim()) {
      els.regrasBody.hidden = false; els.regrasToggle.textContent = 'ocultar regras extras';
    }

    montarCards();

    els.baseToggle.addEventListener('click', () => {
      els.baseBody.hidden = !els.baseBody.hidden;
      els.baseChev.classList.toggle('ffila-rot', !els.baseBody.hidden);
    });

    els.base.addEventListener('input', () => { state.basePrompt = els.base.value; salvar(); });
    els.restaurar.addEventListener('click', () => {
      els.base.value = PROMPT_BASE_PADRAO;
      state.basePrompt = PROMPT_BASE_PADRAO;
      salvar();
      log('Prompt-base restaurado ao padrão.');
    });

    els.regrasToggle.addEventListener('click', () => {
      const abrir = els.regrasBody.hidden;
      els.regrasBody.hidden = !abrir;
      els.regrasToggle.textContent = abrir ? 'ocultar regras extras' : '+ regras extras para a IA';
    });

    els.gerar.addEventListener('click', () => {
      const qtd = parseInt(els.qtd.value, 10) || 1;
      const n = adicionarBlocosEmBranco(qtd);
      log(`${n} bloco(s) em branco adicionado(s).`);
    });

    els.gerarIA.addEventListener('click', gerarComIA);

    els.mostrarChave.addEventListener('click', () => {
      const oculta = els.apiKey.type === 'password';
      els.apiKey.type = oculta ? 'text' : 'password';
      els.mostrarChave.textContent = oculta ? 'ocultar chave' : 'mostrar chave';
    });

    els.apiKey.addEventListener('input', () => { state.apiKey = els.apiKey.value; salvar(); });
    els.tema.addEventListener('input', () => { state.tema = els.tema.value; salvar(); });
    els.min.addEventListener('change', () => {
      state.min = 8; state.max = 12;
      els.min.value = 8; els.max.value = 12; salvar();
    });
    els.max.addEventListener('change', () => {
      state.min = 8; state.max = 12;
      els.min.value = 8; els.max.value = 12; salvar();
    });
    els.modeloIA.addEventListener('input', () => { state.modeloIA = els.modeloIA.value; salvar(); });
    els.regras.addEventListener('input', () => { state.regras = els.regras.value; salvar(); });
    els.handle.addEventListener('input', () => { state.instaHandle = els.handle.value.trim(); salvar(); });
    els.logo.addEventListener('input', () => { state.logoTexto = els.logo.value.trim(); salvar(); });
    els.baixarZip.addEventListener('click', baixarGeradasZip);
    els.limparGeradas.addEventListener('click', limparGeradas);

    els.abrirTodos.addEventListener('click', () => {
      els.cards.querySelectorAll('.ffila-card').forEach(c => c.classList.add('ffila-aberto'));
    });
    els.fecharTodos.addEventListener('click', () => {
      els.cards.querySelectorAll('.ffila-card').forEach(c => c.classList.remove('ffila-aberto'));
    });

    els.iniciar.addEventListener('click', () => {
      if (state.running) {
        state.paused = !state.paused;
        if (!state.paused && abortWait) { abortWait(); abortWait = null; }
        log(state.paused ? 'Pausado.' : 'Retomando.');
        pintar();
        return;
      }
      if (!state.cards.length) { log('Gere os blocos primeiro.', 'err'); return; }
      state.intervalo = Math.max(3, parseInt(els.intervalo.value, 10) || 3);
      state.modo = els.modo.value;
      if (state.index >= state.cards.length) state.index = 0;
      iniciarRastreamentoDeImagens();
      salvar();
      log(`Fila iniciada: ${state.cards.length} imagem(ns), ${state.intervalo}s entre cada.`);
      rodar();
    });

    els.parar.addEventListener('click', () => { parar(); log('Parado.'); });

    els.zerar.addEventListener('click', () => {
      parar(); state.index = 0; state.generatedImages = []; state.batchBaselineImages = []; state.trackingImages = false; state.expectedImages = 0;
      salvar(); pintar(); montarCards(); atualizarInfoGeradas(); log('Progresso zerado.');
    });

    els.escolher.addEventListener('click', escolherCampo);

    els.avancadoToggle.addEventListener('click', () => {
      els.avancadoBody.hidden = !els.avancadoBody.hidden;
      els.avancadoChev.classList.toggle('ffila-rot', !els.avancadoBody.hidden);
    });

    els.recolher.addEventListener('click', () => {
      root.classList.toggle('ffila-collapsed');
      state.collapsed = root.classList.contains('ffila-collapsed');
      salvar();
    });

    els.intervalo.addEventListener('change', () => {
      state.intervalo = Math.max(3, parseInt(els.intervalo.value, 10) || 3);
      els.intervalo.value = state.intervalo; salvar();
    });
    els.modo.addEventListener('change', () => { state.modo = els.modo.value; salvar(); });

    arrastar(root.querySelector('.ffila-head'), root);
    observarImagens();
    pintar();
    atualizarInfoGeradas();
  }

  carregar().then(() => {
    if (document.body) montar();
    else document.addEventListener('DOMContentLoaded', montar);
  });
})();
