#!/usr/bin/env node
/* 2027 生涯探索年历 · 站点构建脚本（Node 零依赖）
   用法：
     node build_site.mjs                          # 用脚本同级上一层的 2027生涯探索年历_data.json，输出到脚本同级目录
     node build_site.mjs --data ../x_data.json    # 指定数据文件
     node build_site.mjs --out ./dist             # 指定输出目录
   产物：index.html / year.html / q1-q4.html / m01-m12.html / major_<专业>.html（共 42 页）
   全部页面内联 CSS/JS/SVG，零外链，可离线打开，支持 A5 纵向打印（左侧留打孔位）。
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const argOf = (k, dflt) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt; };
const DATA_FILE = path.resolve(HERE, argOf("--data", "../assets/data/2027生涯探索年历_data.json"));
const OUT = path.resolve(HERE, argOf("--out", "../out/site"));
fs.mkdirSync(OUT, { recursive: true });

const D = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const META = D.meta, MONTHS = D.months, DAYS = D.days, MAJORS = D.major_days, CARDS = D.cards;

/* 工具图纸编号：与 build_print.mjs 同一口径 —— 按各卡在 365 天里的首次使用日期排序，
   同一张卡内的多张图纸按声明先后（罗盘 ①盘点 → ②定稿） */
const TOOL_CARDS = [
  ["P01", "生涯罗盘图 · 三环盘点"],
  ["P01", "生涯罗盘图 · 交集命名与定稿"],
  ["R01", "周闭环复盘四问"],
  ["P03", "价值观排序卡（18 选 6）"],
  ["P04", "能力雷达图（八轴可自评）"],
  ["P06", "生涯时间线（过去—现在—未来）"],
  ["P07", "决策风格四型自测"],
  ["R02", "季度路线体检表（四条刻度）"],
  ["X01", "复合能力拼图"],
  ["D06", "能力缺口四象限"],
  ["D01", "三走向权衡矩阵"],
];
const DAYS_SORTED = DAYS.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
const FIRST_USE = {};
DAYS_SORTED.forEach((d, i) => {
  const c = String(d.card || "").slice(0, 3);
  if (!c) return;
  if (!FIRST_USE[c]) FIRST_USE[c] = { date: d.date, dayNo: i + 1, count: 0 };
  FIRST_USE[c].count++;
});
const TOOL_SHEETS = TOOL_CARDS
  .map(([cc, name], i) => Object.assign({ cc, name, _seq: i }, FIRST_USE[cc] || { date: "9999-99-99", dayNo: 0, count: 0 }))
  .sort((a, b) => (a.date === b.date ? a._seq - b._seq : (a.date < b.date ? -1 : 1)))
  .map((t, i) => Object.assign(t, { code: "T" + String(i + 1).padStart(2, "0"), page: Math.floor(i / 4) + 1 }));
const TOOL_BY_CARD = {};
TOOL_SHEETS.forEach((t) => { (TOOL_BY_CARD[t.cc] = TOOL_BY_CARD[t.cc] || []).push(t); });
function toolOf(cardStr) {
  const arr = TOOL_BY_CARD[String(cardStr || "").slice(0, 3)];
  if (!arr || !arr.length) return null;
  if (arr.length === 1) return arr[0];
  const m = String(cardStr).match(/[\u2460-\u2464]/);
  const step = m ? "\u2460\u2461\u2462\u2463\u2464".indexOf(m[0]) + 1 : 1;
  return step <= 2 ? arr[0] : arr[arr.length - 1];
}
const MN = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
const TC = {"锚定日":"#B4553C","归档日":"#6B7A8F","专业专属日":"#7C6AA8","节气观察":"#2E7D6F",
  "季度体检":"#C9A227","周闭环":"#3F6E8C","工具卡日":"#0F3D2E","月度成果":"#B4553C","弹性日":"#8A8F7E"};
const SKY = {1:"#DCE7E3",2:"#DCE7E3",3:"#E3EEDC",4:"#E3EEDC",5:"#E3EEDC",6:"#F2E9D0",7:"#F2E9D0",
  8:"#F2E9D0",9:"#F0E4D2",10:"#F0E4D2",11:"#F0E4D2",12:"#DDE5EA"};
const LINE_ABBR = {A:"升学",B:"就业",C:"创业",D:"考编",E:"参军"};

