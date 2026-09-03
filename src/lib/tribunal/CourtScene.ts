import { CharacterRole } from './courtGameData';

type CharacterConfig = {
  id: CharacterRole;
  name: string;
  accent: number;
  robe?: boolean;
};

const CHARACTERS: CharacterConfig[] = [
  { id: 'juiz', name: 'Juiz', accent: 0xd4af37, robe: true },
  { id: 'promotor', name: 'Promotor', accent: 0x8f1d2c },
  { id: 'defesa', name: 'Defesa', accent: 0x1f5eff },
  { id: 'reu', name: 'Cliente', accent: 0xb7791f },
  { id: 'testemunha', name: 'Testemunha', accent: 0x0f766e },
  { id: 'professor', name: 'Professor', accent: 0x7c3aed },
];

export function createCourtSceneClass(Phaser: any) {
  return class CourtScene extends Phaser.Scene {
    private characters: Record<string, any> = {};
    private bgImage: any;
    private vignette: any;
    private floorShadow: any;
    private spotlight: any;
    private hammer: any;
    private currentSpeaker?: CharacterRole;

    constructor() {
      super('CourtScene');
    }

    preload() {
      this.load.image('courtBg', '/assets/images/courtroom_bg.webp');
    }

    create() {
      const { width, height } = this.scale.gameSize;

      this.bgImage = this.add.image(0, 0, 'courtBg').setOrigin(0.5);

      this.vignette = this.add.graphics().setDepth(5);
      this.floorShadow = this.add.graphics().setDepth(9);

      this.spotlight = this.add.ellipse(0, 0, 190, 130, 0xf8e7b8, 0.18)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(10)
        .setAlpha(0);

      CHARACTERS.forEach((character) => {
        this.characters[character.id] = this.createCharacter(character);
      });

      this.hammer = this.createHammer().setDepth(40);

      this.updateLayout(width, height);
      this.scale.on('resize', this.handleResize, this);
    }

    setActiveSpeaker(speaker?: CharacterRole) {
      if (!speaker || !this.characters[speaker]) return;

      this.currentSpeaker = speaker;
      const target = this.characters[speaker];

      Object.entries(this.characters).forEach(([id, character]: [string, any]) => {
        const isSpeaker = id === speaker;
        this.tweens.killTweensOf(character);
        this.tweens.add({
          targets: character,
          alpha: speaker === 'professor' ? (isSpeaker ? 1 : 0.22) : (isSpeaker ? 1 : 0.68),
          scaleX: character.baseScale * (isSpeaker ? 1.06 : 1),
          scaleY: character.baseScale * (isSpeaker ? 1.06 : 1),
          y: character.baseY - (isSpeaker ? 10 : 0),
          duration: 240,
          ease: 'Cubic.easeOut',
        });
      });

      this.tweens.killTweensOf(this.spotlight);
      this.tweens.add({
        targets: this.spotlight,
        x: target.x,
        y: target.baseY - 18,
        alpha: speaker === 'professor' ? 0.28 : 0.22,
        scaleX: speaker === 'juiz' ? 1.15 : 1,
        scaleY: speaker === 'juiz' ? 1.05 : 1,
        duration: 280,
        ease: 'Cubic.easeOut',
      });
    }

    playCourtAction(action: string) {
      if (action !== 'objection') return;

      this.tweens.add({
        targets: this.hammer,
        angle: -32,
        duration: 90,
        yoyo: true,
        repeat: 1,
        ease: 'Power2',
      });
      this.cameras.main.shake(160, 0.006);
    }

    private handleResize(gameSize: any) {
      this.updateLayout(gameSize.width, gameSize.height);
      if (this.currentSpeaker) {
        this.setActiveSpeaker(this.currentSpeaker);
      }
    }

    private updateLayout(w: number, h: number) {
      const isMobile = w < 640;
      const bgScale = Math.max(w / this.bgImage.width, h / this.bgImage.height);

      this.bgImage.setPosition(w / 2, h / 2).setScale(bgScale);

      this.vignette.clear();
      this.vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.18, 0.18, 0.72, 0.72);
      this.vignette.fillRect(0, 0, w, h);

      this.floorShadow.clear();
      this.floorShadow.fillStyle(0x000000, 0.28);
      this.floorShadow.fillEllipse(w / 2, h * 0.64, w * 0.78, h * 0.22);

      const scale = Math.min(1.05, Math.max(0.68, w / 760));
      const usableBottom = isMobile ? h - 250 : h - 230;
      const benchY = Math.min(h * 0.55, usableBottom);
      const judgeY = Math.max(170, h * 0.37);

      this.placeCharacter('juiz', w * 0.5, judgeY, scale * (isMobile ? 0.72 : 0.9));
      this.placeCharacter('testemunha', w * (isMobile ? 0.60 : 0.58), benchY - 46 * scale, scale * 0.72);
      this.placeCharacter('defesa', w * (isMobile ? 0.31 : 0.36), benchY + 30 * scale, scale * 0.82);
      this.placeCharacter('reu', w * (isMobile ? 0.19 : 0.27), benchY + 46 * scale, scale * 0.72);
      this.placeCharacter('promotor', w * (isMobile ? 0.74 : 0.68), benchY + 30 * scale, scale * 0.82);
      this.placeCharacter('professor', w * 0.5, h * 0.48, scale * 1.05);

      this.characters.professor.setAlpha(0);

      this.hammer.setPosition(w * 0.57, judgeY + 34 * scale).setScale(scale * 0.72);
    }

    private placeCharacter(id: CharacterRole, x: number, y: number, scale: number) {
      const character = this.characters[id];
      if (!character) return;

      character.setPosition(x, y);
      character.setScale(scale);
      character.baseScale = scale;
      character.baseY = y;
      character.setDepth(Math.round(y));
    }

    private createCharacter(config: CharacterConfig) {
      const container = this.add.container(0, 0).setDepth(20);
      const g = this.add.graphics();

      g.fillStyle(0x000000, 0.28);
      g.fillEllipse(0, 86, 92, 22);

      g.fillStyle(config.robe ? 0x111827 : 0x172033);
      g.fillRoundedRect(-34, -2, 68, 92, 18);
      g.fillStyle(config.robe ? 0x0b0f19 : 0x243043);
      g.fillRoundedRect(-45, 12, 90, 72, 16);

      g.fillStyle(0xf8fafc);
      g.beginPath();
      g.moveTo(-17, 0);
      g.lineTo(17, 0);
      g.lineTo(0, 36);
      g.closePath();
      g.fillPath();

      g.fillStyle(config.accent);
      g.fillRoundedRect(-7, 3, 14, 38, 4);
      g.fillCircle(0, 44, 7);

      const skin = config.id === 'reu' ? 0xc98b61 : 0xe6b38f;
      g.fillStyle(0x000000, 0.24);
      g.fillCircle(0, -25, 29);
      g.fillStyle(skin);
      g.fillCircle(0, -34, 27);

      g.fillStyle(config.id === 'juiz' ? 0xcbd5e1 : 0x1f2937);
      g.fillRoundedRect(-25, -58, 50, 20, 10);
      g.fillCircle(-18, -42, 11);
      g.fillCircle(18, -42, 11);

      const labelBg = this.add.graphics();
      labelBg.fillStyle(0x060606, 0.66);
      labelBg.lineStyle(1, config.accent, 0.72);
      labelBg.fillRoundedRect(-52, 98, 104, 24, 8);
      labelBg.strokeRoundedRect(-52, 98, 104, 24, 8);

      const label = this.add.text(0, 110, config.name, {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: '700',
        align: 'center',
      }).setOrigin(0.5);

      container.add([g, labelBg, label]);
      return container;
    }

    private createHammer() {
      const container = this.add.container(0, 0);
      const g = this.add.graphics();

      g.fillStyle(0x2b1409);
      g.fillRoundedRect(-19, -10, 38, 18, 4);
      g.fillStyle(0x5a2d14);
      g.fillRoundedRect(-3, -8, 6, 44, 3);
      g.lineStyle(2, 0xd4af37, 0.6);
      g.strokeRoundedRect(-19, -10, 38, 18, 4);

      container.add(g);
      return container;
    }

    destroy() {
      this.scale.off('resize', this.handleResize, this);
      super.destroy();
    }
  };
}
