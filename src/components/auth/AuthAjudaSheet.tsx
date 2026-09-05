import { useState } from 'react';
import { Mail, ChevronDown, X } from 'lucide-react';

interface AuthAjudaSheetProps {
  open: boolean;
  onClose: () => void;
}

export const AuthAjudaSheet = ({ open, onClose }: AuthAjudaSheetProps) => {
  const [openQ, setOpenQ] = useState<number | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#050505] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#050505]/90 backdrop-blur-md z-10 pt-[calc(var(--sai-top,0px)+1.5rem)]">
        <h2 className="text-xl font-display font-bold text-white">Central de Ajuda</h2>
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-white/70 hover:text-white rounded-full bg-white/5 active:scale-95 transition-transform"
          aria-label="Fechar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 max-w-2xl mx-auto w-full flex-1 flex flex-col gap-6 pb-[calc(var(--sai-bottom,0px)+2rem)]">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">Dúvidas Frequentes</h3>

          {[
            {
              q: "Não estou conseguindo entrar com meu e-mail",
              a: "Verifique se você digitou o e-mail corretamente e se já realizou a sua assinatura. Caso tenha esquecido a senha, utilize a opção 'Esqueceu sua senha?' na tela de login."
            },
            {
              q: "Fiz a assinatura mas o acesso está bloqueado",
              a: "As assinaturas podem levar alguns minutos para serem processadas. Se você pagou via Boleto, pode levar até 3 dias úteis. Caso tenha sido via Pix ou Cartão, mande um e-mail para o nosso suporte com o comprovante."
            },
            {
              q: "Como cancelar minha assinatura?",
              a: "O cancelamento pode ser feito a qualquer momento diretamente pelas configurações da sua conta dentro do aplicativo, na aba 'Meu Espaço'."
            }
          ].map((faq, i) => (
            <div key={i} className="border border-white/10 rounded-2xl bg-white/5 overflow-hidden">
              <button
                onClick={() => setOpenQ(openQ === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left text-white font-medium hover:bg-white/5 transition-colors"
              >
                {faq.q}
                <ChevronDown
                  className={`w-5 h-5 text-white/50 transition-transform ${openQ === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openQ === i && (
                <div className="px-5 pb-5 text-white/70 text-sm leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-3xl bg-primary/10 border border-primary/20 text-center">
          <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Ainda precisa de ajuda?</h3>
          <p className="text-sm text-white/70 mb-4">
            Envie um e-mail para nossa equipe de suporte. Nosso tempo útil de resposta é de <strong className="text-white">até 2 dias</strong>.
          </p>
          <a
            href="mailto:suporte.direitoprime@gmail.com"
            className="inline-block w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold transition-all hover:opacity-90 active:scale-[0.98]"
          >
            suporte.direitoprime@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};