const e = (s) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function art(kind, month, size = 52) {
  const sky = SKY[month] || "#E3EEDC", a = TC[kind] || "#0F3D2E", h = Math.round(size * 0.75);
  const g = [`<svg viewBox="0 0 120 90" width="${size}" height="${h}" aria-hidden="true">`,
             `<rect width="120" height="90" rx="10" fill="${sky}"/>`];
  const A = (s) => g.push(s);
  if (kind === "锚定日") {
    A(`<path d="M0 66h120v24H0z" fill="${a}" opacity=".22"/><circle cx="58" cy="52" r="14" fill="${a}"/>`);
    A(`<path d="M78 66V24l14 6-14 6" stroke="${a}" stroke-width="4" fill="none"/>`);
  } else if (kind === "归档日") {
    A(`<rect x="34" y="34" width="52" height="38" rx="5" fill="${a}"/><rect x="41" y="25" width="52" height="38" rx="5" fill="${a}" opacity=".5"/>`);
    A('<path d="M50 46h32M50 56h22" stroke="#fff" stroke-width="3" stroke-linecap="round"/>');
  } else if (kind === "专业专属日") {
    A(`<path d="M26 44c12-6 22-6 34 0 12-6 22-6 34 0v32c-12-6-22-6-34 0-12-6-22-6-34 0z" fill="${a}"/><path d="M60 44v32" stroke="#fff" stroke-width="2.5"/>`);
    A('<path d="M92 20l3 6.6 7 .9-5 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5-4.9 7-.9z" fill="#C9A227"/>');
  } else if (kind === "节气观察") {
    if ([6,7,8].includes(month)) {
      A(`<circle cx="60" cy="36" r="13" fill="#C9A227"/><path d="M14 68c10-8 20 8 30 0s20 8 30 0 15 6 26 0" stroke="${a}" stroke-width="3.5" fill="none"/>`);
    } else if ([12,1,2].includes(month)) {
      A(`<path d="M60 18v38M42 27l36 20M78 27L42 47" stroke="${a}" stroke-width="3.4" stroke-linecap="round"/><path d="M0 72h120" stroke="${a}" stroke-width="3" opacity=".4"/>`);
    } else {
      A(`<path d="M28 68c0-17 14-29 32-29s32 12 32 29z" fill="${a}"/><path d="M60 39V20" stroke="${a}" stroke-width="3"/><circle cx="88" cy="26" r="6" fill="#C9A227"/>`);
    }
  } else if (kind === "季度体检") {
    A(`<circle cx="60" cy="46" r="22" fill="none" stroke="${a}" stroke-width="5"/><path d="M60 46l13-13" stroke="#C9A227" stroke-width="4" stroke-linecap="round"/><circle cx="60" cy="46" r="3.5" fill="${a}"/>`);
  } else if (kind === "周闭环") {
    A(`<path d="M36 58a24 20 0 1 1 12 18" fill="none" stroke="${a}" stroke-width="5" stroke-linecap="round"/><path d="M30 50l6 13 13-4" fill="none" stroke="${a}" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="46" r="7" fill="${a}" opacity=".45"/>`);
  } else if (kind === "月度成果") {
    A(`<circle cx="60" cy="38" r="16" fill="${a}"/><path d="M52 53l-6 19 14-8 14 8-6-19" fill="${a}" opacity=".65"/><path d="M53 38l5 6 9-11" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/>`);
  } else if (kind === "弹性日") {
    A(`<path d="M38 58c-8 0-13-6-13-12s5-12 13-12c2-8 10-13 18-11 7 2 11 11 10 18 7 1 12 6 12 12 0 3-2 5-5 5z" fill="${a}" opacity=".85"/><path d="M28 74h64" stroke="${a}" stroke-width="3" stroke-dasharray="5 6"/>`);
  } else {
    A(`<rect x="38" y="30" width="48" height="40" rx="6" fill="${a}" opacity=".4"/><rect x="29" y="23" width="48" height="40" rx="6" fill="${a}"/><path d="M39 37h28M39 47h20" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`);
  }
  g.push("</svg>");
  return g.join("");
}


