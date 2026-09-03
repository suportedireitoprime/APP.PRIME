import {pickAsset, srcOf } from '@/lib/assetUrl';
import a01Asset from './01-socrates.webp.asset.json';
import a01Bundled from './01-socrates.webp';
import a02Asset from './02-aristotle.webp.asset.json';
import a02Bundled from './02-aristotle.webp';
import a03Asset from './03-plato.webp.asset.json';
import a03Bundled from './03-plato.webp';
import a04Asset from './04-cicero.webp.asset.json';
import a04Bundled from './04-cicero.webp';
import a05Asset from './05-kant.webp.asset.json';
import a05Bundled from './05-kant.webp';
import a06Asset from './06-montesquieu.webp.asset.json';
import a06Bundled from './06-montesquieu.webp';
import a07Asset from './07-lawyer-reading.webp.asset.json';
import a07Bundled from './07-lawyer-reading.webp';
import a08Asset from './08-lawyer-arguing.webp.asset.json';
import a08Bundled from './08-lawyer-arguing.webp';
import a09Asset from './09-judge.webp.asset.json';
import a09Bundled from './09-judge.webp';
import a10Asset from './10-lawyer-walking.webp.asset.json';
import a10Bundled from './10-lawyer-walking.webp';
import a11Asset from './11-lawyer-oath.webp.asset.json';
import a11Bundled from './11-lawyer-oath.webp';
import a12Asset from './12-lawyer-contract.webp.asset.json';
import a12Bundled from './12-lawyer-contract.webp';
import a13Asset from './13-student-desk.webp.asset.json';
import a13Bundled from './13-student-desk.webp';
import a14Asset from './14-student-reading.webp.asset.json';
import a14Bundled from './14-student-reading.webp';
import a15Asset from './15-student-laptop.webp.asset.json';
import a15Bundled from './15-student-laptop.webp';
import a16Asset from './16-student-stacking.webp.asset.json';
import a16Bundled from './16-student-stacking.webp';
import a17Asset from './17-student-pointing.webp.asset.json';
import a17Bundled from './17-student-pointing.webp';
import a18Asset from './18-student-silhouette.webp.asset.json';
import a18Bundled from './18-student-silhouette.webp';
import a19Asset from './19-students-group.webp.asset.json';
import a19Bundled from './19-students-group.webp';
import a20Asset from './20-student-blackboard.webp.asset.json';
import a20Bundled from './20-student-blackboard.webp';
import a21Asset from './21-facade.webp.asset.json';
import a21Bundled from './21-facade.webp';
import a22Asset from './22-colonnade.webp.asset.json';
import a22Bundled from './22-colonnade.webp';
import a23Asset from './23-gothic-window.webp.asset.json';
import a23Bundled from './23-gothic-window.webp';
import a24Asset from './24-staircase.webp.asset.json';
import a24Bundled from './24-staircase.webp';
import a25Asset from './25-looking-up.webp.asset.json';
import a25Bundled from './25-looking-up.webp';
import a26Asset from './26-scales.webp.asset.json';
import a26Bundled from './26-scales.webp';
import a27Asset from './27-gavel.webp.asset.json';
import a27Bundled from './27-gavel.webp';
import a28Asset from './28-scroll.webp.asset.json';
import a28Bundled from './28-scroll.webp';
import a29Asset from './29-quill.webp.asset.json';
import a29Bundled from './29-quill.webp';
import a30Asset from './30-open-book.webp.asset.json';
import a30Bundled from './30-open-book.webp';

const a01 = pickAsset(a01Bundled, srcOf(a01Asset));
const a02 = pickAsset(a02Bundled, srcOf(a02Asset));
const a03 = pickAsset(a03Bundled, srcOf(a03Asset));
const a04 = pickAsset(a04Bundled, srcOf(a04Asset));
const a05 = pickAsset(a05Bundled, srcOf(a05Asset));
const a06 = pickAsset(a06Bundled, srcOf(a06Asset));
const a07 = pickAsset(a07Bundled, srcOf(a07Asset));
const a08 = pickAsset(a08Bundled, srcOf(a08Asset));
const a09 = pickAsset(a09Bundled, srcOf(a09Asset));
const a10 = pickAsset(a10Bundled, srcOf(a10Asset));
const a11 = pickAsset(a11Bundled, srcOf(a11Asset));
const a12 = pickAsset(a12Bundled, srcOf(a12Asset));
const a13 = pickAsset(a13Bundled, srcOf(a13Asset));
const a14 = pickAsset(a14Bundled, srcOf(a14Asset));
const a15 = pickAsset(a15Bundled, srcOf(a15Asset));
const a16 = pickAsset(a16Bundled, srcOf(a16Asset));
const a17 = pickAsset(a17Bundled, srcOf(a17Asset));
const a18 = pickAsset(a18Bundled, srcOf(a18Asset));
const a19 = pickAsset(a19Bundled, srcOf(a19Asset));
const a20 = pickAsset(a20Bundled, srcOf(a20Asset));
const a21 = pickAsset(a21Bundled, srcOf(a21Asset));
const a22 = pickAsset(a22Bundled, srcOf(a22Asset));
const a23 = pickAsset(a23Bundled, srcOf(a23Asset));
const a24 = pickAsset(a24Bundled, srcOf(a24Asset));
const a25 = pickAsset(a25Bundled, srcOf(a25Asset));
const a26 = pickAsset(a26Bundled, srcOf(a26Asset));
const a27 = pickAsset(a27Bundled, srcOf(a27Asset));
const a28 = pickAsset(a28Bundled, srcOf(a28Asset));
const a29 = pickAsset(a29Bundled, srcOf(a29Asset));
const a30 = pickAsset(a30Bundled, srcOf(a30Asset));


