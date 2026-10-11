// 完整流程测试：勾选多行 / 添加菜品 / 设置页 / 安装帮助 / 静态资源
const { JSDOM } = require('jsdom');
const http = require('http');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fail = 0;
const assert = (cond, msg) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + msg); if (!cond) fail++; };

const statusOf = (p) => new Promise((resolve) => {
  http.get('http://localhost:8080/' + p, (res) => {
    res.resume();
    resolve({ status: res.statusCode, type: res.headers['content-type'] || '' });
  }).on('error', () => resolve({ status: 0, type: '' }));
});
const bodyOf = (p) => new Promise((resolve, reject) => {
  http.get('http://localhost:8080/' + p, (res) => {
    let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => resolve(d));
  }).on('error', reject);
});

(async () => {
  const dom = await JSDOM.fromURL('http://localhost:8080/', {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true
  });
  const { window } = dom;
  await sleep(600);
  const doc = window.document;
  const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const input = (el, v) => { el.value = v; el.dispatchEvent(new window.Event('input', { bubbles: true })); };
  const tab = (n) => click(doc.querySelector('.tab[data-tab="' + n + '"]'));
  const findCard = (n) => [...doc.querySelectorAll('.dish-card')].find((c) => c.textContent.includes(n));

  // 选菜：d1×2 + d2
  tab('pick'); await sleep(30);
  click(findCard('番茄炒蛋'));
  click(findCard('番茄炒蛋').querySelector('[data-step="plus"]'));
  click(findCard('番茄炒蛋').querySelector('[data-step="plus"]'));
  click(findCard('青椒肉丝'));
  click(doc.querySelector('#bannerGoList'));
  await sleep(30);

  // 真人式勾选：每次点击后重新查询（DOM 已重绘）
  const clickNth = (idx) => click(doc.querySelectorAll('.shop-item')[idx]);
  clickNth(0); await sleep(20); clickNth(1); await sleep(20); clickNth(2); await sleep(20);
  const count = doc.querySelector('#view-list .summary-count b').textContent;
  assert(count === '3/13', '连续勾选 3 行后计数 3/13（实际 ' + count + '）');
  const checkedRows = doc.querySelectorAll('#view-list .shop-item.is-checked').length;
  assert(checkedRows === 3, '3 行显示勾选样式（实际 ' + checkedRows + '）');
  const pct = doc.querySelector('#view-list .progress i').style.width;
  assert(pct === '23%', '进度条 23%（实际 ' + pct + '）');
  // 重置勾选
  click(doc.querySelector('#btnUncheck')); await sleep(10);
  assert(doc.querySelector('#view-list .summary-count b').textContent === '0/13', '重置后 0/13');

  // 添加菜品
  tab('recipes'); await sleep(30);
  click(doc.querySelector('.fab')); await sleep(100);
  input(doc.querySelector('#edName'), '油焖大虾');
  const r0 = doc.querySelectorAll('.ing-row')[0];
  input(r0.querySelector('.ing-name'), '大虾');
  input(r0.querySelector('.ing-qty-in'), '300');
  r0.querySelector('.ing-unit-in').value = '克';
  r0.querySelector('.ing-unit-in').dispatchEvent(new window.Event('change', { bubbles: true }));
  const catAfterName = r0.querySelector('.ing-cat-in').value;
  assert(catAfterName === '水产', '输入"大虾"自动归类为水产（实际 ' + catAfterName + '）');
  click(doc.querySelector('#addIng')); await sleep(20);
  const r1 = doc.querySelectorAll('.ing-row')[1];
  input(r1.querySelector('.ing-name'), '姜');
  input(r1.querySelector('.ing-qty-in'), '1');
  r1.querySelector('.ing-unit-in').value = '块';
  r1.querySelector('.ing-unit-in').dispatchEvent(new window.Event('change', { bubbles: true }));
  click(doc.querySelector('#edSave')); await sleep(300);
  assert(doc.querySelector('#sheetMask').hidden === true, '保存后弹层关闭');
  assert([...doc.querySelectorAll('.recipe-card')].some((c) => c.textContent.includes('油焖大虾')),
    '菜品库出现"油焖大虾"（共 ' + doc.querySelectorAll('.recipe-card').length + ' 张卡）');

  // 空名称校验
  click(doc.querySelector('.fab')); await sleep(100);
  click(doc.querySelector('#edSave')); await sleep(20);
  assert(doc.querySelector('#sheetMask').hidden === false, '未填名称时点保存，弹层不关闭');
  click(doc.querySelector('#sheetClose')); await sleep(250);

  // 设置页关键元素
  tab('settings'); await sleep(30);
  for (const [sel2, label] of [
    ['#btnInstallHelp', '安装帮助入口'],
    ['#btnExport', '导出备份入口'],
    ['#btnImport', '导入备份入口'],
    ['#btnResetSample', '恢复示例入口'],
    ['#btnWipe', '清空数据入口'],
    ['#importFile', '导入文件控件']
  ]) assert(!!doc.querySelector(sel2), label);

  // 安装帮助三段
  click(doc.querySelector('#btnInstallHelp')); await sleep(80);
  const help = doc.querySelector('.help-body').textContent;
  assert(help.includes('安卓') && help.includes('iPhone') && help.includes('电脑'), '安装帮助含三平台说明');
  click(doc.querySelector('#sheetClose')); await sleep(250);

  // 持久化：新实例读取 localStorage 仍有 11 道菜
  const saved = JSON.parse(window.localStorage.getItem('maicai.shop.v1'));
  assert(Array.isArray(saved.recipes) && saved.recipes.length === 11, '数据已持久化，共 11 道菜（实际 ' + (saved.recipes && saved.recipes.length) + '）');

  // 静态资源
  const checks = [
    ['manifest.webmanifest', 200, 'json'],
    ['sw.js', 200, 'javascript'],
    ['styles.css', 200, 'css'],
    ['app.js', 200, 'javascript'],
    ['icons/icon-192.png', 200, 'png'],
    ['icons/icon-512.png', 200, 'png'],
    ['icons/apple-touch-icon.png', 200, 'png'],
    ['icons/favicon.svg', 200, 'svg']
  ];
  for (const [p, st, mime] of checks) {
    const r = await statusOf(p);
    assert(r.status === st && r.type.includes(mime), p + ' 200/' + mime + '（实际 ' + r.status + '/' + r.type + '）');
  }
  const manifest = JSON.parse(await bodyOf('manifest.webmanifest'));
  assert(manifest.name && manifest.icons.length >= 4 && manifest.display === 'standalone', 'manifest 字段完整');
  const sw = await bodyOf('sw.js');
  assert(sw.includes("'maicai-v3'"), 'sw.js 为最新缓存版本 v3');

  console.log(fail === 0 ? '\n全部通过' : '\n有 ' + fail + ' 项失败');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