const CSS = `
:root{--ink:#1F2A26;--deep:#0F3D2E;--sand:#F5F1E6;--clay:#B4553C;--gold:#C9A227;--violet:#7C6AA8;--line:#DED6C4;--mute:#6B7A70;--paper:#FFFDF6}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;font-family:"Noto Serif SC","Songti SC","Source Han Serif SC",Georgia,"Microsoft YaHei",serif;background:var(--sand);color:var(--ink);line-height:1.7}
a{color:var(--deep);text-decoration:none}
.wrap{max-width:1180px;margin:0 auto;padding:0 20px 72px}
header.hero{background:var(--deep);color:#F5F1E6;padding:38px 0 30px;position:relative;overflow:hidden}
header.hero:after{content:"";position:absolute;right:-60px;top:-60px;width:260px;height:260px;border-radius:50%;background:rgba(201,162,39,.18)}
header.hero .wrap{padding-bottom:0}
.eyebrow{font-size:13px;letter-spacing:.28em;color:#C9A227;margin:0 0 10px}
h1{font-size:32px;margin:0 0 12px;letter-spacing:.04em;font-weight:600}
.lede{max-width:760px;color:#DCE7E3;font-size:15px;margin:0}
.meta-line{margin-top:18px;display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-block;border:1px solid rgba(245,241,230,.35);border-radius:999px;padding:3px 12px;font-size:12.5px;color:#F5F1E6}
nav.tabs{background:var(--paper);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:30}
nav.tabs .wrap{display:flex;gap:6px;overflow-x:auto;padding:0 20px}
nav.tabs a{padding:13px 14px;font-size:14px;color:var(--mute);border-bottom:3px solid transparent;white-space:nowrap}
nav.tabs a:hover{color:var(--deep)}
nav.tabs a.on{color:var(--deep);border-bottom-color:var(--clay);font-weight:600}
section{scroll-margin-top:60px}
.bar{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin:22px 0 8px;position:relative}
.bar h3{margin:0 0 12px;font-size:15px;color:var(--deep)}
.fields{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center}
.fields label{font-size:12.5px;color:var(--mute);display:flex;align-items:center;gap:6px}
select,input[type=search]{font-family:inherit;font-size:13.5px;padding:7px 10px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--ink)}
input[type=search]{min-width:220px}
.count{font-size:12.5px;color:var(--clay);margin-left:auto}
.btn{font-family:inherit;font-size:13px;padding:7px 14px;border:1px solid var(--deep);background:transparent;color:var(--deep);border-radius:9px;cursor:pointer}
.btn:hover{background:var(--deep);color:var(--sand)}
.monthblock{margin:34px 0 0}
.mhead{display:flex;align-items:baseline;gap:14px;border-bottom:2px solid var(--deep);padding-bottom:8px;margin-bottom:4px}
.mhead h2{font-size:22px;margin:0;letter-spacing:.06em}
.mhead .theme{font-size:13.5px;color:var(--clay)}
.mhead .goal{font-size:12.5px;color:var(--mute);margin-left:auto;text-align:right}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:14px;padding:16px 0 4px}
.card{background:var(--paper);border:1px solid var(--line);border-radius:13px;padding:14px 15px 12px;display:flex;gap:12px;transition:.18s;break-inside:avoid}
.card:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(15,61,46,.10)}
.card.hide{display:none}
.card .art{flex:0 0 62px}
.card .body{min-width:0;flex:1}
.datepill{font-size:12px;color:var(--mute);letter-spacing:.06em}
.datepill b{color:var(--ink);font-size:13.5px}
.tags{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 5px}
.tag{font-size:11px;padding:1px 8px;border-radius:999px;color:#fff;letter-spacing:.03em}
.card h4{margin:2px 0 5px;font-size:15.5px;line-height:1.45;font-weight:600}
.card p{margin:0;font-size:12.8px;color:#4A554F;line-height:1.62}
.card .hook{margin-top:7px;font-size:12px;color:var(--clay);border-left:3px solid var(--gold);padding-left:8px}
.card .foot{margin-top:8px;display:flex;gap:12px;font-size:11.5px;color:var(--mute);flex-wrap:wrap}
details.more{margin-top:8px}
details.more summary{cursor:pointer;font-size:12px;color:var(--deep);list-style:none}
details.more summary::-webkit-details-marker{display:none}
details.more summary:before{content:"+ ";color:var(--clay)}
details.more[open] summary:before{content:"- "}
details.more .inner{font-size:12.4px;color:#3E4A44;background:#F7F3E8;border-radius:9px;padding:9px 11px;margin-top:7px}
details.more .inner b{color:var(--deep)}
.idx{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-top:18px}
.idxcard{background:var(--paper);border:1px solid var(--line);border-radius:13px;padding:16px 18px;display:block}
.idxcard:hover{border-color:var(--deep)}
.idxcard .k{font-size:11.5px;letter-spacing:.2em;color:var(--gold)}
.idxcard h3{margin:6px 0 6px;font-size:18px;color:var(--deep)}
.idxcard p{margin:0;font-size:12.8px;color:var(--mute);line-height:1.6}
.legend{display:flex;flex-wrap:wrap;gap:8px 16px;margin:10px 0 0;font-size:12.3px;color:var(--mute)}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px}
footer{background:var(--deep);color:#C8D4CB;font-size:12.5px;padding:26px 0;margin-top:40px}
footer .wrap{padding-bottom:0}
.empty{padding:28px;text-align:center;color:var(--mute);font-size:13.5px;display:none}
.sec-title{margin:38px 0 6px;font-size:15px;letter-spacing:.16em;color:var(--clay)}
.majorcard{background:var(--paper);border:1px solid var(--line);border-radius:13px;padding:15px 16px;break-inside:avoid}
.majorcard .col{font-size:11.5px;color:var(--violet);letter-spacing:.08em}
.majorcard h4{margin:4px 0 6px;font-size:15.5px}
.majorcard .row{font-size:12.6px;color:#44504A;margin:3px 0}
.majorcard .row b{color:var(--deep)}
.punch{display:none}
@media print{
  @page{size:A5 portrait;margin:9mm 8mm 9mm 14mm}
  body{background:#fff;font-size:10.5pt;line-height:1.55}
  header.hero{background:#fff;color:#1F2A26;padding:0 0 6mm;border-bottom:2px solid #0F3D2E}
  header.hero .eyebrow{color:#B4553C}
  .lede,.chip{color:#44504A}
  nav.tabs,.bar,.empty,footer,.legend{display:none!important}
  .wrap{max-width:none;padding:0}
  .grid{grid-template-columns:1fr 1fr;gap:5mm;padding:4mm 0 0}
  .card{box-shadow:none;transform:none;border-color:#CFC7B4;padding:3mm}
  .card .art{flex:0 0 16mm}
  .card h4{font-size:11pt}
  details.more{display:none}
  .monthblock{page-break-before:auto}
  .mhead{page-break-after:avoid}
  .punch{display:block;position:fixed;left:4mm;top:0;bottom:0;width:6mm;pointer-events:none}
  .punch:before{content:"";display:block;height:100%;background:repeating-linear-gradient(to bottom,transparent 0 18mm,#B9B1A0 18mm 18.6mm,transparent 18.6mm 20mm)}
}
`;

