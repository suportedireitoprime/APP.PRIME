import os
import sys
import tempfile
import json
import urllib.request
import fitz  # PyMuPDF
from supabase import create_client, Client

def main():
    if len(sys.argv) < 4:
        print("Uso: python parse.py <pdf_url> <livro_id> <livro_tabela>")
        sys.exit(1)

    pdf_url = sys.argv[1]
    livro_id = sys.argv[2]
    livro_tabela = sys.argv[3]

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        print("Erro: Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não definidas.")
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    # 1. Atualizar status para processando
    print(f"Atualizando status no DB para 'processando' (ID: {livro_id})")
    try:
        supabase.table("biblioteca_leitura_nativa").update({"status": "processando", "erro_detalhe": None}).eq("livro_id", livro_id).eq("livro_tabela", livro_tabela).execute()
    except Exception as e:
        print(f"Erro ao atualizar status inicial: {e}")

    try:
        # 2. Baixar o PDF
        print(f"Baixando PDF de: {pdf_url}")
        pdf_path = os.path.join(tempfile.gettempdir(), f"livro_{livro_id}.pdf")
        urllib.request.urlretrieve(pdf_url, pdf_path)

        # 3. Processar o PDF
        print("Abrindo PDF com PyMuPDF...")
        doc = fitz.open(pdf_path)
        total_paginas = len(doc)
        
        # 3.1 Extrair Sumário (TOC)
        toc = doc.get_toc()
        sumario_json = []
        for item in toc:
            # item = [level, title, page]
            if len(item) >= 3:
                sumario_json.append({
                    "nivel": item[0],
                    "titulo": item[1].strip(),
                    "pagina": item[2]
                })

        # 3.2 Iterar páginas e extrair texto e imagens
        markdown_completo = ""
        
        # Pasta no bucket para as imagens
        bucket_name = "biblioteca-obras"
        imagens_folder = f"imagens/{livro_tabela}_{livro_id}"

        for page_num in range(total_paginas):
            if page_num % 50 == 0:
                print(f"Processando página {page_num + 1}/{total_paginas}...")
                # Atualizar progresso no DB (opcional)
                try:
                    supabase.table("biblioteca_leitura_nativa").update({"progresso": page_num, "total_etapas": total_paginas}).eq("livro_id", livro_id).eq("livro_tabela", livro_tabela).execute()
                except:
                    pass

            page = doc.load_page(page_num)
            
            # Pegar texto formatado como Markdown (suportado nas versões recentes do PyMuPDF)
            # PyMuPDF extrai o texto base. Imagens não são transformadas nativamente em Markdown com URLs,
            # mas vamos extrair imagens manualmente depois, se necessário, ou usar o text().
            # Usando "text" pois é seguro e "markdown" para formatar.
            try:
                # O parâmetro markdown tenta extrair estrutura se disponível
                page_md = page.get_text("markdown")
            except:
                page_md = page.get_text("text")

            # Tratamento de Imagens
            # Extrair as imagens da página
            image_list = page.get_images(full=True)
            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                
                # Fazer upload para Supabase
                img_filename = f"{imagens_folder}/pag_{page_num+1}_img_{img_index+1}.{image_ext}"
                try:
                    res = supabase.storage.from_(bucket_name).upload(
                        path=img_filename,
                        file=image_bytes,
                        file_options={"content-type": f"image/{image_ext}"}
                    )
                    # Gerar URL pública
                    public_url = supabase.storage.from_(bucket_name).get_public_url(img_filename)
                    # Inserir tag de imagem no final da página (ou tentar substituir placeholders)
                    page_md += f"\n\n![Imagem da página {page_num+1}]({public_url})\n\n"
                except Exception as upload_err:
                    print(f"Erro ao fazer upload da imagem {xref}: {upload_err}")
            
            # Formatar a saída
            # Prevenir que o texto comece sem o marcador caso o PyMuPDF retorne algo estranho
            clean_md = page_md.strip()
            if clean_md:
                markdown_completo += f"\n<!-- page:{page_num + 1} -->\n{clean_md}\n\n"

        # 4. Fazer upload do Markdown refinado
        md_filename = f"refinado/{livro_tabela}_{livro_id}.md"
        print(f"Fazendo upload do arquivo Markdown final ({len(markdown_completo)} caracteres)...")
        
        # Sobrescrever se já existir
        try:
            supabase.storage.from_(bucket_name).remove([md_filename])
        except:
            pass
            
        supabase.storage.from_(bucket_name).upload(
            path=md_filename,
            file=markdown_completo.encode("utf-8"),
            file_options={"content-type": "text/markdown;charset=UTF-8"}
        )
        
        md_public_url = supabase.storage.from_(bucket_name).get_public_url(md_filename)
        # Forçar atualização de cache do navegador com ?v=timestamp
        import time
        md_public_url += f"?v={int(time.time())}"

        # 5. Salvar de volta no Banco de Dados
        print("Atualizando banco de dados...")
        supabase.table("biblioteca_leitura_nativa").update({
            "status": "pronto",
            "refino_status": "pronto",
            "conteudo_md_refinado_url": md_public_url,
            "total_paginas": total_paginas,
            "sumario_json": sumario_json,
            "erro_detalhe": None
        }).eq("livro_id", livro_id).eq("livro_tabela", livro_tabela).execute()

        print("Concluído com sucesso!")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Ocorreu um erro fatal: {e}")
        try:
            supabase.table("biblioteca_leitura_nativa").update({
                "status": "erro",
                "erro_detalhe": f"Falha no parser GitHub Actions: {str(e)[:200]}"
            }).eq("livro_id", livro_id).eq("livro_tabela", livro_tabela).execute()
        except:
            pass
        sys.exit(1)

if __name__ == "__main__":
    main()
