# Plano de Implementação — Imagens das 14 Profissões para Concursos

Substituir os brasões e logos genéricos de prefeituras nos cards de concursos pelas novas ilustrações das 14 profissões fornecidas em `docs/`, otimizando com compressão WebP de alta performance, subindo para o Supabase Storage e integrando a detecção inteligente de carreira/cargo em `concursosVisuais.ts`.

---

## 1. Otimização e Compressão WebP das 14 Imagens
- Ler as 14 imagens da pasta `docs/`:
  - `01_educacao_professor.webp`
  - `02_enfermagem_saude_geral.webp`
  - `03_odontologia.webp`
  - `04_delegado_de_policia.webp`
  - `05_juiz_magistratura.webp`
  - `06_advocacia_publica.webp`
  - `07_tribunais_judiciario_analistas.webp`
  - `08_fiscal_controle_auditores.webp`
  - `09_administrativo.webp`
  - `10_engenharia_arquitetura.webp`
  - `11_tecnologia_da_informacao.webp`
  - `12_contabilidade_e_financas.webp`
  - `13_operacional_servicos_gerais.webp`
  - `14_curinga_cargo_generico.webp`
- Redimensionar de 1254x1254 para 384x384 (proporção ideal para avatares circulares de 56-64px com 3x retina) e comprimir com `sharp` (WebP qualidade 82, lossless=false).
- Reduzir o peso de ~3.5MB no total para menos de 300KB (economia de >90% de dados).
- Salvar cópia local em `public/profissoes/` para carregamento imediato a 0ms (Web/PWA/Offline).

---

## 2. Upload para o Supabase Storage
- Subir os 14 arquivos otimizados para o bucket público `imagens` (pasta `profissoes/`):
  - URL base: `https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/imagens/profissoes/<arquivo>.webp`
- Garantir fallback suave entre a URL pública do Supabase e o asset local `/profissoes/<arquivo>.webp`.

---

## 3. Mapeamento Inteligente em `src/lib/concursosVisuais.ts`
- Implementar a função classificadora que analisa o título, termos de cargos (`cargos`, `cargos_resumo`) e mapeia com precisão para uma das 14 profissões:
  1. **Educação / Professores**: professor, docente, pedagogo, educador, magistério, seduc...
  2. **Enfermagem / Saúde Geral**: enfermagem, enfermeiro, técnico de enfermagem, médico, hospital, samu, saúde...
  3. **Odontologia**: dentista, odontologia, cirurgião dentista, saúde bucal...
  4. **Segurança / Polícia**: delegado, policial, polícia, guarda municipal, bombeiro, trânsito, perito, agente...
  5. **Magistratura / Juiz**: juiz, juíza, magistratura, juiz substituto...
  6. **Advocacia Pública**: procurador, advogado, defensoria, defensor, pgm, pge, agu...
  7. **Tribunais / Analistas**: tribunal, tj, trt, trf, tre, analista judiciário, técnico judiciário, escrevente...
  8. **Fiscal / Controle**: auditor fiscal, fiscal, receita, iss, sefaz, tce, tcu, controlador...
  9. **Administrativo**: administrativo, assistente administrativo, auxiliar de escritório, gestão...
  10. **Engenharia / Arquitetura**: engenharia, engenheiro, arquiteto, arquitetura, obras...
  11. **Tecnologia da Informação**: ti, tecnologia, informática, programador, desenvolvedor, sistemas, redes...
  12. **Contabilidade / Finanças**: contabilidade, contador, finanças, tesoureiro, economista...
  13. **Operacional / Serviços Gerais**: operacional, serviços gerais, motorista, merendeira, gari, eletricista, vigilante...
  14. **Curinga / Cargo Genérico**: fallback quando houver múltiplos cargos heterogêneos ou quando não especificado.
- Substituir o uso preferencial de logos de prefeituras pela ilustração da profissão correspondente.

---

## 4. Integração nos Cards e Modais
- Atualizar as chamadas de `getConcursoVisual` em `src/pages/RadarConcursos.tsx`, `src/pages/Concursos.tsx` e `src/pages/Atualizacoes.tsx` para passar também `conc.cargos_resumo` ou `conc.cargos` (quando disponíveis) para que a detecção seja ainda mais assertiva.
- Garantir que a imagem seja carregada com `loading="lazy"` e bordas arredondadas perfeitas dentro do contêiner circular.

---

## 5. Validação e Deploy
- Executar `.\node_modules\.bin\tsc.CMD --noEmit` para garantir ausência de erros de compilação.
- Realizar teste de build `.\node_modules\.bin\vite.CMD build`.
- Enviar automaticamente para o GitHub (`git add . ; git commit ... ; git push`).