const FRONT_JS = `
(function(){
  var cards=[].slice.call(document.querySelectorAll('.card'));
  var q=document.getElementById('q'), fy=document.getElementById('fy'), fm=document.getElementById('fm'),
      ft=document.getElementById('ft'), fM=document.getElementById('fM'), cnt=document.getElementById('cnt'),
      empty=document.getElementById('empty'), reset=document.getElementById('reset');
  if(!q) return;
  function norm(s){return (s||'').toLowerCase();}
  function apply(){
    var kw=norm(q.value).trim(), y=fy.value, m=fm.value, t=ft.value, mj=fM.value, n=0;
    cards.forEach(function(c){
      var ok=true;
      if(kw && norm(c.dataset.text).indexOf(kw)<0) ok=false;
      if(ok && y && (' '+c.dataset.line+' ').indexOf(' '+y+' ')<0) ok=false;
      if(ok && m && c.dataset.month!==m) ok=false;
      if(ok && t && c.dataset.type!==t) ok=false;
      if(ok && mj && c.dataset.major!==mj) ok=false;
      c.classList.toggle('hide', !ok); if(ok) n++;
    });
    cnt.textContent='显示 '+n+' / '+cards.length+' 天';
    if(empty) empty.style.display = n? 'none':'block';
    [].slice.call(document.querySelectorAll('.monthblock')).forEach(function(b){
      var vis=b.querySelectorAll('.card:not(.hide)').length;
      b.style.display = vis? '':'none';
    });
  }
  [q,fy,fm,ft,fM].forEach(function(el){ if(el){ el.addEventListener('input',apply); el.addEventListener('change',apply);} });
  if(reset) reset.addEventListener('click',function(){
    q.value=''; [fy,fm,ft,fM].forEach(function(el){ if(el) el.value=''; }); apply(); sethash('all');
  });
  function sethash(id){
    var t=document.getElementById(id); if(!t) return;
    [].slice.call(document.querySelectorAll('nav.tabs a')).forEach(function(a){
      a.classList.toggle('on', a.getAttribute('href')==='#'+id);
    });
  }
  window.addEventListener('hashchange',function(){ sethash(location.hash.slice(1)); });
  if(!location.hash) sethash('all'); else sethash(location.hash.slice(1));
  document.querySelectorAll('.card').forEach(function(c){
    c.addEventListener('click',function(e){
      if(e.target.tagName==='SUMMARY'||e.target.tagName==='A') return;
      var d=c.querySelector('details.more'); if(d) d.open=!d.open;
    });
  });
  apply();
})();
`;


