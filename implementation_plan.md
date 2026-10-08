1. Criar Edge Function iblioteca-contagem-areas em supabase/functions/biblioteca-contagem-areas/index.ts que faz um select em iblioteca_estudos, faz o group by por área, conta e extrai uma imagem de capa e retorna a lista.
2. Deploy da edge function.
3. Atualizar src/components/biblioteca/useBibliotecasData.ts para usar a edge function iblioteca-contagem-areas e montar a lista materias sem depender de livrosAreas.
4. Atualizar src/components/biblioteca/BibliotecaMateriaSheet.tsx para não receber mais a lista gigante, e sim fazer um fetch da coleção filtrando pela materiaAberta no momento da abertura, garantindo 0ms latency com withBundleFallback.
5. Testes locais e commit automático.
