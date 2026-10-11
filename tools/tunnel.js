// 启动 localtunnel 把本机 8080 暴露为 HTTPS，供手机安装 PWA
const localtunnel = require('localtunnel');

(async () => {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v || true];
  }));
  const tunnel = await localtunnel({
    port: Number(args.port || 8080),
    subdomain: args.sub || undefined
  });
  console.log('TUNNEL_URL=' + tunnel.url);
  tunnel.on('close', () => console.log('tunnel closed'));
  tunnel.on('error', (e) => { console.error('tunnel error', e); process.exit(1); });
  setInterval(() => {}, 1 << 30);
})();
