const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const BATCH_LIMIT = Number(process.env.ROBO_LIMIT || '10');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env antes de iniciar o robô.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('=============================================');
  console.log('🤖 FÁBRICA DE ÁUDIO AULAS - INICIADA');
  console.log('=============================================');
  
  console.log('🔌 Conectando ao Google Chrome via porta 9222...');
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://localhost:9222');
  } catch (e) {
    console.error('❌ Falha ao conectar no Chrome. Feche tudo e abra o iniciar_robo.bat');
    process.exit(1);
  }

  const contexts = browser.contexts();
  const context = contexts[0] || await browser.newContext();
  const page = await context.newPage();
  
  // Aumentar o timeout por ser um site pesado
  page.setDefaultTimeout(30000); 

  console.log('🌐 Navegando para o Gemini Notebook...');
  // Aguarda o carregamento com um timeout maior (2 minutos)
  await page.goto('https://notebook.google.com/', { timeout: 120000 });

  // 1. Pega a Lei do Código Penal
  console.log('🔍 Buscando 10 artigos pendentes do Código Penal...');
  const { data: lei, error: leiError } = await supabase.from('vade_mecum_leis').select('id, slug').eq('slug', 'cp').single();
  if (leiError || !lei) {
    throw new Error(`Não encontrei a lei com slug "cp" no Supabase: ${leiError?.message || 'sem dados'}`);
  }
  
  const googleApi = require('./google_apis.cjs');
  const fs = require('fs');
  const path = require('path');

  console.log('🔍 Sincronizando com a Planilha para buscar os próximos 10 artigos pendentes...');
  const artigos = await googleApi.syncAndGetPending(lei.id, supabase, BATCH_LIMIT);

  if (!artigos || artigos.length === 0) {
    console.log('✅ Nenhum artigo pendente na planilha para o Código Penal. O robô vai descansar.');
    return;
  }


  
  // Buscar o nome real da Lei no banco para criar as pastas com o nome correto
  const { data: leiCompleta, error: leiCompletaError } = await supabase.from('vade_mecum_leis').select('nome').eq('id', lei.id).single();
  if (leiCompletaError) {
    console.warn(`⚠️ Não consegui buscar o nome completo da lei. Usando slug: ${leiCompletaError.message}`);
  }
  const nomeDaLei = leiCompleta ? leiCompleta.nome : lei.slug.toUpperCase();

  console.log('\n=============================================');
  console.log('📁 PREPARANDO PASTAS NO DRIVE');
  console.log('=============================================');
  
  const lawFolderId = await googleApi.prepareFolders(nomeDaLei);

  const notebooksCriados = [];

  for (let i = 0; i < artigos.length; i++) {
    const art = artigos[i];
    const leiSeca = art.texto.replace(/\s*\([^)]*\)/g, '');
    const novoTitulo = `Artigo ${art.numero} ${lei.slug.toUpperCase()}`;
    const prompt = `Atuem como dois juristas especialistas e objetivos realizando uma análise técnica da "lei seca" fornecida nos documentos. O tom da conversa deve ser estritamente profissional, analítico e preciso, evitando o estilo de "podcast de entretenimento". Regras fundamentais para esta análise:
1. **Adesão Estrita ao Texto (Lei Seca):** Sua explicação deve se basear EXCLUSIVAMENTE no que está escrito nos artigos fornecidos. Não adicionem interpretações doutrinárias externas, jurisprudência que não esteja no texto, opiniões pessoais ou analogias do mundo real. Se o texto não diz, vocês não dizem.
2. **Clareza Técnica:** O objetivo é traduzir o "juridiquês" para uma linguagem clara, mas mantendo a precisão técnica. Expliquem o significado dos termos legais conforme definidos na própria lei.
3. **Estrutura da Análise:**
* Comecem identificando qual lei ou conjunto de artigos estão analisando (${novoTitulo}).
* Sigam artigo por artigo, parágrafo por parágrafo, inciso por inciso de forma ordenada e cronológica.
* Um apresentador deve introduzir e ler o dispositivo legal por completo, exatamente na forma que ele está escrito (ex: ler o caput inteiro).
* O segundo apresentador deve destrinchar os elementos objetivos desse trecho recém-lido, explicando seus requisitos, exceções listadas e penalidades.
* IMPORTANTE: Vocês devem destrinchar lendo e explicando ao mesmo tempo, em blocos! Exemplo: Leiam o "caput", e em seguida já expliquem o que é o caput. Depois vão para o "inciso I", leiam completo na forma que é, e expliquem o inciso. Se tiver "alínea", leiam a alínea completa e expliquem. Façam isso passo a passo, dissecando toda a estrutura do artigo em ordem.
4. **Foco nos Elementos:** Destaquem verbos núcleos do tipo penal (se for criminal), prazos, condições e qualificadoras que estejam expressas no texto.
5. **Sem Rodeios:** Evitem introduções longas, piadas internas ou entusiasmo excessivo. Vão direto ao ponto da letra da lei.`;

    console.log(`\n=============================================`);
    console.log(`⚙️ INICIANDO O ARTIGO ${i + 1}/${artigos.length} -> ${novoTitulo}`);
    console.log(`=============================================`);

    console.log('🌐 Navegando para o início do NotebookLM...');
    await page.goto('https://notebook.google.com/');
    
    console.log('🖱️ Clicando em "Criar novo"...');
    // Pode haver um loading inicial
    await page.waitForTimeout(3000);
    
    // Tenta clicar usando a API nativa do Playwright que espera o elemento ficar visível
    await page.getByText(/Criar novo|Criar notebook/i).first().click();

    console.log('🖱️ Selecionando "Texto copiado"...');
    await page.waitForTimeout(1000);
    // Tenta 'Texto copiado' ou outras variações comuns que o Google pode usar
    await page.getByText(/Texto copiado|Texto colado|Colar/i).first().click();

    console.log('📝 Colando a Lei Seca (já limpa de sujeiras)...');
    const sourceTextarea = page.getByPlaceholder(/Cole o texto aqui|Cole seu texto aqui/i).first();
    await sourceTextarea.waitFor({ state: 'visible', timeout: 20000 });
    await sourceTextarea.fill(leiSeca);
    await page.getByRole('button', { name: /Inserir|Adicionar/i }).first().click();

    console.log('⏳ Aguardando a interface do Estúdio e o título automático carregarem...');
    await page.waitForFunction(() => {
      const text = document.body.innerText || '';
      return /1 fonte|1 fontes|Fontes[\s\S]*Art\./i.test(text) && !text.includes('As fontes salvas vão aparecer aqui');
    }, null, { timeout: 90000 });
    await page.waitForTimeout(2500);

    console.log('✏️ Renomeando o Notebook para: ' + novoTitulo);
    await page.evaluate(() => {
      // 1. Tenta achar o input pelo label (padrão de acessibilidade do Google)
      let titleInput = document.querySelector('input[aria-label*="Renomear"], input[aria-label*="Título"], input[aria-label*="Rename"], input[aria-label*="Title"]');
      
      // 2. Se não achar, procura o elemento de texto mais alto da página (no header) que pode ser um <span> clicável
      if (!titleInput) {
        const textElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.height > 0 && rect.top > 0 && rect.top < 80 && el.textContent.trim().length > 3 && !el.querySelector('*');
        });
        
        // Pega o elemento que está à esquerda (depois do logo)
        const titleSpan = textElements.find(el => el.getBoundingClientRect().left > 40 && el.getBoundingClientRect().left < 400);
        if (titleSpan) {
          titleSpan.click(); // Clica para transformar em input, caso seja um span
          if (titleSpan.parentElement) titleSpan.parentElement.click();
        }
      }
    });
    
    // Aguarda meio segundo para o clique (se houve) surtir efeito e abrir o input
    await page.waitForTimeout(500);
    
    await page.evaluate(() => {
      // Agora vamos buscar o input mais alto da página (que deve ser o título)
      let titleInput = document.querySelector('input[aria-label*="Renomear"], input[aria-label*="Título"], input[aria-label*="Rename"], input[aria-label*="Title"]');
      
      if (!titleInput) {
        // Coleta todos os inputs visíveis
        const inputs = Array.from(document.querySelectorAll('input, textarea, [contenteditable="true"]'))
          .filter(el => el.getBoundingClientRect().height > 0);
        
        // Ordena do mais alto (topo da tela) para o mais baixo
        inputs.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
        
        // Pega o primeiro se ele estiver na parte superior da tela (header)
        if (inputs.length > 0 && inputs[0].getBoundingClientRect().top < 150) {
          titleInput = inputs[0];
        }
      }

      if (titleInput) {
        titleInput.focus();
        if (typeof titleInput.select === 'function') {
          titleInput.select(); // Seleciona o texto atual para sobrescrever
        } else if (titleInput.isContentEditable) {
          const range = document.createRange();
          range.selectNodeContents(titleInput);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } else {
        console.warn('⚠️ Não foi possível focar o input do título! A digitação pode ir para o chat.');
      }
    });
    
    // Digita naturalmente usando o teclado virtual para o React/NotebookLM reconhecer a mudança
    await page.locator('input').first().fill(novoTitulo);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    // Clica fora para forçar o blur (salvamento)
    await page.mouse.click(10, 10);
    await page.waitForTimeout(2000);

    console.log('🎧 Clicando em "Resumo em Áudio"...');
    await page.getByLabel('Resumo em Áudio').first().click();
    await page.waitForTimeout(1500);
    const sourcePickerOpen = await page.locator('.cdk-overlay-container').filter({ hasText: /Crie Resumos em Áudio|Texto copiado|Enviar arquivos/i }).count();
    if (sourcePickerOpen > 0) {
      throw new Error(`O NotebookLM abriu o seletor de fontes para ${novoTitulo}; a fonte ainda não está disponível para o áudio.`);
    }

    console.log('🗣️ Preenchendo o Prompt mágico dos narradores...');
    const audioPrompt = page.locator('textarea').last();
    await audioPrompt.waitFor({ state: 'visible', timeout: 30000 });
    await audioPrompt.fill(prompt);

    console.log('🚀 Dando a ignição em "Gerar"...');
    await page.getByRole('button', { name: /^Gerar$/i }).last().click();

    // Aguarda um pouco para garantir que a requisição de gerar áudio e o salvamento do título foram enviados
    console.log('⏳ Garantindo que o salvamento e a geração iniciaram...');
    await page.waitForTimeout(5000);
    await page.waitForFunction(() => {
      const text = document.body.innerText || '';
      return /gerando|preparando|Deep Dive|áudio/i.test(text);
    }, null, { timeout: 30000 });

    // Salvar URL
    const urlAtual = page.url();
    console.log(`✅ ${novoTitulo} deixado no forno! URL: ${urlAtual}`);
    notebooksCriados.push({ id: art.id, rowNumber: art.rowNumber, numero: art.numero, url: urlAtual, titulo: novoTitulo });
    
    // Pequena pausa antes de criar o próximo
    await page.waitForTimeout(2000);
  }

  console.log('\n=============================================');
  console.log('🎉 TODOS OS 10 ARTIGOS ESTÃO NO FORNO!');
  console.log('As URLs dos notebooks criados são:');
  console.log(notebooksCriados);
  console.log('=============================================');
  
  console.log('\n=============================================');
  console.log('📂 FASE 1.5: ORGANIZANDO NA COLEÇÃO');
  console.log('=============================================');
  
  try {
    console.log('🌐 Voltando para a página inicial...');
    await page.goto('https://notebook.google.com/');
    await page.waitForTimeout(4000);
    
    console.log('🖱️ Clicando na aba "Coleções"...');
    await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*'));
      const colTab = els.find(el => el.textContent.trim() === 'Coleções' && el.getBoundingClientRect().height > 0);
      if (colTab) colTab.click();
    });
    await page.waitForTimeout(3000);
    
    // Verifica se a coleção já existe
    const colecaoJaExiste = await page.evaluate((nome) => {
      const els = Array.from(document.querySelectorAll('*'));
      return els.some(el => el.textContent.trim() === nome && el.getBoundingClientRect().height > 0 && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA');
    }, nomeDaLei);
    
    if (!colecaoJaExiste) {
      console.log(`✨ Coleção "${nomeDaLei}" não existe. Criando nova coleção...`);
      await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('*'));
        const btn = els.find(el => el.textContent.includes('Criar coleção') && el.getBoundingClientRect().height > 0);
        if (btn) btn.click();
      });
      await page.waitForTimeout(2000);
      
      console.log(`📝 Preenchendo o nome da coleção: ${nomeDaLei}`);
      await page.evaluate((nome) => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const visibleInput = inputs.find(el => el.getBoundingClientRect().height > 0);
        if (visibleInput) {
          visibleInput.focus();
          visibleInput.value = nome;
          visibleInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, nomeDaLei);
      await page.keyboard.type(' '); // Aciona o estado do React
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(1000);
      
    } else {
      console.log(`📂 Coleção "${nomeDaLei}" já existe. Abrindo menu de edição...`);
      await page.evaluate((nome) => {
        const els = Array.from(document.querySelectorAll('*'));
        const textNodes = els.filter(el => el.textContent.trim() === nome && el.children.length === 0 && el.getBoundingClientRect().height > 0);
        
        if (textNodes.length > 0) {
          const container = textNodes[0].closest('div') || textNodes[0].parentElement;
          // Subindo um pouco na árvore para pegar a "linha" inteira da coleção
          const row = container.parentElement.parentElement;
          if (row) {
            const btns = Array.from(row.querySelectorAll('button, [role="button"]'));
            const dotsBtn = btns[btns.length - 1]; // O menu de 3 pontinhos geralmente é o último
            if (dotsBtn) {
               dotsBtn.click();
               return;
            }
          }
          textNodes[0].click(); // Fallback
        }
      }, nomeDaLei);
      
      await page.waitForTimeout(1500);
      
      // Clica em Editar no menu suspenso
      await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('*'));
        const editBtn = els.find(el => el.textContent.trim() === 'Editar' && el.getBoundingClientRect().height > 0);
        if (editBtn) editBtn.click();
      });
      await page.waitForTimeout(2000);
    }
    
    console.log(`✅ Selecionando os ${notebooksCriados.length} artigos recém-gerados...`);
    for (const notebook of notebooksCriados) {
      await page.evaluate((titulo) => {
        const els = Array.from(document.querySelectorAll('*'));
        const artText = els.find(el => el.textContent.trim() === titulo && el.children.length === 0 && el.getBoundingClientRect().height > 0);
        if (artText) {
           // Clica na linha toda (que engloba o checkbox) ou no próprio texto
           const row = artText.closest('label') || artText.parentElement.parentElement;
           if (row) {
             row.click();
           } else {
             artText.click();
           }
        }
      }, notebook.titulo);
      await page.waitForTimeout(300); // Pausa curtíssima entre os cliques
    }
    
    console.log('💾 Salvando a coleção...');
    await page.evaluate((isEdit) => {
      const els = Array.from(document.querySelectorAll('*'));
      const btnText = isEdit ? 'Salvar' : 'Criar';
      const submitBtns = els.filter(el => (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && el.textContent.trim() === btnText && el.getBoundingClientRect().height > 0);
      if (submitBtns.length > 0) {
        submitBtns[submitBtns.length - 1].click(); // O último botão costuma ser a ação primária do modal
      } else {
         const fallback = els.find(el => (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && ['Atualizar', 'Concluído', 'Salvar alterações'].includes(el.textContent.trim()) && el.getBoundingClientRect().height > 0);
         if (fallback) fallback.click();
      }
    }, colecaoJaExiste);
    
    await page.waitForTimeout(3000);
    console.log('🎉 Coleção organizada com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro na fase de coleções. Continuando para a fila de downloads...', err.message);
  }
  
  console.log('\n=============================================');
  console.log('📥 INICIANDO FASE 2: AGUARDAR E BAIXAR (DOWNLOAD/UPLOAD)');
  console.log('=============================================');

  for (let i = 0; i < notebooksCriados.length; i++) {
    const notebook = notebooksCriados[i];
    console.log(`\n⏳ Abrindo o notebook do ${notebook.titulo}...`);
    await page.goto(notebook.url);
    
    console.log('⏱️ Aguardando a geração do áudio finalizar (pode levar 5 a 10 minutos)...');
    
    // O problema do timeout foi que a tela tem OUTRO botão 'Mais'.
    // Precisamos aguardar uma prova real de que o áudio terminou, como o texto "Deep Dive" ou a tag de áudio aparecer.
    try {
      // Aguarda o texto "Deep Dive" que fica no player do áudio gerado
      await page.getByText('Deep Dive', { exact: false }).first().waitFor({ state: 'visible', timeout: 900000 }); // 15 minutos de timeout
    } catch (e) {
      console.log(`❌ Timeout! O áudio do ${notebook.titulo} demorou demais para gerar.`);
      continue;
    }

    // Agora que o player apareceu, o último botão "Mais" da tela (ou o que está perto do texto Deep Dive) é o nosso alvo
    const btnMais = page.getByRole('button', { name: 'Mais', exact: true }).last();
    
    console.log('⬇️ Botão de menu (Mais) do áudio encontrado! Abrindo as opções...');
    await btnMais.click();
    
    console.log('⬇️ Clicando na opção "Baixar"...');
    // Pode haver um pequeno delay para a animação do menu abrir
    await page.waitForTimeout(500);
    const btnDownload = page.getByText('Baixar', { exact: true }).first();
    await btnDownload.waitFor({ state: 'visible', timeout: 5000 });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      btnDownload.click()
    ]);
    
    const downloadPath = path.join(__dirname, `${notebook.titulo}.wav`);
    await download.saveAs(downloadPath);
    console.log(`✅ Áudio baixado localmente: ${downloadPath}`);

    // Fase Google Drive
    const linkDrive = await googleApi.uploadAudio(downloadPath, lawFolderId, notebook.titulo);
    console.log(`☁️ Upload no Drive concluído! Link: ${linkDrive}`);

    // Fase Planilha (Atualizar para Verde e OK)
    if (typeof notebook.rowNumber !== 'number') {
      throw new Error(`Linha da planilha ausente para ${notebook.titulo}. Não é seguro marcar como OK.`);
    }
    await googleApi.updateRowToSuccess(notebook.rowNumber, `Artigo ${notebook.numero}`, linkDrive);

    // Fase Supabase - Marcar como concluído
    console.log(`💾 Atualizando status no Supabase...`);
    const { error: updateError } = await supabase.from('vade_mecum_artigos').update({
      narracao_url: linkDrive
    }).eq('id', notebook.id);
    if (updateError) {
      throw new Error(`Falha ao atualizar Supabase para ${notebook.titulo}: ${updateError.message}`);
    }
    
    console.log(`🎉 Artigo ${notebook.numero} finalizado 100%!`);
    
    // Apaga o arquivo local para não lotar o PC
    if (fs.existsSync(downloadPath)) {
      fs.unlinkSync(downloadPath);
    }
  }

  console.log('\n=============================================');
  console.log('✅✅ FÁBRICA FINALIZADA COM SUCESSO! ✅✅');
  console.log('=============================================');
  
  await browser.close();
}

run().catch((err) => {
  console.error('\n=============================================');
  console.error('❌ ROBÔ FINALIZADO COM ERRO');
  console.error('=============================================');
  console.error(err?.stack || err?.message || err);
  process.exitCode = 1;
});
