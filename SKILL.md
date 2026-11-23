---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 78db55555203ac71c8a419c882a06031_c451e03ee70611f1a9b8525400f8a581
    ReservedCode1: Vti+o8X9XR569AJ9ieuhODjDbQ1aVpnF3/w6DfgFV8RGAfuDjlZpH5djV2tOE95h4BHRl4mnizYyjWXMKUqhoCsVRXrmoMG8X9O911n4KbL5MW0lAhUKFAsDKgcpWzuxMHdR3Xmg7SxTIG8GPQZmGRheVIYqiw1PliQs6hExiZP70KDcKkN9vIWH9ro=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 78db55555203ac71c8a419c882a06031_c451e03ee70611f1a9b8525400f8a581
    ReservedCode2: Vti+o8X9XR569AJ9ieuhODjDbQ1aVpnF3/w6DfgFV8RGAfuDjlZpH5djV2tOE95h4BHRl4mnizYyjWXMKUqhoCsVRXrmoMG8X9O911n4KbL5MW0lAhUKFAsDKgcpWzuxMHdR3Xmg7SxTIG8GPQZmGRheVIYqiw1PliQs6hExiZP70KDcKkN9vIWH9ro=
---



# 2027 生涯探索年历生成器（career-explore-calendar-2027）

## 一、这个 Skill 解决什么

把一份已定稿的「全年生涯探索内容数据」变成两类可直接交付的东西：

1. **网页版**：42 个年历页 + 1 个结论分析页（月度 / 季度 / 年度同页），全部零外链 HTML 单文件，双击 index.html 就能离线翻全年、看季度、看月份、看专业专属日。
2. **打印版**：A5 原稿按 2 列 × 2 行四合一排进 A4，四边带裁切线、无装订孔位，打印后沿虚线裁开即是 A5 小册；并可一键导出 PDF 直接发给对方。
3. **结论分析**（同一份数据派生）：按月、按季、按年把「做了什么」变成「得出什么结论」——网页版填三行即时出结论，打印版给可手写的月度 / 季度 / 年度结论页。

**它不做的事**：不生成新内容、不改题干、不编造数据。所有文字来自 `assets/data/2027生涯探索年历_data.json`，本 Skill 只负责版式、拆页与打印。

## 二、内置数据

- 数据文件：`assets/data/2027生涯探索年历_data.json`（UTF-8，自包含）
- 顶层字段：`meta` / `months` / `days` / `major_days` / `cards`

| 项目 | 数量 |
|---|---|
| 月份 | 12 |
| 日页（全年每一天） | 365 |
| 专业专属日 | 24 |
| 工具卡 | 64 |
| 分线术语 | A 升学 / B 就业 / C 创业 / D 考编 / E 参军 |

日页题型分布（合计 365，改动数据后必须重核）：

| 题型 | 数量 |
|---|---|
| 工具卡日 | 256 |
| 周闭环 | 44 |
| 节气观察 | 23 |
| 专业专属日 | 24 |
| 月度成果 | 12 |
| 季度体检 | 4 |
| 锚定日 | 1 |
| 归档日 | 1 |

## 三、三条产出命令

以下命令均在 **Skill 根目录** 执行（脚本默认已指向 `assets/data` 与 `out/`）。

```bash
# 1) 网页版：42 页零外链站点 → out/site/
node scripts/build_site.mjs
#    产物：index.html / year.html / q1-q4.html / m01-m12.html / major_<专业>.html

# 2) 结论分析网页版：一页零外链交互工具 → out/site/analysis.html
node scripts/build_review.mjs
#    产物：analysis.html（12 个月逐月填写 + 即时月结论 + 4 个季度复盘区（含 R02 五指标手填）
#          + 年度汇总 + 打印/复制/重置，用 localStorage 记住填写，
#          自检 9 项：数据注入 / 引擎内联 / 季度区已挂载 / R02 五指标已注入 / 无占位符 /
#          无 export / 零外链 / 打印样式 / 控件）

# 3) A4 四合一打印版：18 个 HTML → out/print/
node scripts/build_print.mjs
#    产物：print_index.html（屏幕入口，不打印）/ print_year.html /
#          print_m01..m12.html / print_majors.html / print_tools.html / print_tracker.html /
#          print_review.html（12 张月度 + 4 张季度 + 2 张年度结论页 = 18 个 A5 → 5 张 A4）

# 4) 打印版导出 PDF → out/pdf/
node scripts/cdp_pdf_batch.mjs --dir out/print --outdir out/pdf --match "^print_"
#    只出某几个：--only print_majors,print_m01,print_review
```

