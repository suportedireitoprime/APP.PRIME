---
name: salvar-lousa-magica
description: Skill especialista para processar, modularizar e salvar novas aulas da Lousa Mágica (Chalkboard Animation) nas pastas modulares (public/lousa-magica/aulas/<slug>/), extraindo áudio Base64 para MP3 real, imagens para WebP, e separando cenas e legendas em chunks leves sem inchar o código.
---

# 🪄 Skill: Salvar e Modularizar Aula na Lousa Mágica (salvar-lousa-magica)

Esta skill define o protocolo **obrigatório e padronizado** para qualquer IA processar, fatiar e salvar uma nova aula de **Lousa Mágica (Chalkboard Animation)** no projeto, transformando arquivos HTML pesados e monolíticos (~6 MB) em módulos leves, rápidos e organizados em chunks.

---

## 🎯 Quando Usar
Esta skill DEVE ser acionada sempre que o usuário solicitar:
- *"Salve essa nova lousa nas pastas"*
- *"Adicione essa aula na lousa mágica"*
- *"Divida e salve esse HTML de lousa mágica"*
- *"Recebi o arquivo X de lousa, organize no projeto"*
- *"Modularize essa aula para o player da lousa"*

---

## 📂 Arquitetura de Pastas Destino

Toda nova aula **NUNCA** deve ser salva como um único arquivo HTML inchado. Ela DEVE ser desmembrada dentro de:

```
public/lousa-magica/aulas/<slug-da-aula>/
├── cenas.js          # Apenas o objeto LESSONS da aula (~14 KB)
├── legendas.js       # Apenas o array SUBS sincronizado (~3 KB)
├── audio.mp3         # O arquivo de áudio real descompactado (MP3 nativo)
└── assets/           # Imagens e ilustrações da aula em WebP/PNG
    ├── retrato.webp
    └── diagrama.webp
```

O núcleo compartilhado (`public/lousa-magica/core/`) nunca deve ser duplicado, pois já contém o CSS, o bundle de bibliotecas (GSAP, Rough.js, Vivus) e os efeitos sonoros compartilhados.

---

## 🛠️ Passo a Passo Obrigatório para a IA

### Passo 1: Definir o Slug da Aula
A partir do nome do tema ou autor, crie um identificador curto em formato `kebab-case`:
- Hans Kelsen → `hans-kelsen`
- Cesare Beccaria → `cesare-beccaria`
- Teoria do Delito → `teoria-do-delito`

Crie o diretório correspondente:
`public/lousa-magica/aulas/<slug>/assets/`

---

### Passo 2: Extrair o Áudio (Base64 → MP3 Real)
Se o material fornecido trouxer o áudio em formato Base64 (`data:audio/mpeg;base64,...` ou `const AUDIOS = { ... }`):
1. Isole a string Base64 limpa (após a vírgula do cabeçalho `base64,`).
2. Converta os bytes para Buffer binário: `Buffer.from(base64String, 'base64')`.
3. Salve diretamente no arquivo:
   `public/lousa-magica/aulas/<slug>/audio.mp3`
*(Isso reduz o peso em 33% e permite streaming de áudio com scrubbing instantâneo).*

---

### Passo 3: Extrair as Imagens (Base64 → WebP/PNG)
Se existirem ilustrações dentro de `const IMAGES = { ... }`:
1. Para cada imagem no objeto, extraia o Base64.
2. Salve em arquivo individual dentro de:
   `public/lousa-magica/aulas/<slug>/assets/<nome-da-imagem>.webp`
3. No arquivo de cenas, troque a string Base64 pelo caminho relativo: `aulas/<slug>/assets/<nome-da-imagem>.webp`.

---

### Passo 4: Salvar o Roteiro de Desenho (`cenas.js`)
Isole a declaração da aula a partir do objeto `LESSONS['<slug>']`:
1. O arquivo deve registrar a aula no escopo global para o motor:
```javascript
window.LESSONS = window.LESSONS || {};
window.LESSONS['<slug>'] = {
  id: '<slug>',
  title: 'Título da Aula',
  author: 'Nome do Professor ou Escola',
  dur: 159.0, // Duração em segundos
  scenes: [
    // Array com todos os quadros e comandos de desenho
  ]
};
```
2. Salve em: `public/lousa-magica/aulas/<slug>/cenas.js`.

---

### Passo 5: Salvar as Legendas (`legendas.js`)
Isole o array de marcações de tempo do objeto `SUBS['<slug>']`:
```javascript
window.SUBS = window.SUBS || {};
window.SUBS['<slug>'] = [
  { a: 0.0, b: 3.5, txt: 'Texto falado no trecho de 0 a 3.5 segundos.' },
  { a: 3.5, b: 7.2, txt: 'Texto falado no trecho seguinte.' }
];
```
Salve em: `public/lousa-magica/aulas/<slug>/legendas.js`.

---

### Passo 6: Registrar a Nova Aula no Catálogo
Abra o seletor ou catálogo de aulas em `src/data/lousaCatalog.ts` (ou arquivo de rotas/aulas) e adicione o novo registro:
```typescript
{
  id: '<slug>',
  titulo: 'Nome Completo da Aula',
  autor: 'Autor / Matéria',
  duracao: '~3 min',
  pasta: '/lousa-magica/aulas/<slug>/'
}
```

---

## ⚡ Script Automatizador em Node.js (Snippet para a IA Rodar Direto)

Caso o usuário entregue um arquivo HTML completo (ex: `nova-aula.html`), a IA pode executar o desmembrador automático:

```javascript
const fs = require('fs');
const path = require('path');

function modularizarLousa(caminhoHtml, slug) {
  const html = fs.readFileSync(caminhoHtml, 'utf8');
  const pastaDestino = path.join('public', 'lousa-magica', 'aulas', slug);
  const pastaAssets = path.join(pastaDestino, 'assets');
  fs.mkdirSync(pastaAssets, { recursive: true });

  // 1. Áudio MP3
  const matchAudio = html.match(/const AUDIOS\s*=\s*\{[^:]+:\s*"data:audio\/[^;]+;base64,([A-Za-z0-9+/=]+)"/);
  if (matchAudio && matchAudio[1]) {
    fs.writeFileSync(path.join(pastaDestino, 'audio.mp3'), Buffer.from(matchAudio[1], 'base64'));
  }

  // 2. Cenas
  const matchCenas = html.match(/const LESSONS\s*=\s*\{([\s\S]*?)\};\s*const SUBS/);
  if (matchCenas) {
    fs.writeFileSync(path.join(pastaDestino, 'cenas.js'), 'window.LESSONS = window.LESSONS || {};\nwindow.LESSONS = {' + matchCenas[1] + '};');
  }

  // 3. Legendas
  const matchSubs = html.match(/const SUBS\s*=\s*\{([\s\S]*?)\};\s*const AUDIOS/);
  if (matchSubs) {
    fs.writeFileSync(path.join(pastaDestino, 'legendas.js'), 'window.SUBS = window.SUBS || {};\nwindow.SUBS = {' + matchSubs[1] + '};');
  }

  console.log(`Aula ${slug} modularizada com sucesso em ${pastaDestino}`);
}
```

---

## ✅ Checklist de Conclusão da IA
- [ ] O áudio foi extraído para `audio.mp3` real (sem Base64 no JS)?
- [ ] As imagens foram salvas na pasta `assets/`?
- [ ] O arquivo `cenas.js` contém apenas o roteiro leve dos quadros?
- [ ] O arquivo `legendas.js` foi separado?
- [ ] A pasta modular foi copiada para o repositório principal e testada?
- [ ] Commit e push automáticos foram realizados no Git?