export type HeroFigureSide = 'left' | 'center' | 'right';

export interface HeroFigure {
  url: string;
  alt: string;
  caption: string;
  side: HeroFigureSide;
}

// Ordem cicla entre lados (right → center → left) para nunca repetir posição
// e para variar o "peso" visual do slide.
export const heroFigures: HeroFigure[] = [
  { url: a01, alt: 'Sócrates', caption: 'Sócrates — o mestre do questionar', side: 'right' },
  { url: a02, alt: 'Aristóteles', caption: 'Aristóteles — a virtude na medida', side: 'center' },
  { url: a03, alt: 'Platão', caption: 'Platão — o filósofo do ideal', side: 'left' },
  { url: a04, alt: 'Cícero', caption: 'Cícero — a palavra que persuade', side: 'right' },
  { url: a05, alt: 'Kant', caption: 'Kant — a razão como imperativo', side: 'center' },
  { url: a06, alt: 'Montesquieu', caption: 'Montesquieu — o espírito das leis', side: 'left' },
  { url: a07, alt: 'Advogado lendo peça', caption: 'A análise atenta da peça', side: 'right' },
  { url: a08, alt: 'Advogada argumentando', caption: 'A defesa em tribuna', side: 'center' },
  { url: a09, alt: 'Juiz com martelo', caption: 'A decisão que encerra o litígio', side: 'left' },
  { url: a10, alt: 'Advogada caminhando', caption: 'O peso dos códigos, o rumo do estudo', side: 'right' },
  { url: a11, alt: 'Juramento de advogado', caption: 'O juramento que abre a toga', side: 'center' },
  { url: a12, alt: 'Advogado com contrato', caption: 'A cláusula que revela intenção', side: 'left' },
  { url: a13, alt: 'Estudante à mesa', caption: 'A madrugada que forma o jurista', side: 'right' },
  { url: a14, alt: 'Estudante lendo', caption: 'A leitura que fixa o conceito', side: 'center' },
  { url: a15, alt: 'Estudante com notebook', caption: 'O foco na próxima prova', side: 'left' },
  { url: a16, alt: 'Estudante empilhando livros', caption: 'Cada código, um degrau', side: 'right' },
  { url: a17, alt: 'Estudante apontando a lei', caption: 'O artigo exato para o caso', side: 'center' },
  { url: a18, alt: 'Estudante em contraluz', caption: 'A luz que atravessa o vitral', side: 'left' },
  { url: a19, alt: 'Grupo de estudantes', caption: 'O debate que amadurece a tese', side: 'right' },
  { url: a20, alt: 'Estudante de costas', caption: 'O quadro cheio de anotações', side: 'center' },
  { url: a21, alt: 'Fachada de faculdade', caption: 'O portal das faculdades de direito', side: 'left' },
  { url: a22, alt: 'Colonata em perspectiva', caption: 'A luz no fim da colunata', side: 'right' },
  { url: a23, alt: 'Janela gótica', caption: 'A janela que ilumina o estudo', side: 'center' },
  { url: a24, alt: 'Escadaria da faculdade', caption: 'Os degraus que levam à toga', side: 'left' },
  { url: a25, alt: 'Pessoa olhando a faculdade', caption: 'O sonho começa no olhar', side: 'right' },
  { url: a26, alt: 'Balança da justiça', caption: 'O equilíbrio da justiça', side: 'center' },
  { url: a27, alt: 'Martelo do juiz', caption: 'O martelo que sela a decisão', side: 'left' },
  { url: a28, alt: 'Pergaminho lacrado', caption: 'O pergaminho e o selo do direito', side: 'right' },
  { url: a29, alt: 'Pena e tinteiro', caption: 'A pena que registra o direito', side: 'center' },
  { url: a30, alt: 'Livro de leis aberto', caption: 'O código aberto sobre a mesa', side: 'left' },
];