> 结论分析的计算口径集中在 `scripts/analysis_engine.mjs`（`buildModels` / `monthConclusion` / `quarterConclusion` / `quarterFlags` / `yearConclusion`），网页版与打印版共用同一套函数，**不要各写一份判定逻辑**。

自定义数据或输出目录：

```bash
node scripts/build_site.mjs  --data ../assets/data/xxx.json --out ../out/site_v2
node scripts/build_print.mjs --data ../assets/data/xxx.json --out ../out/print_v2
```

## 四、版式契约（改动前必读）

网页版：
- 单页内联 CSS/JS/SVG，**零外链**，可离线打开；A5 纵向打印友好。

打印版（`build_print.mjs`）：
- 一张 A4 纵向（210 × 297 mm）排 4 个 A5：2 列 × 2 行，每格 105 × 148.5 mm。
- A5 原稿 148 × 210 mm，`transform: scale(0.707143)`、`transform-origin: top left` 等比置入格内。
- 每格四边留裁切线（虚线），**无装订孔位**。
- `@page{ size:A4 portrait; margin:0 }`；末张 A4 `break-after:auto` 防空白页。

浏览器手动打印设置（与上面配套，不可再加缩放）：
- 纸张 A4、纵向、缩放 100%、边距「无」、勾选「背景图形」。

工具图纸分册（`print_tools.html`，随 `build_print.mjs` 一起产出）：
- 1 页「使用顺序索引」+ 11 张 A5 可填写图纸 = 12 个 A5，共 3 张 A4。索引页由 `sheetToolIndex()` 生成，列出每张图纸的编号、名称、对应工具卡、首次使用日期（第 N 天）、全年使用次数与所在 A4 页码。
- **编号即课堂先后**：`SHEET_TOOLS` 的顺序不手写，由 `TOOL_RAW` 经各工具卡在 365 天日页里的**首次出现日期**排序后自动编号（`FIRST_USE` 计算），改数据后重跑自动跟随；同一工具卡内的两张图（如罗盘 ①三环盘点 → ②交集定稿）由 `TOOL_RAW` 声明顺序决定。
- 图纸内容用 SVG 手绘坐标（`viewBox="0 0 131 150"`，1 单位 = 1 mm），`width/height` 直接给 `131mm/150mm`，随 A5 等比缩放 0.707143。
- 图纸清单（按使用先后）：T01/T02 生涯罗盘图（三环盘点、交集命名定稿）、T03 周闭环四问、T04 价值观 18 选 6、T05 能力雷达八轴、T06 生涯时间线、T07 决策风格四型、T08 季度路线体检、T09 复合能力拼图、T10 能力缺口四象限、T11 三走向权衡矩阵。
- **与年历互链**：每张图纸页脚标注「首次使用日期（第 N 天）· 全年使用次数」；每个日页底部标注「图纸 Tx · 分册 A4 第 N 张」；每月月封面列出「本月图纸 Tx …」，指向分册 A4 页码——三者同源自动同步，不要手改 HTML。

全年进度总表（`print_tracker.html`，同样由 `build_print.mjs` 产出）：
- 2 个 A5 页 → 1 张 A4：上半年 #001–#183、下半年 #184–#365，13 列网格，每格「勾选框 + 天序号 + 日期」，左侧色条表示该日类型（配色取 `COLOR`）。
- 第 1 页底部有「工具图纸领取核对 T01☐…T11☐」一行，与图纸分册编号一致。
- 可用高度约 195 mm。旧版曾用「天序号换行 + 色条在下」两行格子导致溢出 64 px，现为单行 flex 布局；改格子内容前务必重跑溢出量测。
- **可用高度 195 mm**（210 − 上 8.5 − 下 6.5）。SVG 固定 `h:150`，加上页头/标题/说明/页脚约 178 mm，仍有约 17 mm 余量；新增图纸时若把 `h` 调大，须重跑溢出量测（每格 `scrollHeight > clientHeight` 即溢出）。
- 图纸尺寸/字体口径：字号 2.2—3 mm（≈6-8 pt），填写线间距 3.4—5.6 mm 便于手写；不要把字号压到 2 mm 以下，打印后看不清。


