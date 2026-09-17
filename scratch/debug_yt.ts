import fs from 'node:fs';

async function main() {
  const playlistId = 'PLippyY19Z47uVfUBc_DlZrQpnnqmnPkT0';
  const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
      headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
  });
  const html = await res.text();
  
  const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
  if (!match) {
      console.log("ytInitialData not found");
      return;
  }
  const ytInitialData = JSON.parse(match[1]);
  
  fs.writeFileSync('scratch/yt_data.json', JSON.stringify(ytInitialData, null, 2));
  console.log("Written to scratch/yt_data.json");
}

main();
