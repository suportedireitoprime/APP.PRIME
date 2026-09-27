# Plano de Implementação — Imagem de Equipe (Vários Cargos) & Bandeiras dos Estados em Lista

## 1. Visão Geral das Solicitações do Usuário

O usuário enviou 2 áudios e 2 mídias com duas solicitações claras:
1. **Áudio 1 & Imagem de Equipe:**
   - Quando o edital for para **"Vários Cargos"** (curinga / múltiplos cargos), substituir a imagem anterior (escudo dourado) pela nova imagem enviada pelo usuário contendo a **equipe de diversos profissionais** (professora, policial/delegado, engenheiro, profissional de saúde, auxiliar de limpeza e juíza).
   - A imagem deve ter o fundo preto removido com transparência pura (RGBA WebP) e antialiasing suave, sem bordas brancas, preservando as roupas escuras.
2. **Áudio 2 & Screenshot da Lista (`/concursos`):**
   - Na exibição em lista, atrás dos avatares 3D de cada cargo, renderizar a **bandeira do estado correspondente** em segundo plano (`opacity-20` a `opacity-25` suave), atuando como marca d'água / contorno sutil que contextualiza a UF da vaga sem poluir o visual.
   - Fornecer os assets oficiais em vetor SVG de todas as 27 UFs brasileiras + Brasil em `public/bandeiras/` para carregamento instantâneo a 0ms e operação offline.

---

## 2. Detalhamento Técnico

### A. Imagem de Equipe ("Vários Cargos")
- Imagem enviada: `media_1790479193678.jpg` (1024x1024).
- Processamento:
  - Fundo preto recortado via flood-fill de bordas com threshold de antialiasing suave para canal alfa.
  - Redimensionada para 384x384 WebP otimizada (`public/profissoes/14_curinga_cargo_generico.webp`).
  - Atualização em `concursosVisuais.ts` para que `PROFISSOES_MAP` aponte para os assets locais em `/profissoes/` com carregamento 0ms e offline.
  - Refinamento do classificador para reconhecer `\bdpe\b`, `\bdpu\b` (Defensoria), `\bif[a-z]{2}\b` (Institutos Federais), `ambiental`, etc.

### B. Bandeiras dos Estados em Segundo Plano na Lista (`Concursos.tsx`)
- 28 bandeiras vetoriais SVG baixadas e salvas em `public/bandeiras/`:
  - `ac.svg`, `al.svg`, `ap.svg`, `am.svg`, `ba.svg`, `ce.svg`, `df.svg`, `es.svg`, `go.svg`, `ma.svg`, `mt.svg`, `ms.svg`, `mg.svg`, `pa.svg`, `pb.svg`, `pr.svg`, `pe.svg`, `pi.svg`, `rj.svg`, `rn.svg`, `rs.svg`, `ro.svg`, `rr.svg`, `sc.svg`, `sp.svg`, `se.svg`, `to.svg`, `br.svg`.
- Criação do utilitário `extractConcursoUf(item)` e `getBandeiraUrl(uf)` em `src/lib/concursosVisuais.ts`.
- No componente de lista de [Concursos.tsx](file:///c:/Users/ext_wpereira/OneDrive%20-%20Vitamina%20Work%20Life%20S.A/Documentos/APP.PRIME/src/pages/Concursos.tsx):
  - No contêiner de thumbnail do card (`w-24 sm:w-28`), posicionar a bandeira do estado com:
    - `absolute inset-0 w-full h-full object-cover opacity-20 filter brightness-90 pointer-events-none`
    - Gradiente escuro sutil sobreposto para garantir alto contraste do personagem 3D.
    - O avatar 3D do cargo em primeiro plano com `relative z-10 drop-shadow-[0_6px_14px_rgba(0,0,0,0.7)]`.
    - Tag do cargo no canto inferior e badge da UF no topo.
- No Hero Card de destaque no topo de [Concursos.tsx](file:///c:/Users/ext_wpereira/OneDrive%20-%20Vitamina%20Work%20Life%20S.A/Documentos/APP.PRIME/src/pages/Concursos.tsx):
  - Aplicar também a bandeira do estado em marca d'água no fundo à direita com `opacity-15`.

---

## 3. Validação e Qualidade

1. Checagem estrita de tipos com `.\node_modules\.bin\tsc.CMD --noEmit`.
2. Empacotamento de produção com `.\node_modules\.bin\vite.CMD build`.
3. Auto-commit e push para o GitHub (`git add . ; git commit -m "..." ; git push`).
