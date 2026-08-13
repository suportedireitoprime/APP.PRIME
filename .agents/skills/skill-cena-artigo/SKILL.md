---
name: skill-cena-artigo
description: Skill especialista em criar cenas manuais, ultra-detalhadas e cinematográficas em Vanilla Three.js para o Visualizador Curado do Laboratório (APP.PRIME).
---

# Diretrizes para Criação de Cenas Curadas (Vanilla Three.js)

Esta skill deve ser ativada toda vez que o usuário pedir para gerar a cena de um artigo específico usando "Vanilla Three.js" ou pedir para "aplicar a skill de cena".

## 1. Arquitetura Base
- Use a estrutura do `CenaArtigo3.tsx` ou `CenaArtigo4.tsx`.
- **Efeitos Pós-Processamento OBRIGATÓRIOS:** `EffectComposer`, `RenderPass`, `SMAAPass`, `UnrealBloomPass`, `FilmPass` e `OutlinePass`.
- **Material OBRIGATÓRIO:** `MeshToonMaterial` com `gradientMap` (Cel-Shading) para todos os objetos e personagens, exceto lasers/luzes que usam `MeshBasicMaterial`.
- Animação feita via função `damp` do Three.js (interpolação suave) baseada em uma constante `TIMELINE`.

## 2. Nível de Detalhe e Geometria Prática (Matemática)
- **Não economize nos detalhes geométricos.** Construa móveis complexos (berços, camas, janelas) combinando `BoxGeometry` e `CylinderGeometry`.
- **Cenários Fechados:** NUNCA deixe a câmera olhar para o "vazio" (fog/background puro) em cenas de interiores. Construa chão amplo e paredes (backWall, sideWall) para criar um cômodo fechado. Evite cores de fundo puramente brancas que causam efeito de "void".
- **Micro-detalhes:** Adicione sombras (`castShadow = true`, `receiveShadow = true`) em tudo.

## 3. Design de Personagens Específicos
- **Personagens Femininas:** 
  - Use geometria extra para o cabelo (ex: franja longa, rabo de cavalo ou volume lateral).
  - Ajuste a proporção (torso ligeiramente menor/acinturado).
  - Se for detenta, prefira **rosa** (`0xec4899`) em vez do laranja clássico, para distinguir bem a silhueta.
- **Expressões Faciais:**
  - Os humanoides devem ter expressões que mudam no `animate()`.
  - *Bravo:* Olhos inclinados (`eyeL.rotation.z = 0.2`, `eyeR.rotation.z = -0.2`).
  - *Triste:* Olhos caídos (`eyeL.rotation.z = -0.2`, `eyeR.rotation.z = 0.2`).
  - *Surpreso:* Olhos arregalados (`eye.scale.y = 1.5`).
- **Cor dos olhos/rosto:** Mude a cor do material para vermelho (raiva) ou pálido (medo) dependendo do `step` da timeline.

## 4. Dinamismo e Cinemática
- **Câmera:** A câmera deve acompanhar a ação. O `stepData.cam` deve ter mudanças dramáticas (ex: de uma visão isométrica alta para um close-up no rosto).
- **Luz:** Altere a intensidade e cor das luzes (`DirectionalLight`, `AmbientLight`, `Fog`) para refletir a passagem do tempo ou o clima emocional da cena.
- **Partículas/Efeitos especiais:** Adicione sistemas de partículas (fumaça de tiro, chuva, poeira) ou elementos que tremem/piscam (muzzle flash, sirenes de polícia).

## 5. Integração
O componente final deve ser salvo em `src/components/laboratorio/cenas/CenaArtigo<X>.tsx` e importado no `AdminLaboratorio.tsx` via `lazy()`, adicionando-o ao array `artigosCurados`.
