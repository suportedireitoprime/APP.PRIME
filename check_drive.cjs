const { google } = require('googleapis');
const path = require('path');
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'bot-audioaulas', 'credentials.json'),
  scopes: ['https://www.googleapis.com/auth/drive']
});
auth.getClient().then(client => {
  const drive = google.drive({ version: 'v3', auth: client });
  drive.files.list({
    q: "'1lsH2FvXEzE6C6qe9Hcin_cbsMHNXv0Oa' in parents and trashed=false",
    fields: 'files(id, name, mimeType)'
  }).then(res => console.log(JSON.stringify(res.data.files, null, 2)))
    .catch(err => console.error(err));
}).catch(err => console.error(err));
