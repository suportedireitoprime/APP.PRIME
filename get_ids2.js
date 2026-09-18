async function getChannelId(h) {
  const r = await fetch('https://www.youtube.com/' + h);
  const d = await r.text();
  const match = d.match(/channelId":"([^"]+)"/);
  return match ? match[1] : null;
}
Promise.all(['@camaradosdeputadosoficial', '@tvsenado', '@STF_oficial'].map(h => 
  getChannelId(h).then(id => console.log(h, id))
));
