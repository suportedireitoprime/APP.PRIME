import React from "react";
import {
  DraggableCardBody,
  DraggableCardContainer,
} from "@/components/ui/draggable-card";

export default function TriagemFinal() {
  const items = [
    {
      title: "Se torne o maior jurídico",
      image:
        "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=3540&auto=format&fit=crop",
      className: "absolute top-10 left-[20%] rotate-[-5deg]",
    },
    {
      title: "Tenha ferramentas potentes",
      image:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2667&auto=format&fit=crop",
      className: "absolute top-40 left-[25%] rotate-[-7deg]",
    },
    {
      title: "Desperte o direito em você",
      image:
        "https://images.unsplash.com/photo-1505664159854-2338ce26b1c0?q=80&w=2600&auto=format&fit=crop",
      className: "absolute top-5 left-[40%] rotate-[8deg]",
    },
    {
      title: "Domine os tribunais",
      image:
        "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?q=80&w=3648&auto=format&fit=crop",
      className: "absolute top-32 left-[55%] rotate-[10deg]",
    },
    {
      title: "Evolução constante",
      image:
        "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?q=80&w=3542&auto=format&fit=crop",
      className: "absolute top-20 right-[35%] rotate-[2deg]",
    },
    {
      title: "Acelere sua carreira",
      image:
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=3070&auto=format&fit=crop",
      className: "absolute top-24 left-[45%] rotate-[-7deg]",
    },
    {
      title: "Excelência jurídica",
      image:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2560&auto=format&fit=crop",
      className: "absolute top-8 left-[30%] rotate-[4deg]",
    },
  ];
  return (
    <DraggableCardContainer className="relative flex min-h-screen w-full items-center justify-center overflow-clip">
      <p className="absolute top-1/2 mx-auto max-w-sm -translate-y-3/4 text-center text-2xl font-black text-neutral-400 md:text-4xl dark:text-neutral-800">
        Bem-vindo ao início de uma nova era na sua carreira.
      </p>
      {items.map((item) => (
        <DraggableCardBody key={item.title} className={item.className}>
          <img
            src={item.image}
            alt={item.title}
            className="pointer-events-none relative z-10 h-80 w-80 object-cover"
          />
          <h3 className="mt-4 text-center text-2xl font-bold text-neutral-700 dark:text-neutral-300">
            {item.title}
          </h3>
        </DraggableCardBody>
      ))}
    </DraggableCardContainer>
  );
}
