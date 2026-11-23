/**
 * build_print.mjs — 2027 生涯探索年历 · A4 四合一打印版生成器
 *
 * 版式：一张 A4 纵向排 4 个 A5 页（2 列 × 2 行），每格 105 × 148.5 mm，
 *       A5 原稿 148 × 210 mm 等比缩放 0.70946 置入，四边留裁切线，无装订孔位。
 *
 * 用法：
 *   node build_print.mjs                        # 默认读同目录 2027生涯探索年历_data.json，输出到同目录
 *   node build_print.mjs --data xxx.json --out ./print
 *
 * 产物：
 *   print_index.html      屏幕入口（打印设置说明，本身不用于打印）
 *   print_year.html       全年：12 个月封面 + 365 天，共 377 个 A5 页
 *   print_m01..m12.html   按月分册：月封面 + 当月日页
 *   print_majors.html     24 个专业专属日
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { buildModels, monthConclusion, quarterConclusion, yearConclusion } from './analysis_engine.mjs';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));

function argOf(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
const DATA_PATH = path.resolve(HERE, argOf('data', '../assets/data/2027生涯探索年历_data.json'));
const OUT_DIR = path.resolve(HERE, argOf('out', '../out/print'));

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const MONTHS = data.months || [];
const DAYS = (data.days || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
const MAJORS = data.major_days || [];
const CARDS = data.cards || {};
const META = data.meta || {};

const COLOR = {
  锚定日: '#B4553C', 归档日: '#6B7A8F', 专业专属日: '#7C6AA8', 节气观察: '#2E7D6F',
  季度体检: '#C9A227', 周闭环: '#3F6E8C', 工具卡日: '#0F3D2E', 月度成果: '#B4553C', 弹性日: '#8A8F7E'
};
const LINE_NAME = { A: '升学', B: '就业', C: '创业', D: '考编', E: '参军' };

/* 结论分析模型：与网页版 analysis.html 共用 scripts/analysis_engine.mjs，口径唯一 */
const AM = buildModels(data);
const AMONTHS = AM.months;
const AQUARTERS = AM.quarters;
const AIND = AM.indicators || [];
const AYEAR = AM.year;

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CSS = `
:root{ --ink:#1f2a24; --sub:#5b625c; --paper:#fffdf8; --line:#ddd6c6; }
@page{ size:A4 portrait; margin:0; }
*{ box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
html,body{ margin:0; padding:0; }
body{ background:#e7e4dc; font-family:"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif; color:var(--ink); }
.screen-note{ max-width:210mm; margin:8mm auto 6mm; background:#fff; border:1px solid #d8d2c4; border-left:4px solid #0F3D2E; border-radius:4px; padding:10px 14px; font-size:13px; line-height:1.75; color:#33403a; }
.screen-note b{ color:#0F3D2E; }
.screen-note code{ background:#f2efe6; padding:1px 5px; border-radius:3px; font-size:12px; }
.a4{ width:210mm; height:297mm; background:#fff; display:grid; grid-template-columns:105mm 105mm; grid-template-rows:148.5mm 148.5mm; overflow:hidden; margin:0 auto 6mm; box-shadow:0 2px 10px rgba(0,0,0,.16); page-break-after:always; break-after:page; }
.cell{ position:relative; width:105mm; height:148.5mm; overflow:hidden; }
.cell::after{ content:""; position:absolute; inset:0; border:0.2mm dashed #cfc9ba; pointer-events:none; z-index:5; }
.sheet{ position:absolute; left:0; top:0; width:148mm; height:210mm; padding:8.5mm 8.5mm 6.5mm; background:var(--paper); transform:scale(0.707143); transform-origin:top left; display:flex; flex-direction:column; }
.sheet .top{ display:flex; align-items:flex-end; justify-content:space-between; gap:3mm; border-bottom:0.7mm solid var(--c,#0F3D2E); padding-bottom:1.8mm; }
.dt{ font-size:19pt; font-weight:800; line-height:1; letter-spacing:.3pt; }
.dt small{ font-size:8.6pt; font-weight:600; color:#6b7169; margin-left:1.6mm; letter-spacing:0; }
.meta{ text-align:right; line-height:1.55; }
.chip{ display:inline-block; background:var(--c); color:#fff; padding:0.5mm 2mm; border-radius:1mm; font-size:7pt; font-weight:700; letter-spacing:.2pt; }
.lines{ display:block; margin-top:1mm; font-size:6.8pt; color:#5b625c; }
.sheet h1{ font-size:13.6pt; line-height:1.34; font-weight:800; margin:2.8mm 0 1.8mm; letter-spacing:.2pt; }
.desc{ font-size:8.5pt; line-height:1.6; color:#2c352f; margin:0 0 2.2mm; }
.kv{ display:flex; flex-wrap:wrap; gap:1.4mm 2.6mm; font-size:7.4pt; color:#4a534c; margin-bottom:2mm; }
.kv i{ font-style:normal; color:#9aa19a; }
.cbox{ border:0.35mm solid var(--line); border-radius:1.2mm; background:#fff; padding:2.6mm 3mm 2.8mm; }
.cbox .ch{ display:flex; justify-content:space-between; align-items:baseline; gap:2mm; font-size:8pt; font-weight:800; color:#0F3D2E; border-bottom:0.3mm dashed var(--line); padding-bottom:1.3mm; margin-bottom:1.8mm; }
.cbox .ch em{ font-style:normal; font-size:6.8pt; font-weight:600; color:#7b837c; }
.pool{ font-size:7.3pt; line-height:1.5; color:#4a534c; margin:0 0 1.6mm; }
ol.steps{ margin:0; padding-left:4.4mm; font-size:7.5pt; line-height:1.52; }
ol.steps li{ margin-bottom:0.7mm; }
.out{ margin-top:1.6mm; font-size:7.3pt; color:#33403a; background:#f5f2e8; border-radius:0.8mm; padding:1.3mm 1.8mm; }
.out b{ color:#0F3D2E; }
.vars{ display:flex; gap:1.5mm; margin-top:1.8mm; }
.vars div{ flex:1; background:#f6f3ea; border-radius:1mm; padding:1.2mm 1.4mm; font-size:6.6pt; line-height:1.45; color:#4a534c; }
.vars div b{ display:block; color:#0F3D2E; font-size:6.8pt; margin-bottom:0.5mm; }
.hook{ margin-top:1.8mm; font-size:7.2pt; line-height:1.5; color:#7a5a3a; background:#fdf6ea; border-left:0.8mm solid #d9a55a; padding:1.6mm 2mm; }
.foot{ margin-top:auto; padding-top:1.2mm; border-top:0.25mm solid #e6e0d2; display:flex; justify-content:space-between; font-size:6.4pt; color:#9aa19a; letter-spacing:.2pt; }
/* 月封面 */
.sheet.mon{ justify-content:flex-start; }
.sheet.mon .mnum{ font-size:44pt; font-weight:800; line-height:.86; color:var(--c,#0F3D2E); letter-spacing:-1pt; }
.sheet.mon .mttl{ font-size:15pt; font-weight:800; margin-top:2mm; }
.sheet.mon .mq{ margin-top:3.5mm; font-size:9.4pt; line-height:1.65; color:#2c352f; background:#f5f2e8; border-left:1mm solid var(--c,#0F3D2E); padding:2.6mm 3mm; }
.mrow{ margin-top:2.4mm; font-size:7.8pt; line-height:1.55; color:#33403a; }
.mrow b{ color:#0F3D2E; display:inline-block; min-width:11mm; }
.pool-chips{ margin-top:3mm; display:flex; flex-wrap:wrap; gap:1.2mm; }
.pool-chips span{ background:#f0ece0; border-radius:0.8mm; padding:0.9mm 1.6mm; font-size:6.8pt; color:#4a534c; }
/* 专业日页 */
.sheet.maj .anchor{ margin-top:2.4mm; font-size:7.6pt; color:#5b4a86; background:#f3f0fa; border-radius:1mm; padding:1.8mm 2.2mm; line-height:1.5; }
.sheet.maj .reason{ margin-top:2mm; font-size:7.8pt; line-height:1.55; color:#2c352f; }
.sheet.maj ol{ margin:1.8mm 0 0; padding-left:4.4mm; font-size:7.6pt; line-height:1.55; }
.sheet.maj ol li{ margin-bottom:0.9mm; }
/* 工具图纸 */
.sheet.tool .draw{ margin-top:1.2mm; }
.sheet.tool .draw svg{ display:block; }
.sheet.tool h1{ margin:1.8mm 0 1.2mm; }
.sheet.tool .desc{ margin:0 0 1mm; }
/* 图纸索引页 */
.sheet.tidx .tidxtb{ width:100%; border-collapse:collapse; margin-top:2.4mm; font-size:6.9pt; }
.sheet.tidx .tidxtb th{ background:#0F3D2E; color:#fff; font-weight:700; font-size:6.8pt; padding:1.2mm 1mm; text-align:left; }
.sheet.tidx .tidxtb td{ border-bottom:0.2mm solid #e3ddd0; padding:1.15mm 1mm; color:#33403a; vertical-align:top; line-height:1.35; }
.sheet.tidx .tidxtb td span{ font-size:5.9pt; color:#9aa19a; }
.sheet.tidx .tidxtb .c1{ font-weight:700; color:#0F3D2E; white-space:nowrap; }
.sheet.tidx .tidxtb .c3{ white-space:nowrap; }
.sheet.tidx .tidxtb .c5{ white-space:nowrap; color:#5b625c; }
.sheet.tidx .desc{ font-size:7.2pt; line-height:1.5; }
/* 进度总表 */
.sheet.tk{ justify-content:flex-start; }
.sheet.tk h2{ font-size:11pt; margin:0 0 1.4mm; }
.sheet.tk .sub{ font-size:6.6pt; line-height:1.45; color:#5b625c; margin-bottom:1.8mm; }
.tkgrid{ display:grid; grid-template-columns:repeat(13,1fr); gap:0.6mm; }
.tkmon{ grid-column:1 / -1; font-size:6.4pt; font-weight:700; color:#0F3D2E; margin:1.1mm 0 0.2mm; padding-bottom:0.3mm; border-bottom:0.2mm solid #e6e0d2; }
.tkcell{ display:flex; align-items:center; gap:0.5mm; border:0.25mm solid #dcd6c8; border-left:0.8mm solid var(--t,#cfd4cc); border-radius:0.5mm; padding:0.55mm 0.6mm; font-size:5.2pt; line-height:1.15; color:#8a918a; }
.tkcell b{ display:flex; align-items:center; gap:0.4mm; color:#33403a; font-weight:600; font-size:5.4pt; }
.tkcell b i{ width:1.7mm; height:1.7mm; border:0.25mm solid #9aa19a; border-radius:0.3mm; display:inline-block; }
.tkcell .md{ margin-left:auto; font-size:4.9pt; color:#9aa19a; }
.toolrec{ margin-top:2.2mm; padding-top:1.6mm; border-top:0.25mm solid #e6e0d2; font-size:6.4pt; line-height:1.6; color:#33403a; }
.toolrec b{ color:#0F3D2E; }
.toolrec span{ color:#8a918a; }
/* 月度 / 年度结论分析 */
.sheet.rev{ justify-content:flex-start; }
.sheet.rev h1{ font-size:12.4pt; margin:2.2mm 0 1.4mm; }
.sheet.rev .kv{ margin-bottom:1.4mm; }
.sheet.rev .cbox{ margin-bottom:1.8mm; }
.evlist{ margin:0; padding:0; list-style:none; font-size:7.1pt; line-height:1.28; }
.evlist li{ display:flex; gap:1.4mm; align-items:baseline; padding:0.3mm 0; border-bottom:0.2mm dotted #e3ddd0; }
.evlist li:last-child{ border-bottom:0; }
.evlist li i{ flex:0 0 3mm; height:3mm; border:0.3mm solid #9aa19a; border-radius:0.4mm; display:inline-block; }
.evlist li b{ flex:0 0 20mm; color:#0F3D2E; font-weight:700; }
.evlist li span{ flex:1; color:#4a534c; }
.evlist li em{ font-style:normal; flex:0 0 26mm; color:#8a918a; font-size:6.4pt; text-align:right; }
.rw{ margin-bottom:1.6mm; }
.rw .rl{ font-size:7.3pt; line-height:1.45; color:#33403a; margin:0 0 0.6mm; }
.rw .rl b{ color:#0F3D2E; }
.wl{ height:5.4mm; border-bottom:0.3mm solid #b9bfb7; }
.wl.t2{ height:5.4mm; border-bottom:0.3mm solid #cfd4cc; }
.chk{ font-size:7.2pt; line-height:1.6; color:#33403a; }
.chk span{ display:inline-block; margin-right:3.4mm; white-space:nowrap; }
.chk span i{ display:inline-block; width:2.8mm; height:2.8mm; border:0.3mm solid #9aa19a; border-radius:0.4mm; margin-right:1mm; vertical-align:-0.4mm; }
.final{ border:0.5mm solid #0F3D2E; border-radius:1.2mm; padding:2.4mm 3mm 2.6mm; background:#f7f5ec; }
.final .fh{ font-size:7.6pt; font-weight:800; color:#0F3D2E; margin-bottom:1.2mm; letter-spacing:.3pt; }
.final .fh em{ font-style:normal; font-weight:600; font-size:6.4pt; color:#7b837c; margin-left:2mm; }
.sheet.rvy .ytb{ width:100%; border-collapse:collapse; font-size:6.9pt; margin-top:1.4mm; }
.sheet.rvy .ytb th{ background:#0F3D2E; color:#fff; font-weight:700; padding:1.2mm 1mm; text-align:left; font-size:6.8pt; }
.sheet.rvy .ytb td{ border-bottom:0.2mm solid #e3ddd0; padding:1.1mm 1mm; color:#33403a; vertical-align:top; line-height:1.35; }
.sheet.rvy .ytb td.c1{ font-weight:700; color:#0F3D2E; white-space:nowrap; }
.sheet.rvy .ytb td.c3{ width:40mm; border-bottom:0.3mm solid #cfd4cc; }
.sheet.rvy .ytb td.c4{ width:15mm; }
.sheet.rvy .three2 div{ font-size:7pt; }
.q3{ border:0.35mm solid var(--line); border-radius:1.2mm; background:#fff; padding:2mm 2.6mm 2.2mm; margin-bottom:1.6mm; }
.q3 .qh{ font-size:7.8pt; font-weight:800; color:#0F3D2E; margin-bottom:0.8mm; }
.q3 .qd{ font-size:6.8pt; line-height:1.45; color:#6b7169; margin:0 0 1.2mm; }
.lineset{ font-size:7.2pt; line-height:1.5; color:#33403a; }
.lineset span{ display:inline-block; margin-right:3.2mm; white-space:nowrap; }
.lineset span i{ display:inline-block; width:2.8mm; height:2.8mm; border:0.3mm solid #9aa19a; border-radius:0.4mm; margin-right:1mm; vertical-align:-0.4mm; }
/* 季度复盘页 */
.sheet.revy .qind,
.sheet.rvy .qind{ font-size:6.8pt; line-height:1.48; color:#33403a; }
.sheet.rvy .qind .ir{ padding:0.5mm 0; border-bottom:0.2mm dotted #e3ddd0; }
.sheet.rvy .qind .ir:last-child{ border-bottom:0; }
.sheet.rvy .qind .ir b{ color:#0F3D2E; }
.sheet.rvy .qind .ir em{ font-style:normal; color:#8a918a; font-size:6.4pt; }
.sheet.rvy .qind .opts{ color:#7b837c; font-size:6.4pt; }
.sheet.rvy .evnote{ margin-top:0.9mm; font-size:6.2pt; line-height:1.32; color:#8a6a2f; background:#fdf6ea; border-left:0.7mm solid #d9a55a; padding:0.9mm 1.4mm; }
.sheet.rvy .cbox{ padding:1.9mm 2.5mm 2.1mm; margin-bottom:1.2mm; }
.sheet.rvy .cbox .ch{ font-size:7.5pt; padding-bottom:0.9mm; margin-bottom:1.1mm; }
.sheet.rvy .cbox .ch em{ font-size:6.3pt; }
.sheet.rvy .kv{ font-size:6.9pt; gap:1mm 2.2mm; margin-bottom:1.1mm; }
.sheet.rvy .rw{ margin-bottom:1.1mm; }
.sheet.rvy .wl{ height:4.8mm; }
.sheet.rvy .chk{ font-size:6.8pt; line-height:1.38; }
.sheet.rvy .final{ padding:1.6mm 2.2mm 1.8mm; }
.sheet.rvy .final .fh{ margin-bottom:1mm; }
@media screen{
  .a4{ margin-top:0; }
  .a4:first-of-type{ margin-top:6mm; }
}
@media print{
  body{ background:#fff; }
  .screen-note{ display:none !important; }
  .a4{ margin:0 !important; box-shadow:none !important; }
  .a4:last-of-type{ page-break-after:auto; break-after:auto; }
  .cell::after{ border-color:#d8d2c4; }
}
`;

