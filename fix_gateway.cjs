const fs = require('fs');
const file = 'src/services/aiGatewayService.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { supabase }')) {
  content = content.replace(
    "export type AiFeatureKey =",
    "import { supabase } from '@/integrations/supabase/client';\n\nexport type AiFeatureKey ="
  );
}

const originalTextRequest =     try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
  
      const res = await fetch(\\/chat/completions\, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \Bearer \\,
        },
        body: JSON.stringify({
          model: config.selectedModel,
          messages,
          temperature: options.temperature ?? 0.7,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
  
      if (!res.ok) {
        throw new Error(\HTTP \\);
      }
  
      const elapsed = Math.round(performance.now() - start);
      const data = await res.json();
      return {
        text: data?.choices?.[0]?.message?.content || 'Sem resposta gerada.',
        providerUsed: 'omniroute',
        modelUsed: config.selectedModel,
        durationMs: elapsed,
      };
    } catch (err) {;

const newTextRequest =     try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      
      const payload: any = {
          model: config.selectedModel,
          messages,
          temperature: options.temperature ?? 0.7,
          tools: [{
            type: "function",
            function: {
              name: "search_web",
              description: "Faça pesquisas na internet",
              parameters: {
                type: "object",
                properties: { query: { type: "string" } },
                required: ["query"]
              }
            }
          }]
      };

      let res = await fetch(\\/chat/completions\, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \Bearer \\,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      let data = await res.json();
      
      if (res.ok && data?.choices?.[0]?.message?.tool_calls) {
         const toolCall = data.choices[0].message.tool_calls[0];
         if (toolCall.function.name === 'search_web') {
           const args = JSON.parse(toolCall.function.arguments);
           messages.push(data.choices[0].message);
           
           try {
             const searchRes = await supabase.functions.invoke('omniroute-web-search', { body: { query: args.query } });
             const searchTxt = searchRes.data?.result || 'Sem resultados na internet.';
             
             messages.push({
               role: 'tool',
               tool_call_id: toolCall.id,
               name: 'search_web',
               content: searchTxt
             });
             
             res = await fetch(\\/chat/completions\, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': \Bearer \\,
                },
                body: JSON.stringify({ ...payload, messages }),
                signal: controller.signal,
             });
             data = await res.json();
           } catch (e) {
             console.warn("Falha na tool search_web", e);
           }
         }
      }
      
      clearTimeout(timeoutId);
  
      if (!res.ok) {
        throw new Error(\HTTP \\);
      }
  
      const elapsed = Math.round(performance.now() - start);
      return {
        text: data?.choices?.[0]?.message?.content || 'Sem resposta gerada.',
        providerUsed: 'omniroute',
        modelUsed: config.selectedModel,
        durationMs: elapsed,
      };
    } catch (err) {;

content = content.replace(originalTextRequest, newTextRequest);
fs.writeFileSync(file, content, 'utf8');
console.log('Modified aiGatewayService.ts');
