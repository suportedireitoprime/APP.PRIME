# Plano de Implementação — Seletor Compacto de Voz, 4 Versões Simultâneas e Persistência Supabase

O usuário solicitou três melhorias essenciais no painel de **Teste de Áudio** (`AdminNarracaoLeis.tsx`):
1. **Seletor de Voz como Botão / Modal Compacto:** Em vez de listar as 11 vozes diretamente na tela ocupando espaço vertical, exibir um botão elegante com a voz atual. Ao clicar, abre um Seletor/Sheet para escolher a voz e fecha imediatamente após a seleção.
2. **Geração das 4 Versões de Tonalidade (Simultâneas ou Individuais):** Gerar a prévia do texto nas 4 tonalidades disponíveis (**Animada**, **Solene**, **Didática**, **Direto & Dinâmico**) para comparação auditiva.
3. **Persistência / Cache no Supabase com Exclusão:**
   - Salvar cada áudio gerado no Supabase (tabela `narracao_testes_cache` e bucket `audios`).
   - Não re-gerar áudios já salvos para a mesma voz + tonalidade + texto.
   - Fornecer ícone de **Apagar (Lixeira)** para excluir o áudio do Supabase e permitir regenerá-lo.

---

## 1. Banco de Dados e Storage (Supabase)

### Tabela `narracao_testes_cache`
- Criar migração SQL `20260925130000_narracao_testes_cache.sql`:
  - `id text PRIMARY KEY` (composto: `${voz}_${estiloId}_${textoHash}`)
  - `voz text NOT NULL`
  - `estilo_id text NOT NULL`
  - `estilo_nome text`
  - `texto text NOT NULL`
  - `texto_hash text NOT NULL`
  - `audio_url text NOT NULL`
  - `storage_path text NOT NULL`
  - `duracao_segundos numeric`
  - `created_at timestamptz DEFAULT now()`
  - RLS liberado e permissões concedidas.
- Upload dos arquivos de áudio para o bucket `audios` na rota `narracoes/testes_vozes/{voz}/{estiloId}_{textoHash}.wav`.
- Remoção no Storage e no Banco ao clicar em apagar.

---

## 2. Serviço `src/services/narracaoLeisService.ts`

- Implementar funções de apoio:
  - `gerarTextoHash(texto: string): string`
  - `buscarTestesCache(voz: string, texto: string): Promise<Record<string, TesteAudioRegistro>>`
  - `gerarESalvarPreviaAudio(texto: string, voz: string, estiloId: string, estiloPrompt: string, estiloLabel: string): Promise<TesteAudioRegistro>`
  - `apagarPreviaAudio(registro: TesteAudioRegistro): Promise<void>`
  - `gerarTodas4Versoes(texto: string, voz: string, onProgresso?: ...): Promise<...>`

---

## 3. Interface `src/pages/AdminNarracaoLeis.tsx`

- **Seletor de Voz Compacto:**
  - Card/Botão moderno com avatar/ícone de voz, nome atual (ex: **Kore**), badge de gênero (Feminina / Masculina), descrição e chevron de abertura.
  - Sheet/Modal com as 11 vozes categorizadas por Feminina e Masculina.
  - Ao clicar em uma voz: seleciona e fecha o modal na hora (`setIsVozModalOpen(false)`).
- **Texto da Amostra Jurídica:**
  - Amostras em chips rápidos e textarea editável com contador de caracteres.
  - Ao alterar o texto ou a voz, busca instantaneamente no Supabase se já existem áudios salvos.
- **Seção das 4 Tonalidades:**
  - Grid responsivo (1 col mobile, 2 cols tablet/desktop) exibindo os 4 cards:
    1. Animada & Professoral
    2. Solene & Formal (Judiciário)
    3. Didática para Concursos (Pausado)
    4. Direto & Dinâmico (Revisão Rápida)
  - Botão no topo da seção: **"Gerar 4 Versões Simultâneas"** (gera em paralelo/sequencial apenas as que ainda não estiverem no Supabase).
  - Em cada card:
    - Indicador de status (badge verde `Salvo no Supabase` vs `Pendente`).
    - Se gerado: Player de áudio interativo com Play/Pause e barra de progresso.
    - Ícone de **Apagar (Lixeira / Trash2)** para deletar do Supabase e reabilitar a regeneração.
    - Se não gerado: botão individual para gerar apenas aquela tonalidade.

---

## 4. Validação e Finalização

1. Aplicar migração no Supabase via `supabase db push`.
2. Validar TypeScript (`.\node_modules\.bin\tsc.CMD --noEmit`).
3. Validar build (`.\node_modules\.bin\vite.CMD build`).
4. Auto-commit e push para o GitHub.