function head(title) {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head><body>
`;
}

function noteScreen(text) {
  return `<div class="screen-note">${text}</div>`;
}

/* ---------- A5 单页 ---------- */

function sheetDay(d, idx, total, monthLabel) {
  const c = COLOR[d.type] || '#0F3D2E';
  const card = CARDS[d.card] || null;
  const mmdd = String(d.mmdd || '');
  const md = mmdd.length === 4 ? `${Number(mmdd.slice(0, 2))}月${Number(mmdd.slice(2))}日` : (d.date || '');
  const lineTxt = (d.lines && d.lines.length) ? '走向 ' + d.lines.map((x) => `${x}${LINE_NAME[x] || ''}`).join(' / ') : '通用（不分线）';
  const steps = card && Array.isArray(card.steps) ? card.steps : [];
  const variants = (card && card.variants && d.lines) ? d.lines.filter((x) => card.variants[x]).map((x) => ({ k: x, v: card.variants[x] })) : [];
  return `<div class="cell"><section class="sheet" style="--c:${c}">
  <div class="top">
    <div class="dt">${esc(md)}<small>${esc(d.weekday || '')}</small></div>
    <div class="meta"><span class="chip">${esc(d.type || '')}</span><span class="lines">${esc(lineTxt)}</span></div>
  </div>
  <h1>${esc(d.title || '')}</h1>
  <p class="desc">${esc(d.desc || '')}</p>
  <div class="kv">
    ${d.minutes ? `<span><i>用时</i> ${esc(d.minutes)} 分钟</span>` : ''}
    ${d.material ? `<span><i>材料</i> ${esc(d.material)}</span>` : ''}
    ${(() => { const t = toolForDay(d.card); return t ? `<span><i>图纸</i>${esc(t.code)} · 分册 A4 第 ${t.page} 张</span>` : ''; })()}
  </div>
  ${card ? `<div class="cbox">
    <div class="ch"><span>工具卡 ${esc(card.code)} · ${esc(card.name)}</span><em>${esc(card.minutes || '')}${card.minutes ? ' 分钟' : ''}${card.star ? ' · 核心卡' : ''}</em></div>
    ${card.pool ? `<p class="pool">${esc(card.pool)}</p>` : ''}
    <ol class="steps">${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    ${card.output ? `<div class="out"><b>本卡产出：</b>${esc(card.output)}</div>` : ''}
    ${variants.length ? `<div class="vars">${variants.map((x) => `<div><b>${esc(x.k)} ${esc(LINE_NAME[x.k] || '')}</b>${esc(x.v)}</div>`).join('')}</div>` : ''}
  </div>` : ''}
  ${d.hook ? `<div class="hook">${esc(d.hook)}</div>` : ''}
  <div class="foot"><span>2027 生涯探索年历 · ${esc(monthLabel || '')}</span><span>第 ${idx} / ${total} 页</span></div>
</section></div>`;
}

function sheetMonth(m, idx, total) {
  /* 本月会用到哪些工具图纸（按图纸编号排序，便于按月复印） */
  const mt = [];
  for (const d of DAYS) {
    if (d.month !== m.month) continue;
    const t = toolForDay(d.card);
    if (t && mt.indexOf(t) < 0) mt.push(t);
  }
  mt.sort((a, b) => (a.code < b.code ? -1 : 1));
  const toolRow = mt.length
    ? `<div class="mrow"><b>本月图纸</b>${mt.map((t) => esc(t.code)).join(' · ')}　（共 ${mt.length} 张，见《工具图纸分册》A4 第 ${mt[0].page}${mt[mt.length - 1].page !== mt[0].page ? '–' + mt[mt.length - 1].page : ''} 张）</div>`
    : '';
  const pool = (m.pool || []).map((k) => {
    const cc = CARDS[k];
    return `<span>${esc(k)}${cc ? ' ' + esc(cc.name) : ''}</span>`;
  }).join('');
  return `<div class="cell"><section class="sheet mon" style="--c:${(data.meta && data.meta.month_colors && data.meta.month_colors[m.month]) || '#0F3D2E'}">
  <div class="mnum">${String(m.month).padStart(2, '0')}</div>
  <div class="mttl">${esc(m.name)}　${esc(m.title)}</div>
  <div class="mq">${esc(m.core_question || '')}</div>
  <div class="mrow"><b>本月目标</b>${esc(m.goal || '')}</div>
  <div class="mrow"><b>做法</b>${esc(m.method || '')}</div>
  <div class="mrow"><b>月度产出</b>${esc(m.output || '')}</div>
  <div class="mrow"><b>节奏</b>${esc(m.rhythm || '')}</div>
  ${m.line_note ? `<div class="mrow"><b>分线提示</b>${esc(m.line_note)}</div>` : ''}
  ${toolRow}
  <div class="pool-chips">${pool}</div>
  <div class="foot"><span>2027 生涯探索年历 · 月封面</span><span>第 ${idx} / ${total} 页</span></div>
</section></div>`;
}

function sheetMajor(md, idx, total) {
  const acts = (md.actions || []).map((a) => `<li>${esc(a.text)}</li>`).join('');
  const rel = (md.cards || []).map((k) => {
    const cc = CARDS[k];
    return `<span>${esc(k)}${cc ? ' ' + esc(cc.name) : ''}</span>`;
  }).join('');
  return `<div class="cell"><section class="sheet maj" style="--c:#7C6AA8">
  <div class="top">
    <div class="dt" style="font-size:15pt">${esc(md.major)}</div>
    <div class="meta"><span class="chip" style="--c:#7C6AA8;background:#7C6AA8">专业专属日</span><span class="lines">${esc(md.date || '')}　${esc(md.weekday || '')}</span></div>
  </div>
  <h1 style="font-size:11.6pt;color:#5b4a86">${esc(md.college || '')}　·　${esc(md.anchor || '')}</h1>
  <div class="reason">${esc(md.reason || '')}</div>
  <div class="anchor">材料：${esc(md.materials || '')}　|　用时：${esc(md.minutes || '')} 分钟　|　产出：${esc(md.output || '')}</div>
  <ol>${acts}</ol>
  ${rel ? `<div class="pool-chips">${rel}</div>` : ''}
  <div class="foot"><span>2027 生涯探索年历 · 专业专属日</span><span>第 ${idx} / ${total} 页</span></div>
</section></div>`;
}

/* ================= 工具图纸（A5 可填写） ================= */
const TS = { ink: '#1f2a24', sub: '#5b625c', line: '#94a096', edge: '#cfd4cc', pale: '#b9bfb7', green: '#0F3D2E', warm: '#B4553C' };
const tl = (x1, y1, x2, y2, o) => { o = o || {}; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || TS.line}" stroke-width="${o.w || 0.3}"${o.d ? ' stroke-dasharray="1.2 1"' : ''}/>`; };
const tx = (x, y, s, o) => { o = o || {}; return `<text x="${x}" y="${y}" font-size="${o.s || 2.6}" font-weight="${o.w || 400}" text-anchor="${o.a || 'start'}" fill="${o.c || TS.ink}">${esc(s)}</text>`; };
const bx = (x, y, w, h, o) => { o = o || {}; return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r == null ? 1 : o.r}" fill="${o.fill || 'none'}" stroke="${o.c || TS.edge}" stroke-width="${o.w || 0.3}"${o.d ? ' stroke-dasharray="1.2 1"' : ''}/>`; };
const dot = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c || TS.green}"/>`;

