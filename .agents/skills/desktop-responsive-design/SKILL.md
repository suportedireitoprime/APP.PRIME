---
name: desktop-responsive-design
description: Otimização de layouts responsivos para Desktop, suporte a Electron, telas widescreen e usabilidade em telas grandes. Use ao adaptar a interface para navegadores de computador ou aplicativos Electron.
---

# Skill: Desktop Responsive Design & Adaptabilidade

Esta skill garante que o aplicativo proporcione uma experiência impecável tanto em telas mobile/tablets quanto em monitores desktop e ambiente Electron.

## 🖥️ Princípios de Design Desktop

### 1. Breakpoints e Layouts Expandidos
- **Grid & Flexbox Flexíveis:** Utilizar utilitários Tailwind (`md:`, `lg:`, `xl:`, `2xl:`) para ajustar a quantidade de colunas de cartões e áreas de estudo em monitores de alta resolução.
- **Sidebars e Navegação Lateral:** Em telas com largura `>= 1024px` (`lg:`), priorizar barras de navegação laterais estáticas ou expansíveis em vez de menus de rodapé (*bottom bar*).
- **Largura Máxima Conteúdo (Max-Width Containers):** Evitar linhas de texto extremamente longas. Usar `max-w-7xl mx-auto` ou `max-w-5xl` em áreas de leitura para manter a legibilidade.

### 2. Suporte a Atalhos de Teclado e Navegação Desktop
- **Navegação por Teclado:** Garantir que modais, drawers e barras de busca respondam às teclas `Esc`, `Enter` e setas direcionais.
- **Tooltips e Hover States:** Aplicar estados `:hover` e avisos com `Tooltip` em botões de ação na versão desktop.

### 3. Integração com Electron e Modos de Tela
- **Detecção de Plataforma Desktop:** Respeitar o `HashRouter` e integrações específicas via `window.desktopApp` quando o app rodar encapsulado no Electron.
- **Barras de Título Personalizadas:** Ajustar insets superiores e botões de fechar/minimizar em ambientes desktop nativos.
