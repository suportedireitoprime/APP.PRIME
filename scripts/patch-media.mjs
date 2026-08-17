import fs from 'fs';
import path from 'path';

const pluginService = 'node_modules/@capgo/capacitor-media-session/android/src/main/java/com/capgo/mediasession/MediaSessionService.java';
const pluginCore = 'node_modules/@capgo/capacitor-media-session/android/src/main/java/com/capgo/mediasession/MediaSessionPlugin.java';

try {
  let serviceCode = fs.readFileSync(pluginService, 'utf8');
  // Troca o ícone genérico de volume pelo ícone nativo do próprio app na notificação
  serviceCode = serviceCode.replace('R.drawable.ic_baseline_volume_up_24', 'getApplicationInfo().icon');
  fs.writeFileSync(pluginService, serviceCode);
  console.log('Patch MediaSessionService.java aplicado com sucesso!');
} catch (e) {
  console.log('Aviso: Não foi possível aplicar o patch em MediaSessionService.java', e.message);
}

try {
  let pluginCode = fs.readFileSync(pluginCore, 'utf8');
  // Adiciona User-Agent para evitar que o download da arte seja bloqueado por anti-bot (Cloudflare, etc)
  if (!pluginCode.includes('setRequestProperty("User-Agent"')) {
    pluginCode = pluginCode.replace(
      'HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();',
      'HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();\n            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Android)");'
    );
    fs.writeFileSync(pluginCore, pluginCode);
    console.log('Patch MediaSessionPlugin.java aplicado com sucesso!');
  }
} catch (e) {
  console.log('Aviso: Não foi possível aplicar o patch em MediaSessionPlugin.java', e.message);
}
