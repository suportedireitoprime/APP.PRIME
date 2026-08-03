# Documentos — modelos jurídicos direto do Drive

Nova função **Documentos**: modelos prontos (petição inicial, contestação, contratos, procurações…) que ficam numa pasta do Google Drive e aparecem no app em tempo real. A aba **Áreas** da home passa a ser **Documentos**.

## Como fica para o usuário

1. Na home, a terceira aba deixa de ser "Áreas" e passa a ser **Documentos** (ícone de pasta/arquivo).
2. O título da seção muda para **Documentos** com o subtítulo "Modelos prontos para usar: petições, contratos, procurações e mais".
3. Cada card é um **tipo de documento** (lista fixa no app, com ícone e cor próprios):
   - Petição Inicial, Contestação, Recursos, Contratos, Procurações, Notificações, Habeas Corpus, Trabalhista, Requerimentos, Pareceres, Outros.
4. Ao tocar num card, abre uma folha (bottom sheet) com os arquivos daquele tipo, vindos da pasta do Drive em tempo real — nome, tipo de arquivo, tamanho e data.
5. Em cada arquivo: **Ver** (leitor dentro do app), **Baixar** (salva no aparelho, nativo) e **Compartilhar** (WhatsApp, e-mail etc.).
6. Busca dentro da folha para filtrar por nome do documento.

## Regra de acesso: 1 por dia

- Navegar e ver a lista é livre.
- **Abrir/baixar/compartilhar** conta como 1 uso. Cada usuário tem **1 documento por dia**; a partir do segundo aparece o aviso Premium (mesmo estilo já usado no app).
- Reabrir o mesmo documento no mesmo dia **não** consome outro uso.
- Assinantes Premium e admins: ilimitado.

## Áreas do Direito não se perde

O grid das 16 áreas do Direito continua acessível: entra como um card **"Áreas do Direito"** na aba Estudos, abrindo exatamente a mesma folha de leis por área que existe hoje.

## Detalhes técnicos

**Onde os arquivos moram**
- Pasta raiz de documentos: `17nBPVnNkDUmpAaoQh5hX8-KGtL1PV0PB` (novo segredo `DRIVE_DOCUMENTOS_FOLDER_ID`).
- Como os tipos são fixos no app, a classificação é por **subpasta quando existir** (ex.: `Peticao-Inicial/`) e, na falta dela, por palavras-chave no nome do arquivo (`peticao`, `contestacao`, `contrato`, `procuracao`…). Arquivo que não casa com nenhum tipo cai em "Outros".

**Backend (Supabase Edge Function)**
- Nova função `documentos-listar`: lista recursivamente a pasta via `drive/v3/files` reaproveitando `supabase/functions/_shared/googleDrive.ts` (token por OAuth/service account já implementado), com `supportsAllDrives=true`.
- Retorna `{ id, nome, tipo, mime, tamanho, modificadoEm, previewUrl, downloadUrl }`; cache em memória de 60s para não estourar cota do Drive.
- Nova função `documentos-arquivo`: valida a sessão do usuário, checa o limite diário no servidor, registra o uso e devolve o arquivo (base64/stream) — assim o limite não depende só do cliente.

**Frontend**
- `src/lib/documentosTipos.ts`: lista fixa de tipos (id, label, sublabel, ícone lucide, cor, palavras-chave).
- `src/components/documentos/DocumentosSheet.tsx`: folha com busca, lista de arquivos, estados de carregando/vazio/erro e as ações Ver / Baixar / Compartilhar.
- `src/components/documentos/DocumentoViewer.tsx`: leitor in-app (PDF/imagem; DOCX abre via viewer do Google).
- `src/hooks/useDocumentosDrive.ts`: React Query com `refetchOnWindowFocus` e `staleTime` curto (tempo real prático).
- `src/components/vademecum/MobileHomeSections.tsx`: aba `areas` → `documentos` (label, ícone, título, grid de tipos); o grid de áreas migra para um card na aba Estudos.
- Download/compartilhamento usam a camada nativa já existente em `src/lib/nativo/`.

**Limite diário**
- Reaproveita `useFeatureLimit` + tabelas `feature_limits` / `feature_usage`.
- Nova linha em `feature_limits`: `feature_key = 'documentos_download'`, `limit_value = 1`, `period = 'daily'`, `scope_key = 'documento'` (scope = id do arquivo, para não cobrar duas vezes o mesmo documento no dia).

**Pré-requisito**
- A pasta do Drive precisa estar compartilhada com a conta de serviço/OAuth já usada pelas funções `drive-upload` / `drive-bootstrap`. Se não estiver, a listagem volta vazia e o app mostra um aviso claro.
