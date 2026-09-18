const https = require('https');

function getChannelId(handle) {
  return new Promise((resolve, reject) => {
    https.get(`https://www.youtube.com/${handle}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/channelId":"([^"]+)"/);
        resolve(match ? match[1] : null);
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Camara:', await getChannelId('@camaradosdeputadosoficial'));
  console.log('Senado:', await getChannelId('@tvsenado'));
  console.log('STF:', await getChannelId('@STF_oficial'));
}
main();
