import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let globalProgressCallback: ((progress: number) => void) | null = null;

export async function compressAudioToMp3(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  globalProgressCallback = onProgress || null;

  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    ffmpeg.on('progress', ({ progress }) => {
      if (globalProgressCallback) {
        globalProgressCallback(progress * 100);
      }
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(${baseURL}/ffmpeg-core.js, 'text/javascript'),
      wasmURL: await toBlobURL(${baseURL}/ffmpeg-core.wasm, 'application/wasm'),
    });
  }

  const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
  const outputName = 'output.mp3';

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec(['-i', inputName, '-c:a', 'libmp3lame', '-b:a', '64k', '-ac', '1', outputName]);

  const data = await ffmpeg.readFile(outputName);
  
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  const blob = new Blob([data], { type: 'audio/mpeg' });
  return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".mp3", {
    type: 'audio/mpeg',
  });
}
