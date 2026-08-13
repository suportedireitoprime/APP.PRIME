---
name: threejs-cinematic-expert
description: Especialista em renderização fotorrealista, pós-processamento, arquitetura modular e performance em Vanilla Three.js, inspirado por Three.js Journey (Bruno Simon) e DiscoverThreejs.
---

# Three.js Cinematic Expert (Vanilla WebGL)

Esta skill define as melhores práticas absolutas para criação de cenas 3D cinematográficas e de alta performance no projeto usando **Vanilla Three.js** (sem `@react-three/fiber`).

## 1. Arquitetura Modular (DiscoverThreejs)
Nunca escreva um único bloco monolítico procedural. Separe responsabilidades:
- **Criação de Objetos**: Crie funções construtoras isoladas como `createLights()`, `createEnvironment()`, `createCharacters()`.
- **Loop de Animação**: Extraia o loop de renderização e as animações de câmera para uma função isolada ou classe de Sistema (ex: `Loop`).
- **Resizer**: Sempre tenha um tratador robusto para redimensionamento de tela.

## 2. Iluminação e Materiais Físicos (Three.js Journey)
- **PBR Sempre**: Prefira `MeshStandardMaterial` ou `MeshPhysicalMaterial`. Não use `MeshBasicMaterial` a menos que o objeto deva ser um emissor de luz "puro" (sem afetar sombras).
- **Sombras**: Ative `renderer.shadowMap.enabled = true` e use `THREE.PCFSoftShadowMap`. Limite as luzes que emitem sombras (`castShadow = true`) apenas para as luzes cruciais (como a Luz Direcional Principal / Lua) para economizar processamento.
- **Tone Mapping**: Sempre configure o renderizador para `THREE.ACESFilmicToneMapping` para alcançar cores cinematográficas e lidar com estourados de luz de forma fotográfica.
- **Output Encoding**: Para Three.js moderno (>r150), o encoding sRGB é padrão. Se adicionar Post-Processing, use `OutputPass` no final da cadeia do `EffectComposer`.

## 3. Pós-Processamento / Post-Processing (Bloom)
Para dar um aspecto de "High-End Render", ative o Post-Processing com `EffectComposer`:
1. `RenderPass` (renderiza a cena base).
2. `UnrealBloomPass` (cria o efeito de glow/neon nas sirenes, postes e reflexos metálicos brilhantes).
3. `OutputPass` (converte as cores linear->sRGB ao final).

## 4. Geometrias Avançadas vs Primitivas
- Substitua "Minecraft Box Geometries" (`BoxGeometry`) por malhas arredondadas quando possível.
- Use `CapsuleGeometry` para braços, pernas e torso, garantindo articulações orgânicas em humanoides. 
- Ative o `antialias: true` no `WebGLRenderer`.

## 5. Gerenciamento de Memória e Lixo (Garbage Collection)
Em arquiteturas SPA (React/Vite), cenas 3D causam memory leak instantâneo se não forem limpas. No `useEffect` de desmontagem:
- Chame `dispose()` recursivamente em todas as `geometries`, `materials` e `textures` da `scene`.
- Chame `renderer.dispose()`.
- Force a remoção do canvas do DOM.
- Limpe eventos da janela (`resize`, `click`).

## 6. Performance no Loop
- **Nunca instancie objetos no loop**: Proibido usar `new THREE.Vector3()` dentro do `animate()`. Crie as variáveis globalmente ou fora do loop e apenas modifique seus valores (`.copy()`, `.set()`).
- **Damping Matemático**: Para movimentos de câmera suaves (handheld camera) e transições entre atos, use `THREE.MathUtils.damp(current, target, lambda, dt)`.

## 7. Raycasting Inteligente
- Armazene dados úteis diretamente na propriedade nativa `userData` dos `Group`s ou `Mesh`es (ex: `mesh.userData.label = "Vítima"`).
- Ao realizar `raycaster.intersectObjects()`, navegue pela árvore usando `intersect.object.parent` até encontrar a entidade com o `userData` desejado.
