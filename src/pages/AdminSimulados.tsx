import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Upload, FileSpreadsheet } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminSimulados() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [examName, setExamName] = useState("");

  const [categorias, setCategorias] = useState<any[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  const fetchCategorias = async () => {
    setLoadingCategorias(true);
    const { data, error } = await supabase
      .from("simulado_exams")
      .select(`
        id,
        name,
        created_at,
        simulados:simulados(count)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCategorias(data);
    }
    setLoadingCategorias(false);
  };

  React.useEffect(() => {
    fetchCategorias();
  }, []);

  const handleImport = async () => {
    if (!examName) {
      toast.error("Preencha o nome do concurso/profissão");
      return;
    }
    if (!spreadsheetUrl.includes("docs.google.com/spreadsheets")) {
      toast.error("Insira um link válido do Google Sheets");
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular inserção no banco de dados para a categoria aparecer na listagem
      const { data: examData, error: examError } = await supabase
        .from("simulado_exams")
        .insert({ name: examName })
        .select()
        .single();
        
      if (examError) throw examError;
        
      if (examData) {
        const { error: simuladoError } = await supabase
          .from("simulados")
          .insert({ exam_id: examData.id, year: new Date().getFullYear(), prova_url: spreadsheetUrl });
          
        if (simuladoError) throw simuladoError;
      }
      
      toast.success("Simulado importado com sucesso (simulação)");
      setSpreadsheetUrl("");
      setExamName("");
      fetchCategorias();
    } catch (error: any) {
      toast.error(error.message || "Erro ao importar simulado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 text-white">
      <header className="sticky top-0 z-40 bg-[#0d0f12]/90 backdrop-blur-md border-b border-white/[0.04] px-4 py-4 flex items-center pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
        <button
          onClick={() => navigate("/admin-funcoes")}
          className="w-12 h-12 sm:w-[52px] sm:h-[52px] flex items-center justify-center bg-white/[0.03] rounded-full border border-white/[0.06] shrink-0"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white/70" strokeWidth={2.4} />
        </button>
        <h1 className="text-xl font-bold ml-4 tracking-tight">Admin Simulados</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6 mt-6">
        <Card className="bg-[#121214] border-white/10 text-white shadow-xl rounded-2xl">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-semibold text-white">Importar Planilha do Google</CardTitle>
            <CardDescription className="text-white/60">
              Importe questões, provas e gabaritos diretamente de uma planilha do Google Sheets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Nome do Concurso (ex: Juiz TJSP)</label>
              <Input
                placeholder="Digite o nome do concurso"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Link do Google Sheets</label>
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
              />
              <p className="text-xs text-white/40 mt-1">
                A planilha deve ser pública (ou compartilhada) e conter as abas dos anos e as colunas padronizadas.
              </p>
            </div>
            <Button
              onClick={handleImport}
              disabled={loading}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-xl mt-4"
            >
              {loading ? "Importando..." : "Importar Simulado"}
              {!loading && <Upload className="ml-2 w-5 h-5" />}
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Categorias Importadas</h2>
          {loadingCategorias ? (
            <div className="text-center text-white/50 py-8 animate-pulse font-medium">Carregando categorias...</div>
          ) : categorias.length === 0 ? (
            <div className="bg-[#121214] border border-white/10 rounded-2xl p-8 text-center text-white/50 font-medium">
              Nenhum simulado importado ainda.
            </div>
          ) : (
            <div className="grid gap-4">
              {categorias.map(cat => (
                <div key={cat.id} className="bg-[#121214] border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="font-semibold text-lg tracking-tight text-white">{cat.name}</h3>
                    <p className="text-xs text-white/50 mt-1 uppercase tracking-wider font-medium">
                      Importado em {new Date(cat.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-xl font-bold shadow-sm">
                    {cat.simulados?.[0]?.count || 0} simulado(s)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