## 五、结论分析口径（月度 / 年度）

口径全部在 `scripts/analysis_engine.mjs`，网页版（`build_review.mjs`）与打印版（`build_print.mjs`）调用同一份，**不要另写一套判定**。

### 1. 月度结论（`monthConclusion(model, input)`）

输入只有四个数：本月走完天数 `daysDone`、完成工具卡 `cardsDone`、以及三项自评 `self = {data, judge, next}`（各取 `done=1 / part=0.5 / none=0`）。

| 步骤 | 算法 |
|---|---|
| 投入比 `spend` | 有工具卡：天数比 × 0.4 + 卡完成率 × 0.6；无工具卡：只用天数比 |
| 自评比 `selfScore` | 三项自评取平均 |
| 月得分 | `spend × 0.4 + selfScore × 0.6`（**自评权重更高**：写得出来比做得多更算结论） |
| 四档判定 | ≥0.85 已成形（formed）/ ≥0.60 半成形（half）/ ≥0.35 起步（start）/ 其余 待补（blank） |

输出固定三段，段名不变：`数据`（走完几天、做完几张卡、用到哪些图纸）→ `判断`（按档位给一句该月核心问题的判定语）→ `下一步`（拿下月主题去验证本月结论，被推翻也算结论）。另附三条合格自检（写事实不写形容词 / 能说出一个方向 / 能指出下月一件具体事）与两条分档建议。

### 2. 季度结论（`quarterConclusion(quarterModel, monthResults, quarterInput)`）

季度分**不看自评**，只看可数事实与三月结论的成形度；四个季度按 `QUARTER_MONTHS` 固定划分：Q1 = 1—3 月、Q2 = 4—6 月、Q3 = 7—9 月、Q4 = 10—12 月。锚点取年历**既有**的季度体检日（来自日页 `type === '季度体检'`，当前数据为 3/31、6/30、9/29、**11/30**——Q4 体检排在 11 月最后一天，12/31 在数据里是归档日，故引擎按数据取锚点而非写死 12/31），不新增日期；换数据后锚点自动跟随。

| 步骤 | 算法 |
|---|---|
| 季度月成形比 | 该季 3 条月结论 `(已成形 + 半成形 × 0.5) / 3`，权重 0.5 |
| 工具卡完成比 | 本季完成卡 / 本季应有卡（各月工具卡去重合计），权重 0.3 |
| 天完成比 | 本季走完天数 / 本季总天数，权重 0.2 |
| 季度分 | `月成形比 × 0.5 + 卡完成比 × 0.3 + 天完成比 × 0.2`，四档判定沿用月度（≥0.85 / ≥0.60 / ≥0.35 / 其余） |

输出：`paras` 三段（`数据`：本季天数、卡、三条月结论成形分布；`判断`：按档位给一句「本季路线是否还成立」的判语；`下一步`：下季调整项指向），另附三条合格自检与两条分档建议，字段与 `monthConclusion` 保持同名，便于共用渲染。

**R02 五指标只作手填证据，不参与算分**：

- `buildModels()` 额外返回 `indicators`（从 `cards.R02.steps` 解析出的五项指标：动作完成率 / 有效信息条数 / 决策清晰度 1—10 / 前提假设复检 / 探索时间占比）与 `r02`（R02 原文字段），网页版与打印版都直接渲染，**不要在模板里手写第二份指标文案**。
- `quarterFlags(input)` 只按手填值给「是否要写下季调整项」的提示（如某指标为空、清晰度低于 6、前提被判不成立）；它不改变 `score`，也不改档位——晋升判定仍只走上面三项可数口径。

### 3. 年度结论（`yearConclusion(yearModel, monthInputs)`）

