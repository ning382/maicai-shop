// 真实浏览器布局验证：菜品库滚到底，最后一张卡的删除按钮不得被悬浮 + 按钮遮挡
const puppeteer = require('puppeteer-core');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
let fail = 0;
const assert = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + m); if (!c) fail++; };

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=390,844']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  page.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERROR:', m.text()); });
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });

  await page.evaluate(() => document.querySelector('.tab[data-tab="recipes"]').click());
  await new Promise((r) => setTimeout(r, 300));

  // 滚到最底
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 400));

  // 角标：未选菜时必须隐藏（回归“一直显示 0”）
  const badgeHiddenAtStart = await page.evaluate(() => {
    const b = document.querySelector('#tabBadge');
    return b.hidden || getComputedStyle(b).display === 'none';
  });
  assert(badgeHiddenAtStart, '未选菜时底部“清单”角标隐藏（不显示 0）');

  const res = await page.evaluate(() => {
    const fab = document.querySelector('.fab');
    const cards = [...document.querySelectorAll('.recipe-card')];
    const last = cards[cards.length - 1];
    const del = last.querySelector('[data-del]');
    const fr = fab.getBoundingClientRect();
    const dr = del.getBoundingClientRect();
    // 删除按钮中心点上，最顶层元素是否能点到删除按钮（而不是 FAB）
    const cx = dr.left + dr.width / 2, cy = dr.top + dr.height / 2;
    const top = document.elementFromPoint(cx, cy);
    const hitDel = !!(top && top.closest && top.closest('[data-del]'));
    const hitFab = !!(top && top.closest && top.closest('.fab'));
    return {
      scrollY: window.scrollY,
      docH: document.documentElement.scrollHeight,
      fab: { top: Math.round(fr.top), bottom: Math.round(fr.bottom), left: Math.round(fr.left), right: Math.round(fr.right) },
      del: { top: Math.round(dr.top), bottom: Math.round(dr.bottom), right: Math.round(dr.right) },
      gap: Math.round(fr.top - dr.bottom),
      hitDel, hitFab,
      topTag: top ? top.tagName + '.' + (top.className && top.className.baseVal !== undefined ? '' : top.className) : 'null'
    };
  });
  console.log(JSON.stringify(res, null, 2));

  assert(res.fab.left >= 8, '悬浮按钮完整在屏幕内（左缘 ' + res.fab.left + 'px ≥ 8）');
  assert(res.fab.right <= 382, '悬浮按钮完整在屏幕内（右缘 ' + res.fab.right + 'px ≤ 382）');
  assert(res.gap >= 8, '最后一张卡删除按钮底部在悬浮按钮上方，间距 ' + res.gap + 'px（需 ≥8px）');
  assert(res.hitDel && !res.hitFab, '删除按钮中心点实际命中的是删除按钮，而非悬浮按钮（命中：' + res.topTag + '）');

  // 更窄的 360px 安卓机再验一次 FAB 不出屏
  await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 300));
  const narrow = await page.evaluate(() => {
    const r = document.querySelector('.fab').getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right) };
  });
  assert(narrow.left >= 8 && narrow.right <= 352, '360px 窄屏下悬浮按钮仍完整在屏幕内（' + narrow.left + '–' + narrow.right + '）');

  // 非数字用量不重复拼单位（“柠檬 半个个”回归）
  const lemonText = await page.evaluate(() =>
    [...document.querySelectorAll('.recipe-card')].find((c) => c.textContent.includes('香煎三文鱼')).textContent);
  assert(!lemonText.includes('半个个') && lemonText.includes('柠檬 半个'), '非数字用量显示“柠檬 半个”而不重复单位');

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.screenshot({ path: 'fab-check.png' });

  await browser.close();
  console.log(fail === 0 ? '\n全部通过' : '\n有 ' + fail + ' 项失败');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
