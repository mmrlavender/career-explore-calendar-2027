/**
 * 结论分析引擎（月度 / 年度）—— 打印版与网页版共用同一份逻辑
 * 只做「事实计算 + 口径判定 + 措辞生成」，不引入任何数据层没有的新事实。
 * 可在 Node（import）与浏览器（内联后 window.CEA）两处使用。
 */

const LEVELS = [
  { min: 0.85, key: 'formed', label: '已成形' },
  { min: 0.60, key: 'half', label: '半成形' },
  { min: 0.35, key: 'start', label: '起步' },
  { min: 0, key: 'blank', label: '待补' },
];

const SELF_VALUE = { done: 1, part: 0.5, none: 0 };
const SELF_KEYS = ['data', 'judge', 'next'];

const num = (v, d) => {
  const n = Number(v);
  if (!isFinite(n) || n < 0) return d == null ? 0 : d;
  return n;
};

const pctOf = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

function levelOf(score) {
  for (const l of LEVELS) if (score >= l.min) return l;
  return LEVELS[LEVELS.length - 1];
}

function selfScore(self) {
  let s = 0;
  SELF_KEYS.forEach((k) => {
    const v = self && SELF_VALUE[self[k]] != null ? SELF_VALUE[self[k]] : 0;
    s += v;
  });
  return s / SELF_KEYS.length;
}

/* ---------- 季度：口径常量（季度 = 连续 3 个月；锚点取年历既有季度体检日） ---------- */

const QUARTER_NAME = ['第一季度', '第二季度', '第三季度', '第四季度'];
const QUARTER_MONTHS = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]];

/* 五指标单位只按 R02 原文措辞推断（率/占比→%、条数→条、清晰度→分、前提→个），不写死任何数字 */
function unitOf(label) {
  const s = String(label || '');
  if (/率|占比/.test(s)) return '%';
  if (/条数|条/.test(s)) return '条';
  if (/清晰度|分/.test(s)) return '分';
  if (/前提/.test(s)) return '个前提';
  return '';
}

/* R02「季度路线体检」的五指标与调整项条款，全部取自数据层 cards.R02.steps，不另写文案 */
function buildIndicators(cards) {
  const CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5 };
  const r = (cards && cards.R02) || {};
  const out = [];
  (r.steps || []).forEach((s) => {
    const m = String(s).match(/^指标([一二三四五])[：:]\s*(.+)$/);
    if (!m) return;
    const idx = CN[m[1]];
    const parts = m[2].split('，');
    out.push({ key: 'i' + idx, idx, label: parts[0], detail: parts.slice(1).join('，'), unit: unitOf(parts[0] + m[2]) });
  });
  return out;
}

function r02Model(cards) {
  const r = (cards && cards.R02) || null;
  if (!r) return null;
  const steps = r.steps || [];
  return {
    code: r.code || 'R02',
    name: r.name || '季度路线体检',
    star: r.star || '',
    minutes: r.minutes || '',
    materials: r.materials || '',
    output: r.output || '',
    steps,
    actions: (r.actions || []).map((a) => ({ idx: a.idx, title: a.title, desc: a.desc, minutes: a.minutes })),
    adjust: steps.filter((s) => !/^指标[一二三四五]/.test(String(s))).join(' '),
  };
}

/* ---------- 从年历数据构造分析模型 ---------- */

const CARD_PREFIX = (cardStr) => {
  const s = String(cardStr || '');
  const m = s.match(/^([A-Z])0?(\d+)/i);
  if (m) return (m[1].toUpperCase() + String(m[2]).padStart(2, '0'));
  return s.split('-')[0] || '';
};

