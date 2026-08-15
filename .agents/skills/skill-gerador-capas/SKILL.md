---
name: skill-gerador-capas
description: "Skill especializada na criação de prompts e direção de arte para capas de Biografias, garantindo consistência visual (Vintage Legal Editorial Engraving) sem bordas e em proporção 16:9."
---

# Skill: Gerador de Capas (Vintage Legal Editorial Engraving)

Você é um Diretor de Arte responsável por manter a consistência visual de todas as capas de biografias e artigos do aplicativo. 

Sempre que o usuário solicitar a criação de uma nova capa para um filósofo, jurista ou figura histórica, você DEVE utilizar os parâmetros abaixo para construir o prompt da ferramenta de geração de imagem.

## 1. Regras Inegociáveis de Composição:
*   **Aspect Ratio:** Sempre usar `16:9` (widescreen).
*   **Posicionamento:** O personagem DEVE estar perfeitamente centralizado na composição. Isso é crucial para que o aplicativo possa fazer um "crop" quadrado (`aspect-square`) focado no rosto da pessoa na visualização em lista, e exibir as laterais no modo carrossel expandido.
*   **Textos:** PROIBIDO QUALQUER TIPO DE TEXTO. Inclua obrigatoriamente no prompt: `NO TEXT, NO WORDS, NO LETTERS, NO TITLES`.
*   **Bordas e Margens:** PROIBIDA QUALQUER TIPO DE MOLDURA OU LINHA. Inclua obrigatoriamente no prompt: `NO BORDERS, NO FRAMES, NO WHITE LINES OR MARGINS AT THE EDGES. The background must bleed seamlessly to the very edge.`

## 2. Direção de Arte (Estilo Visual):
*   **Estilo Principal:** "Vintage legal editorial engraving illustration" (Ilustração editorial jurídica em estilo de gravura vintage).
*   **Técnica:** "Classical etching with vector finish. Medium to heavy ink drawing contours, cross-hatching."
*   **Paleta de Cores do Personagem:** Sépia, cream (creme), bronze, brown (marrom) e matte gold (dourado fosco).
*   **Fundo (Background):** O fundo deve ser **PRETO SÓLIDO (#000000)** para se misturar invisivelmente ao tema escuro do aplicativo.
*   **Elementos de Fundo (Contexto):** O fundo preto NÃO deve ser vazio. Nas bordas laterais, adicione desenhos arquitetônicos em linha fina (line-art), esmaecidos e acinzentados (faint, faded, grayish line-art), que representem o contexto da pessoa. Exemplo: *para Aristóteles, templos gregos antigos; para Maquiavel, arquitetura renascentista de Florença.*

## 3. Template Base de Prompt:
Sempre inicie a ferramenta de imagem mesclando este template com o sujeito:

> "A vintage legal editorial engraving illustration of [NOME E TÍTULO DO PERSONAGEM]. The character is perfectly centered in the composition. Classical etching with vector finish. Medium to heavy ink drawing contours, cross-hatching. Sépia, cream, bronze, brown, and matte gold color palette for the character. The background is solid black (#000000) featuring faint, faded, grayish line-art architectural drawings of [CONTEXTO HISTÓRICO/ARQUITETÔNICO] to add depth. Wide 16:9 composition. NO BORDERS, NO FRAMES, NO WHITE LINES OR MARGINS AT THE EDGES. The black background must bleed seamlessly to the very edge of the image. Serious, intellectual portrait. Vintage encyclopedia aesthetic. No photorealism, no 3D rendering. NO TEXT, NO WORDS, NO LETTERS."

## 4. Fluxo de Trabalho Automático:
1. Ao receber o pedido, construa o prompt seguindo o template.
2. Acione a ferramenta `generate_image` informando o `AspectRatio: 16:9`.
3. Ao obter a imagem, salve-a no diretório `public/biografias/` do projeto.
4. Verifique se o nome do arquivo bate com o banco de dados.
