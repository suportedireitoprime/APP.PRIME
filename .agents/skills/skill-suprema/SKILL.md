---
name: skill-suprema
description: Skill Suprema de Auditoria 360°, Performance, Responsividade Desktop/Mobile, Permissões Nativas Capacitor, Imagens WebP e Otimização Geral do Aplicativo.
---

# 🚀 Skill Suprema (All-in-One Master Overhaul)

A **Skill Suprema** reúne todas as diretrizes de qualidade, performance, design responsivo e compatibilidade nativa em um fluxo unificado de auditoria 360°.

---

## 📋 Checkpoints da Skill Suprema

### 1. 📱 Mobile Native & Capacitor (Android 15 / iOS 18)
- **Permissões & Manifestos:** Verificar se as permissões nativas (áudio, microfone, armazenamento, notificações) estão declaradas no `AndroidManifest.xml` / `Info.plist` e se chamadas Capacitor usam `Capacitor.isNativePlatform()`.
- **Prevenção de Crash & Congelamento:** Proteger reprodução de áudios/vídeos com `try/catch` e fallbacks em caso de perda de conexão.
- **Safe Area Insets:** Garantir que nenhum elemento fique sob a barra de status superior (`--sai-top`) ou barra de gestos inferior (`--sai-bottom`).
- **Dimensões Tácteis:** Mínimo **48x48dp (Android)** / **44x44pt (iOS)** e espaçamento mínimo de 8px entre botões.

### 2. 🖥️ Layout Responsivo Desktop
- **Contêineres Widescreen:** Expandir telas para `lg:max-w-7xl 2xl:max-w-[1600px] lg:px-8`.
- **Grids Multi-Colunas:** Converter listas verticais simples em grids adaptativos (2, 3, 4 ou 6 colunas no desktop).
- **Atalhos de Teclado:** Incluir listeners (`Space`, `Enter`, `Esc`, setas, teclas numéricas `1-5`/`A-E`) para navegação agilizada no PC.

### 3. ⚡ Performance & Memória
- **Zero Memory Leaks:** Limpar subscrições do Supabase, `setInterval`, `setTimeout` e `window.addEventListener` no `useEffect` cleanup.
- **Cancelamento de Requisições:** Interromper buscas ativas ao desmontar componentes (`alive` flag / `AbortController`).

### 4. 🖼️ Otimização de Imagens (WebP & Preload)
- **Conversão WebP:** Garantir uso de imagens `.webp` otimizadas e compactadas.
- **Carregamento Inteligente:** Usar `loading="lazy"` para itens fora da tela inicial e `decoding="async"`.

---

## 📊 Relatório Final da Auditoria
Ao concluir o overhaul em qualquer funcionalidade, apresentar um resumo discriminado com:
1. **Verificações Realizadas**
2. **Bugs e Ajustes Efetuados**
3. **Status de Compilação & GitHub**