function svgP01a() {
  const g = [];
  [[46, 36], [85, 36], [65.5, 74]].forEach(([cx, cy]) => g.push(`<circle cx="${cx}" cy="${cy}" r="26" fill="none" stroke="${TS.green}" stroke-width="0.45"/>`));
  g.push(tx(46, 22, '兴趣', { a: 'middle', s: 3, w: 700, c: TS.green }));
  g.push(tx(85, 22, '能力', { a: 'middle', s: 3, w: 700, c: TS.green }));
  g.push(tx(65.5, 66, '价值观', { a: 'middle', s: 3, w: 700, c: TS.green }));
  [[65.5, 34, '①'], [56, 56, '②'], [75, 56, '③']].forEach(([x, y, s]) => {
    g.push(`<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="${TS.warm}" stroke-width="0.4"/>`);
    g.push(tx(x, y + 1.3, s, { a: 'middle', s: 4, c: TS.warm, w: 700 }));
  });
  g.push(tx(0, 104, '每环各写 5 条具体事实（做过什么、被夸过什么），不写形容词；①②③ 三处交集在下一张图纸单独展开。', { s: 2.3, c: TS.sub }));
  [{ x: 0, t: 'A 兴趣｜我主动愿意花时间的事' }, { x: 45, t: 'B 能力｜我做起来明显比人顺的事' }, { x: 90, t: 'C 价值观｜宁可吃亏也要守的东西' }].forEach((c) => {
    g.push(tx(c.x, 112, c.t, { s: 2.2, w: 700, c: TS.green }));
    for (let i = 0; i < 5; i++) {
      const y = 119 + i * 5.6;
      g.push(tx(c.x, y - 0.9, (i + 1) + '.', { s: 2.1, c: TS.sub }));
      g.push(tl(c.x + 3.6, y, c.x + 40.5, y));
    }
  });
  return g.join('');
}

