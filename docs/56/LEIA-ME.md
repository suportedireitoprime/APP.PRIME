# Fila de prompts para o Google Flow — v1.2.0

## Atualização principal
- Intervalo mínimo/padrão entre envios: **3 segundos**.
- Carrosséis jurídicos: **8 a 12 cards**.
- Prompt-base inclui **Design 2** para personagens principais: recorte/papel rasgado, personagem à direita, contorno branco e elementos complementares.
- Campos para **@ do Instagram** e **logo/nome da marca**, com instrução de selo azul no prompt.
- Botão **Baixar geradas (.zip)**: rastreia as imagens que surgirem após o início da fila e baixa apenas esse lote.

## Correção v1.2.0 do ZIP
A versão anterior conseguia rastrear as imagens, mas algumas URLs do Google Flow/CDN não podiam ser lidas diretamente pelo script da página por restrições de CORS.

Agora a extensão busca imagens HTTP/HTTPS pelo service worker da própria extensão, usando as permissões de host, e monta o ZIP depois. URLs blob/data continuam sendo lidas localmente.

## Instalação
1. Extraia o ZIP da extensão para uma pasta.
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Escolha a pasta extraída.
6. Recarregue a página do Google Flow.

Ao atualizar uma instalação anterior, remova/recarregue a extensão para garantir que o novo `manifest.json` e o novo service worker sejam aplicados.
