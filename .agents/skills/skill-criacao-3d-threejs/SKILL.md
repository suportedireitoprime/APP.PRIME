---
name: skill-criacao-3d-threejs
description: Skill dedicada à criação super mega detalhada de cenas em Vanilla Three.js para os Artigos do Código Penal (com luzes volumétricas, sombras, texturas, bevel/cel-shading).
---

# Criação 3D - Three.js

Você deve utilizar esta skill sempre que for invocado para gerar a cena 3D (exemplo: cena do Código Penal).

## 1. Duração e Fluxo Constante
- A linha do tempo (TIMELINE) da animação precisa possuir uma duração final em torno de **1 a 1,5 minutos (60.000ms a 90.000ms)**.
- O andamento da cena deve ser **bem explicativo, constante e direto**, traduzindo os verbos do Artigo Penal de forma imersiva e sem pausas mortas longas.

## 2. Padrão de Estética Cinematográfica (Referência Artigo 157)
- **Engine Base:** Vanilla Three.js com `EffectComposer`.
- **Materiais e Cel-Shading:** Aplique gradientes tipo *Toon Shading* (`MeshToonMaterial` com `gradientMap`) nos personagens principais, gerando uma arte de quadrinho/cel-shaded moderna. Use cores fortes e vibrantes.
- **Iluminação Volumétrica e Sombras:** 
  - Todo ambiente externo precisa ter no mínimo um `DirectionalLight` marcante que lança sombra (`castShadow = true`). E um `AmbientLight` balanceado para clarear os tons baixos.
  - Habilite sempre o PCFSoftShadowMap no renderizador (`renderer.shadowMap.type = THREE.PCFSoftShadowMap`).
  - Habilite sombras em todas as malhas (`castShadow = true`, `receiveShadow = true`).
  - Use `PointLight` (ex: azul e vermelho tipo sirene, caso aplique) para intensificar as cores de forma volumétrica.
- **Post-Processing (Obrigatório):**
  - **SMAAPass:** Antialiasing avançado.
  - **UnrealBloomPass:** Essencial para trazer vida às luzes (intensidade ~1.2, threshold 0.5, radius 0.85).
  - **FilmPass:** Para dar um aspecto de scanline e granulação leve.
  - **OutlinePass:** Contornos nas geometrias com `visibleEdgeColor` preto (estilo Borderlands/HQ).

## 3. Geometria Detalhada e Bevel (Betel)
- Evite blocos lisos perfeitos na construção dos objetos: use Bevel (`ExtrudeGeometry` com opções de chanfro/bevel) para dar um acabamento reflexivo melhor nas bordas dos cenários ou caixas.
- Não deixe cômôdos vazios, construa paredes e texturize o piso (ex: linhas em malha xadrez ou asfalto cinza escuro no `MeshToonMaterial`).

## 4. Estrutura do Código
- A cena será orquestrada inteiramente dentro do componente React em um arquivo autônomo (ex. `CenaArtigoX.tsx`), utilizando a função `damp` e controle de câmera interpolado em cada `step` da animação.
- Mantenha o código limpo, comentado e otimizado para não sofrer gargalos em Mobile. O *disposal* de geometrias/materiais deve estar garantido no retorno do `useEffect`.
