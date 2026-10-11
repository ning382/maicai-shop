// 把网页源文件同步到 www/ 供 Capacitor 打包
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const www = path.join(root, 'www');

const files = ['index.html', 'app.js', 'styles.css', 'sw.js', 'manifest.webmanifest'];
const dirs = ['icons'];

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });

for (const f of files) {
  fs.copyFileSync(path.join(root, f), path.join(www, f));
}
for (const d of dirs) {
  fs.cpSync(path.join(root, d), path.join(www, d), { recursive: true });
}
console.log('www/ synced:', fs.readdirSync(www).join(', '));
