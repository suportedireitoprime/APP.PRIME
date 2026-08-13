---
name: modo-offline
description: "Skill para automatizar a adição de coleções de dados (tabelas do Supabase) no bundle offline nativo do aplicativo, para funcionarem sem necessidade de download."
---

# Modo Offline Skill

Esta skill define o processo padrão de como a Inteligência Artificial deve proceder sempre que o usuário solicitar que uma "função" ou "coleção de dados" (como questões, flashcards, leis, etc.) passe a ser nativa no aplicativo (ou seja, embutida para funcionar offline sem precisar que o usuário faça o download previamente).

## 📋 Como funciona

Sempre que a skill for ativada e um alvo (coleção) for indicado, execute os seguintes passos estritamente nesta ordem:

### Passo 1: Atualizar o script de exportação
Identifique a tabela do Supabase relacionada ao recurso. 
Edite o arquivo `scripts/export-offline-bundle.mjs` e adicione o alvo no array `TARGETS`:

```javascript
  { name: 'nome-do-arquivo', fn: () => fetchAll('nome_da_tabela', '*') },
```
*Observação: caso necessite de paginação, ordenação ou limitação, utilize os métodos adequados do SupabaseJS disponíveis no script.*

### Passo 2: Atualizar o consumo do Offline Bundle
Edite o arquivo `src/services/offlineBundle.ts` para que o frontend saiba consumir esse novo arquivo JSON:

No objeto exportado `bundle`, adicione a chave correspondente:
```typescript
export const bundle = {
  // ...
  novoRecurso: <T = any>() => fetchBundle<T>('nome-do-arquivo'),
};
```

### Passo 3: Implementar o Fallback (Opcional)
Se o usuário pediu para integrar o novo recurso na interface, vá até a página/hook onde a chamada online é feita e encapsule com `withBundleFallback`:

```typescript
import { withBundleFallback, bundle } from '@/services/offlineBundle';

const data = await withBundleFallback(
  chamadaOnline(), // Ex: supabase.from('...').select()
  () => bundle.novoRecurso() // Fallback
);
```

### Passo 4: Regenerar o Bundle
Utilize o utilitário de comandos do terminal (`run_command`) para executar o script de exportação localmente, garantindo que o JSON seja criado em `public/offline-bundle/`.
```bash
node scripts/export-offline-bundle.mjs
```

### Passo 5: Commit e Push Automáticos
Como dita a regra principal do projeto, após o sucesso de todas as etapas e a validação do script (e se `tsc --noEmit` passar, caso necessário), adicione as alterações, faça o commit com uma descrição clara e envie para o repositório remoto (`git push`).
