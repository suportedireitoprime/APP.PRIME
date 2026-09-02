const token = Deno.env.get("BROWSERLESS_API_KEY");

async function run() {
  try {
    const resp = await fetch(`https://production-sfo.browserless.io/content?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.jota.info/legislativo/ligacao-com-vorcaro-leva-moraes-a-67-pedidos-de-impeachment-no-senado', waitForTimeout: 3000 })
    });
    const html = await resp.text();
    // try to find NEXT DATA
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (match) {
      const data = JSON.parse(match[1]);
      console.log('Got NEXT_DATA keys:', Object.keys(data.props.pageProps));
      if (data.props.pageProps.post) {
        console.log('Post keys:', Object.keys(data.props.pageProps.post));
        console.log('Content preview:', data.props.pageProps.post.content?.substring(0, 200));
      }
    } else {
      console.log('No NEXT_DATA found');
      // let's print some HTML
      console.log(html.substring(0, 1000));
    }
  } catch (e) {
    console.error(e);
  }
}
run();
