/**
 * 生成《2027 生涯探索年历 · 月度 / 年度结论分析》交互页（单文件、零外链、离线可用）
 * 用法（在 Skill 根目录）：
 *   node scripts/build_review.mjs
 *   node scripts/build_review.mjs --data ../assets/data/xxx.json --out ../out/site
 *
 * 逻辑全部来自 scripts/analysis_engine.mjs（与打印版 print_review.html 同源），
 * 本脚本只负责：注入数据 + 内联引擎 + 落盘 + 自检。
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
function argOf(name, dflt) {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
}

const DATA_PATH = path.resolve(HERE, argOf('data', '../assets/data/2027生涯探索年历_data.json'));
const TPL_PATH = path.resolve(HERE, argOf('tpl', '../assets/tpl/analysis.html'));
const OUT_DIR = path.resolve(HERE, argOf('out', '../out/site'));
const OUT_FILE = path.join(OUT_DIR, 'analysis.html');

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
if (!fs.existsSync(TPL_PATH)) {
  console.error('模板不存在：', TPL_PATH);
  process.exit(1);
}
const tpl = fs.readFileSync(TPL_PATH, 'utf8');

/* 交互页只需要「月结构 + 卡名 + 日页归属」，不必注入全量正文，避免单文件过大 */
const slimCards = {};
for (const [k, v] of Object.entries(data.cards || {})) {
  slimCards[k] = { code: v.code || k, name: v.name || k, star: !!v.star };
  /* R02 季度路线体检：五指标原文由数据层提供（季度复盘区直接引用，不另写文案） */
  if (k === 'R02') {
    slimCards[k].steps = v.steps || [];
    slimCards[k].actions = (v.actions || []).map((a) => ({ idx: a.idx, title: a.title, desc: a.desc, minutes: a.minutes }));
    slimCards[k].minutes = v.minutes || '';
    slimCards[k].materials = v.materials || '';
    slimCards[k].output = v.output || '';
  }
}
const slim = {
  meta: data.meta || {},
  months: data.months || [],
  cards: slimCards,
  days: (data.days || []).map((d) => ({ date: d.date, month: d.month, card: d.card, type: d.type })),
  major_days: new Array(((data.major_days) || []).length).fill(0),
};

const rawEngine = fs.readFileSync(path.join(HERE, 'analysis_engine.mjs'), 'utf8');
const engine = rawEngine
  .split('\n')
  .filter((line) => !/^export\s/.test(line))
  .join('\n');

const safeJson = JSON.stringify(slim).replace(/<\//g, '<\\/');

let html = tpl
  .replace('/*__DATA__*/', safeJson)
  .replace('/*__ENGINE__*/', engine)
  .replace(/__TITLE__/g, '2027 生涯探索年历 · 月度 / 季度 / 年度结论分析');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, html, 'utf8');

/* 自检 */
const checks = [];
const read = fs.readFileSync(OUT_FILE, 'utf8');
checks.push(['数据已注入', read.includes('"months"') && read.indexOf('__DATA__') < 0]);
checks.push(['引擎已内联', read.includes('function buildModels') && read.includes('function yearConclusion') && read.includes('function quarterConclusion')]);
checks.push(['季度区已挂载', read.includes('id="qGrid"') && read.includes('function buildQCard')]);
checks.push(['R02 五指标已注入', read.includes('本季计划动作完成率')]);
checks.push(['占位符无残留', !/__TITLE__|__DATA__|__ENGINE__/.test(read)]);
checks.push(['无 export 残留', !/^export\s/m.test(read)]);
checks.push(['零外链', !/(src|href)\s*=\s*["']https?:/i.test(read)]);
checks.push(['含打印样式', read.includes('@media print')]);
checks.push(['含落盘/重置控件', read.includes('btnPrint') && read.includes('btnReset')]);

const months = (data.months || []).length;
const days = (data.days || []).length;
const cards = Object.keys(data.cards || {}).length;

console.log('数据:', DATA_PATH);
console.log('模板:', TPL_PATH);
console.log('输出:', OUT_FILE, `${Math.round(Buffer.byteLength(html) / 1024)} KB`);
console.log(`规模: ${months} 个月 / ${days} 天 / ${cards} 张工具卡`);
let bad = 0;
for (const [name, ok] of checks) {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${name}`);
  if (!ok) bad++;
}
if (bad) {
  console.error(`自检失败 ${bad} 项`);
  process.exit(1);
}
console.log('自检通过');
