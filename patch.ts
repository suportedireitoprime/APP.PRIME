
const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPilulas.tsx', 'utf8');

code = code.replace(/interface ArtigoCP \{([\s\S]*?)\}/, \interface ArtigoCP {
  id: string;
  numero: string;
  audio_pilula_url: string | null;
  audio_transcricao?: string | null;
  audio_grafo?: any;
  lei_slug?: string;
  lei_nome?: string;
}

interface Ministro {
  id: string;
  nome: string;
  nome_completo?: string;
  foto_url?: string;
  diversos?: any;
}\);

code = code.replace(/type SelectedItemType =([\s\S]*?)\| \{ type: 'artigo'; data: ArtigoCP \};/, \	ype SelectedItemType = 
  | { type: 'livro'; data: LivroComColecao }
  | { type: 'artigo'; data: ArtigoCP }
  | { type: 'ministro'; data: Ministro };\);

code = code.replace(/type ScreenState = 'menu' \| 'classicos' \| 'rapidas' \| 'cp' \| 'cf' \| 'cc';/, \	ype ScreenState = 'menu' | 'classicos' | 'rapidas' | 'cp' | 'cf' | 'cc' | 'ministros';\);

code = code.replace(/const \[loadingCC, setLoadingCC\] = useState\(true\);\n  const \[artigosCC, setArtigosCC\] = useState<ArtigoCP\[\]>\(\[\]\);/, \const [loadingCC, setLoadingCC] = useState(true);
  const [artigosCC, setArtigosCC] = useState<ArtigoCP[]>([]);
  
  const [loadingMinistros, setLoadingMinistros] = useState(true);
  const [ministros, setMinistros] = useState<Ministro[]>([]);\);

code = code.replace(/carregarLei\('cc'\);\n  \}, \[\]\);/, \carregarLei('cc');
    carregarMinistros();
  }, []);

  async function carregarMinistros() {
    setLoadingMinistros(true);
    try {
      const { data, error } = await supabase
        .from('stf_ministros')
        .select('id, nome, nome_completo, foto_url, diversos')
        .order('nome');
      if (error) throw error;
      setMinistros(data || []);
    } catch (err) {
      toast.error('Erro ao carregar ministros');
    } finally {
      setLoadingMinistros(false);
    }
  }\);

code = code.replace(/const artigosFiltrados = useMemo\(\(\) => \{/, \const ministrosFiltrados = useMemo(() => {
    const q = busca.toLowerCase();
    if (!q) return ministros;
    return ministros.filter(m => m.nome.toLowerCase().includes(q) || (m.nome_completo && m.nome_completo.toLowerCase().includes(q)));
  }, [ministros, busca]);

  const artigosFiltrados = useMemo(() => {\);

code = code.replace(/const itemId = item.type === 'livro' \? item.data.livro.id : item.data.id;\n    const itemTitulo = item.type === 'livro' \? item.data.livro.titulo : item.data.numero;/, \const itemId = item.type === 'livro' ? item.data.livro.id : item.data.id;
    const itemTitulo = item.type === 'livro' ? item.data.livro.titulo : item.type === 'artigo' ? item.data.numero : item.data.nome;\);

code = code.replace(/if \(item.type === 'artigo'\) \{\n        const slug = item.data.lei_slug \|\| 'cp';\n        rawFileName = \\\esumos-livros\/pilulas-\\\$\{slug\}-\\\$\{itemId\}-\\\$\{Date.now\(\)\}.\\\$\{fileExt\}\\\;\n      \}/, \if (item.type === 'artigo') {
        const slug = item.data.lei_slug || 'cp';
        rawFileName = \\\esumos-livros/pilulas-\\\-\\\-\\\.\\\\\\;
      } else if (item.type === 'ministro') {
        rawFileName = \\\esumos-livros/pilulas-ministro-\\\-\\\.\\\\\\;
      }\);

code = code.replace(/\} else \{\n        const \{ error: dbError \} = await supabase\n          .from\('vade_mecum_artigos'\)\n          .update\(\{ audio_pilula_url: rawUrl \}\)\n          .eq\('id', itemId\);\n        if \(dbError\) throw dbError;\n\n        const updatedArtigoCP = \{ \n          \.\.\.item.data, \n          audio_pilula_url: rawUrl \n        \};\n\n        const slug = item.data.lei_slug;\n        if \(slug === 'cp'\) setArtigosCP\(\(prev\) => prev.map\(a => a.id === itemId \? updatedArtigoCP : a\)\);\n        if \(slug === 'cf'\) setArtigosCF\(\(prev\) => prev.map\(a => a.id === itemId \? updatedArtigoCP : a\)\);\n        if \(slug === 'cc'\) setArtigosCC\(\(prev\) => prev.map\(a => a.id === itemId \? updatedArtigoCP : a\)\);\n\n        updatedItemForTranscription = \{ type: 'artigo', data: updatedArtigoCP \};\n        setSelectedItem\(\(prev\) => \(prev && prev.type === 'artigo' && prev.data.id === itemId\) \? updatedItemForTranscription : prev\);\n      \}/, \} else if (item.type === 'artigo') {
        const { error: dbError } = await supabase
          .from('vade_mecum_artigos')
          .update({ audio_pilula_url: rawUrl })
          .eq('id', itemId);
        if (dbError) throw dbError;

        const updatedArtigoCP = { 
          ...item.data, 
          audio_pilula_url: rawUrl 
        };

        const slug = item.data.lei_slug;
        if (slug === 'cp') setArtigosCP((prev) => prev.map(a => a.id === itemId ? updatedArtigoCP : a));
        if (slug === 'cf') setArtigosCF((prev) => prev.map(a => a.id === itemId ? updatedArtigoCP : a));
        if (slug === 'cc') setArtigosCC((prev) => prev.map(a => a.id === itemId ? updatedArtigoCP : a));

        updatedItemForTranscription = { type: 'artigo', data: updatedArtigoCP };
        setSelectedItem((prev) => (prev && prev.type === 'artigo' && prev.data.id === itemId) ? updatedItemForTranscription : prev);
      } else if (item.type === 'ministro') {
        const curDiversos = item.data.diversos || {};
        const newDiversos = { ...curDiversos, audio_pilula_url: rawUrl };

        const { error: dbError } = await supabase
          .from('stf_ministros')
          .update({ diversos: newDiversos })
          .eq('id', itemId);
        if (dbError) throw dbError;

        const updatedMinistro = { ...item.data, diversos: newDiversos };
        setMinistros((prev) => prev.map(m => m.id === itemId ? updatedMinistro : m));
        updatedItemForTranscription = { type: 'ministro', data: updatedMinistro };
        setSelectedItem((prev) => (prev && prev.type === 'ministro' && prev.data.id === itemId) ? updatedItemForTranscription : prev);
      }\);


fs.writeFileSync('src/pages/AdminPilulas.tsx', code, 'utf8');