| 步骤 | 算法 |
|---|---|
| 月成形比 | `(已成形 + 半成形 × 0.5) / 12`，权重 0.5 |
| 卡完成比 | 全年完成卡 / 64，权重 0.3 |
| 天完成比 | 全年走完天数 / 365，权重 0.2 |
| 年得分 | 三项加权和，四档同上 |

输出：全年概览（天数、卡、12 条月结论的成形分布）→ 一句分档判语 `verdict` → 年度三问 `three`（我在哪 / 我能去哪 / 我凭什么去，各配一段「从哪几个月度结论里摘」的指引）→ 分档建议 `advice`。年度页的「主线只勾一条」用 `LINE_NAME`（A 升学 / B 就业 / C 创业 / D 考编 / E 参军），五条不做优劣比较。

### 4. 三种形态

- **网页版 `out/site/analysis.html`**：12 个月逐月填（天数、卡数、三项自评），右侧即时出结论与自检；中间「季度复盘」区填 4 个季度（R02 五指标手填 + 三条月结论速览），季末能立刻看出路线是否还成立；年末自动汇总 12 条月结论出年度结论。填写存 `localStorage`，可打印、可一键复制成文本、可重置。数据只注入月结构 + 卡名 + 日页归属 + R02 指标的精简版（约 91 KB），不要换成全量 data（会到 368 KB）。
- **打印版 `out/print/print_review.html`**：18 个 A5 → 5 张 A4。12 张月度结论页（① 证据清单勾选 + 图纸编号 ② 结论三段式留白 ③ 三条自检 ④ 可剪下的结论卡）；4 张季度复盘页（Q1—Q4 各一张，见下）；2 张年度结论页（结算表：把 12 条月结论抄进表格并勾「成形」；结论页：年度三问 + 主线只勾一条 + 结论与第一步 + 签名日期）。
- **季度复盘页（新增）**：每页四个区块——① 本季三个月结论速览（照抄月结论第一句 + 勾成形）② 季度结论三段式（数据 / 判断 / 下一步，判断处要勾「仍成立 / 要调整」）③ R02 季度路线体检五指标手填 ④ 三条合格自检；底部是可剪下的「Qx 季度结论卡」。五指标行按指标类型预置填空结构（计划数与完成数、三类信息条数、1—10 分与升降原因、三个前提逐条勾、可支配与探索小时数），只留横线与勾选框，不预填任何数字。

### 5. 改动须知

- 网页版状态对象为 `state = { months: {...}, quarters: {...}, line: '' }`，键 `ce2027.analysis.v1`：月度填写在 `months[n]`（含 `daysDone / cardsDone / data / judge / next`），季度填写在 `quarters[q]`（含 `daysDone / cardsDone / ev`，`ev` 下按指标序号存手填值），年度主线单选在 `line`（取 `A/B/C/D/E`，对应 `YEAR.lineName`：升学 / 就业 / 创业 / 考编 / 参军）。自评回填必须读 `state.months[m].self[...]`，写成 `cur[...]` 会导致刷新后全部回落「未做」（已修，勿回退）；季度五指标必须读 `getQ(q).ev[...]`，否则刷新后手填内容丢失。
- 季度区的档位来源于「该季三个月的月结论」，所以季度区必须挂在 `renderYear()` 之后调用 `renderQuarters()`，填完月度要能看到季度档位联动（实测填满 Q1 三个月后 Q1 由「待补」变「已成形」）。
- 年度区底部「本年主线（只勾一条）」用 `input[name=ceLine]` 单选，互斥由同名 radio 保证；勾选后同步 `localStorage` 与「复制全年结论」文本里的 `· 主线：` 行。
- 判定阈值、权重、三段结构属于**口径**，改前先确认（会同时改变网页版与打印版的输出）。
- 打印版月度页的证据清单行较密（最多的 3 月、5 月各 10 张卡）。改 `.evlist` 行高/字号后必须重跑溢出量测：`.sheet` 的 `scrollHeight − clientHeight > 1px` 即溢出（曾因行高多出 11 px）。
- 季度复盘页内容密度最高（五指标 + 三段式 + 速览 + 自检 + 结论卡），样式集中在 `.sheet.rvy` 一组规则里（`padding / line-height / .wl` 高度都在 `CSS` 模板内）。首次实现曾整页溢出 37—56 px，压缩后当前余量约 14 mm；**任何加行、加框、改字号的改动都必须重跑溢出量测**，不要只看屏幕预览。
- 不新增「结论模板文案库」：判定语与建议都按四档生成，档位之间只差措辞，不写死具体学生的结论。

