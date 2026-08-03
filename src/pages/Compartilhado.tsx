import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Sparkles, ExternalLink, Copy, Check, FileText } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { motion } from 'framer-motion';
import { useGoBack } from '@/hooks/useGoBack';
import { copiarTexto } from '@/lib/nativo/copiar';

/**
 * Página que recebe conteúdo compartilhado com o Direito Prime de outros apps
 * (via Android Share Sheet → SEND intent).
 *
 * Query params:
 *   - texto: texto compartilhado
 *   - url:   URL compartilhada (opcional)
 *
 * Oferece ações rápidas: buscar nas leis, perguntar à IA, abrir link.
 */
export default function Compartilhado() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [params] = useSearchParams();
  const texto = params.get('texto') ?? '';
  const url = params.get('url') ?? '';
  const [copiado, setCopiado] = useState(false);

  const conteudo = useMemo(() => texto || url, [texto, url]);

  useEffect(() => {
    document.title = 'Compartilhado com Direito Prime';
  }, []);

  const buscar = () => {
    if (!conteudo) return;
    navigate(`/buscar?q=${encodeURIComponent(conteudo.slice(0, 300))}`);
  };

  const perguntar = () => {
    if (!conteudo) return;
    navigate(`/assistente?pergunta=${encodeURIComponent(conteudo.slice(0, 500))}`);
  };

  // Gera um resumo do conteúdo recebido direto no assistente.
  const gerarResumo = () => {
    if (!conteudo) return;
    const pedido = `Faça um resumo jurídico estruturado do conteúdo abaixo:\n\n${conteudo.slice(0, 4000)}`;
    navigate(`/assistente?pergunta=${encodeURIComponent(pedido)}`);
  };

  const copiar = async () => {
    try {
      await copiarTexto(conteudo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {}
  };

  return (
    <div className="min-h-dvh bg-background pb-20">
      <PageHeader title="Compartilhado" onBack={() => goBack()} />


      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {!conteudo ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Nenhum conteúdo recebido.</p>
            <p className="text-xs mt-2">
              Selecione um texto em outro app e escolha "Direito Prime" no menu de compartilhar.
            </p>
          </div>
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card border border-border p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Conteúdo recebido
                </span>
                <button
                  onClick={copiar}
                  className="p-1.5 rounded-md hover:bg-muted"
                  aria-label="Copiar"
                >
                  {copiado ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {texto || url}
              </p>
              {url && texto && (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  {url}
                </a>
              )}
            </motion.section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={buscar}
                className="flex items-center gap-3 p-4 rounded-2xl bg-primary text-primary-foreground text-left"
              >
                <Search className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Buscar nas leis</div>
                  <div className="text-xs opacity-80">Encontre artigos relacionados</div>
                </div>
              </button>
              <button
                onClick={perguntar}
                className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border text-left"
              >
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-semibold">Perguntar à IA</div>
                  <div className="text-xs text-muted-foreground">Análise jurídica com IA</div>
                </div>
              </button>
              <button
                onClick={gerarResumo}
                className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border text-left sm:col-span-2"
              >
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-semibold">Gerar resumo</div>
                  <div className="text-xs text-muted-foreground">Resumo jurídico estruturado deste conteúdo</div>
                </div>
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
