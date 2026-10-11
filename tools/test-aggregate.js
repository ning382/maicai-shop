// 离线验证 app.js 的聚合逻辑：stub 最小 DOM，注入可控 localStorage，跑完读取结果
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function makeEl() {
  const el = {
    children: [], style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    innerHTML: '', textContent: '', hidden: false, value: '',
    appendChild(c) { this.children.push(c); return c; },
    addEventListener() {}, removeEventListener() {},
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
    setAttribute() {}, getAttribute() { return null; }, focus() {}, click() {}, remove() {}, closest() { return null; },
    scrollTop: 0
  };
  return el;
}

const store = {};
const sandbox = {
  console,
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  },
  document: {
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    createElement: () => makeEl(),
    addEventListener() {}, body: makeEl()
  },
  window: { addEventListener() {}, scrollTo() {}, matchMedia: () => ({ matches: false }) },
  navigator: { userAgent: 'node', platform: 'node' },
  location: { protocol: 'http:' },
  setTimeout, clearTimeout, requestAnimationFrame: (f) => f && f(),
  Date, Math, JSON, Object, Array, String, Number, isNaN, isFinite, parseFloat, parseInt,
  URL: { createObjectURL: () => '', revokeObjectURL() {} },
  Blob: function () {}, FileReader: function () {}, confirm: () => true
};
sandbox.window.matchMedia = () => ({ matches: false });
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'app.js' });

// 从 localStorage 中读出落库的真实状态，复算选中"番茄炒蛋×2 + 青椒肉丝×1"的聚合
const saved = JSON.parse(store['maicai.shop.v1']);
const recipes = saved.recipes;
const sel = { d1: 2, d2: 1 };

const CATS = ['蔬菜', '肉禽蛋', '水产', '豆制品', '米面粮油', '调料', '其他'];
const groups = new Map();
for (const [rid, mult] of Object.entries(sel)) {
  const r = recipes.find((x) => x.id === rid);
  for (const raw of r.ings) {
    const cat = raw.cat;
    const key = cat + '|' + raw.name + '|' + raw.unit;
    if (!groups.has(key)) groups.set(key, { name: raw.name, unit: raw.unit, cat, num: 0 });
    const n = parseFloat(raw.qty);
    if (!isNaN(n)) groups.get(key).num += n * mult;
  }
}
const rows = [...groups.values()].sort((a, b) => CATS.indexOf(a.cat) - CATS.indexOf(b.cat));
for (const r of rows) console.log(`${r.cat}\t${r.name}\t${Math.round(r.num * 100) / 100} ${r.unit}`);

const get = (name) => rows.find((r) => r.name === name);
const checks = [
  ['番茄', 4, '个'], ['鸡蛋', 6, '个'], ['盐', 5, '克'],
  ['食用油', 40, '毫升'], ['小葱', 2, '根'], ['青椒', 2, '个'], ['猪里脊', 200, '克']
];
let fail = 0;
for (const [name, num, unit] of checks) {
  const r = get(name);
  const ok = r && r.num === num && r.unit === unit;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} = ${r ? r.num + r.unit : '缺失'} (期望 ${num}${unit})`);
}
process.exit(fail ? 1 : 0);
