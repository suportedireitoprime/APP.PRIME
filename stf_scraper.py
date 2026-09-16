import os
import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Faltam variáveis de ambiente do Supabase.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_stf_pautas():
    print("Iniciando extração de pautas do STF...")
    # O portal do STF usa WAF, tentaremos com um User-Agent comum de navegador
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
    }
    
    url = "https://portal.stf.jus.br/pautaSessao/"
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"Erro ao acessar o portal do STF: {e}")
        # Retorna lista vazia para evitar quebrar o pipeline
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    pautas = []

    # Exemplo de lógica de parsing baseada na estrutura típica do STF:
    # (Pode requerer ajustes finos se a estrutura HTML mudar)
    accordions = soup.find_all("div", class_="accordion")
    
    for acc in accordions:
        try:
            # Pega o título/data da sessão
            btn = acc.find("button", class_="accordion-button")
            if not btn: continue
            sessao_info = btn.text.strip() # ex: "Sessão Plenária - 16/09/2026"
            
            # Tentar extrair a data (formato DD/MM/YYYY)
            date_str = ""
            for word in sessao_info.split():
                if "/" in word and len(word) == 10:
                    date_str = word
                    break
            
            if not date_str:
                continue
                
            # Converter para YYYY-MM-DD
            data_sessao = datetime.strptime(date_str, "%d/%m/%Y").strftime("%Y-%m-%d")
            
            tipo_sessao = "Sessão Plenária"
            if "turma" in sessao_info.lower():
                tipo_sessao = "Sessão de Turma"
            elif "virtual" in sessao_info.lower():
                tipo_sessao = "Sessão Virtual"
                
            # Pega os processos dentro do painel
            panel = acc.find("div", class_="accordion-collapse")
            if panel:
                processos = panel.find_all("div", class_="processo-pauta") # classe hipotética
                # Se a classe processo-pauta não existir, busca pelos links ou blocos de texto
                if not processos:
                    # Fallback para parágrafos ou divs de listagem
                    processos = panel.find_all("p")
                    
                for proc in processos:
                    texto = proc.text.strip()
                    if not texto or len(texto) < 10:
                        continue
                        
                    # Procura link do processo se houver
                    link_elem = proc.find("a")
                    link = "https://portal.stf.jus.br" + link_elem["href"] if link_elem and "href" in link_elem.attrs else None
                    
                    titulo = texto.split("\n")[0][:255] # Primeira linha como título
                    
                    pauta = {
                        "titulo": titulo,
                        "resumo": texto[:1000], # Guardamos até 1000 chars de resumo
                        "data_sessao": data_sessao,
                        "tipo_sessao": tipo_sessao,
                        "status": "Agendado",
                        "link_processo": link
                        # relator_id omitido por enquanto se não der pra fazer o match fácil pelo nome
                    }
                    pautas.append(pauta)
        except Exception as ex:
            print(f"Erro ao processar um bloco de pauta: {ex}")
            continue

    print(f"Total de pautas extraídas: {len(pautas)}")
    return pautas

def sync_pautas():
    pautas = fetch_stf_pautas()
    if not pautas:
        print("Nenhuma pauta encontrada para sincronizar.")
        return
        
    print("Inserindo pautas no Supabase...")
    for p in pautas:
        try:
            # Fazemos upsert usando o título e data como chave se quisermos evitar duplicatas,
            # mas como não temos UNIQUE constraint além do ID na tabela (precisaríamos criar),
            # faremos insert direto ou match customizado.
            
            # Checa se já existe uma pauta com mesmo título e data
            existing = supabase.table("radar_stf_pautas").select("id").eq("titulo", p["titulo"]).eq("data_sessao", p["data_sessao"]).execute()
            
            if len(existing.data) == 0:
                supabase.table("radar_stf_pautas").insert(p).execute()
                print(f"Inserido: {p['titulo'][:50]}...")
            else:
                print(f"Já existe: {p['titulo'][:50]}...")
        except Exception as e:
            print(f"Erro ao inserir pauta: {e}")

if __name__ == "__main__":
    sync_pautas()
