---
trigger: always_on
---

# REGRA OBRIGATÓRIA — AUDITORIA AUTOMÁTICA A CADA ALTERAÇÃO

Esta regra é **OBRIGATÓRIA e deve ser executada em toda tarefa que envolva alteração, criação, correção ou refatoração de uma tela, página, componente ou funcionalidade**.

Não espere que o usuário solicite separadamente otimização, responsividade, imagens, offline, performance, animações ou melhorias de UX.

Sempre que trabalhar em uma parte do projeto, além de executar a tarefa solicitada, faça uma **auditoria automática do contexto diretamente relacionado à alteração**.

O processo obrigatório é:

**ANALISAR → ALTERAR → AUDITAR → OTIMIZAR → VALIDAR → SUGERIR**

---

# 1. Auditoria obrigatória de imagens

Sempre que a parte modificada possuir imagens, ícones rasterizados, thumbnails, banners, capas, ilustrações ou outros assets visuais, verifique obrigatoriamente:

- formato atual;
- dimensões;
- peso do arquivo;
- resolução realmente necessária;
- compressão;
- carregamento;
- lazy loading;
- imagens responsivas;
- cache;
- possibilidade de reduzir transferência de dados.

## WebP

Verifique especificamente se imagens rasterizadas adequadas estão utilizando **WebP** ou formato moderno equivalente quando isso trouxer benefício.

Se encontrar PNG, JPEG/JPG ou outro formato significativamente mais pesado:

1. determine se há necessidade técnica de manter o formato atual;
2. verifique transparência, qualidade e compatibilidade;
3. considere conversão para WebP;
4. ajuste as referências no projeto quando a conversão fizer parte do escopo e for segura;
5. evite manter arquivos antigos desnecessariamente depois da migração, quando puder confirmar que não são utilizados.

Não converta cegamente.

SVG, ícones vetoriais, imagens que dependam de características específicas do formato original ou assets que não obtenham benefício real não devem ser convertidos apenas para cumprir esta regra.

Quando apropriado, avalie também:

- AVIF;
- `srcset`;
- `sizes`;
- `<picture>`;
- `loading="lazy"`;
- `decoding="async"`;
- preload da imagem principal/LCP;
- dimensões explícitas;
- prevenção de layout shift;
- qualidade de compressão;
- diferentes resoluções conforme viewport e DPR.

**Objetivo obrigatório:** evitar que usuários baixem imagens maiores ou mais pesadas do que realmente precisam.

---

# 2. Auditoria obrigatória de Mobile

Toda interface alterada deve ser analisada em contexto mobile.

Verifique:

- largura disponível;
- altura;
- portrait;
- landscape quando relevante;
- touch targets;
- espaçamento;
- legibilidade;
- tamanho de fonte;
- navegação;
- menus;
- modais;
- bottom sheets;
- formulários;
- teclado virtual;
- safe areas;
- scroll;
- elementos fixos;
- overflow;
- imagens;
- tabelas;
- gestos;
- performance em aparelhos menos potentes.

Não considere uma interface pronta apenas porque ela "cabe" no celular.

Ela deve ser confortável e eficiente para uso por toque.

---

# 3. Auditoria obrigatória de Tablet

**Tablet NÃO deve ser tratado simplesmente como um celular maior.**

Sempre que modificar uma interface, analise se existe uma organização específica melhor para:

- Android tablets;
- iPad;
- telas intermediárias;
- portrait;
- landscape;
- split-screen;
- multitarefa;
- janelas redimensionáveis.

Pergunte obrigatoriamente:

> "Essa interface está apenas esticando o layout mobile ou está realmente aproveitando o espaço de um tablet?"

Considere, quando fizer sentido:

- layouts de duas colunas;
- list-detail;
- master-detail;
- supporting pane;
- sidebars;
- navigation rail;
- grids;
- painéis auxiliares;
- conteúdo simultâneo;
- largura máxima para leitura;
- reposicionamento de controles;
- melhor aproveitamento das laterais;
- adaptação entre portrait e landscape.

Não implemente multipane indiscriminadamente.

Utilize-o somente quando melhorar efetivamente a experiência.

---

# 4. Auditoria obrigatória de Desktop e telas grandes

Toda interface alterada deve ser avaliada também para desktop.

Não considere desktop como simplesmente:

