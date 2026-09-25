# Plano de Implementação: Correção da Caixa de Confirmação e Narração Contínua de Artigos

## 1. Contexto e Solicitação do Usuário
O usuário apontou dois problemas críticos na tela de narração de leis (`AdminNarracaoLeis.tsx`):
1. **Problema na exclusão**: "não estou conseguindo apagar os artigos, não aparece a caixa de confirmar."
   - Causa identificada: O código usava `window.confirm()`, que é frequentemente suprimido ou bloqueado por navegadores modernos, WebViews e Capacitor, além de checagens de chave em `statusNarracoes` que podiam falhar por divergência de formatação (ex: `"1"` vs `"1º"` vs `"Art. 1º"`).
   - Solução: Implementar um **Dialog de Confirmação nativo em React** (componente `Dialog`), com feedback visual imediato, botões de ação com área mínima de toque de 48px, e busca de variantes flexível tanto no banco de dados quanto no Supabase Storage.
2. **Narração contínua e unificada**: "E eu quero que não divida mais em partes, seja narrado de uma vez, começando narrando pelo nome da lei, por exemplo, Direito Penal, aí ela vai narrar 'Direito Penal', aí depois ela narra o título, aí depois narra o artigo. Até um minuto. Se passar de um minuto, ela deve parar no próximo ponto final e continuar outro áudio, para não perder, não distorcer a voz. Aí juntar tudo."
   - Causa identificada: O modelo anterior fatiava incisos e parágrafos em micro-partes individuais de poucos segundos, fragmentando a leitura.
   - Solução:
     a) Introdução enunciando a lei ("Direito Penal" para CP, "Constituição Federal" para CF/88, etc.), seguida pelo Título/Capítulo (se houver), seguido pelo Artigo ("Artigo primeiro: ...").
     b) Texto corrido de caput, incisos e parágrafos sem cortes artificiais.
     c) Teto de ~1 minuto (~800 a 850 caracteres). Se ultrapassar, a divisão é feita estritamente no **próximo ponto final** (`.`) para preservar a cadência gramatical e evitar distorção na voz da IA Gemini TTS.
     d) **Concatenação de Áudio Real ("Aí juntar tudo")**: Se houver mais de uma parte gerada, os blocos de áudio PCM WAV gerados são concatenados em um único arquivo de áudio final contínuo e salvos no Supabase Storage como o áudio definitivo do artigo.

---

## 2. Arquitetura das Modificações

### 2.1. Concatenação de Áudios WAV PCM no Cliente (`narracaoLeisService.ts`)
- Implementar `concatenarWavBuffers(buffers: ArrayBuffer[]): Uint8Array` / `concatenarWavDataUrls(urls: string[]): Promise<Blob>`:
  - Extrai os samples PCM de cada arquivo WAV gerado pelo Gemini TTS (24000Hz, 16-bit mono).
  - Concatena o array contínuo de bytes PCM.
  - Gera um cabeçalho RIFF/WAVE canônico de 44 bytes com o tamanho total consolidado.
  - Retorna um Blob de áudio único contínuo.
- Se houver apenas 1 parte (a grande maioria dos artigos menores que 1 minuto), nenhum overhead de processamento é gerado.

### 2.2. Parser de Artigo com Enunciação da Lei e Teto em Ponto Final (`artigoPartesParser.ts`)
- Mapear a enunciação da lei para retornar "Direito Penal" quando for o Código Penal (`CP_CODIGO_PENAL` ou `cp`), conforme pedido explícito.
- Montar a introdução:
  `[Nome da Lei]. [Título/Capítulo se houver]. [Artigo X]: [Caput...]`
- Concatenar caput, parágrafos, incisos e penas em um fluxo contínuo.
- Se o texto total passar de ~800 caracteres (~1 minuto de fala), buscar o próximo ponto final (`.`) para fechar a parte e iniciar a seguinte.
- Retornar as partes estruturadas para o gerador.

### 2.3. Interface e Modal de Confirmação (`AdminNarracaoLeis.tsx`)
- Substituir qualquer `window.confirm` por estado `artigoParaExcluir`.
- Dialog elegante com tema escuro (`bg-[#0D0F12]/95 border-white/10`):
  - Título: "Excluir Narração do Artigo X?"
  - Descrição: explicita remoção do Storage e do banco.
  - Botão Cancelar e Botão Excluir (com feedback de loading `Loader2`).
- Ao confirmar exclusão, chamar `apagarNarracaoArtigo` cobrindo todas as variantes (`1`, `1º`, `1°`, `Art. 1º`, etc.), remover todas as chaves do estado local `statusNarracoes` e exibir toast de sucesso.
- No card do artigo:
  - Botão [Play] toca o áudio completo de uma vez só.
  - Exibição limpa de `Narrado (Áudio Completo)` ou `Pendente`.

### 2.4. Edge Function de Automação Cron (`narracao-leis-automacao/index.ts`)
- Sincronizar as regras de concatenação e introdução de contexto para que a automação em segundo plano gere o mesmo áudio contínuo unificado.

---

## 3. Plano de Validação
1. Validação estática de tipagem: `.\node_modules\.bin\tsc.CMD --noEmit`.
2. Build de produção: `.\node_modules\.bin\vite.CMD build`.
3. Verificação de exclusão e geração.
4. Auto-commit e push para o repositório GitHub.