function buildModels(data) {
  const MONTHS = (data && data.months) || [];
  const DAYS = ((data && data.days) || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const CARDS = (data && data.cards) || {};
  const LINE_NAME = { A: '升学', B: '就业', C: '创业', D: '考编', E: '参军' };

  /* 工具图纸：按首次出现日期排序编号（与 build_print.mjs 同口径） */
  const firstUse = {};
  const useCount = {};
  DAYS.forEach((d, i) => {
    const code = CARD_PREFIX(d.card);
    if (!code) return;
    if (!firstUse[code]) firstUse[code] = { dayNo: i + 1, date: d.date };
    useCount[code] = (useCount[code] || 0) + 1;
  });
  const orderedCards = Object.keys(firstUse).sort((a, b) => {
    const fa = firstUse[a], fb = firstUse[b];
    return String(fa.date).localeCompare(String(fb.date)) || (a < b ? -1 : 1);
  });

  const months = MONTHS.map((m, mi) => {
    const mdays = DAYS.filter((d) => Number(d.month) === Number(m.month));
    const pool = (m.pool || []).map((k) => CARDS[k] || { code: k, name: k });
    const typeCount = {};
    mdays.forEach((d) => { typeCount[d.type] = (typeCount[d.type] || 0) + 1; });
    const codes = [];
    mdays.forEach((d) => {
      const c = CARD_PREFIX(d.card);
      if (c && codes.indexOf(c) < 0 && CARDS[c]) codes.push(c);
    });
    const toolSet = [];
    codes.forEach((c) => {
      const t = 'T' + String(orderedCards.indexOf(c) + 1).padStart(2, '0');
      if (orderedCards.indexOf(c) >= 0 && toolSet.indexOf(t) < 0) toolSet.push(t);
    });
    const next = MONTHS[mi + 1] || null;
    return {
      month: Number(m.month),
      name: m.name,
      title: m.title,
      core_question: m.core_question || '',
      goal: m.goal || '',
      method: m.method || '',
      output: m.output || '',
      rhythm: m.rhythm || '',
      line_note: m.line_note || '',
      dayTotal: mdays.length,
      dayTypes: typeCount,
      cards: codes.map((c) => ({ code: c, name: (CARDS[c] || {}).name || c, star: !!(CARDS[c] || {}).star })),
      pool,
      tools: toolSet,
      nextName: next ? next.name : '',
      nextTitle: next ? next.title : '',
      nextOutput: next ? next.output || '' : '',
      nextQuestion: next ? next.core_question || '' : '',
    };
  });

  const year = {
    dayTotal: DAYS.length,
    cardTotal: Object.keys(CARDS).length,
    toolTotal: orderedCards.length,
    majorTotal: ((data && data.major_days) || []).length,
    monthTotal: months.length,
    months: months.map((m) => ({ month: m.month, name: m.name, title: m.title, core_question: m.core_question, output: m.output })),
    lineName: LINE_NAME,
  };

  /* 季度：三个月一组；锚点直接取数据层里 type='季度体检' 的日期，不另行编日期 */
  const checkDates = DAYS.filter((d) => d.type === '季度体检').map((d) => String(d.date)).sort();
  const quarters = QUARTER_MONTHS.map((ms, qi) => {
    const qm = months.filter((m) => ms.indexOf(m.month) >= 0);
    const codes = [];
    qm.forEach((m) => m.cards.forEach((c) => { if (codes.indexOf(c.code) < 0) codes.push(c.code); }));
    const qtools = [];
    qm.forEach((m) => m.tools.forEach((t) => { if (qtools.indexOf(t) < 0) qtools.push(t); }));
    const anchorDate = checkDates.filter((dt) => {
      const mm = Number(String(dt).slice(5, 7));
      return ms.indexOf(mm) >= 0;
    })[0] || '';
    const anchorM = qm[qm.length - 1] || null;
    const nextQ = QUARTER_MONTHS[qi + 1] || null;
    return {
      q: qi + 1,
      name: QUARTER_NAME[qi],
      range: `${ms[0]}—${ms[ms.length - 1]} 月`,
      months: qm.map((m) => ({
        month: m.month, name: m.name, title: m.title,
        core_question: m.core_question, output: m.output,
        cards: m.cards.map((c) => c.code), dayTotal: m.dayTotal,
      })),
      dayTotal: qm.reduce((s, m) => s + m.dayTotal, 0),
      cards: codes.map((c) => ({ code: c, name: (CARDS[c] || {}).name || c, star: !!(CARDS[c] || {}).star })),
      cardTotal: codes.length,
      tools: qtools,
      anchor: anchorDate ? {
        date: anchorDate,
        md: `${Number(anchorDate.slice(5, 7))} 月 ${Number(anchorDate.slice(8, 10))} 日`,
        weekday: (DAYS.filter((d) => String(d.date) === anchorDate)[0] || {}).weekday || '',
      } : null,
      anchorMonthName: anchorM ? anchorM.name : '',
      core_question: anchorM ? anchorM.core_question : '',
      output: anchorM ? anchorM.output || '' : '',
      nextName: nextQ ? QUARTER_NAME[qi + 1] : '',
      nextRange: nextQ ? `${nextQ[0]}—${nextQ[nextQ.length - 1]} 月` : '',
    };
  });
  year.quarterTotal = quarters.length;

  return { months, quarters, year, indicators: buildIndicators(CARDS), r02: r02Model(CARDS) };
}

/* ---------- 月度结论 ---------- */

function monthConclusion(model, input) {
  input = input || {};
  const daysDone = Math.min(num(input.daysDone), model.dayTotal);
  const cardsTotal = model.cards.length;
  const cardsDone = Math.min(num(input.cardsDone), cardsTotal);
  const self = input.self || {};
  const dayRatio = model.dayTotal ? daysDone / model.dayTotal : 0;
  const cardRatio = cardsTotal ? cardsDone / cardsTotal : 0;
  const spend = cardRatio > 0 ? (dayRatio * 0.4 + cardRatio * 0.6) : dayRatio;
  const score = spend * 0.4 + selfScore(self) * 0.6;
  const level = levelOf(score);
  const q = model.core_question || '本月要回答的问题';
  const out = model.output || '本月产出';
  const nextName = model.nextName || '下个月';
  const nextTitle = model.nextTitle || '';
  const nextFocus = model.nextOutput || model.nextQuestion || '';

  const dataLine = cardsTotal
    ? `本月走完 ${daysDone}/${model.dayTotal} 天（${pctOf(daysDone, model.dayTotal)}%），完成工具卡 ${cardsDone}/${cardsTotal} 张${model.tools.length ? `，用到图纸 ${model.tools.join('、')}` : ''}。`
    : `本月走完 ${daysDone}/${model.dayTotal} 天（${pctOf(daysDone, model.dayTotal)}%）。`;

  let judgeLine = '';
  if (level.key === 'formed') {
    judgeLine = `本月核心问题「${q}」你已能自己回答，并且落到了「${out}」里。这条结论可以定稿：写下去，一句话即可，不要超过 30 个字。`;
  } else if (level.key === 'half') {
    judgeLine = `本月核心问题「${q}」方向有了，但证据不齐：${cardsTotal ? `工具卡还差 ${cardsTotal - cardsDone} 张` : '关键动作还没做完'}，「${out}」目前只是半成品。结论先别写漂亮，只补缺口——缺的那一块就是结论的真正内容。`;
  } else if (level.key === 'start') {
    judgeLine = `本月核心问题「${q}」你现在只是知道要问，答案还多半是别人的说法。写一条就好：本月你投入最多的一件事，用三行事实写清楚（做了什么、花了多久、结果是什么），再判断它落在你这个月的哪一步。`;
  } else {
    judgeLine = `本月证据太少，结论暂时不成立——这不等于白过。只做一件事：从本月日页里挑 1 天重做，写下 1 条事实。${nextName}的「${nextTitle}」会直接用到它。`;
  }

  const nextLine = nextTitle
    ? `下月是「${nextName}：${nextTitle}」。本月结论先写死一句（不成熟也写），下月用${nextFocus ? `「${nextFocus}」` : '新的事实'}去验证：被推翻也是结论，改一版即可。`
    : `本月结论写死一句并签署日期，全年结束时它是年报的第一条证据。`;

  const checklist = [
    '写的是事实，不是形容词（有人、有事、有时间或数字）',
    '能说出一个方向，而不是罗列做过的事',
    '能指出下个月要做的一件具体的事',
  ];

  const advice = [];
  if (level.key === 'formed') {
    advice.push(`把「${out}」复印一份留档，年度结论直接从它摘句。`);
    advice.push('结论定稿后不要再改措辞，改动只加证据。');
  } else if (level.key === 'half') {
    advice.push(`用一次 40 分钟补完「${out}」缺的那一栏。`);
    advice.push('补的时候只写观察到的事实，不写评价自己的话。');
  } else if (level.key === 'start') {
    advice.push('把本月最投入的一件事写成三行事实，贴在月结论页。');
    advice.push('找一个人把这三行读给他听，只问一句「你听出我想干什么了吗」。');
  } else {
    advice.push('只补 1 天，不追进度。');
    advice.push('把漏掉的日子记在进度总表上，别在心理上补课。');
  }

  return {
    month: model.month,
    name: model.name,
    level: level.key,
    levelLabel: level.label,
    score: Math.round(score * 100) / 100,
    daysDone,
    daysTotal: model.dayTotal,
    cardsDone,
    cardsTotal,
    paras: [
      { k: '数据', text: dataLine },
      { k: '判断', text: judgeLine },
      { k: '下一步', text: nextLine },
    ],
    checklist,
    advice,
    headline: `${model.name}结论：${level.label}${cardsDone || daysDone ? '' : '（本月未开始）'}`,
  };
}

/* ---------- 季度结论 ---------- */

/**
 * 季度分 = 季度月成形比 × 0.5 + 工具卡完成比 × 0.3 + 天完成比 × 0.2
 * - 季度月成形比：(已成形 + 半成形 × 0.5) / 本季月数（3）
 * - 工具卡完成比：本季完成卡 / 本季涉及的卡（去重）
 * - 天完成比：本季走完天数 / 本季总天数
 * R02 五指标（evidence）只作手填证据，不参与上面任何一项计算。
 */
function quarterConclusion(model, monthResults, evidence) {
  const rs = (monthResults || []).filter(Boolean);
  const monthTotal = model.months.length || 3;
  const formed = rs.filter((r) => r.level === 'formed').length;
  const half = rs.filter((r) => r.level === 'half').length;
  const start = rs.filter((r) => r.level === 'start').length;
  const blank = rs.filter((r) => r.level === 'blank').length;
  const sumDays = rs.reduce((s, r) => s + num(r.daysDone), 0);
  const sumCards = rs.reduce((s, r) => s + num(r.cardsDone), 0);
  const cardsTotal = model.cardTotal || 0;
  const cardsDone = Math.min(sumCards, cardsTotal);
  const monthRatio = (formed + half * 0.5) / monthTotal;
  const dayRatio = model.dayTotal ? sumDays / model.dayTotal : 0;
  const cardRatio = cardsTotal ? cardsDone / cardsTotal : 0;
  const score = monthRatio * 0.5 + cardRatio * 0.3 + dayRatio * 0.2;
  const level = levelOf(score);

  const q = model.core_question || '本季路线是否还成立';
  const anchorTxt = model.anchor ? `${model.anchor.md}` : '季末';

  const dataLine = `本季走完 ${sumDays}/${model.dayTotal} 天（${pctOf(sumDays, model.dayTotal)}%），完成工具卡 ${cardsDone}/${cardsTotal} 张（${pctOf(cardsDone, cardsTotal)}%）；${monthTotal} 个月度结论里，已成形 ${formed} 条、半成形 ${half} 条、起步 ${start} 条、待补 ${blank} 条。`;

  let judgeLine = '';
  if (level.key === 'formed') {
    judgeLine = `本季路线成立：到 ${anchorTxt}体检时，${monthTotal} 个月里有 ${formed + half} 个月能自己回答「${q}」。下季不加新方向，只把同一批动作做深一档。`;
  } else if (level.key === 'half') {
    judgeLine = `本季方向有了、证据不齐：卡只完成 ${cardsDone}/${cardsTotal} 张，缺的正好是月结论里说不清的那段。下季先补本季没做完的动作，再谈换路线。`;
  } else if (level.key === 'start') {
    judgeLine = `本季主要是把日子走了一遍（走完 ${sumDays} 天，卡 ${cardsDone} 张），结论还停在起步。下季只做一件事：挑本季投入最多的一件事，写成三行事实，再用 R02 体检表把五个指标填满。`;
  } else {
    judgeLine = `本季证据太少，路线是否成立暂不判断——这不等于走错。下季只补 1 个月（挑你印象最深的那个月），补完再体检。`;
  }

  const nextLine = model.nextName
    ? `下季是${model.nextName}（${model.nextRange}）。到 ${model.nextName}的体检日，先用一次 30 分钟把 R02 体检表填满：五指标逐条写数，任一指标明显恶化，就在「下季调整项」写一条具体动作（做什么、什么时候之前）。`
    : `本季是最后一季：四季体检表并起来就是年报主体。四季里「前提是否仍成立」都勾成立的那条路径，就是年报里要写的主线。`;

  const checklist = [
    '五个指标填的是数或勾，不是只写「还行」',
    '能说出本季路线「还成立 / 要改」的一个理由，且理由来自事实',
    '调整项写成了具体动作（做什么、什么时候之前），不是「加把劲」',
  ];

  const advice = [];
  if (level.key === 'formed') {
    advice.push(`把本季「${model.output || '季末产出'}」留档，年报的季度段直接摘句。`);
    advice.push('五个指标里只要「前提仍成立」没过，就不改路线；改了要写清是哪条前提变了。');
  } else if (level.key === 'half') {
    advice.push(`用一次 40 分钟补完本季没做完的动作，优先补 ★ 核心卡。`);
    advice.push('补完再回填五指标里的完成率与信息条数，数字变了判断才会变。');
  } else if (level.key === 'start') {
    advice.push('把本季最投入的一件事写成三行事实，贴在季度页。');
    advice.push('五指标先只填三个：完成率、信息条数、时间占比，两周后再补另外两个。');
  } else {
    advice.push('只补 1 个月，不追进度。');
    advice.push('补的时候只回答：这个月我确认了什么、否掉了什么。');
  }

  return {
    q: model.q,
    name: model.name,
    range: model.range,
    anchor: model.anchor || null,
    level: level.key,
    levelLabel: level.label,
    score: Math.round(score * 100) / 100,
    monthRatio: Math.round(monthRatio * 100) / 100,
    cardRatio: Math.round(cardRatio * 100) / 100,
    dayRatio: Math.round(dayRatio * 100) / 100,
    daysDone: sumDays,
    daysTotal: model.dayTotal,
    cardsDone,
    cardsTotal,
    monthTotal,
    formed,
    half,
    start,
    blank,
    evidenceBound: false,
    evidenceNote: 'R02 五指标只作手填证据，不参与季度分计算。',
    paras: [
      { k: '数据', text: dataLine },
      { k: '判断', text: judgeLine },
      { k: '下一步', text: nextLine },
    ],
    checklist,
    advice,
    monthRows: model.months.map((m, i) => ({
      month: m.month,
      name: m.name,
      core_question: m.core_question,
      level: rs[i] ? rs[i].level : 'blank',
      levelLabel: rs[i] ? rs[i].levelLabel : '待补',
    })),
    headline: `${model.name}结论：${level.label}`,
  };
}

/** 五指标手填后的提示语：只根据用户自己填的值给方向，不补任何数据 */
function quarterFlags(model, evidence, prevEvidence) {
  const ev = evidence || {};
  const prev = prevEvidence || {};
  const flags = [];
  const pre = [ev.p1, ev.p2, ev.p3].filter((v) => v != null);
  const bad = pre.filter((v) => v === 'no').length;
  const dim = pre.filter((v) => v === 'part').length;
  if (bad) flags.push(`主选路径有 ${bad} 个前提已不成立：下季换动作，不要加大投入。`);
  else if (dim) flags.push(`${dim} 个前提只能算「存疑」：下季用一次访谈或一次试做去验，别放着。`);
  const c = num(ev.clarity, 0);
  const pc = num(prev.clarity, 0);
  if (c && pc && c < pc) flags.push(`决策清晰度比上季降了 ${pc - c} 分：先把降的原因写成一条事实。`);
  if (c && pc && c > pc) flags.push(`决策清晰度比上季升了 ${c - pc} 分：把升的原因记进月结论，它是路线成立的证据。`);
  const rate = num(ev.rate, -1);
  if (rate >= 0 && rate < 50) flags.push(`本季计划动作完成率 ${rate}%：下季动作砍到 3 件以内，先保证能完成。`);
  const time = num(ev.time, -1);
  if (time >= 0 && time < 10) flags.push(`生涯探索时间占比 ${time}%：下季先固定每周一个时段，时间不落地动作不会发生。`);
  if (!flags.length) flags.push('五个指标没有明显恶化：下季沿用本季动作，把量加一档。');
  return flags;
}

/* ---------- 年度结论 ---------- */

function yearConclusion(yearModel, monthInputs) {
  const inputs = monthInputs || [];
  const results = yearModel.months.map((m, i) => {
    const inp = inputs[i] || {};
    const model = inp.model || null;
    return inp.result || null;
  });
  const done = results.filter(Boolean);
  const sumDays = done.reduce((s, r) => s + r.daysDone, 0);
  const sumCards = done.reduce((s, r) => s + r.cardsDone, 0);
  const formed = done.filter((r) => r.level === 'formed').length;
  const half = done.filter((r) => r.level === 'half').length;
  const start = done.filter((r) => r.level === 'start').length;
  const blank = done.filter((r) => r.level === 'blank').length;
  const monthRatio = yearModel.monthTotal ? (formed + half * 0.5) / yearModel.monthTotal : 0;
  const dayRatio = yearModel.dayTotal ? sumDays / yearModel.dayTotal : 0;
  const cardRatio = yearModel.cardTotal ? sumCards / yearModel.cardTotal : 0;
  const score = monthRatio * 0.5 + cardRatio * 0.3 + dayRatio * 0.2;
  const level = levelOf(score);

  const overview = `全年走完 ${sumDays}/${yearModel.dayTotal} 天（${pctOf(sumDays, yearModel.dayTotal)}%），工具卡完成 ${sumCards}/${yearModel.cardTotal} 张（${pctOf(sumCards, yearModel.cardTotal)}%）；12 个月度结论中，已成形 ${formed} 条、半成形 ${half} 条、起步 ${start} 条、待补 ${blank} 条。`;

  let verdict = '';
  if (level.key === 'formed') {
    verdict = `你的年度结论可以定稿：这一年你已经用事实回答了「我是谁、我能去哪、我凭什么去」。现在要做的不是继续探索，而是把结论压成一页纸，并挑一条线动手。`;
  } else if (level.key === 'half') {
    verdict = `这一年你已经有了方向感，但证据链还差一截：能说清倾向，说不太清凭什么。年度结论写成「倾向 + 待验证项」两句话，比硬写一句完整结论更真实。`;
  } else if (level.key === 'start') {
    verdict = `这一年你走了一段，但结论还停在印象层面：做过的事记住了，为什么做、指向哪里还没接上。年度结论只写一条——这一年最像你的一件事，以及它暗示的方向。`;
  } else {
    verdict = `这一年留下的证据偏少，暂时支撑不起一条年度结论。不用补全年，只补 3 个月：挑你印象最深的 3 个月重做月结论，够写年报。`;
  }

  const three = [
    {
      k: '我在哪',
      text: `把前 3 个月的月结论头一句连起来读。三句里重复出现的那类事（和谁、做什么、什么感觉），就是你现在的坐标。`,
    },
    {
      k: '我能去哪',
      text: `把 4—9 月的月结论里出现过两次以上的方向挑出来。只出现过一次的是兴趣，出现两次以上的才是方向。`,
    },
    {
      k: '我凭什么去',
      text: `把 10—12 月的月结论和工具卡产出摊开，逐条问：这条能不能被别人看见（证书、作品、一次试做、一段经历）。能看见的才叫凭据。`,
    },
  ];

  const advice = [];
  if (level.key === 'formed' || level.key === 'half') {
    advice.push('把年度结论压到 100 字以内，写在年历末页并签名日期。');
    advice.push('从结论里挑 1 条主线（升学／就业／创业／考编／参军），只挑一条，写下第一步的时间。');
    advice.push('把月度结论卡和三张核心图纸（罗盘、雷达、权衡矩阵）装订成一册，作为面试或申请时的自述底稿。');
  } else {
    advice.push('先补 3 个月的月结论，其余月份不追。');
    advice.push('补的时候只回答一件事：这个月我确认了什么、否掉了什么。');
    advice.push('年度结论允许写「还不确定」，但必须写清下一步去验证什么。');
  }

  return {
    level: level.key,
    levelLabel: level.label,
    score: Math.round(score * 100) / 100,
    sumDays,
    sumCards,
    dayTotal: yearModel.dayTotal,
    cardTotal: yearModel.cardTotal,
    monthTotal: yearModel.monthTotal,
    formed,
    half,
    start,
    blank,
    paras: [
      { k: '数据', text: overview },
      { k: '判断', text: verdict },
    ],
    three,
    advice,
    monthRows: yearModel.months.map((m, i) => ({
      month: m.month,
      name: m.name,
      core_question: m.core_question,
      level: done[i] ? done[i].level : 'blank',
      levelLabel: done[i] ? done[i].levelLabel : '待补',
    })),
  };
}

const CEA = { buildModels, monthConclusion, quarterConclusion, quarterFlags, yearConclusion, buildIndicators, levelOf, CARD_PREFIX };

export { buildModels, monthConclusion, quarterConclusion, quarterFlags, yearConclusion, buildIndicators, levelOf, CARD_PREFIX };
export default CEA;
