import fs from 'fs';

const filePath = 'src/components/aulas-interativas/PlayerAulaNativo.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `        .flip-face-back {
          transform: rotateY(180deg);
        }
      \`}</style>`;

const newStyles = `        .flip-face-back {
          transform: rotateY(180deg);
        }

        /* ==========================================================================
           RECURSOS VISUAIS DIDÁTICOS DE ELITE (INFOGRÁFICOS, TABELAS & MAPAS)
           ========================================================================== */
        
        /* TABELAS COMPARATIVAS JURÍDICAS */
        .aula-html-tipografia table.cmp,
        .aula-html-tipografia .tabela-comparativa-juridica {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 18px 0;
          background: rgba(18, 14, 20, 0.88);
          border: 1px solid rgba(212, 175, 55, 0.35);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
        }
        .aula-html-tipografia table.cmp th,
        .aula-html-tipografia .tabela-comparativa-juridica th {
          background: linear-gradient(180deg, rgba(46, 18, 25, 0.95), rgba(28, 10, 16, 0.95));
          color: #e9cd6d;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          padding: 12px 14px;
          text-align: left;
          border-bottom: 2px solid rgba(212, 175, 55, 0.45);
        }
        .aula-html-tipografia table.cmp td,
        .aula-html-tipografia .tabela-comparativa-juridica td {
          padding: 12px 14px;
          font-size: 14px;
          line-height: 1.5;
          color: #f8edef;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          vertical-align: middle;
        }
        .aula-html-tipografia table.cmp tr:last-child td,
        .aula-html-tipografia .tabela-comparativa-juridica tr:last-child td {
          border-bottom: none;
        }
        .aula-html-tipografia table.cmp tr:nth-child(even) td,
        .aula-html-tipografia .tabela-comparativa-juridica tr:nth-child(even) td {
          background: rgba(255, 255, 255, 0.02);
        }
        .aula-html-tipografia table.cmp td.t,
        .aula-html-tipografia .tabela-comparativa-juridica td.col-destaque {
          font-weight: 700;
          color: #e9cd6d;
        }

        /* INFOGRÁFICOS DE FLUXO & GRAFOS DE PROCESSO */
        .aula-html-tipografia .infografico-fluxo {
          margin: 18px 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .aula-html-tipografia .fluxo-etapas {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 12px;
          position: relative;
        }
        .aula-html-tipografia .fluxo-card {
          background: linear-gradient(145deg, rgba(38, 14, 22, 0.9), rgba(20, 8, 12, 0.95));
          border: 1px solid rgba(212, 175, 55, 0.28);
          border-radius: 12px;
          padding: 14px 14px 12px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .aula-html-tipografia .fluxo-card.destaque {
          border-color: rgba(212, 175, 55, 0.6);
          background: linear-gradient(145deg, rgba(50, 18, 28, 0.95), rgba(26, 9, 15, 0.98));
        }
        .aula-html-tipografia .fluxo-card:hover {
          border-color: rgba(212, 175, 55, 0.6);
          transform: translateY(-2px);
        }
        .aula-html-tipografia .fluxo-card .fluxo-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #e9cd6d;
          background: rgba(212, 175, 55, 0.12);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 99px;
          padding: 3px 10px;
          margin-bottom: 8px;
          width: fit-content;
        }
        .aula-html-tipografia .fluxo-card h4 {
          font-family: "Playfair Display", Georgia, serif;
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 6px;
        }
        .aula-html-tipografia .fluxo-card p {
          font-size: 13.5px;
          line-height: 1.45;
          color: #c9a7ad;
          margin: 0;
        }
        .aula-html-tipografia .fluxo-seta {
          display: none;
          align-items: center;
          justify-content: center;
          color: #e9cd6d;
          font-size: 18px;
          font-weight: bold;
          opacity: 0.8;
        }
        @media (min-width: 768px) {
          .aula-html-tipografia .fluxo-seta {
            display: flex;
          }
        }

        /* GRAFOS EM CADEIA / MAPAS DE CAUSA E EFEITO */
        .aula-html-tipografia .grafo-causa-efeito {
          background: rgba(22, 10, 15, 0.85);
          border: 1px dashed rgba(226, 62, 87, 0.4);
          border-radius: 14px;
          padding: 16px;
          margin: 16px 0;
        }
        .aula-html-tipografia .grafo-causa-efeito .grafo-titulo {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          color: \${tema.destaque};
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .aula-html-tipografia .grafo-pilares {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        @media (min-width: 640px) {
          .aula-html-tipografia .grafo-pilares {
            flex-direction: row;
            align-items: stretch;
          }
        }
        .aula-html-tipografia .grafo-pilar {
          flex: 1;
          background: rgba(36, 12, 18, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
        }
        .aula-html-tipografia .grafo-pilar strong {
          color: #ffffff;
          font-size: 15px;
          margin-bottom: 4px;
        }
        .aula-html-tipografia .grafo-pilar span {
          color: #c9a7ad;
          font-size: 13px;
          line-height: 1.4;
        }

        /* MAPA MENTAL VISUAL / ÁRVORE DE CONCEITOS */
        .aula-html-tipografia .mapa-mental-visual {
          margin: 18px 0;
          background: linear-gradient(170deg, rgba(34, 12, 18, 0.95), rgba(18, 6, 10, 0.98));
          border: 1px solid rgba(212, 175, 55, 0.35);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .aula-html-tipografia .mapa-raiz {
          text-align: center;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(212, 175, 55, 0.25);
          margin-bottom: 14px;
        }
        .aula-html-tipografia .mapa-raiz h3 {
          font-family: "Playfair Display", Georgia, serif;
          font-size: 20px;
          font-weight: 800;
          color: #e9cd6d;
          margin: 0 0 4px;
          letter-spacing: 0.8px;
        }
        .aula-html-tipografia .mapa-raiz p {
          font-size: 13.5px;
          color: #c9a7ad;
          margin: 0;
        }
        .aula-html-tipografia .mapa-ramos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }
        .aula-html-tipografia .mapa-ramo-card {
          background: rgba(255, 255, 255, 0.03);
          border-left: 3px solid \${tema.destaque};
          border-radius: 8px;
          padding: 10px 12px;
        }
        .aula-html-tipografia .mapa-ramo-card h5 {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 4px;
        }
        .aula-html-tipografia .mapa-ramo-card p {
          font-size: 12.5px;
          line-height: 1.4;
          color: #c9a7ad;
          margin: 0 0 6px;
        }
        .aula-html-tipografia .mapa-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .aula-html-tipografia .mapa-chip-mini {
          font-size: 11px;
          background: rgba(212, 175, 55, 0.12);
          color: #e9cd6d;
          padding: 2px 7px;
          border-radius: 99px;
          font-weight: 600;
        }

        /* RAIO-X PARA CONCURSOS E OAB (ALERTA VISUAL) */
        .aula-html-tipografia .alerta-concurso-card {
          background: linear-gradient(135deg, rgba(226, 62, 87, 0.15), rgba(212, 175, 55, 0.08));
          border: 1px solid rgba(226, 62, 87, 0.5);
          border-radius: 14px;
          padding: 14px 16px;
          margin: 16px 0;
          position: relative;
        }
        .aula-html-tipografia .alerta-concurso-card .alerta-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #e9cd6d;
          margin-bottom: 8px;
        }
        .aula-html-tipografia .alerta-concurso-card p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #fdf3f4;
        }
      \`}</style>`;

// Normalize CRLF to LF for matching, or match directly
const targetCRLF = target.replace(/\n/g, '\r\n');
const newStylesCRLF = newStyles.replace(/\n/g, '\r\n');

if (content.includes(targetCRLF)) {
  content = content.replace(targetCRLF, newStylesCRLF);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: Injected styles with CRLF');
} else if (content.includes(target)) {
  content = content.replace(target, newStyles);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: Injected styles with LF');
} else {
  console.error('ERROR: Could not find target');
}