function svgP01b() {
  const g = [];
  [{ x: 0, t: '① 兴趣 ∩ 能力' }, { x: 45, t: '② 兴趣 ∩ 价值观' }, { x: 90, t: '③ 能力 ∩ 价值观' }].forEach((c) => {
    g.push(tx(c.x, 5, c.t, { s: 2.4, w: 700, c: TS.green }));
    g.push(tx(c.x, 10, '各写 2 条，并解释为什么它同时属于两边', { s: 1.9, c: TS.sub }));
    for (let i = 0; i < 2; i++) g.push(tl(c.x, 17 + i * 5.2, c.x + 40.5, 17 + i * 5.2));
  });
  g.push(bx(0, 28, 131, 34, { r: 1.2 }));
  g.push(tx(2, 34.5, '给交集区起一个名字（你的定位初稿）', { s: 2.6, w: 700, c: TS.warm }));
  g.push(tl(2, 44, 129, 44));
  g.push(tx(2, 50.5, '这个名字里必须含的三样东西：', { s: 2.2, c: TS.sub }));
  g.push(tl(47, 50.5, 129, 50.5));
  g.push(tx(2, 58.5, '一句话说给同学听：', { s: 2.2, c: TS.sub }));
  g.push(tl(27, 58.5, 129, 58.5));
  g.push(bx(0, 66, 131, 32, { r: 1.2 }));
  g.push(tx(2, 72.5, '找一位熟人看图，只记录他明确不同意的 2 处（不辩解、不改口，先写下他的原话）', { s: 2.3, w: 700, c: TS.green }));
  g.push(tx(2, 81.5, '不同意 1：', { s: 2.2, c: TS.sub }));
  g.push(tl(14, 81.5, 129, 81.5));
  g.push(tx(2, 90.5, '不同意 2：', { s: 2.2, c: TS.sub }));
  g.push(tl(14, 90.5, 129, 90.5));
  g.push(bx(0, 102, 131, 42, { r: 1.2 }));
  g.push(tx(2, 108.5, '按反馈改一版，写下最终的一句话自我定位', { s: 2.6, w: 700, c: TS.warm }));
  g.push(tl(2, 121, 129, 121));
  g.push(tl(2, 131, 129, 131));
  g.push(tx(2, 140.5, '签名：', { s: 2.2, c: TS.sub }));
  g.push(tl(11, 140.5, 58, 140.5));
  g.push(tx(64, 140.5, '日期：', { s: 2.2, c: TS.sub }));
  g.push(tl(73, 140.5, 129, 140.5));
  return g.join('');
}

function svgP04() {
  const cx = 64, cy = 58, R = 38, n = 8;
  const dims = ['专业能力', '沟通表达', '组织协作', '动手实践', '信息技术', '艺术表现', '学习迁移', '自我管理'];
  const g = [];
  for (let k = 1; k <= 5; k++) g.push(`<circle cx="${cx}" cy="${cy}" r="${(R * k / 5).toFixed(2)}" fill="none" stroke="${k === 5 ? '#94a096' : '#d7dcd4'}" stroke-width="0.3"${k === 5 ? '' : ' stroke-dasharray="1.2 1"'}/>`);
  const pt = (i, r) => { const a = (-90 + i * 360 / n) * Math.PI / 180; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, R);
    g.push(tl(cx, cy, x, y, { c: '#d7dcd4' }));
    const [lx, ly] = pt(i, R + 8);
    g.push(tx(lx, ly + 1, dims[i], { s: 2.4, a: Math.abs(lx - cx) < 1 ? 'middle' : (lx > cx ? 'start' : 'end'), w: 600 }));
  }
  g.push(tx(cx, cy + 1.2, '我', { a: 'middle', s: 2.4, c: TS.sub }));
  g.push(tx(0, 104, '外圈 = 5 分（很稳），内圈 = 1 分（几乎没做过）：沿 8 条轴各点一个点，连成你的形状。', { s: 2.2, c: TS.sub }));
  g.push(tx(0, 110, '维度可按本校实际替换；打勾的分数必须能举出一件做过的事，举不出就往下调一档。', { s: 2.2, c: TS.sub }));
  g.push(tx(0, 116, '维度', { s: 2.2, w: 700, c: TS.green }));
  g.push(tx(33, 116, '1 弱　　2　　3　　4　　5 强', { s: 2, c: TS.pale }));
  g.push(tx(76, 116, '举得出的一件事（证据）', { s: 2.2, w: 700, c: TS.green }));
  dims.forEach((d, i) => {
    const y = 126 + i * 3.4;
    g.push(tx(0, y, d, { s: 2.3 }));
    for (let s = 0; s < 5; s++) g.push(bx(34 + s * 8 - 1.9, y - 2.4, 3.8, 3.8, { r: 0.8 }));
    g.push(tl(76, y, 131, y));
  });
  return g.join('');
}

const VALUES18 = ['成长学习', '稳定保障', '收入回报', '生活平衡', '助人利他', '创造表达', '团队归属', '自主独立', '社会认可', '挑战新鲜', '环境舒适', '离家近', '专业对口', '晋升空间', '时间自由', '影响力', '审美体验', '健康安全'];

function svgP03() {
  const g = [];
  const w = 41.5, h = 8.4, gx = 1.5, gy = 1.2;
  VALUES18.forEach((v, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = col * (w + gx), y = 2 + row * (h + gy);
    g.push(bx(x, y, w, h, { r: 1 }));
    g.push(bx(x + 2, y + 2.5, 3.2, 3.2, { c: '#94a096', r: 0.6 }));
    g.push(tx(x + 6.6, y + 5.6, v, { s: 2.5 }));
  });
  const y1 = 70;
  g.push(tx(0, y1, '勾出 6 个“现在最不能放弃”的，再排 1—6 名（一个名次只放一个）', { s: 2.4, w: 700, c: TS.warm }));
  for (let i = 0; i < 6; i++) {
    const y = y1 + 10 + i * 11.5;
    g.push(`<circle cx="4.4" cy="${y - 1.6}" r="4.2" fill="none" stroke="${TS.green}" stroke-width="0.45"/>`);
    g.push(tx(4.4, y - 0.4, String(i + 1), { a: 'middle', s: 2.8, w: 700, c: TS.green }));
    g.push(tl(12, y, 131, y));
    g.push(tx(12, y + 4.8, '为什么排在这里（一句话，写场景不写形容词）：', { s: 2, c: TS.sub }));
  }
  return g.join('');
}

function svgP06() {
  const g = [];
  const nodes = [
    ['过去 · 6 年前', '当时我在做什么'],
    ['过去 · 3 年前', '哪件事被夸过'],
    ['去年', '哪次选择是我自己定的'],
    ['现在', '此刻最想改的一件事'],
    ['未来 · 1 年', '想拿到的一个具体结果'],
    ['未来 · 3 年', '想过上的工作状态']
  ];
  g.push(tl(8, 4, 8, 142, { c: TS.green, w: 0.6 }));
  nodes.forEach((n, i) => {
    const y = 16 + i * 23;
    g.push(dot(8, y, 2.4));
    g.push(bx(16, y - 9, 113, 19, { r: 1.2 }));
    g.push(tx(18.5, y - 4.4, n[0], { s: 2.6, w: 700, c: TS.green }));
    g.push(tx(58, y - 4.4, n[1], { s: 2, c: TS.sub }));
    g.push(tl(18.5, y + 1.6, 126.5, y + 1.6));
    g.push(tl(18.5, y + 7, 126.5, y + 7));
  });
  return g.join('');
}

function svgP07() {
  const g = [];
  [
    ['理性型', '先比条件再决定，怕漏掉信息', 0, 0],
    ['直觉型', '先有感觉再补理由，快但易反复', 66, 0],
    ['依赖型', '先问别人怎么看，怕自己判断错', 0, 72],
    ['回避型', '先拖着不选，怕选错要担责', 66, 72]
  ].forEach((q) => {
    g.push(bx(q[2], q[3], 64, 68, { r: 1.4 }));
    g.push(tx(q[2] + 3, q[3] + 8, q[0], { s: 3, w: 700, c: TS.green }));
    g.push(tx(q[2] + 3, q[3] + 14.5, q[1], { s: 2.1, c: TS.sub }));
    g.push(tx(q[2] + 3, q[3] + 22, '符合我的情形就打勾：', { s: 2.1, c: TS.sub }));
    for (let i = 0; i < 5; i++) g.push(bx(q[2] + 3 + i * 12, q[3] + 54, 6, 6, { c: '#94a096', r: 0.8 }));
    g.push(tx(q[2] + 3, q[3] + 50, '五个情境', { s: 1.9, c: TS.pale }));
  });
  g.push(tx(0, 147, '打勾最多的两型，就是你在重要选择时的默认打法：看清它，才知道该补哪一步。', { s: 2.2, c: TS.warm }));
  return g.join('');
}

function svgD01() {
  const g = [];
  const cols = [[0, 40, '权衡维度'], [42, 29, 'A 升学'], [72, 29, 'B 就业'], [102, 29, 'C 创业']];
  cols.forEach((c) => {
    g.push(bx(c[0], 2, c[1], 9, { fill: '#f5f2e8', r: 0.8 }));
    g.push(tx(c[0] + c[1] / 2, 7.6, c[2], { a: 'middle', s: 2.5, w: 700, c: TS.green }));
  });
  const dims = ['兴趣匹配', '能力储备', '资源支持', '时间成本', '风险可控', '家人支持'];
  dims.forEach((d, i) => {
    const y = 11 + i * 12;
    [[0, 40], [42, 29], [72, 29], [102, 29]].forEach((c) => g.push(bx(c[0], y, c[1], 12, { r: 0 })));
    g.push(tx(2, y + 7.4, d, { s: 2.4 }));
    [42, 72, 102].forEach((x) => g.push(tx(x + 14.5, y + 7.4, '1—5', { a: 'middle', s: 2, c: TS.pale })));
  });
  const yS = 83;
  [[0, 40], [42, 29], [72, 29], [102, 29]].forEach((c) => g.push(bx(c[0], yS, c[1], 10, { fill: '#faf7ee', r: 0 })));
  g.push(tx(2, yS + 6.6, '合计得分', { s: 2.5, w: 700, c: TS.green }));
  g.push(tx(0, 101, '评分规则：每格 1—5 分（5 = 最有把握 / 成本最低）。分数只暴露差异，不替你决定。', { s: 2.2, c: TS.sub }));
  [['我倾向：', 110], ['最打动我的一个理由：', 118], ['最该补的一个条件：', 126], ['如果走不通，B 计划：', 134]].forEach((it) => {
    g.push(tx(0, it[1], it[0], { s: 2.3, c: TS.sub }));
    g.push(tl(String(it[0]).length * 2.35 + 1.5, it[1], 131, it[1]));
  });
  return g.join('');
}

