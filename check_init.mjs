const fs = require('fs');
const path = require('path');

const mock = new Proxy(function() {}, {
  get(target, prop) {
    if (prop === 'location') return { hostname: 'localhost' };
    if (prop === 'navigator') return { userAgent: 'node' };
    if (prop === 'document') return mock;
    if (prop === 'localStorage' || prop === 'sessionStorage') return { getItem: () => null, setItem: () => null, removeItem: () => null };
    if (prop === 'createElement') return () => mock;
    if (prop === 'addEventListener') return () => {};
    if (prop === 'style') return {};
    return mock;
  },
  apply() { return mock; }
});

delete global.window;
delete global.document;
delete global.navigator;
delete global.localStorage;
delete global.sessionStorage;
delete global.location;
delete global.history;

global.window = mock;
global.document = mock;
global.navigator = mock;
global.localStorage = mock.localStorage;
global.sessionStorage = mock.sessionStorage;
global.location = mock.location;
global.history = mock;

process.on('uncaughtException', (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

const files = fs.readdirSync(path.join(__dirname, 'dist/assets'));
const entry = files.find(f => f.startsWith('index-') && f.endsWith('.js'));

if (entry) {
  console.log("Loading", entry);
  import("./dist/assets/" + entry).then(() => {
    console.log("Loaded successfully!");
  }).catch(err => {
    console.error("IMPORT FAILED:", err);
  });
}
