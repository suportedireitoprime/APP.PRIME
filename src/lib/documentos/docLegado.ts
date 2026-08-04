/**
 * Extração de texto de arquivos .doc (Word 97-2003, formato binário CFB).
 * Lê o stream "WordDocument", resolve o piece table (Clx) do stream de tabela
 * e decodifica cada peça em windows-1252 ou UTF-16LE, como manda o formato.
 * Assim o texto sai limpo (sem lixo binário) e com parágrafos preservados.
 */

const CONTROLE_PARAGRAFO = 0x0d;
const CONTROLE_CELULA = 0x07;
const CONTROLE_QUEBRA_LINHA = 0x0b;
const CONTROLE_QUEBRA_PAGINA = 0x0c;
const CAMPO_INICIO = 0x13;
const CAMPO_SEPARADOR = 0x14;
const CAMPO_FIM = 0x15;

const dec1252 = () => {
  try {
    return new TextDecoder('windows-1252');
  } catch {
    return new TextDecoder('iso-8859-1');
  }
};

interface Peca {
  inicio: number;
  bytes: number;
  comprimido: boolean;
}

function lerPieceTable(tabela: Uint8Array, fcClx: number, lcbClx: number, cps: number[]): Peca[] {
  const view = new DataView(tabela.buffer, tabela.byteOffset, tabela.byteLength);
  let p = fcClx;
  const fim = Math.min(fcClx + lcbClx, tabela.length);

  while (p < fim) {
    const tipo = tabela[p];
    if (tipo === 0x01) {
      const cb = view.getUint16(p + 1, true);
      p += 3 + cb;
      continue;
    }
    if (tipo === 0x02) {
      const lcb = view.getUint32(p + 1, true);
      const inicio = p + 5;
      const n = Math.floor((lcb - 4) / 12);
      const pecas: Peca[] = [];
      for (let i = 0; i < n; i++) {
        cps.push(view.getUint32(inicio + i * 4, true));
        const pcd = inicio + (n + 1) * 4 + i * 8;
        let fc = view.getUint32(pcd + 2, true);
        const comprimido = (fc & 0x40000000) !== 0;
        if (comprimido) fc = (fc & ~0x40000000) >>> 1;
        pecas.push({ inicio: fc, bytes: 0, comprimido });
      }
      cps.push(view.getUint32(inicio + n * 4, true));
      for (let i = 0; i < n; i++) {
        const chars = cps[i + 1] - cps[i];
        pecas[i].bytes = pecas[i].comprimido ? chars : chars * 2;
      }
      return pecas;
    }
    break;
  }
  return [];
}

function limparTexto(bruto: string): string {
  let saida = '';
  let dentroDeCampo = false;

  for (const ch of bruto) {
    const c = ch.charCodeAt(0);
    if (c === CAMPO_INICIO) {
      dentroDeCampo = true;
      continue;
    }
    if (c === CAMPO_SEPARADOR) {
      dentroDeCampo = false;
      continue;
    }
    if (c === CAMPO_FIM) {
      dentroDeCampo = false;
      continue;
    }
    if (dentroDeCampo) continue;

    if (c === CONTROLE_PARAGRAFO || c === CONTROLE_QUEBRA_LINHA || c === CONTROLE_QUEBRA_PAGINA) {
      saida += '\n';
      continue;
    }
    if (c === CONTROLE_CELULA) {
      saida += '\t';
      continue;
    }
    if (c === 0x09) {
      saida += '\t';
      continue;
    }
    if (c < 0x20) continue;
    if (c === 0xfffe || c === 0xffff) continue;
    saida += ch;
  }

  return saida
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Retorna os parágrafos do .doc ou null quando não foi possível extrair. */
export async function extrairTextoDoc(blob: Blob): Promise<string[] | null> {
  try {
    const CFB: any = await import('cfb');
    const buf = new Uint8Array(await blob.arrayBuffer());
    const cont = (CFB.default ?? CFB).read(buf, { type: 'array' });

    const acharStream = (nome: string): Uint8Array | null => {
      const alvo = nome.toLowerCase();
      const entrada = cont.FullPaths
        ? cont.FileIndex.find((_: any, i: number) => String(cont.FullPaths[i]).toLowerCase().endsWith(alvo))
        : cont.FileIndex.find((f: any) => String(f.name).toLowerCase() === alvo);
      if (!entrada?.content) return null;
      return entrada.content instanceof Uint8Array ? entrada.content : new Uint8Array(entrada.content);
    };

    const wd = acharStream('worddocument');
    if (!wd || wd.length < 0x200) return null;

    const view = new DataView(wd.buffer, wd.byteOffset, wd.byteLength);
    const flags = view.getUint16(0x000a, true);
    const usaTabela1 = (flags & 0x0200) !== 0;
    const tabela = acharStream(usaTabela1 ? '1table' : '0table') ?? acharStream('0table') ?? acharStream('1table');

    const dec = dec1252();
    const decUtf16 = new TextDecoder('utf-16le');

    let bruto = '';
    const fcClx = view.getUint32(0x01a2, true);
    const lcbClx = view.getUint32(0x01a6, true);

    if (tabela && lcbClx > 0 && fcClx + lcbClx <= tabela.length) {
      const cps: number[] = [];
      const pecas = lerPieceTable(tabela, fcClx, lcbClx, cps);
      for (const peca of pecas) {
        const ini = peca.inicio;
        const fim = Math.min(ini + peca.bytes, wd.length);
        if (ini >= fim) continue;
        const trecho = wd.subarray(ini, fim);
        bruto += peca.comprimido ? dec.decode(trecho) : decUtf16.decode(trecho);
      }
    }

    if (bruto.trim().length < 40) {
      // Sem piece table utilizável: cai para o intervalo fcMin..fcMac do FIB.
      const fcMin = view.getUint32(0x0018, true);
      const fcMac = view.getUint32(0x001c, true);
      if (fcMac > fcMin && fcMac <= wd.length) {
        bruto = dec.decode(wd.subarray(fcMin, fcMac));
      }
    }

    const limpo = limparTexto(bruto);
    if (limpo.length < 40) return null;

    return limpo
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  } catch (e) {
    console.error('doc legado:', e);
    return null;
  }
}
