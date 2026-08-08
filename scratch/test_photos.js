async function run() {
  const res = await fetch('https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/locais-overpass-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'photos',
      local_ids: [
        '557f5892-1084-48a4-b23d-6b925800c5c4',
        '0259777f-7962-42cb-b665-f8ca2292aa9a',
        '0e6d36e8-2b46-49d4-90ae-a2c5df244c89'
      ],
      force: true
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