function svgD06() {
  const g = [];
  [['重要 · 我还不足', 0, 0, TS.warm], ['重要 · 我已经具备', 66, 0, TS.green], ['不重要 · 也不足', 0, 72, '#8a8f88'], ['不重要 · 但已具备', 66, 72, '#8a8f88']].forEach((q) => {
    g.push(bx(q[1], q[2], 64, 68, { r: 1.4 }));
    g.push(tx(q[1] + 3, q[2] + 8, q[0], { s: 2.7, w: 700, c: q[3] }));
    for (let i = 0; i < 3; i++) {
      const y = q[2] + 20 + i * 13;
      g.push(tl(q[1] + 3, y, q[1] + 61, y));
      g.push(tx(q[1] + 3, y + 3.6, '证据 / 例子：', { s: 1.9, c: TS.pale }));
    }
  });
  g.push(tx(0, 147, '左上角只挑 1 项、写成下个月能验证的动作，比列 10 项有用。', { s: 2.2, c: TS.warm }));
  return g.join('');
}

function svgX01() {
  const g = [];
  const cx = 65, cy = 52;
  g.push(`<circle cx="${cx}" cy="${cy}" r="13" fill="#f5f2e8" stroke="${TS.green}" stroke-width="0.5"/>`);
  g.push(tx(cx, cy - 1.5, '复合标签', { a: 'middle', s: 2.5, w: 700, c: TS.green }));
  g.push(tl(cx - 9, cy + 4, cx + 9, cy + 4));
  [['A 专业主能力', -90], ['B 第二技能', -18], ['C 表达力', 54], ['D 工具力', 126], ['E 人际力', 198]].forEach((c) => {
    const a = c[1] * Math.PI / 180;
    const x = cx + Math.cos(a) * 34, y = cy + Math.sin(a) * 34;
    g.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14" fill="none" stroke="#94a096" stroke-width="0.4"/>`);
    g.push(tx(x, y - 5.5, c[0], { a: 'middle', s: 2.2, w: 700, c: TS.green }));
    g.push(tl(x - 11, y + 1, x + 11, y + 1));
    g.push(tl(x - 11, y + 7.5, x + 11, y + 7.5));
  });
  g.push(tx(0, 106, '其中 2—3 块拼起来，能做的 1 件事（越具体越好）：', { s: 2.4, w: 700, c: TS.warm }));
  g.push(tl(0, 114, 131, 114));
  g.push(tx(0, 122, '谁会为这件事找你（写具体的人或单位，不写“市场”）：', { s: 2.3, c: TS.sub }));
  g.push(tl(0, 130, 131, 130));
  g.push(tx(0, 138, '7 天内能做的验证动作：', { s: 2.3, c: TS.sub }));
  g.push(tl(0, 146, 131, 146));
  return g.join('');
}

function svgR01() {
  const g = [];
  [['① 这周我实际做了什么', 0, 0], ['② 哪一件最有价值', 66, 0], ['③ 哪里卡住了', 0, 72], ['④ 下周只改一件', 66, 72]].forEach((q) => {
    g.push(bx(q[1], q[2], 64, 68, { r: 1.4 }));
    g.push(tx(q[1] + 3, q[2] + 8, q[0], { s: 2.5, w: 700, c: TS.green }));
    for (let i = 0; i < 5; i++) g.push(tl(q[1] + 3, q[2] + 20 + i * 9.5, q[1] + 61, q[2] + 20 + i * 9.5));
  });
  g.push(tx(0, 148, '每周固定 10 分钟一页四问；把 44 页摆开，就是这一年的证据链。', { s: 2.2, c: TS.sub }));
  return g.join('');
}

function svgR02() {
  const g = [];
  [['方向清晰度', '知道这一季度为什么做这些事'], ['行动推进', '每周都有可核对的动作'], ['资源支持', '遇到坎有人可问、有材料可用'], ['状态与情绪', '还撑得住，没有硬扛']].forEach((r, i) => {
    const y = 6 + i * 26;
    g.push(tx(0, y + 6.5, r[0], { s: 2.6, w: 700, c: TS.green }));
    g.push(tx(0, y + 12.5, r[1], { s: 1.9, c: TS.sub }));
    for (let k = 0; k < 10; k++) {
      const x = 42 + k * 8.9;
      g.push(bx(x, y, 8.2, 12, { r: 0.6 }));
      g.push(tx(x + 4.1, y + 8, String(k + 1), { a: 'middle', s: 2, c: TS.pale }));
    }
  });
  g.push(tx(0, 116, '涂到几算几分（1—10），最低的那条就是下季度唯一要修的地方。', { s: 2.2, c: TS.warm }));
  g.push(tx(0, 126, '下一季度只做的一件事：', { s: 2.4, c: TS.sub }));
  g.push(tl(0, 135, 131, 135));
  g.push(tx(0, 144, '检验标准（怎么算做到了）：', { s: 2.4, c: TS.sub }));
  g.push(tl(0, 150, 131, 150));
  return g.join('');
}

/* 工具图纸：声明顺序只决定同一张工具卡内两张图的先后（如罗盘 ①三环盘点 → ②交集定稿），
   最终编号与页序由「上课先后」决定 —— 取各工具卡在 365 天日页里的首次出现日期排序，
   改数据后重跑自动跟随，不写死日期 */
const TOOL_RAW = [
  { cardCode: 'P01', card: 'P01 生涯罗盘自画像', name: '生涯罗盘图 · 三环盘点', minutes: '40', materials: '三色笔', tip: '把兴趣、能力、价值观各写满 5 条事实，先不动笔美化图，只求写得多。', h: 150, svg: svgP01a },
  { cardCode: 'P01', card: 'P01 生涯罗盘自画像', name: '生涯罗盘图 · 交集命名与定稿', minutes: '25', materials: '便利贴', tip: '三组交集逼自己解释共同点，再给交集区起名字——这个名字就是你这一年的定位。', h: 150, svg: svgP01b },
  { cardCode: 'R01', card: 'R01 周闭环复盘四问', name: '周闭环复盘四问（可复印 44 张）', minutes: '10', materials: '复印', tip: '每周固定同一时间填；第③问只写真实卡点，不写“时间不够”这类空话。', h: 150, svg: svgR01 },
  { cardCode: 'P03', card: 'P03 价值观排序卡', name: '价值观排序卡（18 选 6）', minutes: '25', materials: '剪刀可选', tip: '先全勾再删，最后只留 6 个；排序时写场景，不写“重要”这两个字。', h: 150, svg: svgP03 },
  { cardCode: 'P04', card: 'P04 能力雷达自评', name: '能力雷达图（八轴可自评）', minutes: '30', materials: '直尺', tip: '沿八条轴各点一个点连成形状；每个分数都必须举得出一件做过的事。', h: 150, svg: svgP04 },
  { cardCode: 'P06', card: 'P06 生涯时间线', name: '生涯时间线（过去—现在—未来）', minutes: '35', materials: '笔', tip: '六个节点只写事实与结果，不写情绪结论；未来的两格必须写成可验证的结果。', h: 150, svg: svgP06 },
  { cardCode: 'P07', card: 'P07 决策风格自测', name: '决策风格四型自测', minutes: '20', materials: '笔', tip: '按最近三次重要选择回想，符合就打勾；不要按“我希望自己是哪种”来勾。', h: 150, svg: svgP07 },
  { cardCode: 'R02', card: 'R02 季度路线体检', name: '季度路线体检表（四条刻度）', minutes: '15', materials: '笔', tip: '每季度末各填一次，把四次叠起来看趋势，比单次分数有用。', h: 150, svg: svgR02 },
  { cardCode: 'X01', card: 'X01 复合能力拼图', name: '复合能力拼图（五块变一件事）', minutes: '30', materials: '笔', tip: '拼图的目的不是凑满五块，而是说清“哪两块拼起来能换到一件具体的事”。', h: 150, svg: svgX01 },
  { cardCode: 'D06', card: 'D06 能力缺口优先级', name: '能力缺口四象限', minutes: '25', materials: '笔', tip: '判断“重要”只看它是否挡在你去向的路上，不看它是否好听。', h: 150, svg: svgD06 },
  { cardCode: 'D01', card: 'D01 三走向权衡矩阵', name: '三走向权衡矩阵（升学 / 就业 / 创业）', minutes: '40', materials: '笔', tip: '六个维度各打 1—5 分，先横向比同一维度，再纵向看合计，别只看总分。', h: 150, svg: svgD01 },
];

