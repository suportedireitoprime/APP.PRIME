---
name: image-optimization
description: Skill especialista em otimização de imagens, pré-aquecimento de cache em memória (prefetch), preloads e carregamento instantâneo (0ms) de capas de livros, obras e mídias no app.
---

# ⚡ Skill de Otimização de Imagens & Carregamento Instantâneo (0ms)

Esta skill estabelece o padrão obrigatório para garantir que todas as imagens, capas de livros, pôsteres de filmes/séries e banners do aplicativo carreguem de forma instantânea (0ms), eliminando telas brancas, flashes de carregamento ou atritos visuais para o usuário.

---

## 🎯 Princípios da Otimização de Imagens

### 1. 🚀 Atributos de Alta Prioridade (HTML / React)
Todas as imagens visíveis na dobra inicial (above-the-fold) ou que pertencem a modais e carrosséis devem conter obrigatoriamente:
- `loading="eager"` (Impede o atraso de lazy loading nativo do navegador)
- `fetchPriority="high"` (Força o navegador a dar prioridade máxima na fila de download de rede)
- `decoding="async"` (Permite que a decodificação da imagem ocorra fora da thread principal do React)

```tsx
<img
  src={capaUrl}
  alt={titulo}
  loading="eager"
  fetchPriority="high"
  decoding="async"
  className="w-full h-full object-cover"
/>
```

---

### 2. ⚡ Pré-aquecimento de Cache em Memória (Prefetching)
Sempre que uma lista de itens (livros, obras, artigos) for renderizada ou estiver prestes a ser visualizada, as capas dos próximos itens prováveis devem ser pré-carregadas em background via JavaScript `new Image()`:

```ts
export function prefetchImage(url: string | null | undefined) {
  if (!url) return;
  const img = new Image();
  img.src = url;
}

export function prefetchImages(urls: (string | null | undefined)[]) {
  urls.filter(Boolean).forEach((url) => {
    const img = new Image();
    img.src = url!;
  });
}
```

---

### 3. 🛡️ Tratamento de Fallbacks e Placeholders Elegantes
- Utilizar fundos com gradientes suaves ou esqueletos animados enquanto a imagem carrega.
- Nunca exibir bordas quebradas de imagens não encontradas (`onerror` handler para imagem de fallback elegante).

---

## 📋 Checklist de Aplicação

- [ ] Todas as capas e pôsteres visíveis utilizam `loading="eager"`, `fetchPriority="high"` e `decoding="async"`?
- [ ] As mídias prováveis são pré-carregadas em background ao montar a lista/carrossel?
- [ ] As imagens utilizam formatos modernos (WebP/JPG otimizados)?
- [ ] A compilação `tsc --noEmit` retorna `0 erros`?
