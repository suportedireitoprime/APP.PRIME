import React from 'react';

const AnimacaoCocos = () => {
  return (
    <div className="w-full h-[350px] bg-[#1a1a24] rounded-xl border border-blue-500/30 p-6 flex flex-col justify-center items-center relative overflow-hidden">
      <div className="absolute top-4 right-4 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/50">
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Cocos Creator (WASM)</span>
      </div>

      <div className="flex flex-col items-center text-center max-w-md z-10">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl border border-blue-500/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        
        <h3 className="text-xl font-display font-semibold text-white mb-2">Motor Cocos2d Limitado (C++)</h3>
        
        <p className="text-sm text-blue-200/70 mb-4">
          O Cocos2d (Cocos Creator) exige um editor externo. O jogo é desenvolvido em TypeScript/C++, compilado para WebAssembly (WASM) e deve ser carregado via um iframe (`index.html` próprio).
        </p>
        
        <div className="w-full bg-black/50 p-3 rounded-lg text-left">
          <code className="text-xs text-green-400 font-mono">
            // Exemplo de Fluxo Cocos:<br/>
            // 1. Criar cena no Cocos Editor<br/>
            // 2. Build -&gt; Web Mobile (WASM)<br/>
            // 3. &lt;iframe src="/cocos-build/index.html" /&gt;
          </code>
        </div>
      </div>
    </div>
  );
};

export default AnimacaoCocos;