## 六、数据更新流程

1. 只改 `assets/data/2027生涯探索年历_data.json`，不改脚本里的文案。
2. 改完先核账：`days` 长度、题型计数、`major_days` 数量与文件对得上。
3. 重跑两条构建命令 → 重出 PDF。
4. 网页版与打印版共用同一份数据，禁止各自维护一份内容。

快速核账（Node）：

```bash
node -e "const d=require('./assets/data/2027生涯探索年历_data.json');const t={};d.days.forEach(x=>t[x.type]=(t[x.type]||0)+1);console.log('months',d.months.length,'days',d.days.length,'majors',d.major_days.length,'cards',Object.keys(d.cards).length,JSON.stringify(t))"
```

## 七、事实纪律（硬约束）

- 不编造数字：不写薪资区间、不写「缺口 XX 万」「就业率 XX%」这类无来源数据。
- 不承诺结果：不写「包就业」「必上岸」「月入过万」。
- 不臆造专业与岗位：专业名、学院名以学校公布口径为准。
- 不写内部引用痕迹：成稿正文里不得出现「见 v5 第 x 节」「详见某文档」之类指向内部草稿的句子。
- 内容中立：分线（升学/就业/创业/考编/参军）之间不做优劣比较，只做路径描述。

## 八、已知限制与排障

- **PDF 导出只支持本机有 Chrome 或 Edge 的 Windows 环境**；脚本自动探测，找不到时用 `--chrome <路径>` 指定。不要用 `chrome --headless --print-to-pdf`，本机实测不出文件。
- **一台机器同时只跑一个打印实例**。脚本结束会 `taskkill /T /F` 整棵进程树；若上次异常中断，先清理残留再跑：
  ```powershell
  Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like "*remote-debugging-port*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
  ```
- 残留实例过多时会报 `timeout Page.enable` / `Printing failed`，清理后重跑即可，不是页面本身的问题。
- 网页版里中文文件名链接在 `file://` 自动化跳转下无法自动实测，人工双击验证；或起一个本地静态服务再验。
- 打印页数核对：全年 377 个 A5 → 95 张 A4；分册各 8 页；专业日 6 页；工具图纸 12 个 A5（1 页使用顺序索引 + 11 张图纸）→ 3 张 A4；全年进度总表 2 个 A5 → 1 张 A4；结论分析 18 个 A5（12 月度 + 4 季度 + 2 年度）→ 5 张 A4；合计 810 个 A5 / 206 张 A4。页数对不上先查数据条数，再查 `@page` 与 `grid` 是否被改。

## 九、产物与交付

| 交付需求 | 给什么 |
|---|---|
| 想直接看内容 | `out/site/index.html`（双击即开，或把整个 out/site 打包） |
| 要拿去打印 | `out/print/print_index.html` 或各 `print_*.html` |
| 要发给别人不折腾打印 | `out/pdf/` 下的 PDF |
| 课上要动手填图（罗盘、雷达、矩阵、复盘） | `out/print/print_tools.html` 或 `print_tools.pdf`（首页为使用顺序索引），可重复复印 |
| 想一眼看全年进度 / 核对图纸有没有漏用 | `out/print/print_tracker.html` 或 `print_tracker.pdf`（365 天勾选网格 + 图纸领取核对） |
| 要出月度 / 季度 / 年度结论 | `out/site/analysis.html`（填完即时出结论，可复制/打印）；要手写版给 `out/print/print_review.html` / `print_review.pdf`（12 张月度结论页 + 4 张季度复盘页 + 2 张年度结论页） |
| 要改某一页内容 | 改 JSON → 重跑构建 → 重出 PDF |

交付时明确告知：打印版是 A4 四合一、需按裁切线裁成 A5；PDF 已按 A4 无边距、保留背景输出，直接双面打印即可。
*（内容由AI生成，仅供参考）*
