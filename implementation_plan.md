# Plano de Implementação - Radar do Código Penal em Tela Inteira

O usuário solicitou através de áudio e captura de tela que o Radar do Código Penal (`LeiDetailView.tsx` / `RadarLegislacaoContent.tsx`) seja transformado em uma experiência completa em tela inteira, exibindo os Projetos de Lei que estão tramitando na Câmara dos Deputados para alterar, incluir ou revogar dispositivos do Código Penal, com:
1. Abertura em tela inteira ao clicar no botão "RADAR".
2. Descrição no topo explicando que este é o local onde se acompanha o que pode mudar no Código Penal.
3. Lista detalhada de quais artigos do Código Penal estão na mira de alteração.
4. Identificação do Deputado(a) proponente de cada proposição.
5. Explicação didática do que o deputado quer fazer e mudar no Código Penal.
6. Links diretos para a tramitação oficial no portal da Câmara dos Deputados e navegação para o artigo correspondente.

---

## 1. Arquitetura e Componentes

### 1.1 `LeiDetailView.tsx`
- No gerenciador de overlays, tratar `overlayPanel === 'radar'` com abertura em tela inteira (`fixed inset-0 z-[60] h-[100dvh] max-h-[100dvh]`), idêntico ao painel de novidades.
- Manter o botão voltar padronizado oficial (52x52px, stroke 2.4, feedback tátil `haptic.selection()`).

### 1.2 Serviço e Dados do Radar do Código Penal (`src/services/radarCpService.ts`)
- Mapeamento inteligente de proposições ativas da Câmara dos Deputados que alteram o Código Penal (Decreto-Lei nº 2.848/1940).
- Detecção automática do artigo visado pela ementa (ex: `Art. 157`, `Art. 171`, `Art. 155, § 5º`, `Art. 129`, `Art. 149-A`, `Art. 216-B / 218-C`...).
- Extração do deputado proponente (com link/foto e filiação partidária).
- Resumo didático em português claro: *"O que o deputado propõe alterar"*.
- Cache local inteligente e semente com dados reais de 2026/2025 da Câmara dos Deputados para garantir 0ms de carregamento e resiliência offline.

### 1.3 `RadarLegislacaoContent.tsx`
- Substituir o stub ("Radar de legislação indisponível") por um componente de nível de produção:
  - Header informativo contextualizado com descrição em destaque.
  - Indicador de tempo real da Câmara dos Deputados.
  - Barra de busca rápida por artigo do CP, deputado ou tema.
  - Cards visuais ricos com os artigos em destaque, identificação do deputado, descrição clara da alteração proposta, fase da tramitação e botão para visualizar o artigo ou abrir na Câmara.

---

## 2. Checklist de Execução
1. Criar `src/services/radarCpService.ts` com base de conhecimento curada e busca na API da Câmara.
2. Implementar `src/components/vademecum/outros/RadarLegislacaoContent.tsx` com interface rica, cards de artigos visados, deputado e o que quer mudar.
3. Ajustar `LeiDetailView.tsx` para abrir o Radar em tela inteira.
4. Validar com `tsc --noEmit`.
5. Validar empacotamento com `vite build`.
6. Auto-commit e push para o GitHub.
