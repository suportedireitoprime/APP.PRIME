const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'biblioteca-obras';

const artifactsDir = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity-ide\\brain\\12f8e3a1-9ac9-45b1-ba2d-4e1daeed02dc';
const pdfsDir = 'C:\\Users\\ext_wpereira\\OneDrive - Vitamina Work Life S.A\\Documentos\\APP.PRIME\\docs\\NOVOS LIVROS DE DIREITO';

const books = [
  {
    id: 151,
    livro: "A Teoria das Formas de Governo",
    autor: "Norberto Bobbio",
    sobre: "Um clássico sobre a evolução histórica do pensamento político e as formas de governo.",
    pdfPath: "A Teoria das Formas de Governo.pdf",
    pdfName: "a_teoria_das_formas_de_governo.pdf",
    coverPath: "capa_formas_governo_1787326907332.jpg",
    coverName: "a_teoria_das_formas_de_governo.jpg"
  },
  {
    id: 152,
    livro: "O Espírito das Leis",
    autor: "Charles de Montesquieu",
    sobre: "A obra-prima que fundamenta a teoria da separação dos três poderes, essencial para o Estado Democrático de Direito.",
    pdfPath: "Do-Espírito-das-Leis-_Charles-Montesquieu_-_z-library.sk_-1lib.sk_-z-lib.sk_.pdf",
    pdfName: "o_espirito_das_leis.pdf",
    coverPath: "capa_espirito_leis_1787326918328.jpg",
    coverName: "o_espirito_das_leis.jpg"
  },
  {
    id: 153,
    livro: "Lições Preliminares de Direito",
    autor: "Miguel Reale",
    sobre: "Obra introdutória magistral, essencial para a compreensão dos conceitos fundamentais do Direito.",
    pdfPath: "Licoes preliminares de direito.pdf",
    pdfName: "licoes_preliminares_de_direito.pdf",
    coverPath: "capa_licoes_direito_1787326928998.jpg",
    coverName: "licoes_preliminares_de_direito.jpg"
  },
  {
    id: 154,
    livro: "O Futuro da Democracia",
    autor: "Norberto Bobbio",
    sobre: "Uma análise profunda das promessas não cumpridas da democracia e os desafios contemporâneos do sistema representativo.",
    pdfPath: "O Futuro da Democracia.pdf",
    pdfName: "o_futuro_da_democracia.pdf",
    coverPath: "capa_futuro_democracia_1787326940620.jpg",
    coverName: "o_futuro_da_democracia.jpg"
  },
  {
    id: 155,
    livro: "O Manual Definitivo para entender a Filosofia do Direito",
    autor: "Vários Autores",
    sobre: "Um guia prático e direto para compreender as principais correntes filosóficas e pensadores do direito.",
    pdfPath: "O Manual definitivo para entender a Filosofia do Direito.pdf",
    pdfName: "filosofia_do_direito.pdf",
    coverPath: "capa_filosofia_direito_1787326950072.jpg",
    coverName: "filosofia_do_direito.jpg"
  }
];

async function run() {
  for (const book of books) {
    console.log(`Processing: ${book.livro}`);
    
    // 1. Upload PDF
    const pdfBuf = fs.readFileSync(path.join(pdfsDir, book.pdfPath));
    const pdfUpload = await supabase.storage.from(BUCKET).upload(`pdfs/${book.pdfName}`, pdfBuf, { contentType: 'application/pdf', upsert: true });
    if (pdfUpload.error) {
      console.error('Error uploading PDF:', pdfUpload.error);
    }
    const downloadUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/pdfs/${book.pdfName}`;

    // 2. Upload Cover
    const coverBuf = fs.readFileSync(path.join(artifactsDir, book.coverPath));
    const coverUpload = await supabase.storage.from(BUCKET).upload(`capas/${book.coverName}`, coverBuf, { contentType: 'image/jpeg', upsert: true });
    if (coverUpload.error) {
      console.error('Error uploading Cover:', coverUpload.error);
    }
    const coverUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/capas/${book.coverName}`;

    // 3. Insert into DB
    const { data, error } = await supabase.from('biblioteca_classicos').upsert({
      id: book.id,
      livro: book.livro,
      autor: book.autor,
      sobre: book.sobre,
      imagem: coverUrl,
      download: downloadUrl,
      capa_horizontal: null
    }, { onConflict: 'id' });

    if (error) {
      console.error('Error inserting to DB:', error);
    } else {
      console.log(`Successfully added: ${book.livro}`);
    }
  }
}

run();
