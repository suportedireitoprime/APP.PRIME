import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterRole } from '@/lib/tribunal/courtGameData';

/* ── Character config ─────────────────────────────────── */
interface CharDef {
  id: CharacterRole;
  name: string;
  accent: string;
  skin: string;
  hair: string;
  robe?: boolean;
}

const CHARACTERS: CharDef[] = [
  { id: 'juiz', name: 'Juiz', accent: '#d4af37', skin: '#e6b38f', hair: '#cbd5e1', robe: true },
  { id: 'promotor', name: 'Promotor', accent: '#8f1d2c', skin: '#e6b38f', hair: '#1f2937' },
  { id: 'defesa', name: 'Defesa', accent: '#1f5eff', skin: '#e6b38f', hair: '#1f2937' },
  { id: 'reu', name: 'Cliente', accent: '#b7791f', skin: '#c98b61', hair: '#1f2937' },
  { id: 'testemunha', name: 'Testemunha', accent: '#0f766e', skin: '#e6b38f', hair: '#1f2937' },
  { id: 'professor', name: 'Professor', accent: '#7c3aed', skin: '#e6b38f', hair: '#1f2937' },
];

/* ── Single character SVG ─────────────────────────────── */
const CharacterSvg: React.FC<{ char: CharDef }> = React.memo(({ char }) => (
  <svg viewBox="-60 -70 120 200" width="100%" height="100%">
    {/* Shadow */}
    <ellipse cx={0} cy={86} rx={46} ry={11} fill="black" opacity={0.28} />
    {/* Body */}
    <rect x={-34} y={-2} width={68} height={92} rx={18} fill={char.robe ? '#111827' : '#172033'} />
    <rect x={-45} y={12} width={90} height={72} rx={16} fill={char.robe ? '#0b0f19' : '#243043'} />
    {/* Tie / collar triangle */}
    <polygon points="-17,0 17,0 0,36" fill="#f8fafc" />
    {/* Accent stripe */}
    <rect x={-7} y={3} width={14} height={38} rx={4} fill={char.accent} />
    <circle cx={0} cy={44} r={7} fill={char.accent} />
    {/* Head shadow */}
    <circle cx={0} cy={-25} r={29} fill="black" opacity={0.24} />
    {/* Head */}
    <circle cx={0} cy={-34} r={27} fill={char.skin} />
    {/* Hair */}
    <rect x={-25} y={-58} width={50} height={20} rx={10} fill={char.hair} />
    <circle cx={-18} cy={-42} r={11} fill={char.hair} />
    <circle cx={18} cy={-42} r={11} fill={char.hair} />
    {/* Label bg */}
    <rect x={-52} y={98} width={104} height={24} rx={8} fill="#060606" opacity={0.66} stroke={char.accent} strokeWidth={1} strokeOpacity={0.72} />
    <text x={0} y={114} textAnchor="middle" fontSize="12" fontWeight={700} fill="white" fontFamily="Arial, sans-serif">{char.name}</text>
  </svg>
));
CharacterSvg.displayName = 'CharacterSvg';

/* ── Hammer SVG ───────────────────────────────────────── */
const HammerSvg: React.FC = React.memo(() => (
  <svg viewBox="-22 -14 44 58" width="100%" height="100%">
    <rect x={-19} y={-10} width={38} height={18} rx={4} fill="#2b1409" />
    <rect x={-19} y={-10} width={38} height={18} rx={4} fill="none" stroke="#d4af37" strokeWidth={2} strokeOpacity={0.6} />
    <rect x={-3} y={-8} width={6} height={44} rx={3} fill="#5a2d14" />
  </svg>
));
HammerSvg.displayName = 'HammerSvg';

/* ── Layout positions (percentage-based) ──────────────── */
interface CharPos { x: string; y: string; scale: number; zIndex: number }

