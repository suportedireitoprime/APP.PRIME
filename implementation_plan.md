# Plano de Implementação — Estúdio de Narração de Leis no "Bases Jurídicas"

Implementar o módulo completo de **Narração de Leis** acessível a partir da tela **Bases Jurídicas**, seguindo a mesma hierarquia do Mapeamento de Leis (Categorias → Leis → Artigos com status de narração), com suporte a:
1. **Teste de Áudio** (vozes Gemini TTS, tonalidade, estilo e preview imediato);
2. **Automação via Cron Job no Supabase** (execução a cada 10 minutos com prioridade para artigos maiores);
3. **Novo Paradigma de Narração Fatiada por Partes do Artigo** (Caput, Parágrafos, Incisos, Alíneas gerados e reproduzidos em blocos modulares, com grifo visual do bloco completo em reprodução).

---

## 1. Arquitetura e Componentes

### 1.1 Parser Fatiador de Artigo (`src/utils/artigoPartesParser.ts`)
- Quebra o texto integral do artigo (ou campos `paragrafos` / `incisos`) em blocos estruturados:
  - `Caput`
  - `Pena` (se houver, comum no Código Penal)
  - `§ 1º, § 2º, Parágrafo único`
  - `Incisos I, II, III...`
  - `Alíneas a), b)...`
- Higienização jurídica e conversão para texto fonético pronto para TTS.

### 1.2 Serviço de Narração e Automação (`src/services/narracaoLeisService.ts`)
- Busca de status de narração de artigos por lei em `narracoes_artigos`.
- Geração de áudio fatiado de cada parte via Edge Function Gemini TTS.
- Player sequencial de blocos com callback de bloco ativo (`activeBlockId`).
- Gerenciamento de configurações da automação e histórico de execuções.
- Suporte a geração manual imediata ou em lote prioritário.

### 1.3 Infraestrutura Supabase & Automação Cron
- Migration SQL:
  - Tabela `narracao_leis_config` (intervalo_minutos, lei_id, prioridade, voz, tom, ativa, etc.).
  - Tabela `narracao_leis_logs` (histórico de execuções e artigos gravados).
  - RPC para agendamento seguro no `pg_cron` a cada 10 minutos (`*/10 * * * *`).
- Edge Function `narracao-leis-automacao`:
  - Disparada pelo cron job a cada 10 minutos (ou via teste no admin).
  - Seleciona o artigo pendente de maior prioridade (artigos maiores primeiro).
  - Fatia em blocos, gera os áudios via Gemini TTS, armazena no bucket `audios` e atualiza `narracoes_artigos`.

### 1.4 Interface do Estúdio (`src/pages/AdminNarracaoLeis.tsx`)
- **Tela Principal (Nível 1 - Categorias & Ferramentas):**
  - Códigos (CP, CC, CPC, CPP, etc.)
  - Estatutos (ECA, OAB, etc.)
  - Constituição Federal
  - Leis Especiais
  - Previdenciário
  - **Teste de Áudio** (localizado logo abaixo de Previdenciário)
  - **Automação** (localizado logo abaixo do Teste de Áudio)
- **Nível 2 (Lista de Leis da Categoria):**
  - Indicadores de total de artigos, artigos narrados e percentual.
- **Nível 3 (Listagem de Artigos da Lei Selecionada):**
  - Indicador de status (Narrado / Pendente).
  - Indicador de complexidade/tamanho (caracteres e blocos).
  - Visualização fatiada por blocos com destaque do bloco ativo durante a reprodução.
  - Ação de geração de áudio individual ou em lote.
- **Painel "Teste de Áudio":**
  - Seleção de vozes (Kore, Sulafat, Aoede, Puck, Charon, Fenrir, etc.).
  - Seleção de tom/estilo (animado, solene, claro, didático).
  - Amostras de textos jurídicos reais para teste imediato.
- **Painel "Automação":**
  - Frequência (10 em 10 minutos configurável).
  - Seleção da lei alvo (Código Penal por padrão).
  - Prioridade: "Artigos maiores primeiro" (ordem por tamanho decrescente).
  - Histórico de execuções e botão "Disparar lote agora".

### 1.5 Integração em "Bases Jurídicas"
- Adicionar o item "Narração de Leis" na categoria `bases-juridicas` em `src/pages/AdminFuncoes.tsx`.
- Registrar a rota `/admin-narracao-leis` em `src/AppRoutes.tsx`.

---

## 2. Validação e Qualidade
1. Testar parsing de artigos complexos do Código Penal (com caput, pena, parágrafos e incisos).
2. Testar geração e reprodução de partes isoladas com grifo do bloco ativo.
3. Testar prévia de áudio com diferentes vozes e estilos.
4. Testar configuração e disparo da automação cron no Supabase.
5. Executar `tsc --noEmit` e `vite build`.
6. Auto-commit e push para o repositório GitHub.
