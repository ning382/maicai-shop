// 用 jsdom 加载真实页面，模拟用户完整选菜流程
const { JSDOM } = require('jsdom');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fail = 0;
const assert = (cond, msg) => {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + msg);
  if (!cond) fail++;
};

(async () => {
  const dom = await JSDOM.fromURL('http://localhost:8080/', {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true
  });
  const { window } = dom;
  await sleep(600);
  const doc = window.document;

  const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

  // 1. 初始空清单
  assert(!!doc.querySelector('#view-list .empty'), '初始显示空清单状态');

  // 2. 进入选菜页
  click(doc.querySelector('.tab[data-tab="pick"]'));
  await sleep(50);
  const cards = [...doc.querySelectorAll('.dish-card')];
  assert(cards.length === 10, '选菜页渲染 10 道菜（实际 ' + cards.length + '）');

  const findCard = (name) => cards.find((c) => c.textContent.includes(name));
  const card1 = findCard('番茄炒蛋');
  const card2 = findCard('青椒肉丝');

  // 检查卡片内是否包含步进按钮（嵌套 button 是否被浏览器解析移出）
  const stepperInsideCard1 = card1.querySelector('[data-step="plus"]');
  assert(!!stepperInsideCard1, '步进按钮是卡片的子节点（嵌套 button 未被解析破坏）');

  // 3. 选择 d1，+ 两次 → 2 份
  click(card1);
  await sleep(20);
  let c1 = doc.querySelectorAll('.dish-card')[0]; // 选中后排到最前
  // 重新定位（innerHTML 重绘）
  const getCardByName = (name) => [...doc.querySelectorAll('.dish-card')].find((c) => c.textContent.includes(name));
  c1 = getCardByName('番茄炒蛋');
  click(c1.querySelector('[data-step="plus"]'));
  await sleep(20);
  c1 = getCardByName('番茄炒蛋');
  click(c1.querySelector('[data-step="plus"]'));
  await sleep(20);

  // 选择 d2
  click(getCardByName('青椒肉丝'));
  await sleep(20);

  const banner = doc.querySelector('#pickBanner').textContent;
  assert(banner.includes('已选 2 道菜') && banner.includes('3 份'), '横幅显示 已选2道菜·共3份（实际：' + banner.replace(/\s+/g, ' ').trim() + '）');

  // 步进器数值
  const valText = getCardByName('番茄炒蛋').querySelector('.step-val').textContent;
  assert(valText.includes('2'), '番茄炒蛋步进器显示 2 份（实际：' + valText + '）');

  // 4. 查看清单
  click(doc.querySelector('#bannerGoList'));
  await sleep(50);

  const rows = [...doc.querySelectorAll('#view-list .shop-item')];
  const qtyOf = (name) => {
    const row = rows.find((r) => r.querySelector('.si-name').textContent === name);
    return row ? row.querySelector('.si-qty').textContent.replace(/\s+/g, '') : null;
  };
  console.log('--- 清单实际数量 ---');
  for (const n of ['番茄', '鸡蛋', '小葱', '盐', '白砂糖', '食用油', '青椒', '猪里脊', '蒜']) {
    console.log('   ' + n + ' = ' + qtyOf(n));
  }
  assert(qtyOf('番茄') === '4个', '番茄 = 4 个（实际 ' + qtyOf('番茄') + '）');
  assert(qtyOf('鸡蛋') === '6个', '鸡蛋 = 6 个（实际 ' + qtyOf('鸡蛋') + '）');
  assert(qtyOf('小葱') === '2根', '小葱 = 2 根（实际 ' + qtyOf('小葱') + '）');
  assert(qtyOf('盐') === '5克', '盐 = 5 克（实际 ' + qtyOf('盐') + '）');
  assert(qtyOf('食用油') === '40毫升', '食用油 = 40 毫升（实际 ' + qtyOf('食用油') + '）');

  // 分类数
  assert(doc.querySelectorAll('#view-list .group').length >= 4, '按分类分组渲染（实际 ' + doc.querySelectorAll('#view-list .group').length + ' 组）');

  // 5. 勾选
  const tomatoRow = rows.find((r) => r.querySelector('.si-name').textContent === '番茄');
  click(tomatoRow);
  await sleep(20);
  assert(doc.querySelector('#view-list .summary-count b').textContent.startsWith('1/'), '勾选后计数变 1/N（实际 ' + doc.querySelector('#view-list .summary-count b').textContent + '）');

  console.log(fail === 0 ? '\n全部通过' : '\n有 ' + fail + ' 项失败');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
