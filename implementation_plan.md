# Plano de Implementação - Detalhamento de Dispositivos e Ações nos Cards de Novidades

O usuário solicitou através de 2 áudios e captura de tela que os cards de novidades deixem de exibir apenas o número genérico do artigo (ex: `Art. 156 -`) e passem a identificar o dispositivo exato alterado (Inciso, Alínea, Parágrafo, Caput), com a descrição informativa explicitando a ação realizada (ex: "Foi incluído o Inciso XI: ...", "Foi alterada a redação do § 2º: ..."), idêntico ao padrão da extração do painel de administração.

---

## 1. Diagnóstico e Arquitetura

### 1.1 Identificação do Dispositivo Específico
Atualmente, `LeiHistoricoCarousel.tsx` e `NovidadesPanel.tsx` utilizam `formatArtigoDisplay(item.artigo)`, o que faz com que artigos como `Art. 156 -` permaneçam com hífen residual e sem o desdobramento do dispositivo (ex: Inciso XI). Além disso, a regex que limpava o artigo no snippet (`replace(/^Art\.\s*\d+[º°]?\s*[-–.]?/i, '')`) não capturava sufixos de letras (como `Art. 216-B`), deixando texto truncado como `B- Produzir...`.

### 1.2 Ação Descritiva no Texto do Card
Conforme solicitado no Áudio 2 (*"Aí na descrição vai falar: 'Ah, foi incluído o inciso tal', 'foi retirado o inciso tal'... esse tipo de coisa"*), cada card terá uma ação descritiva destacada (ex: `Foi incluído o Inciso XI:`) acompanhada do texto limpo do dispositivo.

---

## 2. Etapas de Modificação

### 2.1 Aprimoramento de `parseDispositivoAlteracao` (`src/data/leiAlteracoesScraped.ts`)
1. Limpar caracteres residuais do artigo base (`Art. 156 -` -> `Art. 156`).
2. Detecção profunda e priorizada de:
   - **Alínea**: Alínea "a", Alínea "b"...
   - **Inciso**: Inciso XI, Inciso IV...
   - **Parágrafo**: § 1º, § 2º, § 4º-B, Parágrafo Único...
   - **Pena**: Cominação de Pena
   - **Caput**: Caput
   - **Artigo Novo**: Artigo autônomo incluído/revogado
3. Adicionar novos campos no retorno:
   - `artigoDisplayCompleto`: ex. `Art. 156, Inciso XI`, `Art. 216-B, § 2º`.
   - `acaoDescritiva`: ex. `Foi incluído o Inciso XI`, `Foi alterada a redação do § 2º`, `Foi revogado o Inciso IV`.
   - `descricaoCompleta`: frase pedagógica com a ação descritiva e o trecho limpo do dispositivo.
   - `corpoTexto`: trecho do texto sem prefixos repetidos de artigo ou incisos.

### 2.2 Atualização do Carrossel de Novidades (`src/components/vademecum/artigo/LeiHistoricoCarousel.tsx`)
1. Integrar `parseDispositivoAlteracao` para dados locais de semente e do Supabase (`dbAlteracoes`).
2. Renderizar no topo do card `item.artigoDisplay` enriquecido (ex: `Art. 156, Inciso XI`).
3. Renderizar na descrição a frase de ação descritiva destacada (`item.acaoDescritiva: `) seguida do corpo do texto.
4. Ajustar regex de limpeza para contemplar sufixos de artigos com letras (ex: `Art. 216-B`, `Art. 121-A`).

### 2.3 Atualização do Painel Completo de Histórico (`src/components/vademecum/panels/NovidadesPanel.tsx`)
1. Integrar a mesma resolução de dispositivo e ação descritiva para a listagem completa ("Ver todos").

### 2.4 Validação e Envio
1. Testar compilação com `tsc --noEmit`.
2. Testar build com `vite build`.
3. Auto-commit e push para o repositório remoto.