> "mobile com mais espaço vazio".

Verifique:

- largura máxima do conteúdo;
- aproveitamento horizontal;
- densidade de informação;
- grids;
- colunas;
- sidebars;
- painéis;
- navegação;
- hover;
- mouse;
- trackpad;
- teclado;
- atalhos quando relevantes;
- tamanho de elementos;
- comprimento de linhas;
- hierarquia visual;
- distribuição de espaços;
- alinhamento;
- modais;
- menus;
- tabelas;
- posicionamento de ações.

Pergunte:

> "Existe um layout significativamente melhor para essa funcionalidade quando há 1024px, 1280px, 1440px, 1920px ou mais disponíveis?"

Se houver, apresente a melhoria.

---

# 5. Offline é verificação obrigatória

Sempre que modificar uma funcionalidade que exibe, carrega, pesquisa, salva ou depende de conteúdo que possa ser útil sem conexão, verifique obrigatoriamente se existe suporte offline relacionado.

**Antes de implementar qualquer nova solução offline, procure no projeto se ela já existe.**

Investigue:

- Service Worker;
- PWA;
- Cache API;
- IndexedDB;
- armazenamento local;
- persistência existente;
- Capacitor Preferences;
- Capacitor Filesystem;
- banco local;
- estratégias de cache;
- sincronização;
- fallback offline;
- manifest;
- código relacionado a offline.

Nunca crie um segundo sistema offline sem primeiro compreender o existente.

## Se já existir modo offline

Verifique:

- se a funcionalidade alterada participa dele;
- se os dados necessários são realmente armazenados;
- se assets essenciais estão disponíveis;
- se funciona após fechar e abrir novamente o aplicativo;
- se há tratamento para cache desatualizado;
- se existe comportamento adequado quando a conexão desaparece;
- se existe recuperação quando a internet retorna;
- se erros de rede são tratados corretamente.

## Se não existir

Analise se a funcionalidade teria benefício real funcionando offline.

Quando houver benefício, apresente uma proposta concreta indicando:

- o que deveria ficar disponível offline;
- como poderia ser armazenado;
- estratégia de atualização;
- invalidação;
- sincronização;
- conflitos;
- impacto em armazenamento;
- complexidade.

**Não implemente uma arquitetura offline grande sem autorização quando isso ampliar significativamente o escopo da tarefa.**

---

# 6. Auditoria obrigatória de Performance

Depois de qualquer alteração relevante, procure oportunidades concretas de melhorar desempenho.

Analise quando aplicável:

- renderizações desnecessárias;
- re-renders;
- JavaScript excessivo;
- tamanho do bundle;
- code splitting;
- dynamic imports;
- tree shaking;
- carregamento inicial;
- lazy loading;
- imagens;
- fontes;
- requests;
- cache;
- DOM excessivo;
- listas grandes;
- virtualização;
- memória;
- listeners;
- timers;
- operações repetidas;
- cálculos caros;
- layout thrashing;
- long tasks;
- Core Web Vitals;
- LCP;
- INP;
- CLS;
- consumo dentro de WebView;
- desempenho em dispositivos mobile modestos.

Não faça "micro-otimizações" sem benefício mensurável ou justificável.

Priorize problemas que possam ser percebidos pelo usuário.

---

# 7. Auditoria obrigatória de animações

Toda vez que modificar uma interface, analise se:

1. as animações existentes estão eficientes;
2. existe animação desnecessariamente pesada;
3. uma pequena animação poderia melhorar feedback ou compreensão.

Priorize animações baseadas em propriedades eficientes, especialmente:

- `transform`;
- `opacity`.

Evite animações que provoquem layout/repaint excessivo quando houver alternativa melhor.

Verifique:

- duração;
- easing;
- FPS;
- fluidez;
- dispositivos menos potentes;
- animações simultâneas;
- entrada;
- saída;
- transições;
- feedback de toque;
- loading;
- skeleton;
- expansão/recolhimento;
- mudança de estado.

Respeite obrigatoriamente:

`prefers-reduced-motion`

Animação deve possuir propósito.

Não adicione animação apenas para deixar a interface "mais bonita".

Ela deve melhorar:

- orientação;
- feedback;
- percepção de continuidade;
- compreensão;
- sensação de responsividade.

---

# 8. Auditoria obrigatória de UX e Layout

