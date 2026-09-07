import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { ResumoPdfDoc, ResumoPdfInput } from '@/components/pdf/ResumoPdfDoc';
import { baixarBlob } from '@/lib/nativo';

export type { ResumoPdfInput as ResumoLike } from '@/components/pdf/ResumoPdfDoc';

export async function gerarResumoPdfDocument(resumo: ResumoPdfInput) {
  const doc = React.createElement(ResumoPdfDoc, { data: resumo });
  
  const nome = (resumo.subtema || resumo.tema || "resumo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
    .slice(0, 60);

  const titulo = resumo.subtema || resumo.tema || "Resumo";

  return { doc, nome: `${nome || "resumo"}.pdf`, titulo };
}

export async function gerarResumoPdfBase64(resumo: ResumoPdfInput): Promise<{ base64: string; nome: string; titulo: string }> {
  const { doc, nome, titulo } = await gerarResumoPdfDocument(resumo);
  const asPdf = pdf(doc);
  const blob = await asPdf.toBlob();
  
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(blob);
  });
  
  return { base64, nome, titulo };
}

export async function gerarResumoPdf(resumo: ResumoPdfInput) {
  const { doc, nome, titulo } = await gerarResumoPdfDocument(resumo);
  const asPdf = pdf(doc);
  const blob = await asPdf.toBlob();
  
  await baixarBlob(blob, nome, {
    titulo,
  });
}

export function resumoParaTexto(resumo: ResumoPdfInput) {
  const partes = [
    `${resumo.subtema || resumo.tema}`,
    `${resumo.area} · ${resumo.tema}`,
    "",
    resumo.markdown || "",
  ];
  if (resumo.exemplos) partes.push("", "EXEMPLOS", resumo.exemplos);
  if (resumo.termos) partes.push("", "TERMOS", resumo.termos);
  return partes.join("\n");
}
