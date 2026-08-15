import { motion } from 'framer-motion';
import { ArrowLeft, UserRound } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { getBiografiasByCategoria } from '@/data/biografias';

interface Props {
  categoriaId: string;
  categoriaLabel: string;
  onBack: () => void;
  onSelectPersonagem: (id: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export const BiografiaListView = ({ categoriaId, categoriaLabel, onBack, onSelectPersonagem }: Props) => {
  const biografias = getBiografiasByCategoria(categoriaId);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 pb-32">
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground tracking-tight uppercase">
            {categoriaLabel}
          </h2>
          <p className="text-sm font-body text-muted-foreground leading-relaxed">
            {biografias.length} {biografias.length === 1 ? 'personalidade' : 'personalidades'} nesta categoria.
          </p>
        </div>
      </div>

      {biografias.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border/40">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <UserRound className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground">Ainda vazio</h3>
          <p className="text-sm text-muted-foreground">Novas biografias de {categoriaLabel} serão adicionadas em breve.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(
            biografias.reduce((acc, bio) => {
              const epoca = bio.epoca || 'Outras Épocas';
              if (!acc[epoca]) acc[epoca] = [];
              acc[epoca].push(bio);
              return acc;
            }, {} as Record<string, typeof biografias>)
          )
          .sort((a, b) => {
            const aOrdem = a[1][0]?.ordemEpoca ?? 999;
            const bOrdem = b[1][0]?.ordemEpoca ?? 999;
            return aOrdem - bOrdem;
          })
          .map(([epoca, bios]) => (
            <div key={epoca}>
              {/* Divider Marrom Claro com Título da Época */}
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px w-6 md:w-12 bg-[#B98758]/50" />
                <h3 className="text-sm md:text-base font-display font-bold text-[#B98758] uppercase tracking-widest whitespace-nowrap">
                  {epoca}
                </h3>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
              >
                {bios.map((bio) => (
                  <motion.div
                    key={bio.id}
                    variants={itemVariants}
                    onClick={() => { haptic.selection(); onSelectPersonagem(bio.id); }}
                    className="group cursor-pointer rounded-2xl md:rounded-3xl bg-card border border-border/40 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                  >
                    <div className="aspect-square md:aspect-[4/3] bg-secondary relative overflow-hidden">
                      {bio.imagemUrl ? (
                        <img 
                          src={bio.imagemUrl} 
                          alt={bio.nome} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                          <UserRound className="w-12 h-12 text-zinc-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-3 md:p-5 w-full">
                        <h3 className="font-display font-bold text-sm md:text-lg text-white group-hover:text-primary transition-colors leading-tight drop-shadow-md">
                          {bio.nome}
                        </h3>
                        {bio.datasVida && (
                          <p className="text-xs text-white/80 font-body mt-1 drop-shadow-md">
                            {bio.datasVida}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="p-3 md:p-5 hidden md:block">
                      <p className="text-xs md:text-sm font-body text-muted-foreground line-clamp-2">
                        {bio.subtitulo}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BiografiaListView;
