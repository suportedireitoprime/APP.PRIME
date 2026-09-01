fetch("https://www.youtube.com/@STF_oficial").then(r=>r.text()).then(t => {
  const match = t.match(/channelId":"([^"]+)"/);
  console.log(match ? match[1] : "Not found");
});