/* 各工具卡在年历中的首次使用日、天序号与全年使用次数 */
const FIRST_USE = {};
for (let i = 0; i < DAYS.length; i++) {
  const code = String(DAYS[i].card || '').slice(0, 3);
  if (!code) continue;
  if (!FIRST_USE[code]) FIRST_USE[code] = { date: DAYS[i].date, dayNo: i + 1, count: 0 };
  FIRST_USE[code].count++;
}

const SHEET_TOOLS = TOOL_RAW
  .map((t, i) => {
    const fu = FIRST_USE[t.cardCode] || { date: '9999-99-99', dayNo: 0, count: 0 };
    return Object.assign({}, t, { _seq: i, first: fu.date, dayNo: fu.dayNo, count: fu.count });
  })
  .sort((a, b) => (a.first === b.first ? a._seq - b._seq : (a.first < b.first ? -1 : 1)))
  .map((t, i) => {
    t.code = 'T' + String(i + 1).padStart(2, '0');
    t.page = Math.floor(i / 4) + 1;
    t.firstShow = t.first.length === 10 ? `${Number(t.first.slice(5, 7))}/${Number(t.first.slice(8, 10))}` : '—';
    return t;
  });

/* 日页 → 该用哪张图纸：同一张卡有多张图纸时，动作①②用前一张，③④⑤用后一张 */
const TOOL_BY_CARD = {};
for (const t of SHEET_TOOLS) (TOOL_BY_CARD[t.cardCode] = TOOL_BY_CARD[t.cardCode] || []).push(t);
function toolForDay(cardStr) {
  const code = String(cardStr || '').slice(0, 3);
  const arr = TOOL_BY_CARD[code];
  if (!arr || !arr.length) return null;
  if (arr.length === 1) return arr[0];
  const m = String(cardStr).match(/[\u2460-\u2464]/);
  const step = m ? '\u2460\u2461\u2462\u2463\u2464'.indexOf(m[0]) + 1 : 1;
  return step <= 2 ? arr[0] : arr[arr.length - 1];
}

function sheetToolIndex(idx, total) {
  const rows = SHEET_TOOLS.map((t) => `<tr>
    <td class="c1">${esc(t.code)}</td>
    <td>${esc(t.name)}</td>
    <td class="c3">${esc(t.cardCode)}</td>
    <td>${esc(t.firstShow)}<br><span>第 ${t.dayNo} 天 · 全年 ${t.count} 次</span></td>
    <td class="c5">A4 第 ${t.page} 张</td>
  </tr>`).join('');
  return `<div class="cell"><section class="sheet tool tidx" style="--c:#0F3D2E">
  <div class="top">
    <div class="dt" style="font-size:14pt">工具图纸分册<small>使用顺序索引</small></div>
    <div class="meta"><span class="chip">共 ${SHEET_TOOLS.length} 张</span><span class="lines">T01 → ${SHEET_TOOLS[SHEET_TOOLS.length - 1].code}</span></div>
  </div>
  <p class="desc"><b>编号就是上课先后</b>：T01 最早用到，最后一张最晚。教师可整册复印，也可按各月封面上的「本月图纸」只裁当月要用的几张；年历每个日页底部都标注了当天该用哪张图纸与它在分册里的 A4 页次。</p>
  <table class="tidxtb">
    <thead><tr><th style="width:12mm">编号</th><th>图纸名称</th><th style="width:12mm">工具卡</th><th style="width:34mm">首次使用</th><th style="width:17mm">分册</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="foot"><span>工具图纸分册 · 使用顺序索引（按年历首次使用日期排序）</span><span>第 ${idx} / ${total} 页</span></div>
</section></div>`;
}

function sheetTool(t, idx, total) {
  return `<div class="cell"><section class="sheet tool" style="--c:#0F3D2E">
  <div class="top">
    <div class="dt" style="font-size:14.5pt">${esc(t.code)}<small>${esc(t.card)}</small></div>
    <div class="meta"><span class="chip">工具图纸</span><span class="lines">${esc(t.minutes)} 分钟　${esc(t.materials)}</span></div>
  </div>
  <h1 style="font-size:12.4pt">${esc(t.name)}</h1>
  <p class="desc" style="font-size:7.3pt;line-height:1.45">${esc(t.tip)}</p>
  <div class="draw"><svg viewBox="0 0 131 ${t.h}" width="131mm" height="${t.h}mm" xmlns="http://www.w3.org/2000/svg">${t.svg()}</svg></div>
  <div class="foot"><span>工具图纸 ${esc(t.code)} · 首次 ${esc(t.firstShow)}（第 ${t.dayNo} 天）· 全年 ${t.count} 次</span><span>第 ${idx} / ${total} 页</span></div>
</section></div>`;
}

/* ---------- 进度总表（365 格勾选 + 图纸核对） ---------- */
function sheetTracker(from, to, part, parts) {
  const out = [];
  let cur = null;
  DAYS.forEach((d, i) => {
    const no = i + 1;
    if (no < from || no > to) return;
    if (d.month !== cur) {
      cur = d.month;
      const mn = (MONTHS.find((m) => m.month === d.month) || {}).name || d.month + ' 月';
      out.push(`<div class="tkmon">${esc(mn)}</div>`);
    }
    const mmdd = String(d.date || '').slice(5).replace('-', '-');
    out.push(`<div class="tkcell" style="--t:${COLOR[d.type] || '#0F3D2E'}"><b><i></i>#${String(no).padStart(3, '0')}</b><span class="md">${esc(mmdd)}</span></div>`);
  });
  const toolRec = part === 1
    ? `<div class="toolrec"><b>工具图纸领取核对（编号＝课堂使用先后）</b>${SHEET_TOOLS.map((t) => esc(t.code) + ' ☐').join('　')}　<span>共 ${SHEET_TOOLS.length} 张，见《工具图纸分册》A4 第 1–${Math.ceil(SHEET_TOOLS.length / 4)} 张</span></div>`
    : '';
  const range = `#${String(from).padStart(3, '0')}–#${String(to).padStart(3, '0')}`;
  return `<div class="cell"><section class="sheet tk" style="--c:#0F3D2E">
  <h2>全年进度总表 · ${part === 1 ? '上半年' : '下半年'} ${range}</h2>
  <div class="sub">共 365 天，每格对应一张 A5 日页，格内色条为该日类型。做完一天勾掉一格；漏了不必回头补——到本周闭环页（或月成果页）一次补齐即可。</div>
  <div class="tkgrid">${out.join('')}</div>
  ${toolRec}
  <div class="foot"><span>2027 生涯探索年历 · 全年进度总表 ${range}</span><span>第 ${part} / ${parts} 页</span></div>
</section></div>`;
}

/* ---------- 结论分析分册（月度 ×12 + 年度 ×2） ---------- */
const Y_THREE = yearConclusion(AYEAR, []).three;

function sheetReviewMonth(m, idx, total) {
  const mc = AMONTHS.find((x) => x.month === m.month) || { cards: [], tools: [], dayTotal: 0 };
  const c = (data.meta && data.meta.month_colors && data.meta.month_colors[m.month]) || '#0F3D2E';
  const CHK = monthConclusion(mc, {}).checklist;
  const ev = mc.cards.map((cd) => {
    const ts = (TOOL_BY_CARD[cd.code] || []).map((t) => t.code);
    return `<li><i></i><b>${esc(cd.code)}${cd.star ? ' ★' : ''}</b><span>${esc(cd.name)}</span><em>${ts.length ? '图纸 ' + ts.join('/') : '无图纸'} · __ 日</em></li>`;
  }).join('');
  const nextLine = mc.nextTitle
    ? `下月是「${esc(mc.nextName)}：${esc(mc.nextTitle)}」。本月结论里挑一条要被验证的说法，写成下月第一件要做的事：`
    : '本月结论里挑一条要被验证的说法，写成明年第一件要做的事：';
  return `<div class="cell"><section class="sheet rev" style="--c:${c}">
  <div class="top">
    <div class="dt">${String(m.month).padStart(2, '0')}<small>${esc(m.name)}</small></div>
    <div class="meta"><span class="chip">月度结论分析</span><span class="lines">本月 ${mc.dayTotal} 天 · 工具卡 ${mc.cards.length} 张${mc.tools.length ? ' · 图纸 ' + mc.tools.join('、') : ''}</span></div>
  </div>
  <h1>本月要回答：${esc(m.core_question)}</h1>
  <div class="kv">
    <span><i>本月产出</i> ${esc(m.output || '')}</span>
  </div>
  <div class="cbox">
    <div class="ch"><span>① 证据清单</span><em>做完一张勾一张，写上完成日</em></div>
    <ul class="evlist">${ev}</ul>
  </div>
  <div class="cbox">
    <div class="ch"><span>② 结论三段式</span><em>写事实与判断，不写评价自己的话</em></div>
    <div class="rw"><p class="rl"><b>数据</b>　我走完 ____ / ${mc.dayTotal} 天，完成 ____ / ${mc.cards.length} 张卡；这个月最有力的一件事是：</p><div class="wl"></div></div>
    <div class="rw"><p class="rl"><b>判断</b>　上面那个问题，我的答案是（一句话，不超过 30 字，主语是「我」）：</p><div class="wl"></div></div>
    <div class="rw"><p class="rl"><b>下一步</b>　${nextLine}</p><div class="wl"></div></div>
  </div>
  <div class="cbox">
    <div class="ch"><span>③ 结论合格自检</span><em>三条全勾，本条结论才成立；差一条就补，不重写</em></div>
    <div class="chk">
      <span><i></i>${esc(CHK[0])}</span>
    </div>
    <div class="chk">
      <span><i></i>${esc(CHK[1])}</span>
    </div>
    <div class="chk">
      <span><i></i>${esc(CHK[2])}</span>
    </div>
  </div>
  <div class="final">
    <div class="fh">${esc(m.name)}结论卡<em>沿边剪下，收进年度汇总袋</em></div>
    <div class="rw" style="margin-bottom:1mm"><div class="wl"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:6.4pt;color:#8a918a">
      <span>一句话结论（≤30 字）</span><span>自评：成形 / 半成形 / 起步 / 待补</span>
    </div>
  </div>
  <div class="foot"><span>2027 生涯探索年历 · 月度结论分析 · ${esc(m.name)}</span><span>第 ${idx} / ${total} 页</span></div>
</section></div>`;
}

