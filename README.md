# Direito Prime (APP.PRIME) ⚖️

Um aplicativo multiplataforma premium de Estudos Jurídicos e Vade Mecum, projetado para oferecer a melhor experiência de leitura, consulta e aprendizado ativo para profissionais e estudantes de Direito.

## 🚀 Tecnologias e Stack

O projeto utiliza uma stack moderna e híbrida, garantindo alta performance tanto na Web quanto em dispositivos móveis e desktop:

- **Frontend:** React 18, TypeScript, Vite
- **Estilização:** Tailwind CSS, Shadcn UI, Framer Motion, Radix UI
- **Backend/BaaS:** Supabase (PostgreSQL, Edge Functions, Storage, Realtime)
- **Mobile (iOS/Android):** Capacitor 8 (com suporte total a modos offline, notificações nativas e integrações com o SO)
- **Desktop:** Electron (via Vite)
- **IA Integrada:** Gemini Live API (Recurso "Me Explique" interativo e por voz)
- **Armazenamento e Offline:** IndexedDB (idb-keyval), SQLite, Dexie e React Query Persister
- **Visualização:** Three.js, React PDF, Lottie e Remotion (para animações cinematográficas e biográficas)

## 📦 Funcionalidades Principais

1. **Leitor Jurídico Avançado (Vade Mecum):** Visualização de leis, códigos e constituição com formatação de alto contraste, modo noturno e ferramentas nativas de busca.
2. **"Me Explique" (Tutor IA):** Um overlay interativo turbinado pelo Gemini Live, que tira dúvidas do usuário através de voz ou texto de forma conversacional e com baixa latência utilizando WebSockets e tokens efêmeros.
3. **Sincronização Offline First:** Utilizando a API do SQLite nativo e persistência via React Query, a maior parte do conteúdo pode ser baixada e consumida sem internet.
4. **Layout Híbrido Responsivo:** Totalmente adaptado para Mobile (com áreas de toque ampliadas), Tablet (layouts list-detail) e Desktop (sidebars).
5. **Gamificação:** Controle de XP, sequências (streaks) e progresso de leitura inspirados em apps como Duolingo.

## 🛠️ Como executar o projeto localmente

### Pré-requisitos
- Node.js (v24 recomendado) ou Bun
- Gerenciador de pacotes Bun ou npm
- Supabase CLI (caso queira manipular funções locais ou o banco de dados)

### Passos para inicialização

1. Instale as dependências:
```bash
bun install
# ou
npm install
```

2. Inicialize o servidor de desenvolvimento:
```bash
bun run dev
# ou
npm run dev
```

3. (Opcional) Executar ambiente Electron (Desktop):
```bash
bun run electron:dev
```

## 📱 Build e Deploy (Mobile / iOS)

O projeto possui uma esteira CI/CD madura rodando via **GitHub Actions** (`build-ios.yml`).
Sempre que precisar gerar uma nova build para o **TestFlight**, basta disparar o workflow no GitHub ou via API. 

As assinaturas do iOS (certificados e perfis) são geridas automaticamente pelo App Store Connect API (`scripts/asc-create-profile.py`) e armazenadas de forma segura nos `Secrets` do repositório.

## 🛡️ Regras de Qualidade
- **Verificação Contínua:** `tsc --noEmit` deve ser rodado para garantir que não existam erros de tipagem.
- **Acessibilidade (WCAG):** Elementos interativos devem ter suporte total para navegação e bom contraste.
- **Microinterações:** Feedback tátil (Haptics) acoplado aos cliques e navegação (Framer Motion).
