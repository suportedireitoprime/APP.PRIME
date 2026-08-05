---
name: image-optimization
description: Auditoria e otimização de imagens no projeto. Identifica imagens PNG/JPG não otimizadas, recomenda a conversão para WebP e instrui o uso de preloads e atributos de performance.
---

# Skill: Otimização de Imagens & Assets (WebP / Responsive)

Esta skill orienta a auditoria, compressão e conversão de arquivos de imagem no projeto para maximizar a velocidade de carregamento e reduzir o tamanho final do APK/bundle.

## 🖼️ Regras para Otimização de Imagens

### 1. Formato Padrão: WebP
- **Conversão de PNG/JPG:** Todas as imagens estáticas em `src/assets/` ou `public/` (capas de livros, banners, marcas d'água, ícones) devem ser convertidas para o formato `.webp`.
- **Compressão Eficiente:** Imagens `.webp` devem ser compactadas mantendo bom nível visual (qualidade ~80-85%), reduzindo o tamanho de arquivo em até 70-80% em relação a PNG/JPG originais.

### 2. Preload de Imagens Críticas (LCP)
- Imagens visíveis no primeiro paint do aplicativo (ex: logo da marca, Themis hero, capas de destaque) devem ter preloads declarados em `index.html` ou em `main.tsx` (`link rel="preload"`).

### 3. Atributos de Carregamento (`loading="lazy"` e `decoding="async"`)
- Imagens secundárias, capas de listas, artigos do blog e thumbnails de vídeos devem utilizar `loading="lazy"` e `decoding="async"` para não bloquear a renderização inicial.