function sheetReviewYearSettle(idx, total) {
  const rows = AMONTHS.map((m) => `<tr>
    <td class="c1">${String(m.month).padStart(2, '0')} ${esc(m.name)}</td>
    <td>${esc(m.core_question)}</td>
    <td class="c3"></td>
    <td class="c4">☐</td>
  </tr>`).join('');
  return `<div class="cell"><section class="sheet rvy" style="--c:#0F3D2E">
  <div class="top">
    <div class="dt" style="font-size:15pt">年报 · 结算<small>年度结论分析 1/2</small></div>
    <div class="meta"><span class="chip">先把 12 条摆在一起</span><span class="lines">${AYEAR.monthTotal} 个月 · ${AYEAR.cardTotal} 张工具卡 · ${AYEAR.toolTotal} 张图纸</span></div>
  </div>
  <p class="desc">年度结论不是重新写一篇总结，而是<b>把 12 条月度结论抄在一张纸上</b>，看哪几条互相印证、哪几条互相矛盾。抄的时候不许改写——改写必须加证据。</p>
  <div class="kv">
    <span><i>全年</i> ${AYEAR.dayTotal} 天</span>
    <span><i>走完</i> ____ 天（____ %）</span>
    <span><i>工具卡</i> ____ / ${AYEAR.cardTotal} 张</span>
    <span><i>专业日</i> ${AYEAR.majorTotal} 个</span>
  </div>
  <table class="ytb">
    <thead><tr><th style="width:24mm">月份</th><th>本月核心问题</th><th style="width:40mm">我的月结论（一句话照抄）</th><th style="width:15mm">成形</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="toolrec" style="margin-top:1.6mm">已成形的月结论共 <b>____</b> 条（勾了几行就是几条）。<b>少于 4 条</b>：年度结论只写「倾向 + 待验证项」两句，不硬写完整结论；<b>7 条以上</b>：可以定稿并在末页签名。</div>
  <div class="foot"><span>2027 生涯探索年历 · 年度结论分析 · 结算表</span><span>第 ${idx} / ${total} 页</span></div>
</section></div>`;
}

function sheetReviewYearVerdict(idx, total) {
  const q3 = Y_THREE.map((t) => `<div class="q3">
    <div class="qh">${esc(t.k)}</div>
    <p class="qd">${esc(t.text)}</p>
    <div class="wl"></div>
    <div class="wl t2"></div>
  </div>`).join('');
  const lines = Object.keys(LINE_NAME).map((k) => `<span><i></i>${k} ${esc(LINE_NAME[k])}</span>`).join('');
  return `<div class="cell"><section class="sheet rvy" style="--c:#0F3D2E">
  <div class="top">
    <div class="dt" style="font-size:15pt">年报 · 结论<small>年度结论分析 2/2</small></div>
    <div class="meta"><span class="chip">三问 → 一条结论</span><span class="lines">写完签名，全年闭环</span></div>
  </div>
  <p class="desc">三个问题各写一句真话；写不出来的那题，就是你今年真正没解决的那件事——把它写进年度结论的「待验证」里。</p>
  ${q3}
  <div class="cbox" style="margin-top:1.6mm">
    <div class="ch"><span>主线（只勾一条）</span><em>勾完后所有「不知道选哪个」都先放下</em></div>
    <div class="lineset">${lines}</div>
  </div>
  <div class="final" style="margin-top:1.8mm">
    <div class="fh">年度结论卡<em>一句话，不超过 100 字；写完签日期</em></div>
    <div class="rw" style="margin-bottom:1mm"><p class="rl"><b>结论</b>　这一年，我是 ______ 的人；我要去 ______；凭的是 ______。</p><div class="wl"></div><div class="wl t2"></div></div>
    <div class="rw" style="margin-bottom:1mm"><p class="rl"><b>第一步</b>　做完这件事我就算真正出发了：______（写清做什么、什么时候之前）</p><div class="wl"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:6.6pt;color:#8a918a;margin-top:1.2mm">
      <span>签名 ______________</span><span>日期 ____ 年 ____ 月 ____ 日</span><span>自评：成形 / 半成形 / 起步 / 待补</span>
    </div>
  </div>
  <div class="foot"><span>2027 生涯探索年历 · 年度结论分析 · 三问与结论</span><span>第 ${idx} / ${total} 页</span></div>
</section></div>`;
}

/* ---------- 季度复盘（R02 季度路线体检：五指标手填，不进算分） ---------- */
const A_QCOL = COLOR['季度体检'] || '#C9A227';

function sheetReviewQuarter(q, idx, total) {
  const qc = quarterConclusion(q, [], {});
  const rows = q.months.map((m) => `<div class="ir"><b>${String(m.month).padStart(2, '0')} ${esc(m.name)}</b>　结论：__________________________　☐ 成形</div>`).join('');
  const ind = AIND.map((it) => {
    const n = it.idx;
    let line = '';
    if (n === 1) {
      line = `本季计划动作 计划 ____ 项／完成 ____ 项 → 完成率 ____ %`;
    } else if (n === 2) {
      line = `有效信息：访谈 ____ 条 · 招聘 ____ 条 · 政策 ____ 条（合计 ____ 条）`;
    } else if (n === 3) {
      line = `决策清晰度 ____ / 10 分（上季 ____ 分）比上季 ☐升 ☐降 ☐持平，原因 __________`;
    } else if (n === 4) {
      line = `主选路径前提：① ☐成立 ☐存疑 ☐不成立　② ☐成立 ☐存疑 ☐不成立　③ ☐成立 ☐存疑 ☐不成立`;
    } else if (n === 5) {
      line = `探索时间：可支配 ____ 小时／探索 ____ 小时 → 占比 ____ %`;
    } else {
      line = `${esc(it.label)}　____`;
    }
    return `<div class="ir"><b>指标${['一', '二', '三', '四', '五'][n - 1] || n}</b> ${esc(it.label)}：${line}</div>`;
  }).join('');
  const chk = qc.checklist.map((t) => `<div class="chk"><span><i></i>${esc(t)}</span></div>`).join('');
  const anchorMd = q.anchor ? q.anchor.md : '季末体检日';
  return `<div class="cell"><section class="sheet rvy rev" style="--c:${A_QCOL}">
  <div class="top">
    <div class="dt" style="font-size:15pt">Q${q.q}<small>${esc(q.range)}</small></div>
    <div class="meta"><span class="chip">季度复盘</span><span class="lines">本季 ${q.dayTotal} 天 · 工具卡 ${q.cardTotal} 张 · 图纸 ${q.tools.length} 张 · 体检日 ${esc(anchorMd)}</span></div>
  </div>
  <h1>本季路线是否还成立？——${esc(q.name)}路线体检</h1>
  <div class="kv">
    <span><i>季末要回答</i> ${esc(q.core_question)}</span>
    <span><i>本季应产出</i> ${esc(q.output || '季度体检表＋下季调整项')}</span>
  </div>
  <div class="cbox">
    <div class="ch"><span>① 本季三个月结论速览</span><em>照抄月结论第一句，不写形容词</em></div>
    <div class="qind">${rows}</div>
  </div>
  <div class="cbox">
    <div class="ch"><span>② 季度结论三段式</span><em>数据 → 判断 → 下一步</em></div>
    <div class="rw"><p class="rl"><b>数据</b>　本季走完 ____ / ${q.dayTotal} 天，完成 ____ / ${q.cardTotal} 张卡，成形 ____ 条月结论。</p></div>
    <div class="rw"><p class="rl"><b>判断</b>　本季路线 ☐ 仍成立 ☐ 要调整；理由是一条事实（谁、做了什么、结果如何）：</p><div class="wl"></div></div>
    <div class="rw"><p class="rl"><b>下一步</b>　下季调整项（只写 1—3 件，写清什么时候之前）：</p><div class="wl"></div><div class="wl t2"></div></div>
  </div>
  <div class="cbox">
    <div class="ch"><span>③ R02 季度路线体检 · 五指标</span><em>季末 ${esc(AM.r02 && AM.r02.minutes ? AM.r02.minutes : '30')} 分钟填完</em></div>
    <div class="qind">${ind}</div>
    <div class="evnote">${esc(qc.evidenceNote)}</div>
  </div>
  <div class="cbox">
    <div class="ch"><span>④ 结论合格自检</span><em>三条全勾，本季结论才成立</em></div>
    ${chk}
  </div>
  <div class="final">
    <div class="fh">Q${q.q} 季度结论卡<em>沿边剪下，收进年度汇总袋</em></div>
    <div class="rw" style="margin-bottom:1mm"><div class="wl"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:6.4pt;color:#8a918a">
      <span>一句话结论（≤30 字）</span><span>自评：成形 / 半成形 / 起步 / 待补</span>
    </div>
  </div>
  <div class="foot"><span>2027 生涯探索年历 · 季度复盘 · ${esc(q.name)}（${esc(q.range)}）</span><span>第 ${idx} / ${total} 页</span></div>
</section></div>`;
}

