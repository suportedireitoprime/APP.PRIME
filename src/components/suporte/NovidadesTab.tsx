import { Bell } from 'lucide-react';

export function NovidadesTab() {
  const novidades = [
    { id: 1, date: 'Hoje', title: 'Novo Design do Tribunal', desc: 'Experimente a nova interface do Laboratório de Casos.' },
    { id: 2, date: 'Ontem', title: 'Simulador de Peças 2.0', desc: 'Agora a IA corrige suas peças em tempo real.' },
    { id: 3, date: '10 Ago', title: 'Buscador de Leis Otimizado', desc: 'Resultados mais rápidos e precisos.' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6 text-primary">
        <Bell className="w-5 h-5" />
        <h3 className="font-semibold">Novidades e Atualizações</h3>
      </div>
      
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {novidades.map((n, i) => (
          <div key={n.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-background bg-primary text-primary-foreground font-bold text-[10px] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ml-[3px] md:ml-0">
              {i+1}
            </div>
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm">{n.title}</h4>
                <span className="text-[10px] font-medium text-muted-foreground">{n.date}</span>
              </div>
              <p className="text-xs text-muted-foreground">{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
