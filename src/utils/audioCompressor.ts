import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let globalProgressCallback: ((progress: number, log?: string) => void) | null = null;
let currentDuration = 0;

export async function compressAudioToMp3(
  file: File,
  onProgress?: (progress: number, log?: string) => void
): Promise<File> {
  globalProgressCallback = onProgress || null;

  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    ffmpeg.on('log', ({ message }) => {
      // Tenta extrair a duração total do arquivo (ex: Duration: 00:03:45.12)
      const durationMatch = message.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1], 10);
        const minutes = parseInt(durationMatch[2], 10);
        const seconds = parseFloat(durationMatch[3]);
        currentDuration = (hours * 3600) + (minutes * 60) + seconds;
      }
      
      // Tenta extrair o tempo atual e o tamanho (ex: size=    1024kB time=00:01:23.45)
      const timeMatch = message.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      const sizeMatch = message.match(/size=\s*(\d+)kB/);
      
      if (timeMatch && globalProgressCallback && currentDuration > 0) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const seconds = parseFloat(timeMatch[3]);
        const currentTime = (hours * 3600) + (minutes * 60) + seconds;
        
        const progress = (currentTime / currentDuration) * 100;
        let log = '';
        if (sizeMatch) {
          const mb = (parseInt(sizeMatch[1], 10) / 1024).toFixed(2);
          log = mb + ' MB';
        }
        
        globalProgressCallback(progress, log);
      }
    });

    ffmpeg.on('progress', ({ progress }) => {
      // O evento de progresso nativo às vezes falha com áudios, mas tentamos usá-lo como fallback
      if (globalProgressCallback && progress > 0 && progress <= 1) {
        globalProgressCallback(progress * 100);
      }
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(\${baseURL}/ffmpeg-core.js\, 'text/javascript'),
      wasmURL: await toBlobURL(\${baseURL}/ffmpeg-core.wasm\, 'application/wasm'),
    });
  }

  const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
  const outputName = 'output.mp3';

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  
  // Um pequeno delay para garantir que a UI do React renderize os estados de "Comprimindo 0%"
  await new Promise(resolve => setTimeout(resolve, 50));

  await ffmpeg.exec(['-i', inputName, '-c:a', 'libmp3lame', '-b:a', '64k', '-ac', '1', outputName]);

  const data = await ffmpeg.readFile(outputName);
  
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  const blob = new Blob([data], { type: 'audio/mpeg' });
  return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".mp3", {
    type: 'audio/mpeg',
  });
}
