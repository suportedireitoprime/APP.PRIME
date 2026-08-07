---
name: disparar-narracao
description: Skill Especialista para disparar e gerar narrações em áudio de artigos de lei (ex.: "aplique essa skill no artigo 87 do Código Penal" ou "narre o artigo 121 da CF") via Edge Function Gateway do Antigravity.
---

# 🎙️ Skill: Disparar Narração (disparar-narracao)

Esta skill é acionada quando o usuário pede para **narrar**, **gerar áudio** ou **aplicar a narração** em qualquer artigo de lei (Código Penal, Constituição Federal, Código Civil, CLT, etc.), utilizando o Gateway da API do Antigravity / Supabase Gateway (`https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/narracao?fn=artigo`).

---

## 🎯 Quando Usar
Esta skill DEVE ser acionada sempre que o usuário solicitar:
- *"Aplique essa skill no artigo 87 do Código Penal"*
- *"Narre o artigo 121 do CP"*
- *"Gere a narração do artigo 5º da Constituição Federal"*
- *"Dispare a narração para o artigo X da lei Y"*

---

## 🛠️ Passo a Passo de Execução pela IA

### 1. Identificar o Artigo e a Lei Solicitada
Mapeie a lei e o número do artigo mencionado pelo usuário:
- **Código Penal (CP)** → `--tabela codigo_penal`
- **Constituição Federal (CF/88)** → `--tabela constituicao_federal`
- **Código Civil (CC)** → `--tabela codigo_civil`
- **Código de Processo Penal (CPP)** → `--tabela codigo_processo_penal`
- **Código de Processo Civil (CPC)** → `--tabela codigo_processo_civil`
- **CLT** → `--tabela clt`

---

### 2. Executar o Script Auxiliar da Skill via Terminal (`run_command`)
Execute o script `.agents/skills/disparar-narracao/scripts/disparar.js` especificando a tabela e o artigo:

```bash
node .agents/skills/disparar-narracao/scripts/disparar.cjs --tabela codigo_penal --artigo 87 --force true
```

*Nota: Se o usuário fornecer um texto customizado para o artigo, passe via `--texto "<conteudo>"`.*

---

### 3. Verificar o Resultado e Responder ao Usuário
Após a execução do script:
1. Confirme que o áudio `.wav` foi gerado e assinado com sucesso no Supabase Storage (`audio_url`).
2. Confirme que os `word_timings` do modo karaokê em tempo real foram gerados.
3. Apresente ao usuário o link direto do áudio, o tempo total e o resumo da narração gerada.