Sempre procure pequenas oportunidades de melhorar a experiência diretamente relacionada à área modificada.

Pergunte:

- Existem cliques desnecessários?
- A ação principal está evidente?
- Alguma informação poderia aparecer antes?
- Existe estado vazio adequado?
- Existe feedback de loading?
- Existe feedback de sucesso?
- Existe tratamento de erro?
- Existe retry?
- O usuário sabe o que aconteceu?
- O usuário consegue desfazer uma ação destrutiva quando apropriado?
- O fluxo poderia exigir menos etapas?
- A hierarquia visual está correta?
- Existe alguma informação repetida?
- Existe espaço desperdiçado?
- Algum controle está difícil de alcançar no mobile?
- Tablet poderia mostrar informações simultaneamente?
- Desktop poderia reduzir navegação usando painéis ou colunas?

Pequenas melhorias seguras podem acompanhar a tarefa quando diretamente relacionadas.

Mudanças grandes devem ser recomendadas antes de implementação.

---

# 9. Verificar funcionalidades complementares

Depois de entender a funcionalidade modificada, faça obrigatoriamente esta pergunta:

> "Existe alguma funcionalidade complementar pequena que tornaria isso significativamente mais útil?"

Exemplos:

**Leitura**
→ continuar lendo, progresso, marcador, notas, destaques, busca interna.

**Pesquisa**
→ histórico, sugestões, filtros, termos recentes, destaque dos resultados.

**Favoritos**
→ pastas, coleções, ordenação, filtros.

**Offline**
→ conteúdos baixados, indicador de disponibilidade, atualização automática.

**Navegação**
→ histórico, atalhos, ações rápidas.

Não implemente automaticamente funcionalidades grandes.

Identifique e recomende.

---

# 10. Preservar o que já existe

Esta auditoria **NÃO autoriza refatorações indiscriminadas**.

Antes de alterar qualquer coisa:

1. examine a implementação existente;
2. procure componentes reutilizáveis;
3. procure serviços existentes;
4. procure utilitários existentes;
5. procure sistemas de cache existentes;
6. procure implementação offline existente;
7. procure breakpoints existentes;
8. procure sistema de design existente;
9. procure animações existentes;
10. procure otimizações já implementadas.

**Não duplique soluções que o projeto já possui.**

Preserve:

- arquitetura;
- identidade visual;
- comportamento esperado;
- funcionalidades existentes;
- compatibilidade;
- padrões internos,

exceto quando houver justificativa técnica clara para alteração.

---

# 11. Obrigatório pesquisar documentação quando necessário

Quando houver dúvida ou oportunidade relevante, utilize documentação atual e confiável.

Prioridade:

1. documentação oficial da tecnologia;
2. especificações Web;
3. Google / Android Developers;
4. Apple Developer / Human Interface Guidelines;
5. documentação do framework;
6. Capacitor;
7. MDN;
8. web.dev;
9. WCAG/W3C;
10. projetos open source maduros;
11. Awesome Lists;
12. referências técnicas confiáveis.

Não utilize documentação apenas para resolver erros.

Utilize-a também para descobrir:

> "Existe uma maneira oficialmente recomendada de fazer isso melhor?"

---

# 12. Checklist obrigatório antes de considerar a tarefa concluída

Antes de finalizar qualquer tarefa relevante, confirme internamente:

- [ ] Analisei os arquivos relacionados antes de alterar?
- [ ] Preservei funcionalidades existentes?
- [ ] Verifiquei as imagens?
- [ ] Verifiquei WebP/formato moderno quando aplicável?
- [ ] Verifiquei peso e dimensões das imagens?
- [ ] Verifiquei lazy loading e carregamento?
- [ ] Testei mentalmente/tecnicamente mobile?
- [ ] Analisei tablet separadamente?
- [ ] Analisei portrait e landscape quando relevante?
- [ ] Analisei desktop/telas grandes?
- [ ] Procurei uma organização melhor para telas grandes?
- [ ] Verifiquei se existe modo offline?
- [ ] Verifiquei se esta funcionalidade funciona offline quando deveria?
- [ ] Procurei gargalos de performance?
- [ ] Verifiquei animações e transições?
- [ ] Considerei `prefers-reduced-motion`?
- [ ] Verifiquei acessibil
