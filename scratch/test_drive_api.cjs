const folderId = '154MS3sz9EWZlSmsVfRvxsl3RX4P4c78c';
const keys = [
  'AIzaSyB-cPcIPE_o4mYfAz0ebn_mMRcfxq5PXT4',
  'AIzaSyDKPo3lyh1TvNSku7gw7jDDlYr1zo7tHQs'
];

async function testKey(key) {
  const url = `https://www.googleapis.com/drive/v3/files?q=%27${folderId}%27+in+parents+and+trashed=false&fields=files(id,name,mimeType,size)&key=${key}`;
  console.log('Testando key:', key.slice(0, 10));
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log('Status:', res.status, 'Response:', JSON.stringify(json).slice(0, 300));
    if (json.files) {
      console.log('Arquivos encontrados com esta key:', json.files.length);
      return json.files;
    }
  } catch (err) {
    console.error('Erro:', err);
  }
  return null;
}

async function run() {
  for (const k of keys) {
    const files = await testKey(k);
    if (files) {
      console.log('Sucesso! Arquivos:', files);
      break;
    }
  }
}

run();
