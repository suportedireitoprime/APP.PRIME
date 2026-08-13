import React from 'react';

const AnimacaoDefold = () => {
  return (
    <div className="w-full h-[350px] bg-[#1a1c23] rounded-xl border border-orange-500/30 p-6 flex flex-col justify-center items-center relative overflow-hidden">
      <div className="absolute top-4 right-4 bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/50">
        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Defold Engine (Lua)</span>
      </div>

      <div className="flex flex-col items-center text-center max-w-md z-10">
        <div className="w-16 h-16 bg-orange-500/10 rounded-2xl border border-orange-500/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        
        <h3 className="text-xl font-display font-semibold text-white mb-2">Motor Defold Não-Nativo</h3>
        
        <p className="text-sm text-orange-200/70 mb-4">
          Defold é escrito em Lua (não JavaScript). Não é possível rodar o código-fonte Lua diretamente dentro do React. Ele precisa ser compilado no Editor Defold para HTML5.
        </p>
        
        <div className="w-full bg-black/50 p-3 rounded-lg text-left">
          <code className="text-xs text-green-400 font-mono">
            -- Exemplo de lógica em Lua (Incompatível com React puro):<br/>
            function init(self)<br/>
            &nbsp;&nbsp;go.set_position(vmath.vector3(100, 100, 0))<br/>
            &nbsp;&nbsp;msg.post(".", "acquire_input_focus")<br/>
            end
          </code>
        </div>
      </div>
    </div>
  );
};

export default AnimacaoDefold;