const TPL = (o) => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${o.title}</title>
<meta name="description" content="${e(o.desc)}">
<meta name="generator" content="career-explore-calendar build_site.mjs">
<style>${CSS}</style>
</head>
<body>
<div class="punch"></div>
<header class="hero"><div class="wrap">
<p class="eyebrow">${o.eyebrow}</p>
<h1>${o.h1}</h1>
<p class="lede">${o.lede}</p>
<div class="meta-line">${o.chips.map((x) => `<span class="chip">${e(x)}</span>`).join("")}</div>
</div></header>
${o.nav}
${o.content}
<footer><div class="wrap">${FOOT}</div></footer>
<script>${o.js ? FRONT_JS : ""}</script>
</body>
</html>
`;

const FOOT = "福建幼儿师范高等专科学校 ｜ 生涯探索年历 v1.0 ｜ 零外链离线单页 ｜ 内容为探索工具与课程素材，不承诺升学就业结果";
const majorMap = Object.fromEntries(MAJORS.map((x) => [x.date, x.major]));

function nav(tabs, cur) {
  return `<nav class="tabs"><div class="wrap">${tabs.map(([id, label]) =>
    `<a href="#${id}"${id === cur ? ' class="on"' : ""}>${e(label)}</a>`).join("")}</div></nav>`;
}

function dayCard(d) {
  const t = d.type || "弹性日", m = d.month || 1, col = TC[t] || "#0F3D2E";
  const lines = d.lines || [];
  const tags = [`<span class="tag" style="background:${col}">${e(t)}</span>`]
    .concat(lines.map((ln) => `<span class="tag" style="background:#8A8F7E">${e(LINE_ABBR[ln] || ln)}</span>`));
  const cobj = CARDS[d.card || ""];
  let cinfo = "";
  if (cobj) {
    const steps = (cobj.steps || []).map((x, i) => `<div>${i + 1}. ${e(x)}</div>`).join("");
    const vtxt = Object.entries(cobj.variants || {}).filter(([, v]) => typeof v === "string")
      .map(([k, v]) => `<div><b>${e(k)} 线：</b>${e(v)}</div>`).join("");
    cinfo = `<div><b>工具卡 ${e(d.card)}｜${e(d.card_name || cobj.name)}</b>（${e(cobj.pattern)}类，约 ${e(cobj.minutes)} 分钟）</div>`
      + `<div>${e(cobj.pool)}</div>${steps}${vtxt}<div><b>产出：</b>${e(cobj.output)}</div>`;
  } else if (d.card) {
    cinfo = `<div><b>工具卡 ${e(d.card)}｜${e(d.card_name)}</b></div>`;
  }
  const mj = majorMap[d.date] ? `<div><b>专业专属：</b>${e(majorMap[d.date])}</div>` : "";
  const tl = toolOf(d.card);
  const toolLine = tl ? `<div><b>配套图纸：</b>${e(tl.code)} ${e(tl.name)}（打印版《工具图纸分册》A4 第 ${tl.page} 张；本卡全年用到 ${tl.count} 次）</div>` : "";
  const note = d.note ? `<div><b>备注：</b>${e(d.note)}</div>` : "";
  const hook = d.hook ? `<div class="hook">${e(d.hook)}</div>` : "";
  const payload = [d.title, d.desc, d.material, d.hook, d.card_name, t, lines.join(" ")].join(" ");
  return `<article class="card" data-month="${m}" data-type="${e(t)}" data-line="${lines.join(" ")}" data-major="${e(majorMap[d.date] || "")}" data-text="${e(payload)}">`
    + `<div class="art">${art(t, m)}</div><div class="body">`
    + `<div class="datepill"><b>${m}月${d.day}日</b> ${e(d.weekday)}</div>`
    + `<div class="tags">${tags.join("")}</div>`
    + `<h4>${e(d.title)}</h4><p>${e(d.desc)}</p>${hook}`
    + `<div class="foot"><span>约 ${e(d.minutes)} 分钟</span><span>材料：${e(d.material)}</span></div>`
    + `<details class="more"><summary>展开工具卡、配套图纸与备注</summary><div class="inner">${mj}${cinfo}${toolLine}${note}</div></details>`
    + `</div></article>`;
}

function monthBlock(mi, days) {
  const info = MONTHS[mi - 1] || {};
  const head = `<div class="mhead"><h2>${e(info.name || MN[mi - 1])}</h2><span class="theme">${e(info.title)}</span>`
    + `<span class="goal">${e(info.goal)}</span></div>`;
  const rhythm = info.rhythm ? `<div style="font-size:12.4px;color:#6B7A70;margin:6px 0 2px">${e(info.rhythm)}</div>` : "";
  return `<section class="monthblock" id="m${mi}">${head}${rhythm}<div class="grid">${days.map(dayCard).join("")}</div></section>`;
}

function filterBar(n) {
  const lines = Object.entries(META.lines || {}).map(([k, v]) => `<option value="${k}">${e(k)} ${e(v)}</option>`).join("");
  const ms = MN.map((x, i) => `<option value="${i + 1}">${e(x)}</option>`).join("");
  const ts = (META.day_types || []).map((t) => `<option value="${e(t)}">${e(t)}</option>`).join("");
  const mj = MAJORS.map((x) => `<option value="${e(x.major)}">${e(x.major)}</option>`).join("");
  const lg = (META.day_types || []).map((t) => `<span><i style="background:${TC[t] || "#666"}"></i>${e(t)}</span>`).join("");
  return `<div class="bar"><h3>筛选与搜索（全年 365 天通用）</h3>
<div class="fields">
<label>关键词 <input type="search" id="q" placeholder="如：访谈、简历、专升本、面试"></label>
<label>走向 <select id="fy"><option value="">全部</option>${lines}</select></label>
<label>月份 <select id="fm"><option value="">全部</option>${ms}</select></label>
<label>日类型 <select id="ft"><option value="">全部</option>${ts}</select></label>
<label>专业 <select id="fM"><option value="">全部</option>${mj}</select></label>
<button class="btn" id="reset">清空</button>
<span class="count" id="cnt">共 ${n} 天</span>
</div>
<div class="legend">${lg}</div></div>
<div class="empty" id="empty">没有符合条件的日期，换个关键词试试。</div>`;
}

