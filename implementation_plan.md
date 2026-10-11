# Plano de Implementação - Novo Cabeçalho e Painel de Resumos Jurídicos

## 1. Contexto e Requisitos
O usuário solicitou através de áudio e print:
- O painel/cabeçalho de "Resumos Jurídicos" deve ser exatamente no padrão do painel de início do aplicativo (HomeHeaderHero / VadeMecumHero).
- Criar uma imagem exclusiva para Resumos Jurídicos contendo **5 filósofos do Direito/pensamento de épocas distintas** (ex: Platão/Aristóteles na Antiguidade, Cícero em Roma, Tomás de Aquino no Medievo, Montesquieu no Iluminismo, e um pensador moderno como Kelsen/Kant).
- O cabeçalho deve ter a divisória diagonal com `drop-shadow` de alta definição, os motivos jurídicos sutis (`HeroMotifs`), o brasão/logo ou marca de Resumos Jurídicos alinhada com tipografia clássica serifada/moderna (`Estudos Jurídicos / Resumos Jurídicos` e `Domine os conceitos com clareza`), botões superiores arredondados de voltar (`ArrowLeft` padrão HIG/M3 48-52px) e notificações.
- Painel de estatísticas integrado e barra de pesquisa com digitação dinâmica (`TypingHint`) e atalhos rápidos ou métricas de destaque.
- Suporte a Desktop, Tablet e Mobile com latência zero e conformidade com as regras do projeto.
- Auto-commit & push automático para o GitHub ao concluir.

## 2. Etapas de Execução
1. **Geração da Imagem de Filósofos**:
   - Gerar com `generate_image` uma composição épica cinematográfica em estilo pintura clássica a óleo / estúdio com 5 grandes filósofos/jurisconsultos de épocas diferentes reunidos em biblioteca jurídica clássica com tom solene, perfeito para encaixar no painel de corte diagonal do aplicativo.
   - Salvar e otimizar como `/resumos-philosophers-hero.webp` (e copiar para `public/` e `src/assets/covers/`).
2. **Atualização do Cabeçalho `ResumosHero.tsx`**:
   - Ajustar o shell do cabeçalho para seguir a mesma geometria, proporção e estrutura de `HomeHeaderHero` e `VadeMecumHero` (divisão diagonal `clipPath: polygon(0 0, 47% 0, 36% 100%, 0% 100%)`, motivos de fundo, grid animado suave `ShapeGrid`, branding unificado com logo/ícone de sabedoria e tipografia editorial).
   - Manter as métricas consolidadas (Total Resumos, Áreas, Temas) de forma visualmente harmoniosa no estilo do app.
   - Preservar a barra de busca e atalhos de filtro.
3. **Validação & Testes**:
   - Executar `tsc.CMD --noEmit` para garantir zero erros de compilação TypeScript.
   - Testar no navegador para validar proporção visual e transição de imagem.
4. **Git Versionamento**:
   - `git add . ; git commit -m "feat(resumos): novo painel hero padrao home com composicao de 5 filosofos" ; git push`
