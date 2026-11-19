# DIREITO PRIME / ESTUDOS JURÍDICOS

Aplicativo móvel e web de estudos jurídicos, Vade Mecum, audioaulas, mapas mentais, biblioteca de clássicos e simulados.

## Tecnologias

- **Frontend:** React 19, TypeScript, Tailwind CSS, TanStack Router
- **Backend & Banco de Dados:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Nativo Mobile:** Capacitor 8 (Jetpack Compose para Android, SwiftUI para iOS)
- **Mídia:** Cloudflare R2 (áudios, PDFs, vídeos)

## Desenvolvimento Local

```sh
# Instalar dependências
bun install # ou npm i

# Iniciar servidor de desenvolvimento (porta 8080)
bun run dev
```

## Build

```sh
# Verificação de tipos
.\node_modules\.bin\tsc.CMD --noEmit

# Build de produção
.\node_modules\.bin\vite.CMD build
```
