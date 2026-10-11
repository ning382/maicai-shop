/* ============================================================
   买菜清单 —— 纯前端本地应用
   选菜 → 按份数汇总食材 → 同名同单位自动累加 → 购物清单
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 常量：分类 / 单位 / 自动归类 ---------------- */
  const CATEGORIES = [
    { name: '蔬菜',     color: '#5F8D4E' },
    { name: '肉禽蛋',   color: '#C2503E' },
    { name: '水产',     color: '#4E7FA8' },
    { name: '豆制品',   color: '#D9A441' },
    { name: '米面粮油', color: '#A07E4F' },
    { name: '调料',     color: '#8A6F9E' },
    { name: '其他',     color: '#8F867A' }
  ];
  const DEFAULT_CAT = '其他';
  // 营养金字塔默认层序：越靠上越要少吃，越靠下建议多吃（用户可自定义）
  // 4 行左右分格，新增 水果 / 坚果种子 / 乳制品 细分类
  const DEFAULT_PYRAMID_LAYERS = [
    { name: '调料', color: '#8A6F9E' },
    { name: '肉禽蛋', color: '#C2503E', split: true, right: { name: '水产', color: '#4E7FA8' } },
    { name: '乳制品', color: '#6FA8A0', split: true, right: { name: '坚果种子', color: '#B0796E' } },
    { name: '豆制品', color: '#D9A441', split: true, right: { name: '其他', color: '#8F867A' } },
    { name: '米面粮油', color: '#A07E4F', split: true, right: { name: '水果', color: '#E58F3A' } },
    { name: '蔬菜', color: '#5F8D4E' }
  ];
  const PYRAMID_PALETTE = ['#8A6F9E', '#C2503E', '#4E7FA8', '#D9A441', '#8F867A', '#A07E4F', '#5F8D4E',
                           '#E0533D', '#6FA8A0', '#B0796E', '#7A8C4F', '#9E7CC3'];
  const UNITS = ['个', '克', '斤', '根', '颗', '瓣', '片', '块', '只', '条',
                 '把', '勺', '毫升', '小撮', '适量', '小包'];

  const ING_CAT_MAP = {
    // 蔬菜
    '番茄': '蔬菜', '西红柿': '蔬菜', '青椒': '蔬菜', '西兰花': '蔬菜', '土豆': '蔬菜',
    '黄瓜': '蔬菜', '小葱': '蔬菜', '葱': '蔬菜', '葱花': '蔬菜', '姜': '蔬菜',
    '蒜': '蔬菜', '蒜瓣': '蔬菜', '大蒜': '蔬菜', '干辣椒': '蔬菜', '小米椒': '蔬菜',
    '香菜': '蔬菜', '白菜': '蔬菜', '生菜': '蔬菜', '洋葱': '蔬菜', '胡萝卜': '蔬菜',
    '茄子': '蔬菜', '冬瓜': '蔬菜', '豆芽': '蔬菜', '韭菜': '蔬菜', '芹菜': '蔬菜',
    '菠菜': '蔬菜', '香菇': '蔬菜', '金针菇': '蔬菜', '蘑菇': '蔬菜', '豆角': '蔬菜',
    '玉米': '蔬菜', '莲藕': '蔬菜', '莴笋': '蔬菜', '苦瓜': '蔬菜', '蒜苗': '蔬菜',
    '彩椒': '蔬菜', '辣椒': '蔬菜', '柠檬': '蔬菜', '青菜': '蔬菜', '西葫芦': '蔬菜',
    '白萝卜': '蔬菜', '萝卜': '蔬菜', '山药': '蔬菜', '南瓜': '蔬菜',
    // 肉禽蛋
    '鸡蛋': '肉禽蛋', '猪肉': '肉禽蛋', '猪里脊': '肉禽蛋', '里脊肉': '肉禽蛋',
    '五花肉': '肉禽蛋', '牛肉': '肉禽蛋', '牛肉末': '肉禽蛋', '排骨': '肉禽蛋',
    '猪排骨': '肉禽蛋', '鸡翅': '肉禽蛋', '鸡翅中': '肉禽蛋', '鸡腿': '肉禽蛋',
    '鸡胸肉': '肉禽蛋', '鸡肉': '肉禽蛋', '整鸡': '肉禽蛋', '鸭肉': '肉禽蛋',
    '火腿': '肉禽蛋', '培根': '肉禽蛋', '香肠': '肉禽蛋', '肉末': '肉禽蛋',
    // 水产
    '三文鱼': '水产', '鱼': '水产', '虾': '水产', '虾仁': '水产', '带鱼': '水产',
    '鲈鱼': '水产', '鲫鱼': '水产', '螃蟹': '水产', '鱿鱼': '水产', '花甲': '水产',
    '贝类': '水产',
    // 豆制品
    '豆腐': '豆制品', '嫩豆腐': '豆制品', '老豆腐': '豆制品', '豆皮': '豆制品',
    '豆干': '豆制品', '腐竹': '豆制品',
    // 米面粮油
    '挂面': '米面粮油', '面条': '米面粮油', '米': '米面粮油', '米饭': '米面粮油',
    '面粉': '米面粮油', '食用油': '米面粮油', '植物油': '米面粮油', '黄油': '米面粮油',
    '橄榄油': '米面粮油', '香油': '米面粮油', '面包': '米面粮油', '饺子皮': '米面粮油',
    '粉丝': '米面粮油', '粉条': '米面粮油', '燕麦': '米面粮油', '小米': '米面粮油',
    '大米': '米面粮油',
    // 调料
    '盐': '调料', '白砂糖': '调料', '糖': '调料', '冰糖': '调料', '生抽': '调料',
    '老抽': '调料', '料酒': '调料', '香醋': '调料', '醋': '调料', '蚝油': '调料',
    '豆瓣酱': '调料', '花椒': '调料', '花椒粉': '调料', '黑胡椒': '调料',
    '胡椒粉': '调料', '淀粉': '调料', '八角': '调料', '桂皮': '调料',
    '香叶': '调料', '酱油': '调料', '辣椒油': '调料', '鸡精': '调料', '味精': '调料'
  };

  function guessCategory(name) {
    const n = (name || '').trim();
    if (ING_CAT_MAP[n]) return ING_CAT_MAP[n];
    if (/蛋$/.test(n)) return '肉禽蛋';
    if (/鱼|虾|蟹|鱿|贝|蛤/.test(n)) return '水产';
    if (/豆腐|豆干|豆皮|腐竹/.test(n)) return '豆制品';
    if (/油$|米$|面$|粉$/.test(n)) return '米面粮油';
    if (/菜$|椒$|葱$|姜$|蒜$|菇$|笋$|瓜$|卜$|藕$|苗$/.test(n)) return '蔬菜';
    return DEFAULT_CAT;
  }

  // 营养金字塔默认层级（深拷贝，避免调用方共享引用）
  function defaultPyramidLayers() {
    return JSON.parse(JSON.stringify(DEFAULT_PYRAMID_LAYERS));
  }

  /* ---------------- 预置菜谱 ---------------- */
  let _uid = 0;
  const uid = (p) => p + Date.now().toString(36) + (_uid++).toString(36);
  const ing = (name, qty, unit, cat) => ({ id: uid('i'), name, qty: String(qty), unit, cat: cat || guessCategory(name) });

  function sampleRecipes() {
    return [
      { id:'np-d01', dishCat:'dc-breakfast', name:'燕麦蓝莓酸奶杯', ings:[ing('燕麦','40','克','米面粮油'), ing('蓝莓','80','克','水果'), ing('希腊酸奶','150','克','乳制品'), ing('奇亚籽','10','克','坚果种子')] },
      { id:'np-d02', dishCat:'dc-staple', name:'藜麦鸡胸彩蔬碗', ings:[ing('藜麦','60','克','米面粮油'), ing('鸡胸肉','120','克','肉禽蛋'), ing('西兰花','100','克','蔬菜'), ing('胡萝卜','80','克','蔬菜'), ing('橄榄油','5','毫升','米面粮油'), ing('盐','2','克','调料')] },
      { id:'np-d03', dishCat:'dc-meat', name:'香煎三文鱼配芦笋菠菜', ings:[ing('三文鱼','150','克','水产'), ing('芦笋','100','克','蔬菜'), ing('菠菜','100','克','蔬菜'), ing('柠檬','2','片','蔬菜'), ing('橄榄油','5','毫升','米面粮油'), ing('盐','2','克','调料'), ing('黑胡椒','1','克','调料')] },
      { id:'np-d04', dishCat:'dc-snack', name:'杏仁配橙子', ings:[ing('杏仁','15','克','坚果种子'), ing('橙子','1','个','水果')] },
      { id:'np-d05', dishCat:'dc-breakfast', name:'全麦面包配牛油果水煮蛋', ings:[ing('全麦面包','2','片','米面粮油'), ing('牛油果','半个','个','水果'), ing('鸡蛋','1','个','肉禽蛋'), ing('番茄','1','个','蔬菜'), ing('盐','1','克','调料')] },
      { id:'np-d06', dishCat:'dc-staple', name:'黑豆糙米碗配番茄莎莎', ings:[ing('黑豆','60','克','豆制品'), ing('糙米','60','克','米面粮油'), ing('番茄','1','个','蔬菜'), ing('莎莎酱','30','克','调料'), ing('青椒','半个','个','蔬菜'), ing('盐','2','克','调料')] },
      { id:'np-d07', dishCat:'dc-meat', name:'清蒸鳕鱼配杂蔬荞麦面', ings:[ing('鳕鱼','150','克','水产'), ing('荞麦面','80','克','米面粮油'), ing('西兰花','100','克','蔬菜'), ing('蘑菇','80','克','蔬菜'), ing('生抽','10','毫升','调料'), ing('盐','2','克','调料')] },
      { id:'np-d08', dishCat:'dc-snack', name:'蓝莓配核桃', ings:[ing('蓝莓','80','克','水果'), ing('核桃','15','克','坚果种子')] },
      { id:'np-d09', dishCat:'dc-breakfast', name:'燕麦粥配草莓亚麻籽', ings:[ing('燕麦','40','克','米面粮油'), ing('草莓','80','克','水果'), ing('亚麻籽','10','克','坚果种子'), ing('脱脂牛奶','250','毫升','乳制品')] },
      { id:'np-d10', dishCat:'dc-cold', name:'鹰嘴豆蔬菜沙拉配全麦皮塔', ings:[ing('鹰嘴豆','60','克','豆制品'), ing('生菜','80','克','蔬菜'), ing('黄瓜','半根','根','蔬菜'), ing('番茄','1','个','蔬菜'), ing('全麦皮塔','1','个','米面粮油'), ing('橄榄油','5','毫升','米面粮油'), ing('盐','1','克','调料')] },
      { id:'np-d11', dishCat:'dc-meat', name:'少油鸡肉彩椒炒藜麦', ings:[ing('鸡胸肉','100','克','肉禽蛋'), ing('彩椒','1','个','蔬菜'), ing('芦笋','80','克','蔬菜'), ing('藜麦','60','克','米面粮油'), ing('橄榄油','5','毫升','米面粮油'), ing('盐','2','克','调料')] },
      { id:'np-d12', dishCat:'dc-snack', name:'希腊酸奶配猕猴桃', ings:[ing('希腊酸奶','150','克','乳制品'), ing('猕猴桃','1','个','水果')] },
      { id:'np-d13', dishCat:'dc-breakfast', name:'绿叶蔬果昔', ings:[ing('菠菜','60','克','蔬菜'), ing('香蕉','1','根','水果'), ing('蓝莓','60','克','水果'), ing('亚麻籽','10','克','坚果种子'), ing('脱脂牛奶','200','毫升','乳制品')] },
      { id:'np-d14', dishCat:'dc-staple', name:'金枪鱼牛油果全麦三明治', ings:[ing('金枪鱼','80','克','水产'), ing('牛油果','半个','个','水果'), ing('全麦面包','2','片','米面粮油'), ing('黄瓜','半根','根','蔬菜'), ing('盐','1','克','调料'), ing('黑胡椒','1','克','调料')] },
      { id:'np-d15', dishCat:'dc-staple', name:'扁豆番茄炖菜配糙米', ings:[ing('扁豆','70','克','豆制品'), ing('番茄','2','个','蔬菜'), ing('洋葱','半个','个','蔬菜'), ing('蒜','2','瓣','蔬菜'), ing('糙米','60','克','米面粮油'), ing('橄榄油','5','毫升','米面粮油'), ing('盐','2','克','调料')] },
      { id:'np-d16', dishCat:'dc-snack', name:'橙子配南瓜籽', ings:[ing('橙子','1','个','水果'), ing('南瓜籽','15','克','坚果种子')] },
      { id:'np-d17', dishCat:'dc-breakfast', name:'希腊酸奶燕麦碗配桃', ings:[ing('希腊酸奶','150','克','乳制品'), ing('燕麦','40','克','米面粮油'), ing('桃','1','个','水果'), ing('杏仁','15','克','坚果种子')] },
      { id:'np-d18', dishCat:'dc-meat', name:'虾仁西兰花炒藜麦', ings:[ing('虾仁','120','克','水产'), ing('西兰花','100','克','蔬菜'), ing('藜麦','60','克','米面粮油'), ing('蒜','2','瓣','蔬菜'), ing('橄榄油','5','毫升','米面粮油'), ing('盐','2','克','调料')] },
      { id:'np-d19', dishCat:'dc-veg', name:'豆腐菌菇蔬菜煲配荞麦面', ings:[ing('豆腐','150','克','豆制品'), ing('蘑菇','100','克','蔬菜'), ing('荞麦面','80','克','米面粮油'), ing('白菜','100','克','蔬菜'), ing('生抽','10','毫升','调料'), ing('盐','2','克','调料')] },
      { id:'np-d20', dishCat:'dc-snack', name:'西瓜苹果拼盘', ings:[ing('西瓜','200','克','水果'), ing('苹果','1','个','水果')] },
      { id:'np-d21', dishCat:'dc-breakfast', name:'全麦法式吐司配莓果', ings:[ing('全麦面包','2','片','米面粮油'), ing('鸡蛋','1','个','肉禽蛋'), ing('蓝莓','60','克','水果'), ing('脱脂牛奶','100','毫升','乳制品')] },
      { id:'np-d22', dishCat:'dc-cold', name:'三文鱼牛油果沙拉', ings:[ing('三文鱼','100','克','水产'), ing('牛油果','半个','个','水果'), ing('生菜','80','克','蔬菜'), ing('番茄','1','个','蔬菜'), ing('橄榄油','5','毫升','米面粮油'), ing('柠檬','2','片','蔬菜'), ing('盐','1','克','调料')] },
      { id:'np-d23', dishCat:'dc-meat', name:'鸡胸蔬菜卷配番茄莎莎', ings:[ing('鸡胸肉','120','克','肉禽蛋'), ing('全麦卷饼','1','张','米面粮油'), ing('彩椒','1','个','蔬菜'), ing('莎莎酱','30','克','调料'), ing('盐','2','克','调料')] },
      { id:'np-d24', dishCat:'dc-snack', name:'奇亚籽布丁配蓝莓', ings:[ing('奇亚籽','15','克','坚果种子'), ing('希腊酸奶','150','克','乳制品'), ing('蓝莓','60','克','水果')] },
      { id:'np-d25', dishCat:'dc-breakfast', name:'燕麦杏仁苹果碗', ings:[ing('燕麦','40','克','米面粮油'), ing('杏仁','15','克','坚果种子'), ing('苹果','1','个','水果')] },
      { id:'np-d26', dishCat:'dc-cold', name:'地中海拼盘', ings:[ing('鹰嘴豆泥','50','克','豆制品'), ing('全麦面包','2','片','米面粮油'), ing('生菜','60','克','蔬菜'), ing('黄瓜','半根','根','蔬菜'), ing('番茄','1','个','蔬菜'), ing('沙丁鱼','60','克','水产'), ing('橄榄油','5','毫升','米面粮油')] },
      { id:'np-d27', dishCat:'dc-meat', name:'番茄海鲜汤', ings:[ing('蛤蜊','100','克','水产'), ing('虾仁','80','克','水产'), ing('番茄','2','个','蔬菜'), ing('芹菜','1','根','蔬菜'), ing('洋葱','半个','个','蔬菜'), ing('橄榄油','5','毫升','米面粮油'), ing('盐','2','克','调料')] },
      { id:'np-d28', dishCat:'dc-snack', name:'核桃配梨', ings:[ing('核桃','15','克','坚果种子'), ing('梨','1','个','水果')] }
    ].map((r) => ({ ...r, catalogId: 'cat-recipe' }));
  }

  // 预置食材/条目库（含 FCS 营养评分备注、酒水零食条目）
  function sampleItems() {
    return [
      { id:'np-it-001', catalogId:'cat-staple', name:'西兰花', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-002', catalogId:'cat-staple', name:'胡萝卜', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-003', catalogId:'cat-staple', name:'芦笋', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-004', catalogId:'cat-staple', name:'菠菜', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-005', catalogId:'cat-staple', name:'番茄', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-006', catalogId:'cat-staple', name:'青椒', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-007', catalogId:'cat-staple', name:'蘑菇', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-008', catalogId:'cat-staple', name:'生菜', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-009', catalogId:'cat-staple', name:'黄瓜', price:0, priceUnit:'根', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-010', catalogId:'cat-staple', name:'彩椒', price:0, priceUnit:'个', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-011', catalogId:'cat-staple', name:'洋葱', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 82', cat:'蔬菜' },
      { id:'np-it-012', catalogId:'cat-staple', name:'蒜', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 82', cat:'蔬菜' },
      { id:'np-it-013', catalogId:'cat-staple', name:'白菜', price:0, priceUnit:'斤', piecesPerUnit:"", cat:'蔬菜' },
      { id:'np-it-014', catalogId:'cat-staple', name:'芹菜', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-015', catalogId:'cat-staple', name:'柠檬', price:0, priceUnit:'个', piecesPerUnit:"", cat:'蔬菜' },
      { id:'np-it-016', catalogId:'cat-staple', name:'鸡胸肉', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 62', cat:'肉禽蛋' },
      { id:'np-it-017', catalogId:'cat-staple', name:'鸡蛋', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 69', cat:'肉禽蛋' },
      { id:'np-it-018', catalogId:'cat-staple', name:'鸡肝', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 81', cat:'肉禽蛋' },
      { id:'np-it-019', catalogId:'cat-staple', name:'三文鱼', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'水产' },
      { id:'np-it-020', catalogId:'cat-staple', name:'鳕鱼', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 98', cat:'水产' },
      { id:'np-it-021', catalogId:'cat-staple', name:'金枪鱼', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'水产' },
      { id:'np-it-022', catalogId:'cat-staple', name:'虾仁', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'水产' },
      { id:'np-it-023', catalogId:'cat-staple', name:'沙丁鱼', price:0, priceUnit:'罐', piecesPerUnit:"", note:'FCS 95', cat:'水产' },
      { id:'np-it-024', catalogId:'cat-staple', name:'蛤蜊', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 87', cat:'水产' },
      { id:'np-it-025', catalogId:'cat-staple', name:'牡蛎', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'水产' },
      { id:'np-it-026', catalogId:'cat-staple', name:'黑豆', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 98', cat:'豆制品' },
      { id:'np-it-027', catalogId:'cat-staple', name:'鹰嘴豆', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 91', cat:'豆制品' },
      { id:'np-it-028', catalogId:'cat-staple', name:'鹰嘴豆泥', price:0, priceUnit:'盒', piecesPerUnit:"", note:'FCS 91', cat:'豆制品' },
      { id:'np-it-029', catalogId:'cat-staple', name:'豆腐', price:0, priceUnit:'块', piecesPerUnit:"", cat:'豆制品' },
      { id:'np-it-030', catalogId:'cat-staple', name:'扁豆', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 100', cat:'豆制品' },
      { id:'np-it-031', catalogId:'cat-staple', name:'毛豆', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'豆制品' },
      { id:'np-it-032', catalogId:'cat-staple', name:'大豆', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 100', cat:'豆制品' },
      { id:'np-it-033', catalogId:'cat-staple', name:'腰豆', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 96', cat:'豆制品' },
      { id:'np-it-034', catalogId:'cat-staple', name:'燕麦', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 81', cat:'米面粮油' },
      { id:'np-it-035', catalogId:'cat-staple', name:'藜麦', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 89', cat:'米面粮油' },
      { id:'np-it-036', catalogId:'cat-staple', name:'糙米', price:0, priceUnit:'袋', piecesPerUnit:"", cat:'米面粮油' },
      { id:'np-it-037', catalogId:'cat-staple', name:'荞麦面', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 77', cat:'米面粮油' },
      { id:'np-it-038', catalogId:'cat-staple', name:'全麦面包', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 75', cat:'米面粮油' },
      { id:'np-it-039', catalogId:'cat-staple', name:'全麦皮塔', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 75', cat:'米面粮油' },
      { id:'np-it-040', catalogId:'cat-staple', name:'全麦卷饼', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 75', cat:'米面粮油' },
      { id:'np-it-041', catalogId:'cat-staple', name:'橄榄油', price:0, priceUnit:'瓶', piecesPerUnit:"", note:'FCS 78', cat:'米面粮油' },
      { id:'np-it-042', catalogId:'cat-staple', name:'莎莎酱', price:0, priceUnit:'瓶', piecesPerUnit:"", note:'FCS 100', cat:'调料' },
      { id:'np-it-043', catalogId:'cat-staple', name:'盐', price:0, priceUnit:'袋', piecesPerUnit:"", cat:'调料' },
      { id:'np-it-044', catalogId:'cat-staple', name:'黑胡椒', price:0, priceUnit:'瓶', piecesPerUnit:"", cat:'调料' },
      { id:'np-it-045', catalogId:'cat-staple', name:'生抽', price:0, priceUnit:'瓶', piecesPerUnit:"", cat:'调料' },
      { id:'np-it-046', catalogId:'cat-staple', name:'番茄泥', price:0, priceUnit:'罐', piecesPerUnit:"", note:'FCS 100', cat:'调料' },
      { id:'np-it-047', catalogId:'cat-staple', name:'蓝莓', price:0, priceUnit:'盒', piecesPerUnit:"", note:'FCS 96', cat:'水果' },
      { id:'np-it-048', catalogId:'cat-staple', name:'橙子', price:0, priceUnit:'个', piecesPerUnit:"", note:'FCS 100', cat:'水果' },
      { id:'np-it-049', catalogId:'cat-staple', name:'草莓', price:0, priceUnit:'盒', piecesPerUnit:"", note:'FCS 100', cat:'水果' },
      { id:'np-it-050', catalogId:'cat-staple', name:'猕猴桃', price:0, priceUnit:'个', piecesPerUnit:"", note:'FCS 100', cat:'水果' },
      { id:'np-it-051', catalogId:'cat-staple', name:'香蕉', price:0, priceUnit:'把', piecesPerUnit:"", note:'FCS 83', cat:'水果' },
      { id:'np-it-052', catalogId:'cat-staple', name:'桃', price:0, priceUnit:'个', piecesPerUnit:"", note:'FCS 97', cat:'水果' },
      { id:'np-it-053', catalogId:'cat-staple', name:'西瓜', price:0, priceUnit:'个', piecesPerUnit:"", note:'FCS 98', cat:'水果' },
      { id:'np-it-054', catalogId:'cat-staple', name:'苹果', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 95', cat:'水果' },
      { id:'np-it-055', catalogId:'cat-staple', name:'梨', price:0, priceUnit:'个', piecesPerUnit:"", note:'FCS 89', cat:'水果' },
      { id:'np-it-056', catalogId:'cat-staple', name:'牛油果', price:0, priceUnit:'个', piecesPerUnit:"", note:'FCS 96', cat:'水果' },
      { id:'np-it-057', catalogId:'cat-staple', name:'杏仁', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 100', cat:'坚果种子' },
      { id:'np-it-058', catalogId:'cat-staple', name:'核桃', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 92', cat:'坚果种子' },
      { id:'np-it-059', catalogId:'cat-staple', name:'奇亚籽', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 100', cat:'坚果种子' },
      { id:'np-it-060', catalogId:'cat-staple', name:'亚麻籽', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 100', cat:'坚果种子' },
      { id:'np-it-061', catalogId:'cat-staple', name:'南瓜籽', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 100', cat:'坚果种子' },
      { id:'np-it-062', catalogId:'cat-staple', name:'葵花籽', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 100', cat:'坚果种子' },
      { id:'np-it-063', catalogId:'cat-staple', name:'希腊酸奶', price:0, priceUnit:'盒', piecesPerUnit:"", note:'FCS 86', cat:'乳制品' },
      { id:'np-it-064', catalogId:'cat-staple', name:'脱脂牛奶', price:0, priceUnit:'瓶', piecesPerUnit:"", note:'FCS 66', cat:'乳制品' },
      { id:'np-it-065', catalogId:'cat-staple', name:'马苏里拉奶酪', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 48', cat:'乳制品' },
      { id:'np-it-066', catalogId:'cat-staple', name:'切达奶酪', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 44', cat:'乳制品' },
      { id:'np-it-067', catalogId:'cat-staple', name:'羽衣甘蓝', price:0, priceUnit:'把', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-068', catalogId:'cat-staple', name:'芥蓝', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-069', catalogId:'cat-staple', name:'青豆', price:0, priceUnit:'斤', piecesPerUnit:"", note:'FCS 100', cat:'蔬菜' },
      { id:'np-it-070', catalogId:'cat-snack', name:'空气爆米花', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 82', cat:'' },
      { id:'np-it-071', catalogId:'cat-snack', name:'无盐米饼', price:0, priceUnit:'包', piecesPerUnit:"", note:'FCS 80', cat:'' },
      { id:'np-it-072', catalogId:'cat-snack', name:'豆制脆片', price:0, priceUnit:'袋', piecesPerUnit:"", note:'FCS 72', cat:'' },
      { id:'np-it-073', catalogId:'cat-drink', name:'咖啡替代饮品', price:0, priceUnit:'罐', piecesPerUnit:"", note:'FCS 90', cat:'' },
      { id:'np-it-074', catalogId:'cat-drink', name:'番茄汁', price:0, priceUnit:'瓶', piecesPerUnit:"", note:'FCS 89', cat:'' },
      { id:'np-it-075', catalogId:'cat-drink', name:'橙汁', price:0, priceUnit:'瓶', piecesPerUnit:"", note:'FCS 77', cat:'' },
      { id:'np-it-076', catalogId:'cat-drink', name:'混合蔬菜汁', price:0, priceUnit:'瓶', piecesPerUnit:"", note:'FCS 95', cat:'' },
      { id:'np-it-077', catalogId:'cat-drink', name:'芹菜汁', price:0, priceUnit:'瓶', piecesPerUnit:"", note:'FCS 100', cat:'' },
      { id:'np-it-078', catalogId:'cat-drink', name:'蔬果昔', price:0, priceUnit:'瓶', piecesPerUnit:"", note:'FCS 97', cat:'' },
      { id:'sp-it-01', catalogId:'cat-staple', name:'小葱', price:0, priceUnit:'把', piecesPerUnit:"", cat:'蔬菜' },
      { id:'sp-it-02', catalogId:'cat-staple', name:'白砂糖', price:0, priceUnit:'袋', piecesPerUnit:"", cat:'调料' },
      { id:'sp-it-03', catalogId:'cat-staple', name:'食用油', price:0, priceUnit:'瓶', piecesPerUnit:"", cat:'米面粮油' },
      { id:'sp-it-04', catalogId:'cat-staple', name:'可乐', price:0, priceUnit:'听', piecesPerUnit:"", cat:'其他' },
      { id:'sp-it-05', catalogId:'cat-staple', name:'姜', price:0, priceUnit:'斤', piecesPerUnit:"", cat:'蔬菜' },
      { id:'sp-it-06', catalogId:'cat-staple', name:'八角', price:0, priceUnit:'袋', piecesPerUnit:"", cat:'调料' },
      { id:'sp-it-07', catalogId:'cat-staple', name:'冰糖', price:0, priceUnit:'袋', piecesPerUnit:"", cat:'调料' },
      { id:'sp-it-08', catalogId:'cat-staple', name:'老抽', price:0, priceUnit:'瓶', piecesPerUnit:"", cat:'调料' },
      { id:'sp-it-09', catalogId:'cat-staple', name:'料酒', price:0, priceUnit:'瓶', piecesPerUnit:"", cat:'调料' },
      { id:'sp-it-10', catalogId:'cat-staple', name:'香醋', price:0, priceUnit:'瓶', piecesPerUnit:"", cat:'调料' },
      { id:'sp-it-11', catalogId:'cat-staple', name:'花椒', price:0, priceUnit:'袋', piecesPerUnit:"", cat:'调料' },
      { id:'sp-it-12', catalogId:'cat-staple', name:'干辣椒', price:0, priceUnit:'袋', piecesPerUnit:"", cat:'蔬菜' },
      { id:'sp-it-13', catalogId:'cat-staple', name:'挂面', price:0, priceUnit:'袋', piecesPerUnit:"", cat:'米面粮油' },
      { id:'sp-it-14', catalogId:'cat-staple', name:'土豆', price:0, priceUnit:'斤', piecesPerUnit:"", cat:'蔬菜' },
      { id:'sp-it-15', catalogId:'cat-staple', name:'蚝油', price:0, priceUnit:'瓶', piecesPerUnit:"", cat:'调料' },
      { id:'sp-it-16', catalogId:'cat-staple', name:'嫩豆腐', price:0, priceUnit:'块', piecesPerUnit:"", cat:'豆制品' },
      { id:'sp-it-17', catalogId:'cat-staple', name:'牛肉末', price:0, priceUnit:'盒', piecesPerUnit:"", cat:'肉禽蛋' },
      { id:'sp-it-18', catalogId:'cat-staple', name:'猪里脊', price:0, priceUnit:'斤', piecesPerUnit:"", cat:'肉禽蛋' },
      { id:'sp-it-19', catalogId:'cat-staple', name:'鸡翅中', price:0, priceUnit:'斤', piecesPerUnit:"", cat:'肉禽蛋' },
      { id:'sp-it-20', catalogId:'cat-staple', name:'猪排骨', price:0, priceUnit:'斤', piecesPerUnit:"", cat:'肉禽蛋' },
      { id:'sp-it-21', catalogId:'cat-staple', name:'淀粉', price:0, priceUnit:'袋', piecesPerUnit:"", cat:'调料' },
      { id:'sp-it-22', catalogId:'cat-staple', name:'豆瓣酱', price:0, priceUnit:'袋', piecesPerUnit:"", cat:'调料' },
      { id:'sp-it-23', catalogId:'cat-staple', name:'花椒粉', price:0, priceUnit:'袋', piecesPerUnit:"", cat:'调料' },
      { id:'sp-it-24', catalogId:'cat-staple', name:'黄油', price:0, priceUnit:'块', piecesPerUnit:"", cat:'米面粮油' }
    ].map((i) => ({ ...i }));
  }

  // 预置一周饮食规划（key = 周几-餐次，0 为周一）
  const SAMPLE_MEAL_PLAN = {
    '0-breakfast': ['np-d01'], '0-lunch': ['np-d02'], '0-dinner': ['np-d03'], '0-snack': ['np-d04'],
    '1-breakfast': ['np-d05'], '1-lunch': ['np-d06'], '1-dinner': ['np-d07'], '1-snack': ['np-d08'],
    '2-breakfast': ['np-d09'], '2-lunch': ['np-d10'], '2-dinner': ['np-d11'], '2-snack': ['np-d12'],
    '3-breakfast': ['np-d13'], '3-lunch': ['np-d14'], '3-dinner': ['np-d15'], '3-snack': ['np-d16'],
    '4-breakfast': ['np-d17'], '4-lunch': ['np-d18'], '4-dinner': ['np-d19'], '4-snack': ['np-d20'],
    '5-breakfast': ['np-d21'], '5-lunch': ['np-d22'], '5-dinner': ['np-d23'], '5-snack': ['np-d24'],
    '6-breakfast': ['np-d25'], '6-lunch': ['np-d26'], '6-dinner': ['np-d27'], '6-snack': ['np-d28']
  };

  /* ---------------- 状态与持久化 ---------------- */
  const STORAGE_KEY = 'maicai.shop.v1';
  const SYSTEM_CATALOGS = [
    { id: 'cat-recipe', name: '菜品', type: 'recipe', system: true, color: '#E0533D' },
    { id: 'cat-staple', name: '食材', type: 'item',   system: true, color: '#5F8D4E' },
    { id: 'cat-drink',  name: '酒水', type: 'item',   system: true, color: '#4E7FA8' },
    { id: 'cat-snack',  name: '零食', type: 'item',   system: true, color: '#D9A441' }
  ];
  // 菜品库子分类（仅 recipe 型 catalog 下展示），默认四项，用户可改名/新增/删除/排序
  const DEFAULT_DISH_CATS = [
    { id: 'dc-staple', name: '主食', color: '#D9A441', system: true },
    { id: 'dc-cold',   name: '凉菜', color: '#5F8D4E', system: true },
    { id: 'dc-veg',    name: '素菜', color: '#4E7FA8', system: true },
    { id: 'dc-meat',   name: '肉菜', color: '#E0533D', system: true },
    { id: 'dc-breakfast', name: '早餐', color: '#6FA8A0', system: false },
    { id: 'dc-snack',  name: '加餐', color: '#9E7CC3', system: false }
  ];
  // 按菜名启发式归类（用于迁移无 dishCat 的已有菜品）
  function guessDishCat(name) {
    const n = (name || '').trim();
    if (/面|饭|饼|粥|粉|米/.test(n)) return 'dc-staple';
    if (/凉|拌|拍/.test(n)) return 'dc-cold';
    if (/肉|鸡|鱼|排|骨|虾|牛|猪|羊|鸭|鹅/.test(n)) return 'dc-meat';
    return 'dc-veg';
  }
  const ITEM_PRICE_UNITS = ['斤', '个', '瓶', '包', '盒', '袋', '听', '罐', '份', '克', '毫升', '把', '根', '块'];
  const COUNT_UNITS = ['个', '根', '颗', '瓣', '片', '块', '只', '条', '把'];
  const state = { catalogs: SYSTEM_CATALOGS.map(c => ({ ...c })), dishCats: DEFAULT_DISH_CATS.map(c => ({ ...c })), recipes: [], items: [], sel: {}, checked: {}, itemSel: {}, mealPlan: {}, pyramidLayers: defaultPyramidLayers() };

  // 金字塔层级为食材细分品类的唯一顺序来源；颜色找不到时回退到内置色板
  // 每层为一格 {name,color}，也可拆成左右两格 {name,color,split:true,right:{name,color}}
  function pyLayers() {
    if (!Array.isArray(state.pyramidLayers) || state.pyramidLayers.length === 0) {
      state.pyramidLayers = defaultPyramidLayers();
    }
    return state.pyramidLayers;
  }
  // 判断一层是否为有效的左右双格
  function layerSplit(l) {
    return !!(l && l.split && l.right && typeof l.right === 'object' && String(l.right.name || '').trim());
  }
  // 取某层某一格的颜色（l：左格层对象，side：'l' / 'r'）
  function cellColor(l, side) {
    const c = side === 'r' && layerSplit(l) ? l.right : l;
    if (c && c.color) return c.color;
    const f = CATEGORIES.find((x) => x.name === (c && c.name));
    return f ? f.color : '#8F867A';
  }
  // 展平所有格子（自上而下、先左后右）：{name,color,row,side}
  function pyCats() {
    const out = [];
    pyLayers().forEach((l, ri) => {
      out.push({ name: l.name, color: cellColor(l, 'l'), row: ri, side: 'l' });
      if (layerSplit(l)) out.push({ name: String(l.right.name).trim(), color: cellColor(l, 'r'), row: ri, side: 'r' });
    });
    return out;
  }
  function pyNames() { return pyCats().map((c) => c.name); }
  function pyColor(name) {
    const f = pyCats().find((x) => x.name === name);
    if (f) return f.color;
    const c = CATEGORIES.find((x) => x.name === name);
    return c ? c.color : '#8F867A';
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        v: 2, catalogs: state.catalogs, dishCats: state.dishCats, recipes: state.recipes, items: state.items,
        sel: state.sel, checked: state.checked, itemSel: state.itemSel, mealPlan: state.mealPlan,
        pyramidLayers: state.pyramidLayers
      }));
    } catch (e) { /* 隐私模式等场景静默失败 */ }
  }

  // 从一批 recipes 中提取去重食材，作为食材库条目
  function extractStaples(recipes) {
    const map = new Map();
    recipes.forEach((r) => (r.ings || []).forEach((i) => {
      const name = (i.name || '').trim();
      if (!name || map.has(name)) return;
      map.set(name, {
        id: uid('it'), catalogId: 'cat-staple',
        name, price: 0, priceUnit: i.unit || '个', note: '',
        cat: i.cat || guessCategory(name)
      });
    }));
    return [...map.values()];
  }

  // 读取存储中的金字塔层级：兼容字符串数组、缺字段、重名、左右双格等旧/脏数据
  function hydratePyramidLayers(data) {
    const fallbackColor = (name) => (CATEGORIES.find((c) => c.name === name) || { color: '#8F867A' }).color;
    if (data && Array.isArray(data.pyramidLayers)) {
      const seen = new Set();
      const layers = [];
      data.pyramidLayers.forEach((l) => {
        const n = String((l && typeof l === 'object' ? l.name : l) || '').trim();
        if (!n || seen.has(n)) return;
        seen.add(n);
        const row = { name: n, color: (l && l.color) || fallbackColor(n) };
        // 左右双格：右格名称有效且不与已有格子重名时才采用，否则降级为单格
        if (l && typeof l === 'object' && l.split && l.right && typeof l.right === 'object') {
          const rn = String(l.right.name || '').trim();
          if (rn && !seen.has(rn)) {
            seen.add(rn);
            row.split = true;
            row.right = { name: rn, color: l.right.color || fallbackColor(rn) };
          }
        }
        layers.push(row);
      });
      if (layers.length) { state.pyramidLayers = layers; return; }
    }
    state.pyramidLayers = defaultPyramidLayers();
  }

  // 读取菜品子分类：兼容旧备份无该字段、脏数据、缺色回退
  function hydrateDishCats(data) {
    const fallbackColor = (name) => {
      const f = DEFAULT_DISH_CATS.find((c) => c.name === name);
      return f ? f.color : '#8F867A';
    };
    if (data && Array.isArray(data.dishCats) && data.dishCats.length) {
      const seen = new Set();
      const cats = [];
      data.dishCats.forEach((c) => {
        const n = String((c && c.name) || '').trim();
        if (!n || seen.has(n)) return;
        seen.add(n);
        cats.push({ id: (c && c.id) || 'dc-' + Date.now().toString(36) + cats.length, name: n, color: (c && c.color) || fallbackColor(n), system: !!(c && c.system) });
      });
      if (cats.length) { state.dishCats = cats; return; }
    }
    state.dishCats = DEFAULT_DISH_CATS.map(c => ({ ...c }));
  }

  // 迁移已有菜品：无 dishCat 或指向已删分类 → 启发式归类
  function migrateRecipeDishCats() {
    const validIds = new Set(state.dishCats.map((c) => c.id));
    const fallback = state.dishCats[0] ? state.dishCats[0].id : 'dc-veg';
    state.recipes.forEach((r) => {
      if (!r.dishCat || !validIds.has(r.dishCat)) {
        r.dishCat = validIds.has('dc-veg') ? guessDishCat(r.name) : fallback;
      }
    });
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        // 迁移 v1 → v2
        if (data.v !== 2) {
          migrateV1(data);
          return;
        }
        if (Array.isArray(data.recipes)) {
          state.catalogs = Array.isArray(data.catalogs) && data.catalogs.length
            ? data.catalogs : SYSTEM_CATALOGS.map(c => ({ ...c }));
          state.recipes = data.recipes;
          state.items = Array.isArray(data.items) ? data.items : [];
          state.sel = data.sel || {};
          state.checked = data.checked || {};
          state.itemSel = data.itemSel || {};
          state.mealPlan = data.mealPlan || {};
          hydratePyramidLayers(data);
          hydrateDishCats(data);
          migrateRecipeDishCats();
          return;
        }
      }
    } catch (e) { /* 损坏则重建 */ }
    state.recipes = sampleRecipes();
    state.items = sampleItems();
    state.mealPlan = JSON.parse(JSON.stringify(SAMPLE_MEAL_PLAN));
    save();
  }

  // v1 数据迁移：补 catalogId、生成食材库
  function migrateV1(data) {
    const recipes = Array.isArray(data.recipes) ? data.recipes : [];
    recipes.forEach((r) => { if (!r.catalogId) r.catalogId = 'cat-recipe'; });
    state.catalogs = SYSTEM_CATALOGS.map(c => ({ ...c }));
    state.dishCats = DEFAULT_DISH_CATS.map(c => ({ ...c }));
    state.recipes = recipes;
    migrateRecipeDishCats();
    state.items = Array.isArray(data.items) ? data.items : extractStaples(recipes);
    state.sel = data.sel || {};
    state.checked = data.checked || {};
    state.itemSel = data.itemSel || {};
    state.mealPlan = data.mealPlan || {};
    save();
  }

  /* ---------------- 工具 ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const fmtNum = (n) => {
    const v = Math.round(n * 100) / 100;
    return String(v);
  };
  const ingKey = (cat, name, unit) => cat + '|' + name.trim() + '|' + unit;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  let toastTimer = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => { el.hidden = true; }, 220);
    }, 1900);
  }

  /* ---------------- 购物清单聚合 ---------------- */
  function aggregate() {
    const groups = new Map(); // cat -> Map(key -> item)
    let totalServings = 0;
    const chosenNames = [];

    Object.keys(state.sel).forEach((rid) => {
      const r = state.recipes.find((x) => x.id === rid);
      if (!r) return;
      const mult = state.sel[rid];
      totalServings += mult;
      chosenNames.push({ name: r.name, mult });

      (r.ings || []).forEach((raw) => {
        const name = (raw.name || '').trim();
        if (!name) return;
        const cat = raw.cat || guessCategory(name);
        const unit = raw.unit || '';
        if (!groups.has(cat)) groups.set(cat, new Map());
        const map = groups.get(cat);
        const key = ingKey(cat, name, unit);
        if (!map.has(key)) {
          map.set(key, { name, unit, num: 0, free: '', sources: [] });
        }
        const item = map.get(key);
        const n = parseFloat(raw.qty);
        if (!isNaN(n) && isFinite(n)) {
          item.num += n * mult;
        } else {
          const t = (raw.qty || '').trim();
          if (t && !item.free) item.free = t;
        }
        const label = mult === 1 ? r.name : r.name + ' ×' + fmtNum(mult);
        if (!item.sources.includes(label)) item.sources.push(label);
      });
    });

    const result = [];
    // 按金字塔格子顺序成组（双格层先左后右），层级之外残留的品类追加在后面
    const orderedNames = pyNames();
    orderedNames.forEach((name) => {
      if (!groups.has(name)) return;
      const items = [...groups.get(name).values()].sort((a, b) => a.name.localeCompare(b.name, 'zh'));
      result.push({ cat: name, color: pyColor(name), items });
    });
    CATEGORIES.forEach((c) => {
      if (orderedNames.includes(c.name) || !groups.has(c.name)) return;
      const items = [...groups.get(c.name).values()].sort((a, b) => a.name.localeCompare(b.name, 'zh'));
      result.push({ cat: c.name, color: c.color, items });
    });
    groups.forEach((map, name) => {
      if (orderedNames.includes(name) || CATEGORIES.some((c) => c.name === name)) return;
      const items = [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh'));
      result.push({ cat: name, color: pyColor(name), items });
    });

    // item 型条目（酒水/零食/自定义 item 分类）按 catalog 分组
    const itemMap = new Map(); // catalogId -> [{ item, qty, subtotal, key }]
    Object.keys(state.itemSel).forEach((itemId) => {
      const it = state.items.find((x) => x.id === itemId);
      if (!it) return;
      const qty = state.itemSel[itemId] || 0;
      if (qty <= 0) return;
      const key = 'item|' + it.catalogId + '|' + it.id;
      if (!itemMap.has(it.catalogId)) itemMap.set(it.catalogId, []);
      itemMap.get(it.catalogId).push({
        item: it, qty, subtotal: (it.price || 0) * qty, key
      });
    });
    const itemGroups = [];
    state.catalogs.forEach((c) => {
      if (c.type !== 'item' || !itemMap.has(c.id)) return;
      itemGroups.push({
        cat: c.name, color: c.color || '#8F867A', catalogId: c.id,
        items: itemMap.get(c.id).sort((a, b) => a.item.name.localeCompare(b.item.name, 'zh'))
      });
    });

    // 食材价格参考 + 总价
    // 换算规则：食材库单价单位与用量单位一致时直接相乘；
    // 食材库按「斤」计价且填了「1斤约N个」时，可估算按个/根/颗等计数的食材；
    // 食材库按「斤」计价、用量为克时按 1斤=500克 换算。
    let foodAmount = 0;
    let foodPriced = 0;
    result.forEach((g) => g.items.forEach((it) => {
      const staple = it.stapleId ? state.items.find((s) => s.id === it.stapleId)
        : state.items.find((s) => s.catalogId === 'cat-staple' && s.name === it.name);
      it.price = 0;
      it.subtotal = 0;
      it.priceHint = '';
      it.priceNote = '';
      if (!staple || !(staple.price > 0) || !(it.num > 0)) return;
      if (staple.priceUnit === it.unit) {
        it.price = staple.price;
        it.subtotal = staple.price * it.num;
        it.priceHint = fmtNum(staple.price) + '元/' + staple.priceUnit;
        it.priceNote = '';
      } else if (staple.priceUnit === '斤' && Number(staple.piecesPerUnit) > 0 && COUNT_UNITS.includes(it.unit)) {
        const perPiece = staple.price / Number(staple.piecesPerUnit);
        it.price = perPiece;
        it.subtotal = perPiece * it.num;
        it.priceHint = '约' + fmtNum(perPiece) + '元/' + it.unit;
        it.priceNote = '按' + fmtNum(staple.price) + '元/斤、1斤约' + fmtNum(Number(staple.piecesPerUnit)) + '个折算';
      } else if (staple.priceUnit === '斤' && it.unit === '克') {
        const perGram = staple.price / 500;
        it.price = perGram;
        it.subtotal = perGram * it.num;
        it.priceHint = fmtNum(staple.price) + '元/斤';
        it.priceNote = '按1斤=500克折算';
      } else {
        return;
      }
      foodAmount += it.subtotal;
      foodPriced++;
    }));
    const itemAmount = itemGroups.reduce((s, g) => s + g.items.reduce((x, r) => x + r.subtotal, 0), 0);

    return {
      groups: result, totalServings, chosenNames,
      itemGroups, foodAmount, itemAmount, totalAmount: foodAmount + itemAmount, foodPriced
    };
  }

  /* ---------------- 视图：购物清单 ---------------- */
  const listView = $('#view-list');

  function qtyText(item) {
    if (item.num > 0) {
      let s = fmtNum(item.num);
      if (item.unit && item.unit !== '适量') s += ' ' + item.unit;
      if (item.free) s += '（另需 ' + item.free + '）';
      return s;
    }
    return item.free || item.unit || '适量';
  }

  function renderList() {
    const data = aggregate();
    const flat = data.groups.flatMap((g) => g.items.map((it) => ingKey(g.cat, it.name, it.unit)))
      .concat(data.itemGroups.flatMap((g) => g.items.map((r) => r.key)));
    const checkedCount = flat.filter((k) => state.checked[k]).length;
    const total = flat.length;

    if (total === 0) {
      listView.innerHTML = `
        <div class="empty">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 11h.01"/><path d="M11 15h.01"/><path d="M16 16h.01"/><path d="m2 16 2-6a1 1 0 0 1 1-.7h11.4a2 2 0 0 1 2 1.6L20 17H3.1A1.6 1.6 0 0 1 2 16Z"/><path d="M6 9.3 5 6H3"/><path d="M9 20a1.5 1.5 0 1 0 0-.01"/><path d="M18 20a1.5 1.5 0 1 0 0-.01"/></svg>
          </div>
          <h3>购物车还是空的</h3>
          <p>去「选菜」挑几道今天想做的菜，食材会自动汇总到这里</p>
          <button class="btn btn-primary" type="button" data-go="pick">去选菜</button>
        </div>`;
      return;
    }

    const pct = total ? Math.round((checkedCount / total) * 100) : 0;
    const dishSummary = data.chosenNames
      .slice(0, 3).map((d) => d.mult === 1 ? d.name : d.name + '×' + fmtNum(d.mult)).join('、') +
      (data.chosenNames.length > 3 ? ' 等' : '');

    const groupsHTML = data.groups.map((g) => `
      <div class="group">
        <div class="group-head">
          <span class="dot" style="background:${g.color}"></span>
          ${esc(g.cat)}<span class="g-count">${g.items.length}</span>
        </div>
        <div class="group-list">
          ${g.items.map((it) => {
            const key = ingKey(g.cat, it.name, it.unit);
            const on = !!state.checked[key];
            const priceTag = it.subtotal > 0
              ? `<span class="si-subtotal" ${it.priceNote ? 'title="' + esc(it.priceNote) + '"' : ''}>¥${fmtNum(it.subtotal)}</span>`
              : '';
            return `
            <button class="shop-item ${on ? 'is-checked' : ''}" type="button" data-key="${esc(key)}">
              <span class="check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
              <span class="si-main">
                <span class="si-name">${esc(it.name)}</span>
                <span class="si-from">来自：${esc(it.sources.join('、'))}</span>
              </span>
              <span class="si-qty">${esc(qtyText(it))}${priceTag}</span>
            </button>`;
          }).join('')}
        </div>
      </div>`).join('');

    const itemGroupsHTML = data.itemGroups.map((g) => `
      <div class="group">
        <div class="group-head">
          <span class="dot" style="background:${g.color}"></span>
          ${esc(g.cat)}<span class="g-count">${g.items.length}</span>
        </div>
        <div class="group-list">
          ${g.items.map((r) => {
            const on = !!state.checked[r.key];
            const it = r.item;
            return `
            <button class="shop-item ${on ? 'is-checked' : ''}" type="button" data-key="${esc(r.key)}">
              <span class="check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
              <span class="si-main">
                <span class="si-name">${esc(it.name)}</span>
                <span class="si-from">¥${fmtNum(it.price || 0)}/${esc(it.priceUnit || '个')} × ${fmtNum(r.qty)}</span>
              </span>
              <span class="si-qty">${esc(it.priceUnit || '')}${r.subtotal > 0 ? '<span class="si-subtotal">¥' + fmtNum(r.subtotal) + '</span>' : ''}</span>
            </button>`;
          }).join('')}
        </div>
      </div>`).join('');

    // 只要清单里有条目就展示预估总计与完成购物按钮；价格为 0 时显示 ¥0（明细提示仅在有价格时展示）
    const totalHTML = total > 0
      ? `<div class="total-bar"><span>预估总计</span><b>¥${fmtNum(data.totalAmount)}</b><button class="btn-done-shopping" type="button" id="btnDoneShopping"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>完成购物</button>${data.totalAmount > 0 ? `<span class="total-hint">食材${fmtNum(data.foodAmount)} + 其他${fmtNum(data.itemAmount)}</span>` : ''}</div>`
      : '';

    listView.innerHTML = `
      <div class="card summary-card">
        <div class="summary-top">
          <div>
            <h2>今日购物清单</h2>
            <div class="summary-sub">${esc(dishSummary)} · 共 ${fmtNum(data.totalServings)} 份</div>
          </div>
          <div class="summary-count">
            <b>${checkedCount}/${total}</b>
            <span>已买 / 样数</span>
          </div>
        </div>
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="summary-actions">
          <button class="btn btn-primary" type="button" id="btnCopy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            复制清单
          </button>
          <button class="btn btn-ghost" type="button" id="btnUncheck" ${checkedCount === 0 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            重置勾选
          </button>
        </div>
      </div>
      ${groupsHTML}${itemGroupsHTML}${totalHTML}`;

    $('#btnCopy', listView).addEventListener('click', copyList);
    $('#btnUncheck', listView).addEventListener('click', () => {
      state.checked = {};
      save(); renderList(); refreshBadge();
      toast('已重置勾选状态');
    });
    const btnDone = $('#btnDoneShopping', listView);
    if (btnDone) btnDone.addEventListener('click', () => {
      if (!confirm('完成购物将清空所有已选的菜品和条目，确定吗？')) return;
      state.sel = {};
      state.itemSel = {};
      state.checked = {};
      save(); renderList(); refreshBadge();
      toast('已完成购物，清单已清空');
    });
  }

  listView.addEventListener('click', (e) => {
    const goBtn = e.target.closest('[data-go]');
    if (goBtn) { switchView(goBtn.dataset.go); return; }
    const row = e.target.closest('.shop-item');
    if (!row || !row.dataset.key) return;
    const key = row.dataset.key;
    if (state.checked[key]) delete state.checked[key];
    else state.checked[key] = true;
    save(); renderList(); refreshBadge();
  });

  function buildCopyText() {
    const data = aggregate();
    const lines = ['购物清单（' + new Date().toLocaleDateString('zh-CN') + '）', ''];
    let hasAny = false;
    data.groups.forEach((g) => {
      const pending = g.items.filter((it) => !state.checked[ingKey(g.cat, it.name, it.unit)]);
      if (pending.length === 0) return;
      hasAny = true;
      lines.push('【' + g.cat + '】');
      pending.forEach((it) => lines.push('□ ' + it.name + '  ' + qtyText(it) + (it.subtotal > 0 ? '  约¥' + fmtNum(it.subtotal) : '')));
      lines.push('');
    });
    data.itemGroups.forEach((g) => {
      const pending = g.items.filter((r) => !state.checked[r.key]);
      if (pending.length === 0) return;
      hasAny = true;
      lines.push('【' + g.cat + '】');
      pending.forEach((r) => {
        const it = r.item;
        const unit = it.priceUnit ? ' ' + it.priceUnit : '';
        const pieces = it.piecesPerUnit ? '（1斤约' + it.piecesPerUnit + '个）' : '';
        lines.push('□ ' + it.name + '  ' + fmtNum(r.qty) + unit + pieces + (r.subtotal > 0 ? '  ¥' + fmtNum(r.subtotal) : ''));
      });
      lines.push('');
    });
    if (data.totalAmount > 0) lines.push('预估总计：¥' + fmtNum(data.totalAmount), '');
    if (!hasAny) lines.push('（都已买齐啦）', '');
    lines.push('—— 来自：买菜清单');
    return lines.join('\n');
  }

  function copyList() {
    const text = buildCopyText();
    const done = () => toast('清单已复制，去微信/备忘录粘贴吧');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
    function fallbackCopy() {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); }
      catch (_) { toast('复制失败，请长按选择文本'); }
      ta.remove();
    }
  }

  /* ---------------- 视图：选菜 ---------------- */
  const pickView = $('#view-pick');
  let pickKeyword = '';
  let pickDishCat = null; // 选菜页子分类筛选（null=未选不展示菜品；有搜索词时跳过分类筛选）

  pickView.innerHTML = `
    <div class="searchbar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="text" id="pickSearch" placeholder="搜索菜名或食材，如：番茄、鸡翅" autocomplete="off">
    </div>
    <div id="pickBanner"></div>
    <div class="dish-list" id="pickList"></div>`;

  $('#pickSearch', pickView).addEventListener('input', (e) => {
    pickKeyword = e.target.value.trim().toLowerCase();
    renderPickList();
  });

  function selectedCount() { return Object.keys(state.sel).length + Object.keys(state.itemSel).length; }
  function selectedServings() {
    return Object.values(state.sel).reduce((a, b) => a + b, 0);
  }

  function renderPickBanner() {
    const n = selectedCount();
    $('#pickBanner', pickView).innerHTML = n === 0 ? '' : `
      <div class="pick-banner">
        <span>已选 <b>${n}</b> 道菜 · 共 <b>${fmtNum(selectedServings())}</b> 份</span>
        <button class="btn btn-primary" type="button" id="bannerGoList">查看清单</button>
      </div>`;
    const b = $('#bannerGoList', pickView);
    if (b) b.addEventListener('click', () => switchView('list'));
  }

  function renderPickList() {
    const kw = pickKeyword;
    const validIds = new Set(state.dishCats.map((c) => c.id));
    if (pickDishCat && !validIds.has(pickDishCat)) pickDishCat = null;

    // 分类大色块选择区（搜索时隐藏，直接全局搜）
    const catGrid = kw ? '' : `<div class="dish-cat-grid">${state.dishCats.map((c) => {
      const color = c.color || '#8F867A';
      const n = state.recipes.reduce((acc, r) => acc + (r.dishCat === c.id ? 1 : 0), 0);
      return `<button class="dish-cat-tile ${c.id === pickDishCat ? 'is-active' : ''}" type="button" data-pickcat="${esc(c.id)}" style="--cat-color:${color};--cat-soft:${color}24">
        <span class="tile-name">${esc(c.name)}</span>
        <span class="tile-count">${n} 道</span>
      </button>`;
    }).join('')}</div>`;

    const slot = $('#pickList', pickView);

    // 未选分类 → 提示先选分类
    if (!kw && !pickDishCat) {
      slot.innerHTML = catGrid + `<div class="empty"><div class="empty-icon">${RECIPE_EMPTY_ICON}</div>
        <h3>请选择一个菜品分类</h3><p>点击上方分类方块，挑选该类下的菜品</p></div>`;
      return;
    }

    let list = state.recipes.slice();
    if (kw) {
      list = list.filter((r) =>
        r.name.toLowerCase().includes(kw) ||
        (r.ings || []).some((i) => i.name.toLowerCase().includes(kw))
      );
    } else {
      list = list.filter((r) => r.dishCat === pickDishCat);
    }
    // 已选的排前面
    list.sort((a, b) => {
      const sa = state.sel[a.id] ? 1 : 0, sb = state.sel[b.id] ? 1 : 0;
      if (sa !== sb) return sb - sa;
      return a.name.localeCompare(b.name, 'zh');
    });

    if (list.length === 0) {
      if (kw) {
        slot.innerHTML = `<div class="empty"><h3>没有找到相关菜品</h3><p>换个关键词试试，或去「菜品库」添加一道新菜</p>
          <button class="btn btn-ghost" type="button" data-go="recipes">去菜品库添加</button></div>`;
      } else {
        const dc = dishCatById(pickDishCat);
        slot.innerHTML = catGrid + `<div class="empty"><div class="empty-icon">${RECIPE_EMPTY_ICON}</div>
          <h3>${esc(dc ? dc.name : '该分类')}还是空的</h3><p>去菜品库添加一道菜，再回来挑选</p>
          <button class="btn btn-ghost" type="button" data-go="recipes">去菜品库添加</button></div>`;
      }
      return;
    }

    slot.innerHTML = catGrid + list.map((r) => {
      const mult = state.sel[r.id];
      const on = !!mult;
      const tags = (r.ings || []).map((i) => esc(i.name)).join(' · ');
      return `
      <div class="dish-card ${on ? 'is-selected' : ''}" role="button" tabindex="0" data-rid="${esc(r.id)}">
        <span class="dish-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <span class="dish-main">
          <span class="dish-name">${esc(r.name)}</span>
          <span class="dish-tags">${tags}</span>
        </span>
        <span class="dish-hint">点击选择</span>
        <span class="stepper" role="group" aria-label="份数">
          <button type="button" data-step="minus" aria-label="减少份数">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 12h14"/></svg>
          </button>
          <span class="step-val">${on ? fmtNum(mult) : '1'}<small> 份</small></span>
          <button type="button" data-step="plus" aria-label="增加份数">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </span>
      </div>`;
    }).join('');
  }

  pickView.addEventListener('click', (e) => {
    const goBtn = e.target.closest('[data-go]');
    if (goBtn) { switchView(goBtn.dataset.go); return; }
    const catTile = e.target.closest('[data-pickcat]');
    if (catTile) {
      const id = catTile.dataset.pickcat;
      pickDishCat = pickDishCat === id ? null : id; // 再点已选色块 → 收起
      renderPickList(); return;
    }
    const card = e.target.closest('.dish-card');
    if (!card) return;
    const rid = card.dataset.rid;
    const stepBtn = e.target.closest('[data-step]');
    if (stepBtn) {
      e.stopPropagation();
      const cur = state.sel[rid] || 1;
      const next = stepBtn.dataset.step === 'plus' ? cur + 0.5 : cur - 0.5;
      if (next < 0.5) return;
      state.sel[rid] = Math.round(next * 10) / 10;
    } else {
      if (state.sel[rid]) delete state.sel[rid];
      else state.sel[rid] = 1;
    }
    save();
    renderPickList(); renderPickBanner(); refreshBadge();
  });

  // 键盘可达性：卡片聚焦时 Enter / Space 等效点击
  pickView.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('dish-card')) {
      e.preventDefault();
      e.target.click();
    }
  });

  /* ---------------- 视图：周规划 ---------------- */
  const planView = $('#view-plan');
  const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const MEALS = [
    { key: 'breakfast', name: '早餐', color: '#D9A441', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>' },
    { key: 'lunch', name: '午餐', color: '#E0533D', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' },
    { key: 'dinner', name: '晚餐', color: '#4E7FA8', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>' },
    { key: 'snack', name: '加餐', color: '#8E7CC3', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M5 11v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6M9 8h6"/></svg>' }
  ];

  function getWeekDates() {
    const now = new Date();
    const day = now.getDay() === 0 ? 7 : now.getDay(); // 周日=7
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0); // 归零到零点，否则带时刻的日期永远无法与 today 匹配（今天高亮/自动展开失效）
    monday.setDate(now.getDate() - day + 1);
    return DAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }

  function planKey(dayIdx, mealKey) { return dayIdx + '-' + mealKey; }

  // 兼容旧格式（单个 id 字符串）和新格式（id 数组），统一返回数组
  function getPlanDishes(key) {
    const v = state.mealPlan[key];
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }

  function planDishCount() {
    return Object.values(state.mealPlan).reduce((sum, v) => {
      if (!v) return sum;
      return sum + (Array.isArray(v) ? v.length : 1);
    }, 0);
  }

  // 规划条目：菜品用原 id 直接添加；库内单条目加 item: 前缀并带数量（item:ID@数量）
  const ITEM_PLAN_PREFIX = 'item:';

  function planEntryInfo(id) {
    if (typeof id === 'string' && id.startsWith(ITEM_PLAN_PREFIX)) {
      const rest = id.slice(ITEM_PLAN_PREFIX.length);
      const at = rest.indexOf('@');
      const realId = at >= 0 ? rest.slice(0, at) : rest;
      const qty = at >= 0 ? parseFloat(rest.slice(at + 1)) : 1;
      const it = state.items.find((x) => x.id === realId);
      if (!it || !isFinite(qty) || qty <= 0) return null;
      // 按斤计价且填了「1斤约N个」的条目（如水果）：规划中按「个」选，清单折算回斤
      const countable = (it.priceUnit || '') === '斤' && Number(it.piecesPerUnit) > 0;
      const unit = countable ? '个' : (it.priceUnit || '份');
      return {
        id: realId, name: it.name, qty, unit, isItem: true, countable,
        listQty: countable ? qty / Number(it.piecesPerUnit) : qty,
        label: it.name + ' ' + fmtNum(qty) + unit
      };
    }
    const r = state.recipes.find((x) => x.id === id);
    return r ? { id, name: r.name, isItem: false, label: r.name } : null;
  }

  function planEntryName(id) {
    const info = planEntryInfo(id);
    return info ? info.name : null;
  }

  // 规划页折叠状态：默认展开今天（跟随手机日期，跨天后重新定位到当天）
  let planOpenDay = null;
  let planOpenStamp = '';

  function renderPlan() {
    const dates = getWeekDates();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const stamp = today.toDateString();
    if (planOpenDay === null || planOpenStamp !== stamp) {
      const ti = dates.findIndex((d) => d.getTime() === today.getTime());
      planOpenDay = ti >= 0 ? ti : 0;
      planOpenStamp = stamp;
    }
    const totalDishes = planDishCount();
    const filledSlots = Object.keys(state.mealPlan).filter((k) => getPlanDishes(k).length > 0).length;

    const daysHTML = DAYS.map((dayName, di) => {
      const date = dates[di];
      const isToday = date.getTime() === today.getTime();
      const isOpen = di === planOpenDay;
      const dateStr = (date.getMonth() + 1) + '/' + date.getDate();
      const dayFilled = MEALS.reduce((n, m) => n + (getPlanDishes(planKey(di, m.key)).length > 0 ? 1 : 0), 0);

      const mealsHTML = MEALS.map((m) => {
        const key = planKey(di, m.key);
        const dishes = getPlanDishes(key)
          .map((id) => planEntryInfo(id))
          .filter(Boolean);
        const filled = dishes.length > 0;
        const dishHTML = filled
          ? dishes.map((d) => '<span class="dish-tag">' + esc(d.label) + '</span>').join('')
          : '点击选择';
        return `
        <button class="meal-slot ${filled ? 'is-filled' : ''}" type="button" data-plan-key="${esc(key)}" style="--meal-color:${m.color}">
          <span class="meal-label">${m.icon}${esc(m.name)}</span>
          <span class="meal-dish">${dishHTML}</span>
        </button>`;
      }).join('');

      return `
      <div class="plan-day ${isToday ? 'is-today' : ''} ${isOpen ? 'is-open' : ''}" data-day="${di}">
        <button class="plan-day-head" type="button" aria-expanded="${isOpen}">
          <span class="plan-day-name">${esc(dayName)}${isToday ? '<small>今天</small>' : ''}</span>
          <span class="plan-day-meta">
            ${dayFilled > 0 ? '<span class="plan-day-count">已排 ' + dayFilled + ' 餐</span>' : ''}
            <span class="plan-day-date">${dateStr}</span>
            <svg class="plan-day-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </span>
        </button>
        <div class="plan-day-body"><div class="plan-meals">${mealsHTML}</div></div>
      </div>`;
    }).join('');

    planView.innerHTML = `
      <div class="card plan-summary">
        <div class="plan-summary-top">
          <div>
            <h2>本周饮食规划</h2>
            <div class="plan-summary-sub">已安排 <b>${filledSlots}</b> / ${MEALS.length * 7} 餐 · 共 <b>${totalDishes}</b> 样</div>
          </div>
          <button class="btn btn-primary" type="button" id="planGenList" ${totalDishes === 0 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>
            生成购物清单
          </button>
        </div>
      </div>
      <div class="plan-week">${daysHTML}</div>
      <button class="btn btn-ghost btn-block" type="button" id="planClear" ${totalDishes === 0 ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
        清空本周规划
      </button>`;

    $('#planGenList', planView).addEventListener('click', generatePlanShoppingList);
    $('#planClear', planView).addEventListener('click', () => {
      if (confirm('确定清空本周所有饮食规划吗？')) {
        state.mealPlan = {};
        save(); renderPlan();
        toast('已清空本周规划');
      }
    });
  }

  planView.addEventListener('click', (e) => {
    const head = e.target.closest('.plan-day-head');
    if (head) {
      const di = Number(head.closest('.plan-day').dataset.day);
      planOpenDay = planOpenDay === di ? -1 : di; // 再点一次当天收起
      planView.querySelectorAll('.plan-day').forEach((el) => {
        el.classList.toggle('is-open', Number(el.dataset.day) === planOpenDay);
        const btn = el.querySelector('.plan-day-head');
        if (btn) btn.setAttribute('aria-expanded', el.classList.contains('is-open') ? 'true' : 'false');
      });
      return;
    }
    const slot = e.target.closest('.meal-slot');
    if (slot) {
      openMealPicker(slot.dataset.planKey);
    }
  });

  function openMealPicker(key) {
    const dayIdx = parseInt(key.split('-')[0], 10);
    const mealKey = key.split('-')[1];
    const meal = MEALS.find((m) => m.key === mealKey);
    const dayName = DAYS[dayIdx];

    const node = document.createElement('div');
    node.className = 'meal-picker';

    let pickKeyword = '';
    let pickEntryCat = null; // 二级条目分类（dishCat id 或 'cat:<catalogId>'）；null=一级分类选择界面

    function removeEntry(id) {
      const dishes = getPlanDishes(key);
      const idx = dishes.indexOf(id);
      if (idx >= 0) dishes.splice(idx, 1);
      if (dishes.length === 0) delete state.mealPlan[key];
      else state.mealPlan[key] = dishes;
      save();
    }

    function toggleEntry(id) {
      const dishes = getPlanDishes(key);
      const idx = dishes.indexOf(id);
      if (idx >= 0) dishes.splice(idx, 1);
      else dishes.push(id);
      if (dishes.length === 0) delete state.mealPlan[key];
      else state.mealPlan[key] = dishes;
      save();
    }

    // 按大分类取条目：recipe 分类出菜品，item 分类出库内单条目（带单价单位，添加时需选数量）
    function catalogEntries(catId) {
      const cat = state.catalogs.find((c) => c.id === catId);
      if (!cat) return [];
      if (cat.type === 'recipe') {
        return state.recipes.filter((r) => r.catalogId === catId)
          .map((r) => ({ id: r.id, name: r.name, isItem: false }));
      }
      return state.items.filter((it) => it.catalogId === catId)
        .map((it) => ({ id: ITEM_PLAN_PREFIX + it.id, name: it.name, isItem: true, item: it }));
    }

    // 该餐次中已选条目：菜品 id 集合 + 单条目 realId -> 数量
    function selectedMap() {
      const map = new Map();
      getPlanDishes(key).forEach((id) => {
        const info = planEntryInfo(id);
        if (info) map.set(info.id, info);
      });
      return map;
    }

    // ===== 两级分类选择：一级大色块（高频优先）→ 二级条目列表 =====
    function tileDefs() {
      const defs = state.dishCats.map((c) => ({ key: c.id, name: c.name, color: c.color || '#8F867A' }));
      state.catalogs.filter((c) => c.type !== 'recipe').forEach((c) =>
        defs.push({ key: 'cat:' + c.id, name: c.name, color: c.color || '#8F867A' }));
      return defs;
    }

    function tileEntries(def) {
      if (def.key.startsWith('cat:')) return catalogEntries(def.key.slice(4));
      return state.recipes.filter((r) => r.dishCat === def.key)
        .map((r) => ({ id: r.id, name: r.name, isItem: false }));
    }

    // 本周规划中各分类被排入次数（高频常用分类优先展示）
    function hotCounts() {
      const hot = {};
      Object.values(state.mealPlan || {}).forEach((arr) => (arr || []).forEach((id) => {
        if (typeof id !== 'string') return;
        if (id.startsWith(ITEM_PLAN_PREFIX)) {
          const realId = id.slice(ITEM_PLAN_PREFIX.length).split('@')[0];
          const it = state.items.find((x) => x.id === realId);
          if (it) { const k = 'cat:' + it.catalogId; hot[k] = (hot[k] || 0) + 1; }
        } else {
          const r = state.recipes.find((x) => x.id === id);
          if (r && r.dishCat) { hot[r.dishCat] = (hot[r.dishCat] || 0) + 1; }
        }
      }));
      return hot;
    }

    function renderChips() {
      const slot = $('#pickerChips', node);
      if (!slot) return;
      if (pickKeyword) { slot.innerHTML = ''; slot.hidden = true; return; }
      slot.hidden = false;
      if (!pickEntryCat) {
        // 一级：分类大色块，高频排前
        const hot = hotCounts();
        const defs = tileDefs().slice().sort((a, b) => (hot[b.key] || 0) - (hot[a.key] || 0));
        slot.innerHTML = `<div class="dish-cat-grid">` + defs.map((d) => {
          const n = tileEntries(d).length;
          const hotN = hot[d.key] || 0;
          const unit = d.key.startsWith('cat:') ? '样' : '道';
          return `<button class="dish-cat-tile ${hotN > 0 ? 'is-hot' : ''}" type="button" data-ptile="${esc(d.key)}" style="--cat-color:${d.color};--cat-soft:${d.color}24">
            ${hotN > 0 ? '<span class="tile-hot">本周 ' + hotN + ' 次</span>' : ''}
            <span class="tile-name">${esc(d.name)}</span>
            <span class="tile-count">${n > 0 ? n + ' ' + unit : '暂无'}</span>
          </button>`;
        }).join('') + `</div>`;
      } else {
        // 二级：返回一级分类
        slot.innerHTML = `<button class="picker-back" type="button" data-backcat>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          返回全部分类</button>`;
      }
    }

    function renderResults() {
      const slot = $('#pickerList', node);
      const kw = pickKeyword;
      const selMap = selectedMap();
      const listItem = (e) => {
        const sel = selMap.get(e.isItem ? e.item.id : e.id);
        const on = !!sel;
        let tail;
        if (on && e.isItem) {
          tail = '<span class="picker-qty">×' + fmtNum(sel.qty) + (sel.unit || '') + '</span>';
        } else if (on) {
          tail = '<span class="picker-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>';
        } else {
          tail = '<span class="picker-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>';
        }
        const unitHint = e.isItem && e.item.priceUnit ? '<span class="picker-unit">/' + esc(e.item.priceUnit) + '</span>' : '';
        return `
        <button class="picker-item ${on ? 'is-current' : ''}" type="button" data-eid="${esc(e.id)}">
          <span class="picker-thumb" style="background:${thumbColor(e.name)}">${esc(e.name.slice(0, 1))}</span>
          <span class="picker-name">${esc(e.name)}${unitHint}</span>
          ${tail}
        </button>`;
      };

      if (kw) {
        // 搜索：跨全部分类
        const all = tileDefs().flatMap((d) => tileEntries(d))
          .filter((e) => e.name.toLowerCase().includes(kw));
        if (all.length === 0) {
          slot.innerHTML = `<div class="empty" style="padding:26px 20px"><p style="color:var(--muted)">没有找到相关条目，换个关键词试试</p></div>`;
        } else {
          slot.innerHTML = all.map(listItem).join('');
        }
      } else if (!pickEntryCat) {
        // 一级：等待选择分类，不展示条目
        slot.innerHTML = `<div class="empty" style="padding:18px 20px 6px"><p style="color:var(--muted)">点击上方分类方块，查看该类下的菜品</p></div>`;
      } else {
        const def = tileDefs().find((d) => d.key === pickEntryCat);
        const list = def ? tileEntries(def) : [];
        if (list.length === 0) {
          slot.innerHTML = `<div class="empty" style="padding:26px 20px"><p style="color:var(--muted)">该分类下暂无条目</p></div>`;
        } else {
          slot.innerHTML = list.map(listItem).join('');
        }
      }
      // 更新已选计数
      const countEl = $('#pickerCount', node);
      if (countEl) {
        const n = selMap.size;
        countEl.textContent = n > 0 ? '已选 ' + n + ' 样' : '菜品直接添加，其他条目需选择数量';
      }
    }

    function renderPickerList() {
      renderChips();
      renderResults();
    }

    node.innerHTML = `
      <div class="picker-banner" style="border-left-color:${meal ? meal.color : 'var(--tomato)'}">
        <span class="picker-banner-label">${esc(dayName)} · ${esc(meal ? meal.name : '')}</span>
        <span class="picker-banner-current" id="pickerCount">菜品直接添加，其他条目需选择数量</span>
      </div>
      <div id="pickerMain">
        <div id="pickerChips" class="picker-cat-wrap"></div>
        <div class="searchbar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="pickerSearch" placeholder="搜索菜名或条目，跨全部分类" autocomplete="off">
        </div>
        <div id="pickerList" class="picker-list"></div>
        <button class="btn btn-primary btn-block" type="button" id="pickerDone" style="margin-top:14px">完成</button>
      </div>
      <div id="qtyPanel" hidden></div>`;

    $('#pickerSearch', node).addEventListener('input', (e) => {
      pickKeyword = e.target.value.trim().toLowerCase();
      renderPickerList();
    });

    node.addEventListener('click', (e) => {
      const tile = e.target.closest('[data-ptile]');
      if (tile) {
        pickEntryCat = tile.dataset.ptile;
        pickKeyword = '';
        $('#pickerSearch', node).value = '';
        renderPickerList();
        return;
      }
      const back = e.target.closest('[data-backcat]');
      if (back) {
        pickEntryCat = null;
        renderPickerList();
        return;
      }
      const item = e.target.closest('.picker-item');
      if (item) {
        const eid = item.dataset.eid;
        if (eid.startsWith(ITEM_PLAN_PREFIX)) {
          const realId = eid.slice(ITEM_PLAN_PREFIX.length);
          const it = state.items.find((x) => x.id === realId);
          if (it) openQtyEditor(it);
        } else {
          const info = planEntryInfo(eid);
          if (!info) return;
          const wasSelected = getPlanDishes(key).includes(eid);
          toggleEntry(eid);
          renderPickerList();
          renderPlan();
          if (wasSelected) {
            toast('已取消「' + info.name + '」');
          } else {
            toast('已添加「' + info.name + '」');
          }
        }
      }
    });

    $('#pickerDone', node).addEventListener('click', () => {
      renderPlan();
      closeSheet();
    });

    // 单条目数量编辑：替换列表区显示，确定后写回 item:ID@数量
    function openQtyEditor(it) {
      const countable = (it.priceUnit || '') === '斤' && Number(it.piecesPerUnit) > 0;
      const unit = countable ? '个' : (it.priceUnit || '份');
      const step = countable ? 1 : (['克', '毫升'].includes(unit) ? 50 : 1);
      const hint = countable
        ? '按 个 计 · 1斤约' + fmtNum(Number(it.piecesPerUnit)) + '个' +
          (it.price > 0 ? ' · 约' + fmtNum(it.price / Number(it.piecesPerUnit)) + '元/个' : '')
        : '按 ' + esc(unit) + ' 计' + (it.price > 0 ? ' · ' + fmtNum(it.price) + '元/' + esc(unit) : '');
      const existing = getPlanDishes(key).find((id) =>
        typeof id === 'string' && id.startsWith(ITEM_PLAN_PREFIX) &&
        id.slice(ITEM_PLAN_PREFIX.length).split('@')[0] === it.id);
      const cur = existing ? parseFloat(existing.slice(ITEM_PLAN_PREFIX.length).split('@')[1]) : 1;

      const main = $('#pickerMain', node);
      const panel = $('#qtyPanel', node);
      main.hidden = true;
      panel.hidden = false;
      panel.innerHTML = `
        <div class="qty-name">${esc(it.name)}<small>${hint}</small></div>
        <div class="qty-ctl">
          <button class="qty-btn" type="button" id="qtyDec">−</button>
          <input class="qty-input" id="qtyInput" type="number" inputmode="decimal" min="0" step="${step}" value="${fmtNum(isFinite(cur) && cur > 0 ? cur : 1)}">
          <button class="qty-btn" type="button" id="qtyInc">＋</button>
          <span class="qty-unit">${esc(unit)}</span>
        </div>
        <div class="sheet-actions">
          ${existing ? '<button class="btn btn-ghost danger-text" type="button" id="qtyRemove">移除</button>' : ''}
          <button class="btn btn-ghost" type="button" id="qtyBack">取消</button>
          <button class="btn btn-primary" type="button" id="qtyOk">确定</button>
        </div>`;

      const bump = (d) => {
        const inp = $('#qtyInput', panel);
        inp.value = fmtNum(Math.max(0, (parseFloat(inp.value) || 0) + d));
      };
      const back = () => { panel.hidden = true; main.hidden = false; };

      $('#qtyDec', panel).addEventListener('click', () => bump(-step));
      $('#qtyInc', panel).addEventListener('click', () => bump(step));
      $('#qtyBack', panel).addEventListener('click', back);
      const rm = $('#qtyRemove', panel);
      if (rm) rm.addEventListener('click', () => {
        removeEntry(existing);
        renderPickerList(); renderPlan();
        toast('已移除「' + it.name + '」');
        back();
      });
      $('#qtyOk', panel).addEventListener('click', () => {
        const q = parseFloat($('#qtyInput', panel).value);
        if (!isFinite(q) || q <= 0) { toast('请输入大于 0 的数量'); return; }
        if (existing) removeEntry(existing);
        const dishes = getPlanDishes(key);
        dishes.push(ITEM_PLAN_PREFIX + it.id + '@' + fmtNum(q));
        state.mealPlan[key] = dishes;
        save();
        renderPickerList(); renderPlan();
        toast('已添加「' + it.name + ' ' + fmtNum(q) + unit + '」');
        back();
      });
      setTimeout(() => $('#qtyInput', panel).focus(), 60);
    }

    renderPickerList();
    openSheetHTML(dayName + ' · ' + (meal ? meal.name : ''), node);
  }

  function generatePlanShoppingList() {
    const counts = {};
    const itemCounts = {};
    Object.keys(state.mealPlan).forEach((k) => {
      getPlanDishes(k).forEach((id) => {
        const info = planEntryInfo(id);
        if (!info) return;
        if (info.isItem) {
          // 按个选的条目（1斤约N个）折算回斤参与计价
          itemCounts[info.id] = (itemCounts[info.id] || 0) + info.listQty;
        } else {
          counts[info.id] = (counts[info.id] || 0) + 1;
        }
      });
    });
    const hasDishes = Object.keys(counts).length > 0;
    const hasItems = Object.keys(itemCounts).length > 0;
    if (!hasDishes && !hasItems) { toast('请先安排一些菜品或条目'); return; }

    state.sel = counts;
    state.itemSel = itemCounts;
    state.checked = {};
    save();
    refreshAll();
    switchView('list');
    toast('已根据本周规划生成购物清单');
  }

  /* ---------------- 视图：菜品库 ---------------- */
  const recipesView = $('#view-recipes');
  recipesView.innerHTML = `
    <div class="catalog-bar"><div class="catalog-chips" id="catalogChips"></div></div>
    <div class="catalog-actions" id="catalogActions"></div>
    <div class="dish-list" id="catalogList"></div>`;

  const THUMB_COLORS = ['#E0533D', '#5F8D4E', '#4E7FA8', '#D9A441', '#8A6F9E', '#A07E4F'];
  function thumbColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return THUMB_COLORS[h % THUMB_COLORS.length];
  }

  let currentCatalogId = 'cat-recipe';
  let stapleSubCat = '__all__'; // 食材库内细分品类筛选
  let currentDishCat = null; // 菜品库子分类筛选（null=未选，不展示菜品）
  function getCatalog(id) { return state.catalogs.find((c) => c.id === id); }
  function dishCatById(id) { return state.dishCats.find((c) => c.id === id); }
  function currentCatalog() { return getCatalog(currentCatalogId) || state.catalogs[0]; }
  function itemSubCat(it) { return it.cat || guessCategory(it.name); }

  function renderRecipes() {
    const chipsSlot = $('#catalogChips', recipesView);
    chipsSlot.innerHTML = state.catalogs.map((c) =>
      `<button class="cat-chip ${c.id === currentCatalogId ? 'is-active' : ''}" type="button" data-cat="${esc(c.id)}" style="--cat-color:${c.color || '#8F867A'}">${esc(c.name)}</button>`
    ).join('') + `
      <button class="cat-chip is-add" type="button" id="addCatalogBtn" aria-label="新建分类">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      </button>`;

    const cat = currentCatalog();
    currentCatalogId = cat.id;
    const slot = $('#catalogList', recipesView);
    if (cat.type === 'recipe') renderRecipeList(slot, cat);
    else renderItemList(slot, cat);

    // 自定义分类可删除/改名；系统分类可改名
    const actionsSlot = $('#catalogActions', recipesView);
    actionsSlot.innerHTML = '';
    if (!cat.system) {
      const del = document.createElement('button');
      del.className = 'btn-text danger-text';
      del.type = 'button';
      del.textContent = '删除此分类';
      del.addEventListener('click', () => deleteCatalog(cat.id));
      actionsSlot.appendChild(del);
    }
    const rename = document.createElement('button');
    rename.className = 'btn-text muted';
    rename.type = 'button';
    rename.textContent = cat.system ? '重命名' : '重命名分类';
    rename.addEventListener('click', () => renameCatalog(cat));
    actionsSlot.appendChild(rename);
  }

  function deleteCatalog(catId) {
    const cat = getCatalog(catId);
    if (!cat || cat.system) { toast('系统分类不可删除'); return; }
    const recipeCount = state.recipes.filter((r) => r.catalogId === catId).length;
    const itemCount = state.items.filter((it) => it.catalogId === catId).length;
    const msg = '确定删除分类「' + cat.name + '」吗？'
      + (recipeCount + itemCount > 0 ? '其下 ' + (recipeCount + itemCount) + ' 个条目将一并删除。' : '');
    if (!confirm(msg)) return;
    state.recipes.forEach((r) => { if (r.catalogId === catId) delete state.sel[r.id]; });
    state.recipes = state.recipes.filter((r) => r.catalogId !== catId);
    state.items.filter((it) => it.catalogId === catId).forEach((it) => {
      delete state.itemSel[it.id];
      delete state.checked['item|' + catId + '|' + it.id];
    });
    state.items = state.items.filter((it) => it.catalogId !== catId);
    // mealPlan 引用清理（菜品原 id + item: 前缀的单条目）
    Object.keys(state.mealPlan).forEach((k) => {
      const v = state.mealPlan[k];
      if (!v) return;
      const ids = Array.isArray(v) ? v : [v];
      const cleaned = ids.filter((id) => !!planEntryName(id));
      if (cleaned.length === 0) delete state.mealPlan[k];
      else state.mealPlan[k] = Array.isArray(v) ? cleaned : cleaned[0];
    });
    state.catalogs = state.catalogs.filter((c) => c.id !== catId);
    currentCatalogId = 'cat-recipe';
    save(); refreshAll();
    toast('已删除分类「' + cat.name + '」');
  }

  function renameCatalog(cat) {
    const node = document.createElement('div');
    node.innerHTML = `
      <div class="field">
        <label for="rnName">分类名称</label>
        <input type="text" id="rnName" maxlength="12">
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost" type="button" id="rnCancel">取消</button>
        <button class="btn btn-primary" type="button" id="rnSave">保存</button>
      </div>`;
    $('#rnName', node).value = cat.name;
    $('#rnCancel', node).addEventListener('click', closeSheet);
    $('#rnSave', node).addEventListener('click', () => {
      const name = $('#rnName', node).value.trim();
      if (!name) { toast('名称不能为空'); return; }
      if (state.catalogs.some((c) => c.name === name && c.id !== cat.id)) { toast('已有同名分类'); return; }
      cat.name = name;
      save(); closeSheet(); refreshAll();
      toast('已重命名');
    });
    openSheetHTML('重命名分类', node);
    setTimeout(() => $('#rnName', node).focus(), 260);
  }

  const RECIPE_EMPTY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>';

  function renderRecipeList(slot, cat) {
    const allRecipes = state.recipes.filter((r) => r.catalogId === cat.id);

    // 子分类大色块选择区（点击展开/再点收起）
    const validIds = new Set(state.dishCats.map((c) => c.id));
    if (currentDishCat && !validIds.has(currentDishCat)) currentDishCat = null;
    const catGrid = `<div class="dish-cat-grid">
      ${state.dishCats.map((c) => {
        const color = c.color || '#8F867A';
        const n = allRecipes.reduce((acc, r) => acc + (r.dishCat === c.id ? 1 : 0), 0);
        return `<button class="dish-cat-tile ${c.id === currentDishCat ? 'is-active' : ''}" type="button" data-dishcat="${esc(c.id)}" style="--cat-color:${color};--cat-soft:${color}24">
          <span class="tile-name">${esc(c.name)}</span>
          <span class="tile-count">${n} 道</span>
        </button>`;
      }).join('')}
      <button class="dish-cat-manage" type="button" id="manageDishCats" aria-label="管理分类">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
        <span>管理分类</span>
      </button>
    </div>`;

    // 未选分类 → 提示选择，不展示菜品
    if (!currentDishCat) {
      slot.innerHTML = catGrid + `<div class="empty"><div class="empty-icon">${RECIPE_EMPTY_ICON}</div>
        <h3>请选择一个菜品分类</h3><p>点击上方分类方块，展开查看该类下的菜品</p></div>`;
      return;
    }

    const dc = dishCatById(currentDishCat);
    const list = allRecipes.filter((r) => r.dishCat === currentDishCat);
    if (list.length === 0) {
      slot.innerHTML = catGrid + `<div class="empty"><div class="empty-icon">${RECIPE_EMPTY_ICON}</div>
        <h3>${esc(dc ? dc.name : '该分类')}还是空的</h3><p>添加第一道你常做的菜，记录它的食材用量</p>
        <button class="btn btn-primary" type="button" id="emptyAdd">＋ 添加菜品</button></div>`;
      $('#emptyAdd', slot).addEventListener('click', () => openEditor(null, cat.id));
      return;
    }
    slot.innerHTML = catGrid + list.map((r) => `
      <div class="card recipe-card">
        <span class="recipe-thumb" style="background:${dc ? dc.color : thumbColor(r.name)}">${esc(r.name.slice(0, 1))}</span>
        <span class="recipe-main">
          <span class="dish-name">${esc(r.name)}</span>
          <span class="dish-tags">${(r.ings || []).map((i) =>
            esc(i.name) + (i.qty ? ' ' + esc(i.qty) + (/^\s*\.?\d/.test(i.qty) && i.unit && i.unit !== '适量' ? esc(i.unit) : '') : '')
          ).join(' · ')}</span>
        </span>
        <span class="recipe-ops">
          <button class="icon-btn add-btn" type="button" data-add-recipe="${esc(r.id)}" aria-label="加入清单" title="加入清单">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          </button>
          <button class="icon-btn" type="button" data-edit="${esc(r.id)}" aria-label="编辑">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn danger" type="button" data-del="${esc(r.id)}" aria-label="删除">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </span>
      </div>`).join('');
  }

  function itemCardHTML(it) {
    const qty = state.itemSel[it.id] || 0;
    const inList = qty > 0;
    const subtotal = (it.price || 0) * qty;
    return `
      <div class="card item-row ${inList ? 'is-in-list' : ''}">
        <div class="item-main">
          <span class="dish-name">${esc(it.name)}</span>
          <span class="item-price">¥${fmtNum(it.price || 0)} / ${esc(it.priceUnit || '个')}${it.piecesPerUnit ? ' · 1斤约' + esc(it.piecesPerUnit) + '个' : ''}${it.note ? ' · ' + esc(it.note) : ''}</span>
        </div>
        <div class="item-ops">
          <div class="item-qty ${inList ? '' : 'is-hidden'}">
            <button class="qty-btn" type="button" data-item-dec="${esc(it.id)}" aria-label="减1">−</button>
            <span class="qty-num">${qty}</span>
            <button class="qty-btn" type="button" data-item-inc="${esc(it.id)}" aria-label="加1">+</button>
            ${subtotal > 0 ? `<span class="item-subtotal">¥${fmtNum(subtotal)}</span>` : ''}
          </div>
          <button class="icon-btn ${inList ? 'add-btn is-active' : 'add-btn'}" type="button" data-item-toggle="${esc(it.id)}" aria-label="${inList ? '移出清单' : '加入清单'}" title="${inList ? '移出清单' : '加入清单'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          </button>
          <button class="icon-btn" type="button" data-item-edit="${esc(it.id)}" aria-label="编辑">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn danger" type="button" data-item-del="${esc(it.id)}" aria-label="删除">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </div>`;
  }

  function renderItemList(slot, cat) {
    const list = state.items.filter((it) => it.catalogId === cat.id);

    // 食材库：营养金字塔入口 → 点层级进入对应细分品类
    if (cat.id === 'cat-staple') {
      const layers = pyLayers();
      const counts = new Map();
      list.forEach((it) => {
        const sc = itemSubCat(it);
        counts.set(sc, (counts.get(sc) || 0) + 1);
      });
      const validName = (nm) => pyNames().includes(nm);
      if (stapleSubCat !== '__all__' && !validName(stapleSubCat)) stapleSubCat = '__all__';

      if (stapleSubCat === '__all__') {
        // 每层为梯形，自上而下加宽；顶层少吃、底层多吃；拆分层为左右两个半梯形
        const n = layers.length;
        const layerHTML = layers.map((l, k) => {
          const wTop = 8 + 90 * k / n;
          const wBottom = 8 + 90 * (k + 1) / n;
          const vars = `--tw:${wTop.toFixed(2)}%;--bw:${wBottom.toFixed(2)}%;`;
          if (layerSplit(l)) {
            const half = (cell, side) => {
              const cnt = counts.get(cell.name) || 0;
              // 文字靠近底边，横向中心对齐该层底部半宽的中心
              const cx = (50 + (side === 'l' ? -1 : 1) * wBottom / 4).toFixed(2);
              const hw = (wBottom / 2 - 4).toFixed(2);
              return `<button class="pyr-layer pyr-half pyr-half-${side} ${cnt === 0 ? 'is-empty' : ''}" type="button"
                data-subcat="${esc(cell.name)}"
                style="background:${cell.color};${vars}--cx:${cx}%;--hw:${hw}%">
                <span class="pyr-txt"><span class="pyr-name">${esc(cell.name)}</span><span class="pyr-cnt">${cnt}</span></span>
              </button>`;
            };
            return `<div class="pyr-row is-split" style="${vars}">
              ${half({ name: l.name, color: cellColor(l, 'l') }, 'l')}
              ${half({ name: l.right.name, color: cellColor(l, 'r') }, 'r')}
            </div>`;
          }
          const cnt = counts.get(l.name) || 0;
          return `<button class="pyr-layer ${cnt === 0 ? 'is-empty' : ''}" type="button" data-subcat="${esc(l.name)}"
            style="background:${l.color || '#8F867A'};${vars}">
            <span class="pyr-name">${esc(l.name)}</span>
            <span class="pyr-cnt">${cnt}</span>
          </button>`;
        }).join('');
        slot.innerHTML = `
          <div class="pyramid-card">
            <div class="pyramid">${layerHTML}</div>
            <p class="pyramid-hint">点击层级查看食材 · 越靠下建议多吃，越靠上越要少吃</p>
            <button class="btn btn-ghost btn-block" type="button" id="pyramidManage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              管理层级
            </button>
          </div>`;
        $('#pyramidManage', slot).addEventListener('click', openPyramidEditor);
        return;
      }

      // 某个细分品类内：返回金字塔 + 该类食材列表
      const c = { color: pyColor(stapleSubCat) };
      const items = list.filter((it) => itemSubCat(it) === stapleSubCat)
        .sort((a, b) => a.name.localeCompare(b.name, 'zh'));
      let body;
      if (items.length === 0) {
        body = `<div class="empty"><div class="empty-icon">${RECIPE_EMPTY_ICON}</div>
          <h3>${esc(stapleSubCat)}类还是空的</h3><p>添加「${esc(stapleSubCat)}」类食材，记录价格，可勾选加入购物清单</p>
          <button class="btn btn-primary" type="button" id="emptyAddItem">＋ 添加食材</button></div>`;
      } else {
        body = `<div class="sub-group-list">${items.map(itemCardHTML).join('')}</div>`;
      }
      slot.innerHTML = `
        <div class="pyr-back-bar">
          <button class="pyr-back" type="button" data-subcat="__all__">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            金字塔
          </button>
          <span class="pyr-cur"><span class="dot" style="background:${c.color}"></span>${esc(stapleSubCat)}<span class="g-count">${items.length}</span></span>
        </div>
        ${body}`;
      const emptyAdd = $('#emptyAddItem', slot);
      if (emptyAdd) emptyAdd.addEventListener('click', () => openItemEditor(null, cat.id));
      return;
    }

    if (list.length === 0) {
      slot.innerHTML = `<div class="empty"><div class="empty-icon">${RECIPE_EMPTY_ICON}</div>
        <h3>${esc(cat.name)}还是空的</h3><p>添加条目，记录价格，可勾选加入购物清单</p>
        <button class="btn btn-primary" type="button" id="emptyAddItem">＋ 添加条目</button></div>`;
      $('#emptyAddItem', slot).addEventListener('click', () => openItemEditor(null, cat.id));
      return;
    }
    slot.innerHTML = list
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
      .map(itemCardHTML).join('');
  }

  function setItemQty(itemId, delta) {
    const cur = state.itemSel[itemId] || 0;
    const next = Math.max(0, cur + delta);
    if (next === 0) delete state.itemSel[itemId];
    else state.itemSel[itemId] = next;
    save(); renderRecipes(); renderList(); refreshBadge();
  }
  function toggleItem(itemId) {
    if (state.itemSel[itemId]) delete state.itemSel[itemId];
    else state.itemSel[itemId] = 1;
    save(); renderRecipes(); renderList(); refreshBadge();
  }

  recipesView.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-cat]');
    if (chip) { currentCatalogId = chip.dataset.cat; stapleSubCat = '__all__'; renderRecipes(); return; }
    if (e.target.closest('#addCatalogBtn')) { openCatalogEditor(); return; }
    if (e.target.closest('#manageDishCats')) { openDishCatManager(); return; }

    const dishChip = e.target.closest('[data-dishcat]');
    if (dishChip) {
      const id = dishChip.dataset.dishcat;
      currentDishCat = currentDishCat === id ? null : id; // 再点已选色块 → 收起
      renderRecipes(); return;
    }

    const subChip = e.target.closest('[data-subcat]');
    if (subChip) { stapleSubCat = subChip.dataset.subcat; renderRecipes(); return; }

    const addRecipeBtn = e.target.closest('[data-add-recipe]');
    if (addRecipeBtn) {
      const id = addRecipeBtn.dataset.addRecipe;
      state.sel[id] = (state.sel[id] || 0) + 1;
      save(); refreshBadge();
      const r = state.recipes.find((x) => x.id === id);
      toast('已加入清单：' + (r ? r.name : '') + '（' + state.sel[id] + '份）');
      return;
    }
    const editBtn = e.target.closest('[data-edit]');
    const delBtn = e.target.closest('[data-del]');
    if (editBtn) {
      const r = state.recipes.find((x) => x.id === editBtn.dataset.edit);
      if (r) openEditor(r, r.catalogId);
      return;
    }
    if (delBtn) {
      const r = state.recipes.find((x) => x.id === delBtn.dataset.del);
      if (r && confirm('确定删除「' + r.name + '」吗？此操作不可撤销。')) {
        state.recipes = state.recipes.filter((x) => x.id !== r.id);
        delete state.sel[r.id];
        Object.keys(state.mealPlan).forEach((k) => {
          const v = state.mealPlan[k];
          if (!v) return;
          if (Array.isArray(v)) {
            const filtered = v.filter((id) => id !== r.id);
            if (filtered.length === 0) delete state.mealPlan[k];
            else state.mealPlan[k] = filtered;
          } else if (v === r.id) {
            delete state.mealPlan[k];
          }
        });
        save(); refreshAll();
        toast('已删除「' + r.name + '」');
      }
      return;
    }

    const incBtn = e.target.closest('[data-item-inc]');
    if (incBtn) { setItemQty(incBtn.dataset.itemInc, +1); return; }
    const decBtn = e.target.closest('[data-item-dec]');
    if (decBtn) { setItemQty(decBtn.dataset.itemDec, -1); return; }
    const toggleBtn = e.target.closest('[data-item-toggle]');
    if (toggleBtn) { toggleItem(toggleBtn.dataset.itemToggle); return; }
    const itemEditBtn = e.target.closest('[data-item-edit]');
    if (itemEditBtn) {
      const it = state.items.find((x) => x.id === itemEditBtn.dataset.itemEdit);
      if (it) openItemEditor(it, it.catalogId);
      return;
    }
    const itemDelBtn = e.target.closest('[data-item-del]');
    if (itemDelBtn) {
      const it = state.items.find((x) => x.id === itemDelBtn.dataset.itemDel);
      if (it && confirm('确定删除「' + it.name + '」吗？')) {
        state.items = state.items.filter((x) => x.id !== it.id);
        delete state.itemSel[it.id];
        delete state.checked['item|' + it.catalogId + '|' + it.id];
        // 清理规划中引用的该条目
        Object.keys(state.mealPlan).forEach((k) => {
          const v = state.mealPlan[k];
          if (!v) return;
          const ids = Array.isArray(v) ? v : [v];
          const cleaned = ids.filter((id) =>
            !(typeof id === 'string' && id.startsWith(ITEM_PLAN_PREFIX) &&
              id.slice(ITEM_PLAN_PREFIX.length).split('@')[0] === it.id));
          if (cleaned.length === 0) delete state.mealPlan[k];
          else state.mealPlan[k] = Array.isArray(v) ? cleaned : cleaned[0];
        });
        save(); refreshAll();
        toast('已删除「' + it.name + '」');
      }
      return;
    }
  });

  /* ---------------- 菜品编辑器（底部弹层） ---------------- */
  const mask = $('#sheetMask');

  function closeSheet() {
    mask.classList.remove('show');
    const sheet = $('.sheet');
    if (sheet) sheet.remove();
    setTimeout(() => { mask.hidden = true; }, 200);
  }
  mask.addEventListener('click', closeSheet);

  function openSheetHTML(title, bodyNode) {
    mask.hidden = false;
    requestAnimationFrame(() => mask.classList.add('show'));
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.innerHTML = `<div class="sheet-grab"></div>
      <div class="sheet-head"><h3>${esc(title)}</h3>
        <button class="icon-btn" id="sheetClose" aria-label="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button></div>`;
    const body = document.createElement('div');
    body.className = 'sheet-body';
    body.appendChild(bodyNode);
    sheet.appendChild(body);
    $('#app').appendChild(sheet);
    $('#sheetClose', sheet).addEventListener('click', closeSheet);
    // 键盘弹出后，把聚焦的输入框滚到可视区（等键盘动画/视口调整完成）
    sheet.addEventListener('focusin', (e) => {
      const el = e.target;
      if (!el.matches('input, select, textarea')) return;
      setTimeout(() => {
        const vv = window.visualViewport;
        const vh = vv ? vv.height : window.innerHeight;
        const r = el.getBoundingClientRect();
        if (r.bottom > vh - 8 || r.top < 0) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 320);
    });
    return sheet;
  }

  function openEditor(recipe, catalogId) {
    const catId = catalogId || (recipe && recipe.catalogId) || 'cat-recipe';
    const draft = {
      id: recipe ? recipe.id : uid('r'),
      catalogId: catId,
      name: recipe ? recipe.name : '',
      dishCat: recipe ? recipe.dishCat : (currentDishCat || (state.dishCats[0] && state.dishCats[0].id) || ''),
      ings: (recipe ? recipe.ings.map((i) => ({ ...i })) : []).filter((i) => i.name)
    };

    const staples = state.items.filter((it) => it.catalogId === 'cat-staple');
    let ingSubCat = '__all__'; // 选食材时的细分品类筛选

    const node = document.createElement('div');
    node.innerHTML = `
      <div class="field">
        <label for="edName">菜品名称</label>
        <input type="text" id="edName" placeholder="例如：番茄炒蛋" maxlength="30">
      </div>
      <div class="field">
        <label for="edDishCat">菜品分类</label>
        <select id="edDishCat">${state.dishCats.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label>食材与用量（做一份的量）<span class="field-hint">先选品类，点食材快速添加；也可直接输入</span></label>
        <div id="staplePicker" class="staple-picker"></div>
        <div id="ingRows"></div>
        <button class="add-ing-btn" type="button" id="addIng">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          添加食材
        </button>
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost" type="button" id="edCancel">取消</button>
        <button class="btn btn-primary" type="button" id="edSave">保存</button>
      </div>`;
    $('#edName', node).value = draft.name;
    const edDishCat = $('#edDishCat', node);
    if (draft.dishCat) edDishCat.value = draft.dishCat;
    edDishCat.addEventListener('change', () => { draft.dishCat = edDishCat.value; });

    const rowsSlot = $('#ingRows', node);

    function catOptions(sel) {
      const names = pyNames();
      if (sel && !names.includes(sel)) names.push(sel);
      return names.map((name) =>
        `<option value="${esc(name)}" ${name === sel ? 'selected' : ''}>${esc(name)}</option>`
      ).join('');
    }
    function unitOptions(sel) {
      const opts = UNITS.slice();
      if (sel && !opts.includes(sel)) opts.unshift(sel);
      return opts.map((u) =>
        `<option value="${esc(u)}" ${u === sel ? 'selected' : ''}>${esc(u)}</option>`
      ).join('');
    }
    function findStaple(name) {
      const n = (name || '').trim();
      if (!n) return null;
      return state.items.find((it) => it.catalogId === 'cat-staple' && it.name === n) || null;
    }

    function addRow(data) {
      const d = data || { id: uid('i'), name: '', qty: '', unit: '个', cat: '' };
      // 编辑已有食材时传入的是 draft.ings 里已有的引用，不能重复 push
      if (!draft.ings.includes(d)) draft.ings.push(d);
      if (!d.cat) d.cat = guessCategory(d.name);
      const row = document.createElement('div');
      row.className = 'ing-row';
      row.dataset.id = d.id;
      row.innerHTML = `
        <div class="ing-row-line1">
          <input type="text" class="ing-name" placeholder="食材名，如：鸡蛋" maxlength="20" autocomplete="off">
          <button class="ing-del" type="button" aria-label="删除食材">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          </button>
        </div>
        <div class="ing-row-line2">
          <div class="ing-qty"><input type="text" class="ing-qty-in" placeholder="用量" inputmode="decimal"></div>
          <div class="ing-unit"><select class="ing-unit-in">${unitOptions(d.unit)}</select></div>
          <div class="ing-cat"><select class="ing-cat-in" aria-label="分类">${catOptions(d.cat)}</select></div>
        </div>`;
      $('.ing-name', row).value = d.name;
      $('.ing-qty-in', row).value = d.qty;

      $('.ing-name', row).addEventListener('input', (e) => {
        d.name = e.target.value;
        // 优先匹配食材库，自动带 unit/cat
        const s = findStaple(d.name);
        if (s) {
          d.stapleId = s.id;
          d.unit = s.priceUnit || d.unit;
          d.cat = itemSubCat(s) || d.cat;
          $('.ing-unit-in', row).value = d.unit;
          $('.ing-cat-in', row).value = d.cat;
        } else {
          delete d.stapleId;
          const g = guessCategory(d.name);
          if (g !== DEFAULT_CAT) { d.cat = g; $('.ing-cat-in', row).value = g; }
        }
        // 同步快速选择按钮的已添加状态
        node.querySelectorAll('.staple-quick').forEach((b) =>
          b.classList.toggle('is-added', draft.ings.some((x) => x.name === b.dataset.staple)));
      });
      $('.ing-qty-in', row).addEventListener('input', (e) => { d.qty = e.target.value; });
      $('.ing-unit-in', row).addEventListener('change', (e) => { d.unit = e.target.value; });
      $('.ing-cat-in', row).addEventListener('change', (e) => { d.cat = e.target.value; });
      $('.ing-del', row).addEventListener('click', () => {
        draft.ings = draft.ings.filter((x) => x.id !== d.id);
        row.remove();
        renderStaplePicker();
      });
      rowsSlot.appendChild(row);
      return row;
    }

    // 从食材库快速选择：先按细分品类筛选，再点食材名直接添加一行
    function renderStaplePicker() {
      const picker = $('#staplePicker', node);
      const presentCats = pyCats().filter((c) => staples.some((s) => itemSubCat(s) === c.name));
      const chips = ['<button class="cat-chip ' + (ingSubCat === '__all__' ? 'is-active' : '') + '" type="button" data-ingcat="__all__" style="--cat-color:var(--tomato)">全部</button>']
        .concat(presentCats.map((l) =>
          `<button class="cat-chip ${ingSubCat === l.name ? 'is-active' : ''}" type="button" data-ingcat="${esc(l.name)}" style="--cat-color:${l.color || '#8F867A'}">${esc(l.name)}</button>`
        ));
      const inDraft = (n) => draft.ings.some((x) => x.name === n);
      const quickBtn = (s) =>
        `<button type="button" class="staple-quick ${inDraft(s.name) ? 'is-added' : ''}" data-staple="${esc(s.name)}">${esc(s.name)}</button>`;
      let quickHTML;
      if (ingSubCat === '__all__') {
        quickHTML = presentCats.map((c) => {
          const ss = staples.filter((s) => itemSubCat(s) === c.name)
            .sort((a, b) => a.name.localeCompare(b.name, 'zh'));
          if (!ss.length) return '';
          return `<div class="staple-qg"><span class="staple-qg-name" style="color:${c.color}">${esc(c.name)}</span><div class="staple-qg-list">${ss.map(quickBtn).join('')}</div></div>`;
        }).join('');
      } else {
        const ss = staples.filter((s) => itemSubCat(s) === ingSubCat)
          .sort((a, b) => a.name.localeCompare(b.name, 'zh'));
        quickHTML = `<div class="staple-qg-list">${ss.map(quickBtn).join('')}</div>`;
      }
      picker.innerHTML =
        `<div class="catalog-chips sub-chips">${chips.join('')}</div>` +
        (staples.length
          ? `<div class="staple-quick-wrap">${quickHTML || '<p class="staple-empty">该品类下暂无食材</p>'}</div>`
          : '<p class="staple-empty">食材库还是空的，可直接在下方输入食材名，保存时会自动加入食材库</p>');
    }

    function pickStaple(name) {
      if (draft.ings.some((x) => x.name === name)) {
        toast('「' + name + '」已在食材列表中');
        return;
      }
      const s = findStaple(name);
      const row = addRow({
        id: uid('i'), name, qty: '',
        unit: s ? (s.priceUnit || '个') : '个',
        cat: s ? itemSubCat(s) : guessCategory(name),
        stapleId: s ? s.id : undefined
      });
      $('.ing-qty-in', row).focus();
      renderStaplePicker();
    }

    node.addEventListener('click', (e) => {
      const catBtn = e.target.closest('[data-ingcat]');
      if (catBtn) { ingSubCat = catBtn.dataset.ingcat; renderStaplePicker(); return; }
      const sb = e.target.closest('[data-staple]');
      if (sb) pickStaple(sb.dataset.staple);
    });

    if (draft.ings.length === 0) {
      addRow({ id: uid('i'), name: '', qty: '', unit: '个', cat: DEFAULT_CAT });
      addRow({ id: uid('i'), name: '', qty: '', unit: '克', cat: DEFAULT_CAT });
    } else {
      draft.ings.forEach((d) => addRow(d));
    }

    $('#addIng', node).addEventListener('click', () => {
      const row = addRow();
      $('.ing-name', row).focus();
    });
    $('#edCancel', node).addEventListener('click', closeSheet);
    $('#edName', node).addEventListener('input', (e) => { draft.name = e.target.value; });

    $('#edSave', node).addEventListener('click', () => {
      const name = draft.name.trim();
      if (!name) { toast('先填一下菜品名称'); $('#edName', node).focus(); return; }
      // 按行 id 去重：修复旧版本编辑时食材翻倍产生的历史重复数据；
      // 品类若已不在金字塔格子中（层级被改名/删除/合并），归一化到有效格子
      const layerNames = pyNames();
      const fallbackLayer = layerNames[layerNames.length - 1] || DEFAULT_CAT;
      const normalizeCat = (cat, ingName) => {
        const c = cat || guessCategory(ingName);
        return layerNames.includes(c) ? c : fallbackLayer;
      };
      const seenIds = new Set();
      const ings = draft.ings
        .map((x) => ({ ...x, name: (x.name || '').trim(), qty: (x.qty || '').trim(), cat: normalizeCat(x.cat, x.name) }))
        .filter((x) => x.name && !seenIds.has(x.id) && seenIds.add(x.id));
      if (ings.length === 0) { toast('至少添加一种食材'); return; }
      // 食材库同步：手输的新食材自动入食材库
      ings.forEach((ing) => {
        const s = findStaple(ing.name);
        if (s) {
          ing.stapleId = s.id;
        } else {
          const ns = {
            id: uid('it'), catalogId: 'cat-staple',
            name: ing.name, price: 0, priceUnit: ing.unit || '个', note: '',
            cat: ing.cat || guessCategory(ing.name)
          };
          state.items.push(ns);
          ing.stapleId = ns.id;
        }
      });
      const dishCat = draft.dishCat || (state.dishCats[0] && state.dishCats[0].id) || '';
      const existing = state.recipes.find((x) => x.id === draft.id);
      if (existing) Object.assign(existing, { name, ings, dishCat, catalogId: draft.catalogId });
      else state.recipes.push({ id: draft.id, name, ings, dishCat, catalogId: draft.catalogId });
      save();
      closeSheet();
      refreshAll();
      toast(existing ? '已保存修改' : '已添加「' + name + '」');
    });

    renderStaplePicker();
    openSheetHTML(recipe ? '编辑菜品' : '添加菜品', node);
  }

  /* ---------------- 单条目编辑器（食材/酒水/零食/自定义 item） ---------------- */
  function openItemEditor(item, catalogId) {
    const catId = catalogId || (item && item.catalogId) || 'cat-staple';
    const isStaple = catId === 'cat-staple';
    // 从金字塔某层新增食材时，预选该细分品类
    const presetCat = !item && isStaple && stapleSubCat !== '__all__' ? stapleSubCat : '';
    const draft = {
      id: item ? item.id : uid('it'),
      catalogId: catId,
      name: item ? item.name : '',
      price: item ? (item.price || 0) : 0,
      priceUnit: item ? (item.priceUnit || '个') : '个',
      piecesPerUnit: item ? (item.piecesPerUnit || '') : '',
      note: item ? (item.note || '') : '',
      cat: item ? (item.cat || '') : presetCat
    };
    const node = document.createElement('div');
    node.innerHTML = `
      <div class="field">
        <label for="itName">名称</label>
        <input type="text" id="itName" placeholder="例如：可乐 / 鸡蛋 / 薯片" maxlength="30">
      </div>
      ${isStaple ? `<div class="field">
        <label for="itCat">细分品类</label>
        <select id="itCat">${pyCats().map((c) => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}</select>
      </div>` : ''}
      <div class="field-row">
        <div class="field">
          <label for="itPrice">单价（元）</label>
          <input type="text" id="itPrice" placeholder="0" inputmode="decimal">
        </div>
        <div class="field">
          <label for="itUnit">计价单位</label>
          <select id="itUnit"></select>
        </div>
      </div>
      <div class="field" id="itPiecesField" hidden>
        <label for="itPieces">1斤大约多少个</label>
        <input type="text" id="itPieces" placeholder="例如：8" inputmode="decimal">
      </div>
      <div class="field">
        <label for="itNote">备注（可选）</label>
        <input type="text" id="itNote" placeholder="如：500ml / 大瓶 / 促销装" maxlength="30">
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost" type="button" id="itCancel">取消</button>
        <button class="btn btn-primary" type="button" id="itSave">保存</button>
      </div>`;
    $('#itName', node).value = draft.name;
    if (isStaple) {
      const catSel = $('#itCat', node);
      const layerNames = pyNames();
      const initialCat = draft.cat || guessCategory(draft.name) || layerNames[0];
      catSel.value = layerNames.includes(initialCat) ? initialCat : layerNames[0];
      // 未手动改过品类时，输入名称按常见归类自动选择；归类层已被改名则不强行切换
      let catTouched = !!draft.cat;
      catSel.addEventListener('change', () => { catTouched = true; });
      $('#itName', node).addEventListener('input', () => {
        if (catTouched) return;
        const g = guessCategory($('#itName', node).value);
        if (layerNames.includes(g)) catSel.value = g;
      });
    }
    $('#itPrice', node).value = draft.price ? String(draft.price) : '';
    $('#itPieces', node).value = draft.piecesPerUnit || '';
    $('#itNote', node).value = draft.note;
    const unitSel = $('#itUnit', node);
    const piecesField = $('#itPiecesField', node);
    const syncPiecesField = () => { piecesField.hidden = unitSel.value !== '斤'; };
    unitSel.innerHTML = ITEM_PRICE_UNITS.map((u) =>
      `<option value="${esc(u)}" ${u === draft.priceUnit ? 'selected' : ''}>${esc(u)}</option>`
    ).join('');
    if (draft.priceUnit && !ITEM_PRICE_UNITS.includes(draft.priceUnit)) {
      unitSel.innerHTML = `<option value="${esc(draft.priceUnit)}" selected>${esc(draft.priceUnit)}</option>` + unitSel.innerHTML;
    }
    syncPiecesField();
    unitSel.addEventListener('change', syncPiecesField);

    $('#itCancel', node).addEventListener('click', closeSheet);
    $('#itSave', node).addEventListener('click', () => {
      const name = $('#itName', node).value.trim();
      if (!name) { toast('先填一下名称'); $('#itName', node).focus(); return; }
      const price = parseFloat($('#itPrice', node).value) || 0;
      const priceUnit = $('#itUnit', node).value || '个';
      const piecesRaw = $('#itPieces', node).value.trim();
      const piecesPerUnit = priceUnit === '斤' && piecesRaw !== '' ? (parseFloat(piecesRaw) || '') : '';
      const note = $('#itNote', node).value.trim();
      const cat = isStaple ? ($('#itCat', node).value || guessCategory(name)) : '';
      const existing = state.items.find((x) => x.id === draft.id);
      if (existing) Object.assign(existing, { name, price, priceUnit, piecesPerUnit, note, catalogId: draft.catalogId, cat });
      else state.items.push({ id: draft.id, name, price, priceUnit, piecesPerUnit, note, catalogId: draft.catalogId, cat });
      save(); closeSheet(); refreshAll();
      toast(existing ? '已保存修改' : '已添加「' + name + '」');
    });

    openSheetHTML(item ? '编辑条目' : '添加条目', node);
  }

  /* ---------------- 营养金字塔层级管理（重命名/排序/增删/左右拆格） ---------------- */
  function openPyramidEditor() {
    // 每行草稿：左格 name/color；split 时 right* 为右格；droppedRightOld 记录被合并掉的右格旧名
    // old/rightOld：打开时的格子名（新增为空串），保存时据此同步食材与菜品食材的 cat
    const draft = pyLayers().map((l) => ({
      old: l.name, name: l.name, color: cellColor(l, 'l'),
      split: layerSplit(l),
      rightOld: layerSplit(l) ? String(l.right.name).trim() : '',
      rightName: layerSplit(l) ? String(l.right.name).trim() : '',
      rightColor: layerSplit(l) ? cellColor(l, 'r') : '#8F867A',
      droppedRightOld: ''
    }));
    const deleted = []; // 整行被删除时，收集行内所有格子的旧名
    const node = document.createElement('div');

    function usedColors() {
      const s = new Set();
      draft.forEach((d) => { s.add(d.color); if (d.split) s.add(d.rightColor); });
      return s;
    }
    function pickColor() {
      const used = usedColors();
      const free = PYRAMID_PALETTE.find((c) => !used.has(c));
      if (free) return free;
      let h = 0;
      const seed = '层级' + Date.now() + draft.length;
      for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
      return PYRAMID_PALETTE[h % PYRAMID_PALETTE.length];
    }

    const SPLIT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M12 5v14"/></svg>';
    // 越靠上的层越窄（底层宽度 = 8 + 90*(i+1)/n %），太窄时拆两格文字放不下，禁止拆分
    const SPLIT_MIN_W = 30;
    const canSplit = (i) => (8 + 90 * (i + 1) / draft.length) >= SPLIT_MIN_W;

    function renderRows() {
      const slot = $('#pyRows', node);
      if (!slot) return;
      slot.innerHTML = draft.map((d, i) => `
        <div class="pyr-edit-row ${d.split ? 'is-split' : ''}" data-i="${i}">
          <div class="pyr-edit-cells">
            <div class="pyr-edit-cell">
              <span class="pyr-edit-dot" style="background:${d.color}"></span>
              <input class="pyr-edit-name" type="text" maxlength="10" data-side="l" value="${esc(d.name)}" placeholder="左格名称">
            </div>
            <div class="pyr-edit-cell pyr-edit-cell-r" ${d.split ? '' : 'hidden'}>
              <span class="pyr-edit-dot" style="background:${d.rightColor}"></span>
              <input class="pyr-edit-name" type="text" maxlength="10" data-side="r" value="${esc(d.rightName)}" placeholder="右格名称">
            </div>
          </div>
          <span class="pyr-order">
            <button class="pyr-order-btn" type="button" data-move="up" ${i === 0 ? 'disabled' : ''} aria-label="上移">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            </button>
            <button class="pyr-order-btn" type="button" data-move="down" ${i === draft.length - 1 ? 'disabled' : ''} aria-label="下移">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </span>
          <button class="pyr-split-btn ${d.split ? 'is-on' : ''}" type="button" data-split
            ${(!d.split && !canSplit(i)) ? 'disabled title="这一层太窄，拆成两格会显示不开"' : `title="${d.split ? '合并为一格' : '拆成左右两格'}" aria-label="${d.split ? '合并为一格' : '拆成左右两格'}"`}>${SPLIT_ICON}</button>
          <button class="pyr-edit-del" type="button" data-del="${i}" ${draft.length === 1 ? 'disabled' : ''} aria-label="删除层级">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          </button>
        </div>`).join('');
      slot.querySelectorAll('.pyr-edit-name').forEach((inp) => {
        inp.addEventListener('input', () => {
          const d = draft[Number(inp.closest('.pyr-edit-row').dataset.i)];
          if (inp.dataset.side === 'r') d.rightName = inp.value;
          else d.name = inp.value;
        });
      });
      slot.querySelectorAll('.pyr-order-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = Number(btn.closest('.pyr-edit-row').dataset.i);
          const j = btn.dataset.move === 'up' ? i - 1 : i + 1;
          if (j < 0 || j >= draft.length) return;
          [draft[i], draft[j]] = [draft[j], draft[i]];
          renderRows();
        });
      });
      slot.querySelectorAll('.pyr-split-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = Number(btn.closest('.pyr-edit-row').dataset.i);
          const d = draft[i];
          if (!d.split && !canSplit(i)) { toast('这一层太窄，拆成两格会显示不开'); return; }
          if (d.split) {
            const rn = d.rightName.trim() || d.rightOld;
            const ln = d.name.trim() || d.old;
            if (rn && !confirm('把右格「' + rn + '」合并进左格「' + ln + '」？右格里的食材都会移到左格。')) return;
            d.split = false;
            if (d.rightOld) d.droppedRightOld = d.rightOld;
            d.rightOld = ''; d.rightName = '';
            renderRows();
          } else {
            d.split = true;
            d.droppedRightOld = '';
            d.rightOld = ''; d.rightName = ''; d.rightColor = pickColor();
            renderRows();
            const row = slot.querySelector('.pyr-edit-row[data-i="' + i + '"]');
            const inp = row && row.querySelector('.pyr-edit-cell-r input');
            if (inp) inp.focus();
          }
        });
      });
      slot.querySelectorAll('.pyr-edit-del').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = Number(btn.dataset.del);
          if (draft.length === 1) return;
          const row = draft[i];
          const label = row.split
            ? '「' + (row.name || row.old) + '」和「' + (row.rightName || row.rightOld) + '」'
            : '「' + (row.name || row.old) + '」';
          if (!confirm('删除这一层（' + label + '）？其下食材将并入最上层。')) return;
          if (row.old) deleted.push(row.old);
          if (row.rightOld) deleted.push(row.rightOld);
          draft.splice(i, 1);
          renderRows();
        });
      });
    }

    node.innerHTML = `
      <div class="field-hint" style="margin-bottom:10px">越靠上越要少吃，越靠下建议多吃。每层可改名、排序、增删，也可点分栏按钮拆成<b>左右两格</b>，各放一个类别。</div>
      <div id="pyRows" class="pyr-edit-list"></div>
      <button class="add-ing-btn" type="button" id="pyAdd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        添加一层
      </button>
      <div class="sheet-actions">
        <button class="btn btn-ghost" type="button" id="pyCancel">取消</button>
        <button class="btn btn-primary" type="button" id="pySave">保存</button>
      </div>`;

    renderRows();

    $('#pyAdd', node).addEventListener('click', () => {
      draft.push({ old: '', name: '', color: pickColor(), split: false, rightOld: '', rightName: '', rightColor: '#8F867A', droppedRightOld: '' });
      renderRows();
      const rows = node.querySelectorAll('.pyr-edit-name');
      const last = rows[rows.length - 1];
      if (last) last.focus();
    });
    $('#pyCancel', node).addEventListener('click', closeSheet);
    $('#pySave', node).addEventListener('click', () => {
      const finalNames = [];
      draft.forEach((d) => {
        finalNames.push(d.name.trim());
        if (d.split) finalNames.push(d.rightName.trim());
      });
      if (finalNames.some((nm) => !nm)) { toast('每一格都要有名称；不需要右格可点分栏按钮合并'); return; }
      if (new Set(finalNames).size !== finalNames.length) { toast('各格名称不能重复'); return; }
      const target = draft[0].name.trim(); // 整行被删时，其食材并入最上层左格

      // 仍保留格子的改名映射；整行删除 → 最上层；右格合并 → 同层左格
      const renameMap = new Map();
      const removeMap = new Map();
      draft.forEach((d) => {
        const ln = d.name.trim();
        if (d.old && d.old !== ln) renameMap.set(d.old, ln);
        if (d.split) {
          const rn = d.rightName.trim();
          if (d.rightOld && d.rightOld !== rn) renameMap.set(d.rightOld, rn);
        } else if (d.droppedRightOld) {
          removeMap.set(d.droppedRightOld, ln);
        }
      });
      deleted.forEach((nm) => removeMap.set(nm, target));
      const migrateCat = (cat) => {
        if (!cat) return cat;
        return removeMap.get(cat) || renameMap.get(cat) || cat;
      };

      state.items.forEach((it) => { if (it.catalogId === 'cat-staple') it.cat = migrateCat(it.cat || guessCategory(it.name)); });
      state.recipes.forEach((r) => (r.ings || []).forEach((i2) => { i2.cat = migrateCat(i2.cat || guessCategory(i2.name)); }));
      state.pyramidLayers = draft.map((d) => {
        const row = { name: d.name.trim(), color: d.color || pickColor() };
        if (d.split) {
          row.split = true;
          row.right = { name: d.rightName.trim(), color: d.rightColor || pickColor() };
        }
        return row;
      });

      // 当前正停留在被改名/删除/合并的格子里时，跟着切换或退回金字塔
      if (stapleSubCat !== '__all__') {
        const next = migrateCat(stapleSubCat);
        stapleSubCat = pyNames().includes(next) ? next : '__all__';
      }
      const mergedCount = draft.reduce((n, d) => n + (d.droppedRightOld ? 1 : 0), 0);
      save(); closeSheet(); refreshAll();
      let msg;
      if (deleted.length) msg = '已保存，删除层的食材并入「' + target + '」';
      else if (mergedCount) msg = '已保存，右格食材已并入对应左格';
      else msg = '金字塔层级已更新';
      toast(msg);
    });

    openSheetHTML('管理层级', node);
  }

  /* ---------------- 菜品子分类管理弹层 ---------------- */
  function openDishCatManager() {
    const DISH_CAT_PALETTE = ['#D9A441', '#5F8D4E', '#4E7FA8', '#E0533D', '#8A6F9E', '#A07E4F', '#6FA8A0', '#B0796E'];
    // draft: {id, oldName, name, color}
    const draft = state.dishCats.map((c) => ({ id: c.id, oldName: c.name, name: c.name, color: c.color || DISH_CAT_PALETTE[0] }));
    const deleted = []; // 被删分类的 id
    const node = document.createElement('div');

    function usedColors() { return new Set(draft.map((d) => d.color)); }
    function pickColor() {
      const used = usedColors();
      const free = DISH_CAT_PALETTE.find((c) => !used.has(c));
      return free || DISH_CAT_PALETTE[draft.length % DISH_CAT_PALETTE.length];
    }

    function renderRows() {
      const slot = $('#dcRows', node);
      if (!slot) return;
      slot.innerHTML = draft.map((d, i) => `
        <div class="pyr-edit-row" data-i="${i}">
          <div class="pyr-edit-cells">
            <div class="pyr-edit-cell">
              <span class="pyr-edit-dot" style="background:${d.color}" data-color></span>
              <input class="pyr-edit-name" type="text" maxlength="10" value="${esc(d.name)}" placeholder="分类名称">
            </div>
          </div>
          <span class="pyr-order">
            <button class="pyr-order-btn" type="button" data-move="up" ${i === 0 ? 'disabled' : ''} aria-label="上移">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            </button>
            <button class="pyr-order-btn" type="button" data-move="down" ${i === draft.length - 1 ? 'disabled' : ''} aria-label="下移">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </span>
          <button class="pyr-split-btn" type="button" data-color-btn aria-label="换颜色" title="换颜色">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.52-4.5-10-10-10Z"/></svg>
          </button>
          <button class="pyr-edit-del" type="button" data-del="${i}" ${draft.length <= 1 ? 'disabled' : ''} aria-label="删除分类">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          </button>
        </div>`).join('');
      slot.querySelectorAll('.pyr-edit-name').forEach((inp) => {
        inp.addEventListener('input', () => {
          const d = draft[Number(inp.closest('.pyr-edit-row').dataset.i)];
          d.name = inp.value;
        });
      });
      slot.querySelectorAll('.pyr-order-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = Number(btn.closest('.pyr-edit-row').dataset.i);
          const j = btn.dataset.move === 'up' ? i - 1 : i + 1;
          if (j < 0 || j >= draft.length) return;
          [draft[i], draft[j]] = [draft[j], draft[i]];
          renderRows();
        });
      });
      slot.querySelectorAll('[data-color-btn]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const d = draft[Number(btn.closest('.pyr-edit-row').dataset.i)];
          const palette = DISH_CAT_PALETTE.filter((c) => !usedColors().has(c) || c === d.color);
          const idx = palette.indexOf(d.color);
          d.color = palette[(idx + 1) % palette.length] || pickColor();
          renderRows();
        });
      });
      slot.querySelectorAll('.pyr-edit-del').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = Number(btn.dataset.del);
          if (draft.length <= 1) return;
          const d = draft[i];
          if (!confirm('删除分类「' + (d.name || d.oldName) + '」？其下菜品将并入首个分类。')) return;
          deleted.push(d.id);
          draft.splice(i, 1);
          renderRows();
        });
      });
    }

    node.innerHTML = `
      <div class="field-hint" style="margin-bottom:10px">管理菜品分类。每项可改名、换色、排序、增删。删除时其下菜品自动并入首个分类，不会丢失。</div>
      <div id="dcRows" class="pyr-edit-list"></div>
      <button class="add-ing-btn" type="button" id="dcAdd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        添加分类
      </button>
      <div class="sheet-actions">
        <button class="btn btn-ghost" type="button" id="dcCancel">取消</button>
        <button class="btn btn-primary" type="button" id="dcSave">保存</button>
      </div>`;

    renderRows();

    $('#dcAdd', node).addEventListener('click', () => {
      draft.push({ id: uid('dc'), oldName: '', name: '', color: pickColor() });
      renderRows();
      const rows = node.querySelectorAll('.pyr-edit-name');
      const last = rows[rows.length - 1];
      if (last) last.focus();
    });
    $('#dcCancel', node).addEventListener('click', closeSheet);
    $('#dcSave', node).addEventListener('click', () => {
      const names = draft.map((d) => d.name.trim());
      if (names.some((nm) => !nm)) { toast('每个分类都要有名称'); return; }
      if (new Set(names).size !== names.length) { toast('分类名称不能重复'); return; }
      // 删除的分类：其下菜品迁入首个保留分类
      const survivorId = draft.length ? draft[0].id : null;
      if (survivorId && deleted.length) {
        state.recipes.forEach((r) => { if (deleted.includes(r.dishCat)) r.dishCat = survivorId; });
      }
      // 更新分类数组
      state.dishCats = draft.map((d) => ({ id: d.id, name: d.name.trim(), color: d.color, system: !!(dishCatById(d.id) && dishCatById(d.id).system) }));
      // 当前选中分类被删 → 切到首个
      if (deleted.includes(currentDishCat)) currentDishCat = survivorId;
      save(); closeSheet(); refreshAll();
      toast(deleted.length ? '已保存，删除分类的菜品已并入首个分类' : '菜品分类已更新');
    });

    openSheetHTML('管理菜品分类', node);
  }

  /* ---------------- 新建大分类弹层 ---------------- */
  function openCatalogEditor() {
    const draft = { name: '', type: 'item' };
    const node = document.createElement('div');
    node.innerHTML = `
      <div class="field">
        <label for="catName">分类名称</label>
        <input type="text" id="catName" placeholder="例如：日用 / 水果" maxlength="12">
      </div>
      <div class="field">
        <label>分类类型</label>
        <div class="type-pick">
          <button class="type-opt is-active" type="button" data-type="item">
            <span class="type-title">单条目+价格</span>
            <span class="type-desc">如酒水/零食：每条记单价，可勾选加入清单</span>
          </button>
          <button class="type-opt" type="button" data-type="recipe">
            <span class="type-title">菜品型</span>
            <span class="type-desc">像「菜品」一样：每条是一道菜，含食材组合</span>
          </button>
        </div>
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost" type="button" id="catCancel">取消</button>
        <button class="btn btn-primary" type="button" id="catSave">创建</button>
      </div>`;
    node.querySelectorAll('.type-opt').forEach((b) => {
      b.addEventListener('click', () => {
        draft.type = b.dataset.type;
        node.querySelectorAll('.type-opt').forEach((x) => x.classList.toggle('is-active', x === b));
      });
    });
    $('#catCancel', node).addEventListener('click', closeSheet);
    $('#catSave', node).addEventListener('click', () => {
      const name = $('#catName', node).value.trim();
      if (!name) { toast('先填分类名称'); $('#catName', node).focus(); return; }
      if (state.catalogs.some((c) => c.name === name)) { toast('已有同名分类'); return; }
      const palette = ['#8A6F9E', '#5F8D4E', '#4E7FA8', '#D9A441', '#A07E4F', '#8E7CC3'];
      const cat = {
        id: uid('cat'), name, type: draft.type, system: false,
        color: palette[state.catalogs.length % palette.length]
      };
      state.catalogs.push(cat);
      currentCatalogId = cat.id;
      save(); closeSheet(); refreshAll();
      toast('已创建分类「' + name + '」');
    });
    openSheetHTML('新建分类', node);
    setTimeout(() => $('#catName', node).focus(), 260);
  }

  /* ---------------- 视图：设置 ---------------- */
  const settingsView = $('#view-settings');

  settingsView.innerHTML = `
    <div class="section-title">安装</div>
    <div class="settings-group">
      <button class="settings-row" type="button" id="btnInstall" style="display:none">
        <span class="sr-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
        </span>
        <span class="sr-main"><b>安装到手机桌面</b><span>像普通 App 一样全屏、离线使用</span></span>
        <span class="sr-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg></span>
      </button>
      <button class="settings-row" type="button" id="btnInstallHelp">
        <span class="sr-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </span>
        <span class="sr-main"><b>安装帮助</b><span>安卓 / iPhone 分别怎么装到桌面</span></span>
        <span class="sr-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg></span>
      </button>
    </div>

    <div class="section-title">数据</div>
    <div class="settings-group">
      <button class="settings-row" type="button" id="btnExport">
        <span class="sr-icon gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>
        </span>
        <span class="sr-main"><b>导出备份</b><span>下载 JSON 文件，换手机也不怕丢</span></span>
        <span class="sr-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg></span>
      </button>
      <button class="settings-row" type="button" id="btnImport">
        <span class="sr-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
        </span>
        <span class="sr-main"><b>导入备份</b><span class="sr-desc">从 JSON 文件恢复菜品和数据</span></span>
        <span class="sr-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg></span>
      </button>
      <button class="settings-row" type="button" id="btnResetSample">
        <span class="sr-icon grey">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </span>
        <span class="sr-main"><b>恢复示例菜谱</b><span>重置为内置的 28 道营养菜与一周规划</span></span>
        <span class="sr-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg></span>
      </button>
      <button class="settings-row danger" type="button" id="btnWipe">
        <span class="sr-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
        </span>
        <span class="sr-main"><b>清空所有数据</b><span>删除全部菜品、选菜和勾选记录</span></span>
        <span class="sr-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg></span>
      </button>
    </div>
    <input type="file" id="importFile" accept="application/json,.json" class="hidden-file">

    <div class="section-title">说明</div>
    <div class="note-card">
      所有菜品和清单数据只保存在<b>本设备</b>中，不会上传到任何服务器。卸载应用、清理浏览器数据可能导致丢失，建议定期导出备份。
    </div>
    <div class="about">买菜清单 v1.0<br>选好菜，照着买，不落下一样</div>`;

  $('#btnExport', settingsView).addEventListener('click', exportData);
  $('#btnImport', settingsView).addEventListener('click', () => $('#importFile', settingsView).click());
  $('#importFile', settingsView).addEventListener('change', importData);
  $('#btnResetSample', settingsView).addEventListener('click', () => {
    if (confirm('恢复示例将覆盖你当前的所有数据（含分类、菜品、条目和一周规划），确定继续吗？')) {
      state.catalogs = SYSTEM_CATALOGS.map(c => ({ ...c }));
      state.dishCats = DEFAULT_DISH_CATS.map(c => ({ ...c }));
      state.recipes = sampleRecipes();
      state.items = sampleItems();
      state.sel = {};
      state.checked = {};
      state.itemSel = {};
      state.mealPlan = JSON.parse(JSON.stringify(SAMPLE_MEAL_PLAN));
      state.pyramidLayers = defaultPyramidLayers();
      stapleSubCat = '__all__';
      currentCatalogId = 'cat-recipe';
      save(); refreshAll();
      toast('已恢复示例数据');
    }
  });
  $('#btnWipe', settingsView).addEventListener('click', () => {
    if (confirm('将删除全部菜品、条目和记录，且无法恢复。确定吗？')) {
      state.catalogs = SYSTEM_CATALOGS.map(c => ({ ...c }));
      state.recipes = [];
      state.items = [];
      state.sel = {};
      state.checked = {};
      state.itemSel = {};
      state.mealPlan = {};
      state.pyramidLayers = defaultPyramidLayers();
      stapleSubCat = '__all__';
      currentCatalogId = 'cat-recipe';
      save(); refreshAll();
      toast('已清空全部数据');
    }
  });
  $('#btnInstallHelp', settingsView).addEventListener('click', openInstallHelp);
  $('#btnInstall', settingsView).addEventListener('click', async () => {
    if (!deferredPrompt) return;
    const btn = $('#btnInstall', settingsView);
    btn.style.display = 'none';
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });

  function exportData() {
    const payload = JSON.stringify({
      app: 'maicai-shopping', v: 2,
      exportedAt: new Date().toISOString(),
      catalogs: state.catalogs,
      recipes: state.recipes,
      items: state.items,
      pyramidLayers: state.pyramidLayers,
      dishCats: state.dishCats,
      mealPlan: state.mealPlan
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    a.href = URL.createObjectURL(blob);
    a.download = '买菜清单备份-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('备份文件已下载');
  }

  function importData(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        // 新格式：含 catalogs/recipes/items
        if (Array.isArray(data.catalogs) && Array.isArray(data.recipes)) {
          const recipes = data.recipes.filter((r) => r && typeof r.name === 'string');
          const items = Array.isArray(data.items) ? data.items.filter((it) => it && typeof it.name === 'string') : [];
          if (!confirm('导入将替换当前数据（' + state.recipes.length + ' 菜品 / ' + state.items.length + ' 条目），确定继续吗？')) return;
          state.catalogs = data.catalogs.length ? data.catalogs : SYSTEM_CATALOGS.map(c => ({ ...c }));
          state.recipes = recipes.map((r) => ({
            id: r.id || uid('r'),
            catalogId: r.catalogId || 'cat-recipe',
            dishCat: r.dishCat || '',
            name: r.name,
            ings: (Array.isArray(r.ings) ? r.ings : []).map((i) => ({
              id: i.id || uid('i'),
              name: String(i.name || ''),
              qty: String(i.qty || ''),
              unit: String(i.unit || ''),
              cat: i.cat || guessCategory(i.name),
              stapleId: i.stapleId || undefined
            })).filter((i) => i.name)
          }));
          state.items = items.map((it) => ({
            id: it.id || uid('it'),
            catalogId: it.catalogId || 'cat-staple',
            name: it.name,
            price: Number(it.price) || 0,
            priceUnit: it.priceUnit || '个',
            piecesPerUnit: it.piecesPerUnit || '',
            note: it.note || '',
            cat: it.cat || ((it.catalogId || 'cat-staple') === 'cat-staple' ? guessCategory(it.name) : '')
          }));
          state.sel = {}; state.checked = {}; state.itemSel = {};
          // 恢复备份中的一周饮食规划（兼容旧备份无 mealPlan 字段；容忍旧格式单 id 字符串）
          state.mealPlan = {};
          if (data.mealPlan && typeof data.mealPlan === 'object') {
            Object.keys(data.mealPlan).forEach((k) => {
              const v = data.mealPlan[k];
              if (typeof v === 'string') state.mealPlan[k] = v;
              else if (Array.isArray(v)) {
                const arr = v.filter((x) => typeof x === 'string');
                if (arr.length) state.mealPlan[k] = arr;
              }
            });
          }
          // 备份中带了自定义层级就采用，否则回到默认层级（旧备份的食材分类均为内置名）
          hydratePyramidLayers(data);
          hydrateDishCats(data);
          migrateRecipeDishCats();
          stapleSubCat = '__all__';
          currentDishCat = null;
          currentCatalogId = 'cat-recipe';
          save(); refreshAll();
          const plannedMeals = Object.keys(state.mealPlan).filter((k) => getPlanDishes(k).length > 0).length;
          toast('已导入 ' + state.recipes.length + ' 菜品 / ' + state.items.length + ' 条目 / ' + plannedMeals + ' 餐规划');
          return;
        }
        // 旧格式：只有 recipes（数组或 {recipes}）
        const recipes = Array.isArray(data) ? data : data.recipes;
        if (!Array.isArray(recipes) || !recipes.every((r) => r && typeof r.name === 'string')) {
          throw new Error('格式不正确');
        }
        const clean = recipes.map((r) => ({
          id: r.id || uid('r'),
          catalogId: 'cat-recipe',
          name: r.name,
          ings: (Array.isArray(r.ings) ? r.ings : []).map((i) => ({
            id: i.id || uid('i'),
            name: String(i.name || ''),
            qty: String(i.qty || ''),
            unit: String(i.unit || ''),
            cat: i.cat || guessCategory(i.name)
          })).filter((i) => i.name)
        }));
        if (!confirm('导入将替换当前的 ' + state.recipes.length + ' 道菜，确定继续吗？')) return;
        state.catalogs = SYSTEM_CATALOGS.map(c => ({ ...c }));
        state.dishCats = DEFAULT_DISH_CATS.map(c => ({ ...c }));
        state.recipes = clean;
        migrateRecipeDishCats();
        state.items = extractStaples(clean);
        state.sel = {}; state.checked = {}; state.itemSel = {}; state.mealPlan = {};
        currentDishCat = null;
        currentCatalogId = 'cat-recipe';
        save(); refreshAll();
        toast('已导入 ' + clean.length + ' 道菜');
      } catch (err) {
        toast('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
  }

  function openInstallHelp() {
    const node = document.createElement('div');
    node.className = 'help-body';
    node.innerHTML = `
      <h4>安卓手机（Chrome / Edge / 华为浏览器等）</h4>
      <ol>
        <li>用浏览器打开本应用页面</li>
        <li>点击浏览器右上角的 <kbd>⋮</kbd> 菜单</li>
        <li>选择「<b>添加到主屏幕</b>」或「安装应用」</li>
        <li>桌面出现「买菜清单」图标，点开即全屏运行</li>
      </ol>
      <h4>苹果 iPhone（用 Safari 打开）</h4>
      <ol>
        <li>必须使用系统自带的 <b>Safari</b> 浏览器打开本页面</li>
        <li>点击底部的 <b>分享</b> 按钮 <kbd>􀈂</b>（方框向上箭头）</li>
        <li>在弹出的菜单里选择「<b>添加到主屏幕</b>」</li>
        <li>点击右上角「添加」，桌面即出现应用图标</li>
      </ol>
      <h4>电脑 Chrome / Edge</h4>
      <ol>
        <li>打开本应用后，地址栏右侧会出现「安装」图标</li>
        <li>点击即可作为桌面应用安装</li>
      </ol>
      <p style="margin-top:14px;color:var(--muted);font-size:13px">提示：安装后完全离线可用，数据保存在本机。iPhone 请务必用 Safari，微信内置浏览器不支持安装。</p>`;
    openSheetHTML('如何安装到桌面', node);
  }

  /* ---------------- 导航 ---------------- */
  const TITLES = { list: '购物清单', pick: '今天做点什么', plan: '本周饮食规划', recipes: '菜品库', settings: '设置' };
  let currentView = 'list';

  function switchView(name) {
    currentView = name;
    document.querySelectorAll('.view').forEach((v) => {
      v.hidden = v.dataset.view !== name;
    });
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('is-active', t.dataset.tab === name);
    });
    $('#viewTitle').textContent = TITLES[name] || '';
    window.scrollTo(0, 0);
    renderTopbarAction();
    fab.style.display = name === 'recipes' ? 'grid' : 'none';
    if (name === 'list') renderList();
    if (name === 'pick') { renderPickBanner(); renderPickList(); }
    if (name === 'plan') renderPlan();
    if (name === 'recipes') renderRecipes();
  }

  document.querySelectorAll('.tab').forEach((t) => {
    t.addEventListener('click', () => switchView(t.dataset.tab));
  });

  /* 顶栏右侧动作：选菜页清空 / 菜品库页添加 */
  function renderTopbarAction() {
    const slot = $('#topbarAction');
    slot.innerHTML = '';
    if (currentView === 'pick' && selectedCount() > 0) {
      const b = document.createElement('button');
      b.className = 'btn btn-text muted';
      b.textContent = '清空选择';
      b.addEventListener('click', () => {
        if (confirm('清空当前选择的所有菜吗？')) {
          state.sel = {};
          save();
          renderPickList(); renderPickBanner(); refreshBadge(); renderTopbarAction();
          toast('已清空选择');
        }
      });
      slot.appendChild(b);
    }
  }

  /* 悬浮添加按钮（菜品库页，按当前分类 type 触发对应编辑器） */
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.setAttribute('aria-label', '添加');
  fab.style.display = 'none';
  fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
  fab.addEventListener('click', () => {
    const cat = currentCatalog();
    if (cat.type === 'recipe') openEditor(null, cat.id);
    else openItemEditor(null, cat.id);
  });
  $('#app').appendChild(fab);

  /* 底部标签红点：选中菜数 */
  function refreshBadge() {
    const badge = $('#tabBadge');
    const n = selectedCount();
    if (n > 0) { badge.hidden = false; badge.textContent = n; }
    else badge.hidden = true;
  }

  function refreshAll() {
    renderList();
    renderPickBanner(); renderPickList();
    renderPlan();
    renderRecipes();
    renderTopbarAction();
    refreshBadge();
  }

  /* ---------------- 虚拟键盘适配（兜底） ----------------
     APK 里由原生层把键盘高度设为 WebView margin（视口直接缩小，--kb 稳定为 0）；
     浏览器/iOS 等原生缩放不生效的场景，用 visualViewport 算键盘高度抬弹层。
     必须防抖：键盘动画期间 innerHeight 与 vv.height 时序错位会产生瞬时差值，
     逐帧应用会让弹层 bottom 来回抽动；只在动画结束、数值稳定后应用一次 */
  if (window.visualViewport) {
    const vv = window.visualViewport;
    let kbTimer = 0;
    const applyKB = () => {
      const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      document.documentElement.style.setProperty('--kb', kb + 'px');
    };
    const scheduleKB = () => {
      clearTimeout(kbTimer);
      kbTimer = setTimeout(applyKB, 120);
    };
    vv.addEventListener('resize', scheduleKB);
    vv.addEventListener('scroll', scheduleKB);
    applyKB();
  }

  /* ---------------- PWA ---------------- */
  let deferredPrompt = null;

  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !window.Capacitor) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    $('#btnInstall', settingsView).style.display = '';
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    $('#btnInstall', settingsView).style.display = 'none';
    toast('安装成功，桌面见！');
  });
  // iPhone 上没有安装按钮，直接引导看帮助
  if (isIOS && !(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)) {
    setTimeout(() => toast('点底部分享键，可把应用添加到主屏幕'), 1200);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mask.hidden) closeSheet();
  });

  /* ---------------- 启动 ---------------- */
  load();
  // 兼容旧数据：给缺少细分品类的食材补 cat
  let catsBackfilled = false;
  state.items.forEach((it) => {
    if (it.catalogId === 'cat-staple' && !it.cat) { it.cat = guessCategory(it.name); catsBackfilled = true; }
  });
  if (catsBackfilled) save();
  refreshAll();
  switchView('list');
})();
