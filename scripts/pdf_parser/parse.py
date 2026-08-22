import os
import sys
import tempfile
import json
import urllib.request
import re
import fitz  # PyMuPDF
from supabase import create_client, Client
import traceback

def resolve_drive_pdf_url(url: str) -> str:
    """Converte URL de visualização do Google Drive em URL de download direto."""
    try:
        if "drive.google.com" not in url and "docs.google.com" not in url:
            return url
        # /file/d/{ID}/view
        m = re.search(r"/file/d/([^/]+)", url)
        file_id = m.group(1) if m else None
        
        if not file_id and "?id=" in url:
            m = re.search(r"id=([^&]+)", url)
            file_id = m.group(1) if m else None
            
        if not file_id:
            return url
        return f"https://drive.google.com/uc?export=download&id={file_id}"
    except Exception:
        return url

def main():
    if len(sys.argv) < 5:
        print("Uso: python parse.py <pdf_url> <livro_id> <livro_tabela> <titulo>")
        sys.exit(1)

    pdf_url = sys.argv[1]
    livro_id = sys.argv[2]
    livro_tabela = sys.argv[3]
    titulo_raw = sys.argv[4]

    # Sanitize title for filename
    titulo_safe = re.sub(r'[^a-zA-Z0-9_\- ]', '', titulo_raw).strip().replace(' ', '_')
    if not titulo_safe:
        titulo_safe = f"livro_{livro_id}"

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        print("Erro: Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não definidas.")
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    try:
        # 1. Atualizar status para processando
        print(f"Atualizando status no DB para 'processando' (ID: {livro_id})")
        supabase.table("biblioteca_leitura_nativa").update({"status": "processando", "etapa": "Iniciando worker e baixando PDF", "erro_detalhe": None}).eq("livro_id", livro_id).eq("livro_tabela", livro_tabela).execute()
        
        # 2. Baixar o PDF (Resolvendo Google Drive)
        direct_url = resolve_drive_pdf_url(pdf_url)
        print(f"Baixando PDF de: {direct_url}")
        
        req = urllib.request.Request(direct_url, headers={'User-Agent': 'Mozilla/5.0'})
        pdf_path = os.path.join(tempfile.gettempdir(), f"{titulo_safe}.pdf")
        
        with urllib.request.urlopen(req) as response, open(pdf_path, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
            
            # Checagem básica se baixou um HTML (aviso de vírus do Google Drive)
            if data[:4] != b'%PDF':
                if b'<html' in data.lower():
                    # Tenta rota alternativa (usercontent)
                    alt_id_match = re.search(r"id=([^&]+)", direct_url)
                    if alt_id_match:
                        alt_url = f"https://drive.usercontent.google.com/download?id={alt_id_match.group(1)}&export=download&authuser=0&confirm=t"
                        print(f"Tentando rota alternativa: {alt_url}")
                        req_alt = urllib.request.Request(alt_url, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(req_alt) as res_alt:
                            data_alt = res_alt.read()
                            if data_alt[:4] == b'%PDF':
                                with open(pdf_path, 'wb') as f:
                                    f.write(data_alt)
                            else:
                                raise Exception("O link não devolveu um PDF válido, mesmo na rota alternativa.")
                    else:
                        raise Exception("O arquivo baixado não é um PDF válido. Certifique-se que o link é público e direto.")

        # 3. Processar o PDF
        print("Abrindo PDF com PyMuPDF...")
        doc = fitz.open(pdf_path)
        total_paginas = len(doc)
        
        # 3.1 Extrair Sumário (TOC) para JSON
        print("Extraindo Sumário...")
        toc = doc.get_toc()
        sumario_json = []
        for item in toc:
            if len(item) >= 3:
                nivel = item[0] if isinstance(item[0], int) else 1
                titulo = str(item[1]).strip()
                
                # Sanitização anti-lixo de PDFs mal gerados (remove ?? e caracteres alienígenas do início)
                titulo = re.sub(r'^[?\s\ufffd]+', '', titulo)
                
                pagina = item[2] if isinstance(item[2], int) else 1
                sumario_json.append({
                    "nivel": nivel,
                    "titulo": titulo,
                    "pagina": pagina
                })

        # 3.2 Iterar páginas e extrair texto e imagens
        markdown_completo = ""
        bucket_name = "biblioteca-obras"
        imagens_folder = f"imagens/{livro_tabela}_{livro_id}"
        sumario_customizado = []
        
        start_img_page = 0
        capitulos_por_pagina = {}
        capitulos_lista = []
        
        if sumario_json:
            paginas_validas = [item["pagina"] for item in sumario_json if item["pagina"] > 4]
            if paginas_validas:
                start_img_page = min(paginas_validas)
            
            # Mapear os capítulos de Nível 1 para gerar a marcação de Capa
            for item in sumario_json:
                pg = item["pagina"]
                if item["nivel"] == 1 and pg not in capitulos_por_pagina:
                    capitulos_por_pagina[pg] = item["titulo"]
                    capitulos_lista.append(pg)

        for page_num in range(total_paginas):
            if page_num % 10 == 0 or page_num == total_paginas - 1:
                print(f"Processando página {page_num + 1}/{total_paginas}...")
                try:
                    supabase.table("biblioteca_leitura_nativa").update({"progresso": page_num + 1, "total_etapas": total_paginas, "etapa": f"Extraindo pág. {page_num + 1}"}).eq("livro_id", livro_id).eq("livro_tabela", livro_tabela).execute()
                except:
                    pass

            page = doc.load_page(page_num)
            
            try:
                page_md = page.get_text("markdown")
            except:
                page_md = page.get_text("text")

            if start_img_page == 0 or (page_num + 1) >= start_img_page:
                image_list = page.get_images(full=True)
                for img_index, img in enumerate(image_list):
                    try:
                        xref = img[0]
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        image_ext = base_image["ext"]
                        
                        img_filename = f"{imagens_folder}/pag_{page_num+1}_img_{img_index+1}.{image_ext}"
                        supabase.storage.from_(bucket_name).upload(
                            path=img_filename,
                            file=image_bytes,
                            file_options={"content-type": f"image/{image_ext}", "upsert": "true"}
                        )
                        public_url = supabase.storage.from_(bucket_name).get_public_url(img_filename)
                        page_md += f"\n\n![Imagem da página {page_num+1}]({public_url})\n\n"
                    except Exception as upload_err:
                        print(f"Erro ao processar imagem na pág {page_num+1}: {upload_err}")
            
            clean_md = page_md.strip()
            
            # --- INÍCIO DA HEURÍSTICA DE REFINAMENTO (0 TOKENS) ---
            if clean_md:
                linhas = clean_md.split('\n')
                linhas_refinadas = []
                for linha in linhas:
                    linha_limpa = linha.strip()
                    if not linha_limpa:
                        linhas_refinadas.append(linha)
                        continue
                    
                    is_heading = False
                    heading_level = 2
                    
                    if linha_limpa.startswith('#'):
                        m = re.match(r'^(#{1,6})\s+(.+)', linha_limpa)
                        if m:
                            sumario_customizado.append({"nivel": len(m.group(1)), "titulo": m.group(2).strip(), "pagina": page_num + 1})
                        linhas_refinadas.append(linha)
                        continue
                        
                    if re.match(r'(?i)^(cap[ií]tulo|parte|se[çc][ãa]o|livro|t[íi]tulo)\s+([IVXLCDM\d]+)', linha_limpa):
                        is_heading = True
                        heading_level = 2
                            
                    if is_heading:
                        nova_linha = f"{'#' * heading_level} {linha_limpa}"
                        linhas_refinadas.append(nova_linha)
                        sumario_customizado.append({"nivel": heading_level, "titulo": linha_limpa, "pagina": page_num + 1})
                    else:
                        linhas_refinadas.append(linha)
                        
                clean_md = '\n'.join(linhas_refinadas)
                
                # Heurística para quebrar diálogos que o OCR aglutinou na mesma linha
                # Exemplo: "motorista. - Você se importa" -> "motorista.\n\n- Você se importa"
                clean_md = re.sub(r'([.?!>”"’])\s+(–|—|-)\s+([A-ZÉÀÁÍÓÚa-záéíóú])', r'\1\n\n\2 \3', clean_md)
                
                capa_inject = ""
                if sumario_json and (page_num + 1) in capitulos_por_pagina:
                    titulo_cap = capitulos_por_pagina[page_num + 1]
                    idx_cap = capitulos_lista.index(page_num + 1) + 1
                    
                    # Remover o título e número do topo do texto para não ficar duplicado na página
                    linhas_md = clean_md.strip().split('\n')
                    start_idx = 0
                    import difflib
                    for i_linha, linha_md in enumerate(linhas_md):
                        L = linha_md.strip()
                        if not L:
                            start_idx = i_linha + 1
                            continue
                        if L.isdigit():
                            start_idx = i_linha + 1
                            continue
                        if re.match(r'(?i)^(cap[íi]tulo|parte|se[çc][ãa]o|livro|t[íi]tulo)\s+([IVXLCDM\d]+)$', L):
                            start_idx = i_linha + 1
                            continue
                        
                        # Normalizar comparando apenas letras
                        L_norm = re.sub(r'\W+', '', L.lower())
                        T_norm = re.sub(r'\W+', '', titulo_cap.lower())
                        if L_norm and T_norm and difflib.SequenceMatcher(None, L_norm, T_norm).ratio() > 0.8:
                            start_idx = i_linha + 1
                            continue
                            
                        # Não bateu com cabeçalho, então chegamos no texto real
                        break
                    
                    clean_md = '\n'.join(linhas_md[start_idx:])
                    
                    # Formatar o titulo real limpando números iniciais, ex: "1. A coisa..." -> "A coisa..."
                    titulo_limpo = re.sub(r'^[\d\.\s]+', '', titulo_cap)
                    capa_inject = f"<!-- capa-capitulo -->\n## CAPÍTULO {idx_cap}\n## {titulo_limpo}\n"
                
                markdown_completo += f"\n{capa_inject}<!-- page:{page_num + 1} -->\n{clean_md}\n\n"

        final_toc = sumario_json if len(sumario_json) > 0 else sumario_customizado

        # 4. Fazer upload do Markdown REFINADO (Heurística Python)
        md_filename = f"refinado/{livro_tabela}_{livro_id}.md"
        print(f"Fazendo upload do arquivo Markdown refinado heurístico ({len(markdown_completo)} caracteres)...")
        
        try:
            supabase.storage.from_(bucket_name).upload(
                path=md_filename,
                file=markdown_completo.encode("utf-8"),
                file_options={"content-type": "text/markdown;charset=UTF-8", "upsert": "true"}
            )
        except Exception as e:
            print(f"Falha no upload do MD, tentando sobrescrever: {e}")
            supabase.storage.from_(bucket_name).remove([md_filename])
            supabase.storage.from_(bucket_name).upload(
                path=md_filename,
                file=markdown_completo.encode("utf-8"),
                file_options={"content-type": "text/markdown;charset=UTF-8"}
            )
        
        md_public_url = supabase.storage.from_(bucket_name).get_public_url(md_filename)
        import time
        md_public_url += f"?v={int(time.time())}"

        # 5. Salvar de volta no Banco de Dados
        print("Atualizando banco de dados (pronto!)...")
        supabase.table("biblioteca_leitura_nativa").update({
            "status": "pronto",
            "refino_status": "pronto",
            "conteudo_md_refinado_url": md_public_url,
            "total_paginas": total_paginas,
            "sumario_json": final_toc,
            "erro_detalhe": None
        }).eq("livro_id", livro_id).eq("livro_tabela", livro_tabela).execute()

        print("Concluído com sucesso!")

    except Exception as e:
        traceback.print_exc()
        print(f"Ocorreu um erro fatal: {e}")
        try:
            supabase.table("biblioteca_leitura_nativa").update({
                "status": "erro",
                "erro_detalhe": f"Falha no parser GitHub Actions: {str(e)[:200]}"
            }).eq("livro_id", livro_id).eq("livro_tabela", livro_tabela).execute()
        except Exception as inner_e:
            print(f"Falha ao salvar erro no banco: {inner_e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