/* ---------- A4 拼版 ---------- */
function a4Pages(cells) {
  const out = [];
  for (let i = 0; i < cells.length; i += 4) {
    const four = cells.slice(i, i + 4);
    while (four.length < 4) four.push('<div class="cell"></div>');
    out.push(`<section class="a4">${four.join('')}</section>`);
  }
  return out;
}

function writePage(file, title, note, cells) {
  const pages = a4Pages(cells);
  const html = head(title) + noteScreen(note) + pages.join('\n') + '\n</body></html>\n';
  fs.writeFileSync(path.join(OUT_DIR, file), html, 'utf8');
  return { file, a5: cells.length, a4: pages.length, kb: Math.round(Buffer.byteLength(html) / 1024) };
}

/* ---------- 组装 ---------- */
fs.mkdirSync(OUT_DIR, { recursive: true });
const results = [];
const baseNote = (what) => `<b>打印设置</b>：Ctrl+P → 纸张 <code>A4 纵向</code>、缩放 <code>默认（100%）</code>、边距 <code>无</code>、勾选 <code>背景图形</code>。每张 A4 排 4 个 A5 页（左上 → 右上 → 左下 → 右下），格间虚线为裁切线，裁开后即为 A5 卡片，<b>无装订孔位</b>。本说明不参与打印。${what ? '　' + what : ''}`;

// 1) 全年
{
  const cells = [];
  const total = MONTHS.length + DAYS.length;
  let n = 0;
  for (const m of MONTHS) {
    n++; cells.push(sheetMonth(m, n, total));
    const mdays = DAYS.filter((d) => d.month === m.month);
    for (const d of mdays) { n++; cells.push(sheetDay(d, n, total, m.name)); }
  }
  results.push(writePage('print_year.html', '2027 生涯探索年历 · 全年打印版（A4 四合一）', baseNote(`全年 ${total} 个 A5 页，共 ${Math.ceil(total / 4)} 张 A4。`), cells));
}

// 2) 按月
for (const m of MONTHS) {
  const mdays = DAYS.filter((d) => d.month === m.month);
  const cells = [];
  const total = 1 + mdays.length;
  cells.push(sheetMonth(m, 1, total));
  mdays.forEach((d, i) => cells.push(sheetDay(d, i + 2, total, m.name)));
  const fn = `print_m${String(m.month).padStart(2, '0')}.html`;
  results.push(writePage(fn, `2027 生涯探索年历 · ${m.name}打印版（A4 四合一）`, baseNote(`${m.name}共 ${total} 个 A5 页，共 ${Math.ceil(total / 4)} 张 A4。`), cells));
}

// 3) 专业日
{
  const cells = MAJORS.map((md, i) => sheetMajor(md, i + 1, MAJORS.length));
  results.push(writePage('print_majors.html', '2027 生涯探索年历 · 24 专业专属日打印版（A4 四合一）', baseNote(`24 个专业专属日，共 ${Math.ceil(MAJORS.length / 4)} 张 A4。`), cells));
}

// 3.5) 工具图纸
{
  const totalA5 = SHEET_TOOLS.length + 1;
  const cells = [sheetToolIndex(1, totalA5)].concat(SHEET_TOOLS.map((t, i) => sheetTool(t, i + 2, totalA5)));
  results.push(writePage('print_tools.html', '2027 生涯探索年历 · 工具图纸分册（A4 四合一）', baseNote(`可填写工具图纸 ${SHEET_TOOLS.length} 张，加 1 页使用顺序索引，共 ${totalA5} 个 A5、${Math.ceil(totalA5 / 4)} 张 A4，<b>已按上课先后排序</b>：${SHEET_TOOLS.map((t) => t.code).join(' → ')}；每张页脚标注首次使用日期与全年使用次数，年历日页与月封面的「图纸」标注直接对应本册页次。`), cells));
}

// 3.6) 进度总表
{
  const cells = [sheetTracker(1, 183, 1, 2), sheetTracker(184, 365, 2, 2)];
  results.push(writePage('print_tracker.html', '2027 生涯探索年历 · 全年进度总表（A4 四合一）', baseNote('进度总表 2 个 A5 页，共 1 张 A4；建议裁开后贴在册首页或末页，用于核对漏了哪一天、图纸是否领全。'), cells));
}

// 3.7) 月度 / 季度 / 年度结论分析
{
  const total = AMONTHS.length + AQUARTERS.length + 2;
  const cells = [];
  let n = 0;
  for (const mc of AMONTHS) {
    const m = MONTHS.find((x) => x.month === mc.month) || mc;
    n++;
    cells.push(sheetReviewMonth(m, n, total));
  }
  for (const q of AQUARTERS) {
    n++;
    cells.push(sheetReviewQuarter(q, n, total));
  }
  n++; cells.push(sheetReviewYearSettle(n, total));
  n++; cells.push(sheetReviewYearVerdict(n, total));
  results.push(writePage('print_review.html', '2027 生涯探索年历 · 月度 / 季度 / 年度结论分析（A4 四合一）', baseNote(`12 张月度结论页 + 4 张季度复盘页 + 2 张年度结论页，共 ${total} 个 A5、${Math.ceil(total / 4)} 张 A4。月度页三段式（数据 → 判断 → 下一步）写完后沿边剪下收进年度汇总袋；季度页先用 R02 季度路线体检的五个指标体检本季路线（五指标只作手填证据，不进季度分），再写季度结论三段式；年度页先把 12 条月结论抄进结算表，再回答三问、勾一条主线、定稿签名。`), cells));
}

// 4) 入口页
{
  const extra = [];
  const trackerFile = path.join(OUT_DIR, 'print_tracker.html');
  if (!results.some((r) => r.file === 'print_tracker.html') && fs.existsSync(trackerFile)) {
    extra.push({ file: 'print_tracker.html', a5: '—', a4: '—', kb: Math.round(fs.statSync(trackerFile).size / 1024) });
  }
  const rows = results.concat(extra).map((r) => `<tr><td><a href="${r.file}">${r.file}</a></td><td>${r.a5}</td><td>${r.a4}</td><td>${r.kb} KB</td></tr>`).join('');
  const html = head('2027 生涯探索年历 · 打印版入口') + `
<div style="max-width:820px;margin:40px auto;font-family:'Microsoft YaHei',sans-serif;color:#1f2a24;line-height:1.8">
  <h1 style="font-size:22px;color:#0F3D2E;margin-bottom:6px">2027 生涯探索年历 · A4 四合一打印版</h1>
  <p style="color:#5b625c;margin-top:0">每张 A4 排 4 个 A5 页，格间虚线裁切，无装订孔位。全部单文件、零外链，离线可打印。</p>
  <div style="background:#fdf6ea;border-left:4px solid #d9a55a;padding:12px 16px;border-radius:4px;font-size:14px">
    <b>打印设置</b>：Ctrl+P → 纸张 <b>A4 纵向</b>、缩放 <b>默认 100%</b>、边距 <b>无</b>、勾选 <b>背景图形</b>。
  </div>
  <table style="width:100%;border-collapse:collapse;margin-top:18px;font-size:14px">
    <thead><tr style="background:#0F3D2E;color:#fff"><th style="padding:8px;text-align:left">文件</th><th style="padding:8px">A5 页</th><th style="padding:8px">A4 张</th><th style="padding:8px">大小</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="font-size:13px;color:#7b837c;margin-top:18px">重新生成：<code>node build_print.mjs</code>（改数据后重跑，勿手改 HTML）。</p>
</div>
</body></html>
`;
  fs.writeFileSync(path.join(OUT_DIR, 'print_index.html'), html, 'utf8');
}

console.log('数据:', DATA_PATH);
console.log('输出:', OUT_DIR);
for (const r of results) console.log(`  ${r.file.padEnd(22)} A5=${String(r.a5).padStart(4)}  A4=${String(r.a4).padStart(3)}  ${r.kb} KB`);
console.log(`合计 A5=${results.reduce((s, r) => s + r.a5, 0)}  A4=${results.reduce((s, r) => s + r.a4, 0)}`);
