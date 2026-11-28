import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { haptic } from "@/lib/nativeHaptics";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0?: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results?: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstanceLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstanceLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

/**
 * Hook para pesquisa por voz usando Web Speech API (pt-BR) com fallback gracioso.
 */
export function useVoiceSearch(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []);

  const startVoiceSearch = useCallback(() => {
    haptic.selection();
    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setListening(false);
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      toast({
        title: "Pesquisa por voz indisponível neste navegador",
        description: "Digite sua busca no campo acima.",
      });
      return;
    }

    try {
      const rec = new Ctor();
      rec.lang = "pt-BR";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      recognitionRef.current = rec;
      setListening(true);

      rec.onresult = (ev) => {
        const transcript = ev.results?.[0]?.[0]?.transcript?.trim();
        if (transcript) {
          onTranscript(transcript);
        }
      };

      rec.onerror = () => {
        setListening(false);
        toast({
          title: "Não foi possível capturar o áudio",
          description: "Verifique a permissão do microfone e tente novamente.",
        });
      };

      rec.onend = () => {
        setListening(false);
      };

      rec.start();
    } catch {
      setListening(false);
      toast({
        title: "Não foi possível iniciar a busca por voz",
      });
    }
  }, [listening, onTranscript]);

  return { listening, startVoiceSearch };
}
