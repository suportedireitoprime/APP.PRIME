import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase variables missing');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function dispararPush() {
  console.log("Enviando push para wn7corporation@gmail.com...");

  // Exemplo de payload com imagem
  const payload = {
    title: "Teste Capa In-App + Banner!",
    body: "Aqui é o Antigravity! Este é um teste da notificação híbrida (In-App + Lockscreen com imagem).",
    emoji: "🚀",
    image: "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/boletins-thumbnails/16_9_boletim-teste.jpg",
    audience: {
      emails: ["wn7corporation@gmail.com"]
    },
    url: "/boletins",
    data: {
      campaign_id: "test-campaign-123"
    },
    personalize: true
  };

  const { data, error } = await supabase.functions.invoke('send-push', {
    body: payload
  });

  if (error) {
    console.error("Erro ao enviar push:", error);
  } else {
    console.log("Push enviado com sucesso:", data);
  }
}

dispararPush();
