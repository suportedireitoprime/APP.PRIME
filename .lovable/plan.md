## Objetivo

Ao abrir o Me Explique, a câmera já liga (preview ao vivo). O botão "Me explique" só inicia o professor, ficando verde enquanto a sessão está ativa. A imagem passa a usar a qualidade real da câmera do aparelho, com toque para focar.

## 1. Câmera liga ao entrar na tela

- Separar em duas etapas: **preview** (só câmera, sem áudio nem WebSocket) e **sessão** (professor ao vivo).
- Ao montar a página, pedir a permissão nativa de câmera e abrir o preview automaticamente. Se a permissão for negada, mostrar a mensagem atual com botão de tentar de novo.
- O microfone continua sendo pedido apenas quando o usuário toca em "Me explique" (evita pedir microfone sem necessidade).
- Ao iniciar a sessão, reaproveitar o stream de vídeo já aberto em vez de abrir a câmera de novo (hoje ela reabre e “pisca”).
- Pausar/soltar a câmera ao sair da tela ou quando o app vai para segundo plano, e reabrir ao voltar.

## 2. Botão verde indicando "funcionando"

- Estado `inativo` → botão vermelho (primary) "Me explique".
- Estados `conectando` → botão verde com spinner ("Conectando…").
- Estados `ouvindo`/`falando` → botão verde com ponto pulsante ("Ao vivo"); toque nele (ou no botão Encerrar) finaliza.
- Erro/encerrado → volta ao vermelho com "Tentar de novo".
- Adicionar o verde como token semântico no CSS global (ex.: `--success`) para não usar cor fixa no componente.

## 3. Qualidade real da câmera

Motivo da imagem ruim hoje: os constraints pedem 1280x720 “ideal”, o vídeo é exibido com `object-cover` (recorta), e o frame enviado é reduzido para 768 px com JPEG 0.7 — então tanto o preview quanto o que a IA vê ficam abaixo da capacidade do aparelho.

Ajustes:
- Constraints em cascata pedindo a maior resolução suportada (4K → 1440p → 1080p → 720p → `video: true`), com `aspectRatio` livre e `frameRate: { ideal: 30 }`.
- Aplicar `applyConstraints` após abrir, usando `getCapabilities()` para subir para o máximo real do sensor.
- Ativar recursos avançados quando o aparelho suportar: `focusMode: "continuous"`, `exposureMode: "continuous"`, `whiteBalanceMode: "continuous"` (com fallback silencioso se não suportado).
- **Toque para focar**: tocar no preview aplica `pointsOfInterest` + `focusMode: "single-shot"` no ponto tocado, com animação de anel de foco; volta a contínuo depois.
- **Pinça para zoom** (quando `zoom` estiver nas capacidades) e botão de lanterna quando `torch` existir — útil para livro em ambiente escuro.
- Preview em `object-contain` no modo de leitura (não recorta o texto da página) e overlay de mira alinhado ao quadro real.

## 4. Qualidade do frame enviado à IA

- Subir a captura para até 1280 px no lado maior com JPEG 0,85 (ainda dentro dos limites da Live API), mantendo 1 fps.
- Enviar um frame de alta qualidade extra logo após o toque de foco e ao iniciar a sessão, para o reconhecimento inicial do material ser mais preciso.
- Recortar o frame na área da mira quando o usuário estiver com o guia visível, para o modelo focar no texto e não no ambiente.

## Detalhes técnicos

- `src/lib/meExplique/camera.ts` (novo): abrir/fechar stream, cascata de resoluções, `aplicarMelhorias()`, `focarEm(x, y)`, `definirZoom()`, `alternarLanterna()`. Tipos estendidos localmente, já que `MediaTrackCapabilities` do TS não cobre `focusMode`/`zoom`/`torch`.
- `src/lib/meExplique/liveClient.ts`: aceitar um `MediaStream` já pronto por opção (sem abrir câmera própria), captura de frame com resolução/qualidade novas e recorte opcional.
- `src/pages/MeExplique.tsx`: preview automático, gestos de foco/zoom, botão com estados de cor, lanterna, liberação da câmera em background.
- `src/index.css`: token `--success` (e variante para o botão ao vivo).
- Nenhuma mudança de backend; a edge function `me-explique-token` continua igual.
- Depois do build nativo: `git pull` e `npx cap sync` antes de gerar o próximo APK/IPA.
