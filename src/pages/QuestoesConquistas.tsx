import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Medal, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import DesafiosBottomNav from '@/components/questoes/DesafiosBottomNav';
import { NIVEL_LABEL } from '@/components/questoes/DesafioLinha';
import { useDesafios } from '@/hooks/useQuestoesExtras';
import { useGoBack } from '@/hooks/useGoBack';

const QuestoesConquistas = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { concluidos, loading } = useDesafios();

  return (
    <div className="theme-questoes min-h-screen bg-background pb-28">
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader title="Conquistas" subtitle="Desafios que você concluiu" onBack={() => goBack()} />

        <div className="px-4 py-5">
          {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}

          {!loading && concluidos.length === 0 && (
            <div className="rounded-2xl border border-border bg-card/60 p-6 text-center">
              <Trophy className="mx-auto h-10 w-10 text-muted-foreground/50" strokeWidth={1.4} />
              <p className="mt-3 text-[15px] font-bold text-foreground">Nenhuma medalha ainda</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Conclua um desafio para ver sua primeira conquista aqui.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {concluidos.map((d) => (
              <motion.div
                key={d.desafio_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border p-4"
                style={{ borderColor: `${d.cor}55`, background: `${d.cor}0f` }}
              >
                <Trophy
                  className="pointer-events-none absolute -right-5 -bottom-5 h-24 w-24 opacity-[0.1]"
                  style={{ color: d.cor }}
                  strokeWidth={1}
                />
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: `${d.cor}26`, color: d.cor }}
                >
                  <Medal className="h-6 w-6" />
                </span>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: d.cor }}>
                  {d.trilha_label}
                </p>
                <p className="text-[15px] font-bold text-foreground">{d.titulo}</p>
                <p className="text-[12px] text-muted-foreground">
                  {NIVEL_LABEL[d.nivel] ?? d.nivel} · {d.meta_diaria}/dia
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <DesafiosBottomNav />
    </div>
  );
};

export default QuestoesConquistas;