const byMonth = {};
for (const d of DAYS) { (byMonth[d.month] ||= []).push(d); }

function buildIndex() {
  const st = META.stats || {};
  const cards = [];
  cards.push(`<a class="idxcard" href="year.html"><span class="k">YEAR</span><h3>全年 365 天</h3><p>一页看完全年节奏：${META.days} 天探索、${st.card_total} 张工具卡、${st.major_days} 个专业专属日。支持按走向 / 月份 / 日类型 / 专业筛选与关键词搜索。</p></a>`);
  cards.push(`<a class="idxcard" href="analysis.html"><span class="k">REVIEW</span><h3>月度 / 年度结论分析</h3><p>每月填三行（数据 → 判断 → 下一步）即时出月结论，年末把 12 条月结论汇总成年度结论。含四档判定、合格自检、一键复制与打印。</p></a>`);
  const qTheme = {1:"认自己：把我是谁变成可指认的数据",2:"看清外部：专业、路径与真实需求",3:"做决策：在分岔口上把选项缩到 2 个",4:"去行动：把选择落成可验证的证据"};
  const qRange = {1:"1—3 月",2:"4—6 月",3:"7—9 月",4:"10—12 月"};
  for (let q = 1; q <= 4; q++) cards.push(`<a class="idxcard" href="q${q}.html"><span class="k">QUARTER ${q}</span><h3>${qRange[q]}</h3><p>${qTheme[q]}</p></a>`);
  const monCards = MONTHS.map((info, i) => `<a class="idxcard" href="m${String(i + 1).padStart(2, "0")}.html"><span class="k">${e(info.code)}</span><h3>${e(info.name)}｜${e(info.title)}</h3><p>${e(info.goal)}</p></a>`).join("");
  const lineCards = Object.entries(META.lines || {}).map(([k, v]) => `<a class="idxcard" href="#lines"><span class="k">LINE ${e(k)}</span><h3>${e(v)}</h3><p>同一天的任务在不同走向下的改写版本（工具卡变体），详见正文卡片内「A/B/C/D/E 线」说明。</p></a>`).join("");
  const mjCards = MAJORS.map((x) => `<a class="idxcard" href="${e(majorFile(x.major))}"><span class="k">${e(x.college)}</span><h3>${e(x.major)}</h3><p>${e(x.date)} · ${e(x.anchor.split("（")[0])}</p></a>`).join("");
  const content = `<div class="wrap"><p class="sec-title">入口</p><div class="idx">${cards.join("")}</div>`
    + `<p class="sec-title">月份</p><div class="idx">${monCards}</div>`
    + `<p class="sec-title">二十四专业专属探索日</p><div class="idx">${mjCards}</div>`
    + `<p class="sec-title" id="lines">五条走向分线</p><div class="idx">${lineCards}</div>`
    + `<div class="bar"><h3>怎么用</h3><div style="font-size:13.2px;color:#44504A;line-height:1.85">`
    + `1. 全年页适合整体备课与班会排期，先看日类型色带，再按月份细读。<br>`
    + `2. 月份页适合直接打印当月的日卡，贴进班级公告栏或发给学生。<br>`
    + `3. 专业页是该专业学生的专属一日，落在真实节日/节气上，与当月主线不冲突。<br>`
    + `4. 打印：浏览器 Ctrl+P，A5 纵向，左边留白即为打孔位，卡片会两栏排布。<br>`
    + `5. 本文件零外链，可离线打开、可拷进 U 盘、可挂到内网。</div></div></div>`;
  return TPL({ title: (META.title || "2027 生涯探索年历") + "｜索引", desc: "2027 生涯探索年历站点索引",
    eyebrow: "CAREER EXPLORE CALENDAR 2027", h1: e(META.title),
    lede: "一年 365 天，每天一个可单独做、又能串成一条线的生涯探索动作。按专科三年、五条走向（升学 / 就业 / 创业 / 考编 / 参军）改写，24 个专业各有专属一日。",
    chips: [`${META.school}｜${META.version}`, "365 天 · 64 张工具卡 · 24 个专业日", "零外链 · 可离线 · 支持 A5 打印"],
    nav: "", content, js: false });
}

