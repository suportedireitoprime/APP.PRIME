import React from 'react';

const AnimacaoAxmol = () => {
  return (
    <div className="w-full h-[350px] bg-[#171321] rounded-xl border border-purple-500/30 p-6 flex flex-col justify-center items-center relative overflow-hidden">
      <div className="absolute top-4 right-4 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/50">
        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Axmol Engine (C++)</span>
      </div>

      <div className="flex flex-col items-center text-center max-w-md z-10">
        <div className="w-16 h-16 bg-purple-500/10 rounded-2xl border border-purple-500/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
        </div>
        
        <h3 className="text-xl font-display font-semibold text-white mb-2">Motor Axmol (Fork Cocos2d-x)</h3>
        
        <p className="text-sm text-purple-200/70 mb-4">
          O Axmol é um poderoso motor em C++ puro focado em jogos nativos (iOS/Android/Windows). A integração com Web/React exige CMake pesado, Clang, Emscripten e Wasm.
        </p>
        
        <div className="w-full bg-black/50 p-3 rounded-lg text-left">
          <code className="text-xs text-green-400 font-mono">
            // Exemplo de código C++ do Axmol:<br/>
            auto sprite = ax::Sprite::create("robber.webp");<br/>
            sprite-&gt;setPosition(ax::Vec2(100, 100));<br/>
            this-&gt;addChild(sprite);<br/>
            // Deve ser compilado para .wasm antes do uso.
          </code>
        </div>
      </div>
    </div>
  );
};

export default AnimacaoAxmol;