const LAYOUT: Record<CharacterRole, { mobile: CharPos; desktop: CharPos }> = {
  juiz:        { mobile: { x: '50%', y: '30%', scale: 0.72, zIndex: 20 }, desktop: { x: '50%', y: '32%', scale: 0.9, zIndex: 20 } },
  testemunha:  { mobile: { x: '60%', y: '48%', scale: 0.62, zIndex: 25 }, desktop: { x: '58%', y: '48%', scale: 0.72, zIndex: 25 } },
  defesa:      { mobile: { x: '31%', y: '55%', scale: 0.72, zIndex: 30 }, desktop: { x: '36%', y: '55%', scale: 0.82, zIndex: 30 } },
  reu:         { mobile: { x: '19%', y: '58%', scale: 0.62, zIndex: 28 }, desktop: { x: '27%', y: '58%', scale: 0.72, zIndex: 28 } },
  promotor:    { mobile: { x: '74%', y: '55%', scale: 0.72, zIndex: 30 }, desktop: { x: '68%', y: '55%', scale: 0.82, zIndex: 30 } },
  professor:   { mobile: { x: '50%', y: '46%', scale: 0.92, zIndex: 35 }, desktop: { x: '50%', y: '46%', scale: 1.05, zIndex: 35 } },
};

/* ── Props ────────────────────────────────────────────── */
interface PhaserCourtroomProps {
  speaker?: CharacterRole;
  actionNonce?: number;
}

/* ── Main component ───────────────────────────────────── */
const PhaserCourtroom: React.FC<PhaserCourtroomProps> = ({ speaker, actionNonce = 0 }) => {
  const characters = useMemo(() => CHARACTERS, []);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-[#090705]">
      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 z-[5]"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(0,0,0,0.72) 100%)' }} />

      {/* Floor shadow */}
      <div className="pointer-events-none absolute left-1/2 top-[64%] z-[9] h-[22%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-black/28" />

      {/* Spotlight */}
      <AnimatePresence>
        {speaker && speaker !== 'professor' && (
          <motion.div
            key="spotlight"
            className="pointer-events-none absolute z-[10] h-[130px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
            style={{ background: 'radial-gradient(ellipse, rgba(248,231,184,0.22) 0%, transparent 70%)', mixBlendMode: 'screen' }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              left: LAYOUT[speaker]?.desktop.x ?? '50%',
              top: LAYOUT[speaker]?.desktop.y ?? '50%',
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Characters */}
      {characters.map((char) => {
        const pos = LAYOUT[char.id];
        const isSpeaker = speaker === char.id;
        const isProfessor = char.id === 'professor';
        const isVisible = isProfessor ? speaker === 'professor' : true;
        const dimmed = speaker === 'professor' ? (isSpeaker ? 1 : 0.22) : (isSpeaker ? 1 : 0.68);

        return (
          <motion.div
            key={char.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              width: 120,
              height: 200,
              zIndex: pos.desktop.zIndex,
            }}
            initial={false}
            animate={{
              left: pos.desktop.x,
              top: pos.desktop.y,
              scale: pos.desktop.scale * (isSpeaker ? 1.06 : 1),
              opacity: isVisible ? dimmed : 0,
              y: isSpeaker ? -10 : 0,
            }}
            transition={{ duration: 0.24, ease: [0.33, 1, 0.68, 1] }}
          >
            <CharacterSvg char={char} />
          </motion.div>
        );
      })}

      {/* Hammer */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ width: 44, height: 58, left: '57%', top: '38%', zIndex: 40 }}
        animate={actionNonce > 0 ? {
          rotate: [0, -32, 0, -32, 0],
        } : { rotate: 0 }}
        transition={actionNonce > 0 ? { duration: 0.36, ease: 'easeInOut' } : {}}
        key={`hammer-${actionNonce}`}
      >
        <HammerSvg />
      </motion.div>

      {/* Camera shake on objection */}
      {actionNonce > 0 && <ScreenShake key={`shake-${actionNonce}`} />}
    </div>
  );
};

/* ── Screen shake effect (CSS keyframe) ───────────────── */
const ScreenShake: React.FC = () => {
  useEffect(() => {
    const el = document.getElementById('court-scene-root');
    if (!el) return;
    el.style.animation = 'courtShake 160ms ease-out';
    const timer = setTimeout(() => { el.style.animation = ''; }, 200);
    return () => clearTimeout(timer);
  }, []);
  return null;
};

export default PhaserCourtroom;
