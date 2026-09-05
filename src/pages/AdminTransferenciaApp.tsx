import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, Search, ShieldAlert, Save, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  KIND_LABEL,
  TRANSFER_GROUPS,
  TRANSFER_ITENS,
  type TransferItem,
  type TransferKind,
} from '@/data/transferenciaApp';

const LOCAL_KEY = 'direitoprime:transferencia-app';

const KIND_STYLE: Record<TransferKind, string> = {
  arquivo: 'bg-primary/15 text-primary border-primary/30',
  'secret-github': 'bg-muted text-foreground border-border',
  'secret-supabase': 'bg-accent/20 text-foreground border-accent/40',
  'painel-externo': 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function AdminTransferenciaApp() {
  const { user } = useAuth();
  const [valores, setValores] = useState<Record<string, string>>({});
  const [busca, setBusca] = useState('');
  const [grupoAtivo, setGrupoAtivo] = useState<string>('todos');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // carrega perfil salvo (Supabase, com fallback local)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) setValores(JSON.parse(raw));
    } catch { /* noop */ }
    if (!user) return;
    supabase
      .from('app_transfer_profiles')
      .select('id, valores')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setProfileId(data.id);
        if (data.valores && typeof data.valores === 'object') {
          setValores(data.valores as Record<string, string>);
        }
      });
  }, [user]);

  const setValor = (key: string, v: string) => {
    setValores((prev) => {
      const next = { ...prev, [key]: v };
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };

  const salvar = async () => {
    if (!user) { toast.error('Faça login para salvar.'); return; }
    setSalvando(true);
    const payload = { user_id: user.id, nome: valores.app_name || 'Novo app', valores };
    const { data, error } = profileId
      ? await supabase.from('app_transfer_profiles').update(payload).eq('id', profileId).select('id').maybeSingle()
      : await supabase.from('app_transfer_profiles').insert(payload).select('id').maybeSingle();
    setSalvando(false);
    if (error) { toast.error('Erro ao salvar: ' + error.message); return; }
    if (data?.id) setProfileId(data.id);
    toast.success('Perfil de transferência salvo.');
  };

  const preenchidos = useMemo(
    () => TRANSFER_ITENS.filter((i) => (valores[i.key] || '').trim().length > 0).length,
    [valores],
  );
  const obrigatoriosPendentes = useMemo(
    () => TRANSFER_ITENS.filter((i) => i.obrigatorio && !(valores[i.key] || '').trim()).length,
    [valores],
  );

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return TRANSFER_GROUPS
      .filter((g) => grupoAtivo === 'todos' || g.id === grupoAtivo)
      .map((g) => ({
        ...g,
        itens: g.itens.filter((i) =>
          !termo ||
          i.label.toLowerCase().includes(termo) ||
          i.key.includes(termo) ||
          (i.atual || '').toLowerCase().includes(termo) ||
          (i.arquivos || []).some((a) => a.toLowerCase().includes(termo)),
        ),
      }))
      .filter((g) => g.itens.length > 0);
  }, [busca, grupoAtivo]);

  const copiar = async (texto: string, msg = 'Copiado!') => {
    try { await navigator.clipboard.writeText(texto); toast.success(msg); }
    catch { toast.error('Não foi possível copiar.'); }
  };

  const baixar = (nome: string, conteudo: string, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([conteudo], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nome; a.click();
    URL.revokeObjectURL(url);
  };

  /** Mapa antigo → novo, só dos itens de arquivo com valor atual conhecido */
  const mapaSubstituicao = useMemo(() => {
    const map: Record<string, string> = {};
    TRANSFER_ITENS.forEach((i) => {
      const novo = (valores[i.key] || '').trim();
      if (i.kind === 'arquivo' && i.atual && novo && !i.atual.includes('(')) map[i.atual] = novo;
    });
    return map;
  }, [valores]);

  const scriptSed = useMemo(() => {
    const linhas = Object.entries(mapaSubstituicao).map(([antigo, novo]) => {
      const esc = (s: string) => s.replace(/[/&|]/g, (m) => '\\' + m);
      return `rg -l --hidden --glob '!node_modules' --glob '!.git' -F ${JSON.stringify(antigo)} . | xargs -r sed -i 's|${esc(antigo)}|${esc(novo)}|g'`;
    });
    return [
      '#!/usr/bin/env bash',
      '# Substituição de identificadores — gerada em ' + new Date().toLocaleString('pt-BR'),
      '# Rode na raiz do projeto clonado. Revise o diff antes de commitar.',
      'set -euo pipefail',
      '',
      ...(linhas.length ? linhas : ['echo "Nenhum valor novo preenchido ainda."']),
      '',
      'echo "Pronto. Confira: git diff"',
    ].join('\n');
  }, [mapaSubstituicao]);

  const checklistMd = useMemo(() => {
    const linhas: string[] = ['# Checklist de transferência de app', ''];
    TRANSFER_GROUPS.forEach((g) => {
      linhas.push(`## ${g.titulo}`, '');
      g.itens.forEach((i) => {
        const novo = (valores[i.key] || '').trim();
        linhas.push(
          `- [${novo ? 'x' : ' '}] **${i.label}** (${KIND_LABEL[i.kind]})${i.obrigatorio ? ' — obrigatório' : ''}`,
        );
        if (i.atual) linhas.push(`  - Atual: \`${i.atual}\``);
        if (novo) linhas.push(`  - Novo: \`${novo}\``);
        linhas.push(`  - Como obter: ${i.comoObter}`);
        if (i.arquivos?.length) linhas.push(`  - Arquivos: ${i.arquivos.map((a) => `\`${a}\``).join(', ')}`);
      });
      linhas.push('');
    });
    return linhas.join('\n');
  }, [valores]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Transferência de app" />

      <div className="mx-auto w-full max-w-[1400px] px-4 py-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowLeftRight className="h-4 w-4" /> Clonar este app para outra marca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Preencha o valor novo de cada identificador. O que é <strong>arquivo</strong> entra no script de
              substituição; o que é <strong>secret</strong> ou <strong>painel externo</strong> precisa ser criado na
              conta nova e colado no lugar certo.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{preenchidos}/{TRANSFER_ITENS.length} preenchidos</Badge>
              <Badge variant={obrigatoriosPendentes ? 'destructive' : 'secondary'}>
                {obrigatoriosPendentes} obrigatórios pendentes
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" onClick={salvar} disabled={salvando}>
                <Save className="mr-1.5 h-4 w-4" /> Salvar perfil
              </Button>
              <Button size="sm" variant="outline" onClick={() => copiar(JSON.stringify(mapaSubstituicao, null, 2), 'Mapa copiado!')}>
                <Copy className="mr-1.5 h-4 w-4" /> Mapa de substituição (JSON)
              </Button>
              <Button size="sm" variant="outline" onClick={() => baixar('substituir-ids.sh', scriptSed)}>
                <Download className="mr-1.5 h-4 w-4" /> Script find/replace
              </Button>
              <Button size="sm" variant="outline" onClick={() => baixar('TRANSFERENCIA.md', checklistMd, 'text/markdown;charset=utf-8')}>
                <Download className="mr-1.5 h-4 w-4" /> Checklist (Markdown)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardContent className="flex gap-3 py-4 text-sm">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <p className="text-muted-foreground">
              Itens marcados como <strong>credencial nova</strong> não podem ser resolvidos com find/replace: keystore,
              certificados Apple, contas de serviço (Firebase/Play), chave VAPID e tokens de API precisam ser gerados
              do zero na conta do novo app.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por ID, arquivo ou secret…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[{ id: 'todos', titulo: 'Todos' }, ...TRANSFER_GROUPS].map((g) => (
            <Button
              key={g.id}
              size="sm"
              variant={grupoAtivo === g.id ? 'default' : 'outline'}
              onClick={() => setGrupoAtivo(g.id)}
            >
              {g.titulo}
            </Button>
          ))}
        </div>

        {grupos.map((g) => (
          <section key={g.id} className="space-y-3">
            <div className="pt-2">
              <h2 className="text-base font-semibold">{g.titulo}</h2>
              <p className="text-xs text-muted-foreground">{g.desc}</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {g.itens.map((item) => (
                <ItemCard
                  key={item.key}
                  item={item}
                  valor={valores[item.key] || ''}
                  onChange={(v) => setValor(item.key, v)}
                  onCopy={copiar}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ItemCard({
  item, valor, onChange, onCopy,
}: {
  item: TransferItem;
  valor: string;
  onChange: (v: string) => void;
  onCopy: (t: string, msg?: string) => void;
}) {
  return (
    <Card className={valor ? 'border-primary/40' : undefined}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug">{item.label}</h3>
          {item.obrigatorio && <Badge variant="destructive" className="shrink-0 text-[10px]">obrigatório</Badge>}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${KIND_STYLE[item.kind]}`}>
            {KIND_LABEL[item.kind]}
          </span>
          {item.naoSubstituivel && (
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
              credencial nova
            </span>
          )}
        </div>

        {item.atual && (
          <button
            type="button"
            onClick={() => onCopy(item.atual!, 'Valor atual copiado')}
            className="block w-full break-all rounded-md bg-muted px-2 py-1.5 text-left font-mono text-[11px] text-muted-foreground hover:bg-muted/70"
            title="Copiar valor atual"
          >
            {item.atual}
          </button>
        )}

        <Input
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Valor novo…"
          className="h-9 font-mono text-xs"
          aria-label={`Novo valor para ${item.label}`}
        />

        <p className="text-[11px] leading-snug text-muted-foreground">{item.comoObter}</p>

        {item.arquivos?.length ? (
          <details className="text-[11px] text-muted-foreground">
            <summary className="cursor-pointer select-none">Arquivos ({item.arquivos.length})</summary>
            <ul className="mt-1 space-y-0.5 font-mono">
              {item.arquivos.map((a) => <li key={a} className="break-all">{a}</li>)}
            </ul>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
