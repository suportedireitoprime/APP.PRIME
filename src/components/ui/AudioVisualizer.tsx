import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
  className?: string;
  barColor?: string;
}

export function AudioVisualizer({ stream, isActive, className = '', barColor = '#10b981' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive || !stream || !canvasRef.current) return;

    // Inicializa AudioContext e Analyser
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    
    // Conecta a stream do microfone ao Analyser
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');

    if (!canvasCtx) return;

    const draw = () => {
      if (!isActive) return;
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2; // Suaviza a altura

        // Desenhar barra centralizada verticalmente
        canvasCtx.fillStyle = barColor;
        canvasCtx.beginPath();
        canvasCtx.roundRect(
          x, 
          canvas.height / 2 - barHeight / 2, 
          barWidth - 2, 
          barHeight > 4 ? barHeight : 4, // Altura mínima
          2
        );
        canvasCtx.fill();

        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      source.disconnect();
      analyser.disconnect();
      audioCtx.close().catch(() => {});
    };
  }, [isActive, stream, barColor]);

  if (!isActive) return null;

  return (
    <div className={`flex justify-center items-center w-full my-2 ${className}`}>
      <canvas 
        ref={canvasRef} 
        width={200} 
        height={40} 
        className="block"
      />
    </div>
  );
}