function buildYear() {
  const tabs = [["all", "全年"]].concat(MN.map((x, i) => ["m" + (i + 1), x]));
  const content = `<div class="wrap" id="all">${filterBar(DAYS.length)}`
    + MN.map((_, i) => monthBlock(i + 1, byMonth[i + 1] || [])).join("") + `</div>`;
  return TPL({ title: "2027 生涯探索年历｜全年 365 天", desc: "全年 365 天探索日卡",
    eyebrow: "CAREER EXPLORE CALENDAR 2027 · FULL YEAR", h1: e(META.title) + "　全年 365 天",
    lede: "每天一个探索动作，可单独做，也可按周闭环串成线。点击任一卡片可展开工具卡步骤与变体。",
    chips: ["365 天", "64 张工具卡", "五条走向", "A5 可打印"], nav: nav(tabs, "all"), content, js: true });
}

function buildQuarter(q) {
  const ms = [(q - 1) * 3 + 1, (q - 1) * 3 + 2, (q - 1) * 3 + 3];
  const n = ms.reduce((s, i) => s + (byMonth[i] || []).length, 0);
  const qname = ["第一季度", "第二季度", "第三季度", "第四季度"][q - 1];
  const qgoal = {1:"认自己：把「我是谁」变成可指认的数据",2:"看清外部：专业、路径与真实需求",3:"做决策：在分岔口把选项缩到两个",4:"去行动：把选择落成可验证的证据"}[q];
  const tabs = [["top", "本季"]].concat(ms.map((i) => ["m" + i, MN[i - 1]]));
  const content = `<div class="wrap" id="top"><div class="bar"><h3>${qname}｜${e(qgoal)}</h3>`
    + `<div style="font-size:13px;color:#44504A">本季共 ${n} 天，覆盖 ${MN[ms[0] - 1]} 至 ${MN[ms[2] - 1]}。季度末安排一次季度体检与季度复盘，用来判断下一季是否换线。</div></div>`
    + filterBar(n) + ms.map((i) => monthBlock(i, byMonth[i] || [])).join("") + `</div>`;
  return TPL({ title: `2027 生涯探索年历｜${qname}`, desc: qname + qgoal,
    eyebrow: "CAREER EXPLORE CALENDAR 2027 · Q" + q, h1: `${qname}　${MN[ms[0] - 1]}—${MN[ms[2] - 1]}`,
    lede: e(qgoal), chips: [`${n} 天`, "含季度体检与复盘", "A5 可打印"], nav: nav(tabs, "top"), content, js: true });
}

