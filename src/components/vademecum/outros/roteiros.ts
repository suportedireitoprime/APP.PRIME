export interface RoteiroItem {
  frame: number;
  text: string;
  duration: number;
}

export function buildDynamicRoteiro(texts: string[]): RoteiroItem[] {
  let currentFrame = 5;
  return texts.map(text => {
    const wordCount = text.split(/\s+/).length;
    // 14 frames per word, plus 60 frames (2s) pause. Max reading speed matching.
    const duration = Math.max(180, wordCount * 14 + 60);
    const item = { frame: currentFrame, text, duration };
    currentFrame += duration;
    return item;
  });
}

export const SOCRATES_ROTEIROS: Record<number, RoteiroItem[]> = {
  1: buildDynamicRoteiro([
    "Você sabia que o maior gênio da antiguidade nunca escreveu absolutamente nenhuma palavra sequer na vida?",
    "Nas ruidosas ruas da antiga cidade de Atenas, ele usava a pura ironia como uma arma letal.",
    "Seu objetivo secreto era expor e desmascarar a mais profunda ignorância e arrogância dos homens poderosos.",
    "Mas como ele fazia isso na prática? Através da famosa Maiêutica, o verdadeiro parto das grandes ideias.",
    "Ele não ensinava nada, apenas destruía suas certezas com perguntas que você jamais conseguiria responder facilmente.",
    "Nascido no vibrante ano de quatrocentos e setenta antes de cristo, ele revolucionou o pensamento humano.",
    "Sua inteligência insuportável foi duramente tolerada por muito tempo, mas apenas até o fatídico ano trezentos.",
    "Sem nenhum aviso, foi subitamente acusado de corromper a frágil juventude e levado a um tribunal.",
    "Diante da ameaça de morte, ele tinha a chance perfeita de pedir perdão chorando e tentar fugir.",
    "Sabe o que ele fez? Decidiu debochar friamente da cara de todos os seus próprios juízes enfurecidos!",
    "O resultado dessa ousadia não poderia ser outro: a pena foi beber o terrível e mortal veneno.",
    "Trancado em uma masmorra fria e aguardando o seu fim, permaneceu com uma serenidade completamente inabalável.",
    "Sua última e mais dura lição foi clara: é preferível sofrer uma injustiça do que cometer alguma.",
    "Sem hesitar por um segundo sequer, ele tomou o líquido fatal, respeitando as cruéis leis até o fim.",
    "Assim nasceu o primeiro grande mártir, cujas brilhantes perguntas continuarão vivas para sempre na nossa história.",
  ]),
  2: buildDynamicRoteiro([
  ]),
  3: buildDynamicRoteiro([
  ]),
};

export const PLATAO_ROTEIROS: Record<number, RoteiroItem[]> = {
  1: buildDynamicRoteiro([
    "Ele era um jovem aristocrata rico com o destino absolutamente traçado para governar e dominar a grandiosa Atenas.",
    "Mas o seu mundo virou completamente de cabeça para baixo quando ele conheceu e ouviu o velho Sócrates.",
    "A condenação à morte do seu grande mestre o encheu de um ódio cego e uma profunda e sombria revolta.",
    "Sem conseguir suportar a cidade corrompida, ele fez as malas, fugiu de Atenas e viajou por todo o mundo antigo.",
    "Ao voltar dez anos depois, ele fez algo insano: fundou a famosa Academia, a primeira universidade da história!",
    "No ano revolucionário de trezentos e oitenta e sete antes de cristo, ele desenhou o pensamento de todo o ocidente.",
    "Ele não queria apenas pensar, ele queria reprogramar e moldar inteiramente a realidade da alma humana e da política.",
    "Foi ele quem criou o perturbador Mito da Caverna, o aviso mais assustador e genial sobre a nossa ignorância.",
    "Você acha que é livre? Platão provou que vivemos todos acorrentados e paralisados, observando apenas sombras ilusórias na parede.",
    "O verdadeiro dever do líder e do jurista é se soltar dessas correntes, sair da caverna e buscar a luz.",
    "Em trezentos e setenta e cinco, ele publicou o maior best-seller da filosofia política de todos os tempos: A República.",
    "Ele sonhou com uma utopia extrema governada puramente pela sabedoria lógica de poderosos monarcas chamados Reis-Filósofos.",
    "Para ele, preste muita atenção: a função de uma lei nunca é a vingança barata ou a punição física.",
    "A lei suprema serve única e exclusivamente para tentar educar, consertar e elevar o nível da sua alma humana.",
    "Assim se ergueu o arquiteto mestre que estruturou quase absolutamente tudo aquilo que nós ousamos pensar até os dias de hoje.",
  ]),
  2: buildDynamicRoteiro([
  ]),
  3: buildDynamicRoteiro([
  ]),
};

