# Trocar o logo do app (ícone + tela de abertura) pela coruja nova

O logo enviado (coruja branca com capelo, balança dourada e fundo vermelho) passa a ser o único ícone do aplicativo, em iOS, Android e web.

## O que muda

1. **Fonte única do logo**
   - A imagem enviada é convertida em um PNG quadrado 1024x1024 e passa a ser a base de todos os ícones.

2. **iOS (o que aparece no TestFlight e no celular)**
   - `build-assets/ios-app-icon.png` (usado pelo workflow para gerar todo o `AppIcon.appiconset`, incluindo o slot 1024 que a App Store exibe) é substituído pelo logo novo.
   - O workflow do iOS hoje **não injeta tela de abertura** — a splash fica a padrão do Capacitor. Vou adicionar um passo que gera o `Splash.imageset` (2732x2732, claro e escuro) a partir do logo centralizado sobre o fundo vinho, para que a abertura mostre a coruja.

3. **Android**
   - `resources/icon.png`, `icon-foreground.png`, `icon-background.png`, `icon-monochrome.png`, `notification-icon.png`, `splash.png` e `splash-dark.png` são regerados a partir do logo novo (mesmas dimensões e formatos que o pipeline já espera, para não quebrar o guard de branding do workflow).

4. **Web / PWA**
   - `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`, `public/favicon.png`, `favicon-32x32.png`, `favicon-16x16.png` atualizados com o logo novo.

5. **Varredura**
   - Busca por qualquer outro ícone/splash antigo referenciado no código (manifest, `mediaSession`, links de compartilhamento, imagens OG) e troca pelo novo.

6. **Publicar e compilar**
   - Commit e push de tudo para `suportedireitoprime/APP.PRIME`, depois disparo a build iOS e acompanho até subir para o TestFlight com o ícone certo.

## Detalhes técnicos

- Geração com Pillow/ImageMagick: recorte central quadrado, achatamento do alfa sobre `#8C1220` (o `background_color` do manifest) para os slots iOS, que não aceitam transparência; versão RGBA preservada para o `icon-foreground` adaptativo do Android (logo a ~66% do canvas).
- `notification-icon.png` continua 96x96 monocromático branco com alfa, como o workflow do Android exige.
- Nenhuma alteração de código de negócio; só assets e o passo novo de splash no `build-ios.yml`.
- Observação: o ícone amarelo com "V" que apareceu no TestFlight vem do binário antigo/app anterior; ele só é substituído quando uma nova build sobe — por isso a build entra no final do plano.
