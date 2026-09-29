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
      // Future integration: calling Supabase Edge Function to parse and import the Google Sheet
      // For now, simulating the process
      // const { data, error } = await supabase.functions.invoke("import-simulados", {
      //   body: { url: spreadsheetUrl, name: examName }
      // });
      // if (error) throw error;
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Simulado importado com sucesso (simulação)");
      setSpreadsheetUrl("");
      setExamName("");
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
          onClick={() => navigate("/admin/funcoes")}
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
      </main>
    </div>
  );
}