function buildMonth(mi) {
  const info = MONTHS[mi - 1];
  const tabs = [["top", info.name], ["m" + mi, "本月中日卡"]];
  const content = `<div class="wrap" id="top"><div class="bar"><h3>${e(info.name)}｜${e(info.title)}</h3>`
    + `<div style="font-size:13px;color:#44504A;line-height:1.8"><b>本月目标：</b>${e(info.goal)}<br>`
    + `<b>方法：</b>${e(info.method)}<br><b>节奏：</b>${e(info.rhythm)}<br><b>工具卡池：</b>${e((info.pool || []).join("、"))}</div></div>`
    + monthBlock(mi, byMonth[mi] || []) + `</div>`;
  return TPL({ title: `2027 生涯探索年历｜${info.name}`, desc: info.goal,
    eyebrow: "CAREER EXPLORE CALENDAR 2027 · " + info.code, h1: `${e(info.name)}　${e(info.title)}`,
    lede: e(info.goal), chips: [`${(byMonth[mi] || []).length} 天`, `工具卡池 ${(info.pool || []).length} 张`, "A5 可打印"],
    nav: nav(tabs, "top"), content, js: true });
}

function buildMajor(x) {
  const acts = (x.actions || []).map((a) => `<li>${e(a.text)}</li>`).join("");
  const content = `<div class="wrap" id="top"><p class="sec-title">专业专属探索日</p>`
    + `<div class="majorcard"><div class="col">${e(x.college)} ／ ${e(META.school)}</div>`
    + `<h4>${e(x.major)} · ${e(x.anchor.split("（")[0])}</h4>`
    + `<div class="row"><b>落在：</b>${e(x.date)} ${e(x.weekday)} ／ ${e(x.anchor)}</div>`
    + `<div class="row"><b>为什么是这一天：</b>${e(x.reason)}</div>`
    + `<div class="row"><b>当日动作（约 ${e(x.minutes)} 分钟）：</b><ol>${acts}</ol></div>`
    + `<div class="row"><b>材料：</b>${e(x.materials)}</div>`
    + `<div class="row"><b>产出：</b>${e(x.output)}</div>`
    + `<div class="row"><b>配套工具卡：</b>${e((x.cards || []).join("、"))}</div></div>`
    + `<div class="bar" style="margin-top:18px"><h3>使用建议</h3><div style="font-size:13px;color:#44504A;line-height:1.85">`
    + `1. 专业专属日与当月主线的日常探索并行，不替代当日日卡。<br>`
    + `2. 建议由本专业班主任或社团带组者统一组织，一次 45—60 分钟完成。<br>`
    + `3. 产出物收进学生自己的生涯档案袋，年末做年报时作为证据使用。</div></div></div>`;
  return TPL({ title: `2027 生涯探索年历｜${x.major} 专属日`, desc: x.anchor,
    eyebrow: "MAJOR DAY · " + e(x.college), h1: e(x.major), lede: e(x.anchor),
    chips: [x.college, x.date + " " + x.weekday, "约 " + x.minutes + " 分钟"],
    nav: nav([["top", "本页"]], "top"), content, js: false });
}

const majorFile = (name) => "major_" + String(name).replace(/[\\/:*?"<>|\s]+/g, "_") + ".html";

const written = [];
function put(name, html) { fs.writeFileSync(path.join(OUT, name), html, "utf8"); written.push([name, Buffer.byteLength(html)]); }

put("index.html", buildIndex());
put("year.html", buildYear());
for (let q = 1; q <= 4; q++) put(`q${q}.html`, buildQuarter(q));
for (let i = 1; i <= 12; i++) put(`m${String(i).padStart(2, "0")}.html`, buildMonth(i));
for (const x of MAJORS) put(majorFile(x.major), buildMajor(x));

const total = written.reduce((s, [, b]) => s + b, 0);
console.log(`files=${written.length} total=${(total / 1048576).toFixed(2)}MB out=${OUT}`);
console.log(`days=${DAYS.length} cards=${Object.keys(CARDS).length} majors=${MAJORS.length}`);
