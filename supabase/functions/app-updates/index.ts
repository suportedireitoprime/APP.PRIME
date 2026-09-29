import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const updates = [
  {
    "version": "3.9",
    "title": "Versão 3.9 Liberada",
    "date": "2026-09-29",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Novos avatares e experiência visual aprimorada.",
      "Melhorias na integração e envio de mensagens para o WhatsApp."
    ]
  },
  {
    "version": "3.8",
    "title": "Versão 3.8 Liberada",
    "date": "2026-09-27",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Novo design mais moderno e intuitivo na tela principal.",
      "Novos avatares e experiência visual aprimorada.",
      "Correção na exibição de projetos de lei e ementas."
    ]
  },
  {
    "version": "3.7",
    "title": "Versão 3.7 Liberada",
    "date": "2026-09-26",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Nova voz muito mais expressiva e humana para as leituras em áudio.",
      "Novo design mais moderno e intuitivo na tela principal."
    ]
  },
  {
    "version": "3.6",
    "title": "Versão 3.6 Liberada",
    "date": "2026-09-25",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Novo design mais moderno e intuitivo na tela principal.",
      "Melhorias gerais de estabilidade e velocidade."
    ]
  },
  {
    "version": "3.5",
    "title": "Versão 3.5 Liberada",
    "date": "2026-09-21",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Novo design mais moderno e intuitivo na tela principal.",
      "Melhorias gerais de estabilidade e velocidade."
    ]
  },
  {
    "version": "3.4",
    "title": "Versão 3.4 Liberada",
    "date": "2026-09-19",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Novo design mais moderno e intuitivo na tela principal.",
      "Melhorias gerais de estabilidade e velocidade."
    ]
  },
  {
    "version": "3.3",
    "title": "Versão 3.3 Liberada",
    "date": "2026-09-18",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Novo design mais moderno e intuitivo na tela principal.",
      "Melhorias gerais de estabilidade e velocidade."
    ]
  },
  {
    "version": "3.2",
    "title": "Versão 3.2 Liberada",
    "date": "2026-09-16",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "3.1",
    "title": "Versão 3.1 Liberada",
    "date": "2026-09-15",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "3.0",
    "title": "Versão 3.0 Liberada",
    "date": "2026-09-10",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "2.9",
    "title": "Versão 2.9 Liberada",
    "date": "2026-09-08",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "2.8",
    "title": "Versão 2.8 Liberada",
    "date": "2026-09-07",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Novo design mais moderno e intuitivo na tela principal.",
      "Melhorias gerais de estabilidade e velocidade."
    ]
  },
  {
    "version": "2.7",
    "title": "Versão 2.7 Liberada",
    "date": "2026-09-06",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "2.6",
    "title": "Versão 2.6 Liberada",
    "date": "2026-09-05",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "2.5",
    "title": "Versão 2.5 Liberada",
    "date": "2026-09-03",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Nova voz muito mais expressiva e humana para as leituras em áudio.",
      "Melhorias gerais de estabilidade e velocidade."
    ]
  },
  {
    "version": "2.4",
    "title": "Versão 2.4 Liberada",
    "date": "2026-09-02",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "2.3",
    "title": "Versão 2.3 Liberada",
    "date": "2026-08-31",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Novo design mais moderno e intuitivo na tela principal.",
      "Melhorias gerais de estabilidade e velocidade."
    ]
  },
  {
    "version": "2.2",
    "title": "Versão 2.2 Liberada",
    "date": "2026-08-30",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "2.1",
    "title": "Versão 2.1 Liberada",
    "date": "2026-08-28",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "2.0",
    "title": "Versão 2.0 Liberada",
    "date": "2026-08-21",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "1.9",
    "title": "Versão 1.9 Liberada",
    "date": "2026-08-19",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "1.8",
    "title": "Versão 1.8 Liberada",
    "date": "2026-08-17",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "1.7",
    "title": "Versão 1.7 Liberada",
    "date": "2026-08-16",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "1.6",
    "title": "Versão 1.6 Liberada",
    "date": "2026-08-15",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "1.5",
    "title": "Versão 1.5 Liberada",
    "date": "2026-08-13",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "1.4",
    "title": "Versão 1.4 Liberada",
    "date": "2026-08-11",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "1.3",
    "title": "Versão 1.3 Liberada",
    "date": "2026-08-10",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "1.2",
    "title": "Versão 1.2 Liberada",
    "date": "2026-08-09",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "1.1",
    "title": "Versão 1.1 Liberada",
    "date": "2026-08-06",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Melhorias gerais de desempenho.",
      "Correção de pequenos problemas relatados."
    ]
  },
  {
    "version": "1.0",
    "title": "Versão 1.0 Liberada",
    "date": "2026-08-04",
    "description": "Atualizações focadas na sua experiência de uso e velocidade do aplicativo.",
    "features": [
      "Aprimoramento no motor de buscas para resultados mais precisos.",
      "Melhorias gerais de estabilidade e velocidade."
    ]
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    return new Response(JSON.stringify(updates), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
