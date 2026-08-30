import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let globalProgressCallback: ((progress: number, log?: string) => void) | null = null;
let currentDuration = 0;

export async function compressAudioToMp3(
  file: File,
  introUrl?: string,
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
        } else if (message.includes('out_time=')) {
          // Extra log parsing to check if it's progressing but in a different format
          const outTimeMatch = message.match(/out_time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
          if (outTimeMatch) log = 'Tempo: ' + outTimeMatch[1];
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
  }

  if (!ffmpeg.loaded) {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      classWorkerURL: await toBlobURL(`https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd/814.ffmpeg.js`, 'text/javascript')
    });
  }

  const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
  const outputName = 'output.mp3';

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  if (introUrl) {
    try {
      const res = await fetch(introUrl);
      const arrayBuffer = await res.arrayBuffer();
      await ffmpeg.writeFile('intro.mp3', new Uint8Array(arrayBuffer));
    } catch (err) {
      console.warn("Falha ao baixar intro, vai continuar sem intro", err);
    }
  }
  
  // Um pequeno delay para garantir que a UI do React renderize os estados de "Comprimindo 0%"
  await new Promise(resolve => setTimeout(resolve, 50));

  const args = [];
  
  if (introUrl) {
    args.push('-i', 'intro.mp3'); // [0:a]
    args.push('-i', inputName);   // [1:a]
    args.push('-filter_complex', `[0:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:10,afade=t=out:st=8:d=2[intro];[1:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay=8000|8000[voice];[intro][voice]amix=inputs=2:duration=longest:normalize=0,aformat=channel_layouts=mono[out]`);
    args.push('-map', '[out]');
  } else {
    args.push('-i', inputName);
    args.push('-ac', '1');
  }

  args.push('-c:a', 'libmp3lame', '-b:a', '64k', outputName);

  await ffmpeg.exec(args);

  const data = await ffmpeg.readFile(outputName);
  
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  const blob = new Blob([data], { type: 'audio/mpeg' });
  return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".mp3", {
    type: 'audio/mpeg',
  });
}
