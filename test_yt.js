const videoId = 'zI_kiwJ2S2Y';
async function run() {
  const html = await fetch('https://www.youtube.com/watch?v=' + videoId + '&hl=pt', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
  }).then((r) => r.text());
  
  const m = html.match(/var ytInitialPlayerResponse = (\{.*?\});/);
  if (!m) {
    console.log('NO ytInitialPlayerResponse FOUND');
    return;
  }
  const playerResponse = JSON.parse(m[1]);
  const captions = playerResponse.captions;
  console.log('captions:', !!captions);
  if (captions) {
     console.log('keys:', Object.keys(captions));
     console.log('playerCaptionsTracklistRenderer:', !!captions.playerCaptionsTracklistRenderer);
     if (captions.playerCaptionsTracklistRenderer) {
        console.log('captionTracks:', captions.playerCaptionsTracklistRenderer.captionTracks);
     }
  }
}
run();
