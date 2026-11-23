---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 78db55555203ac71c8a419c882a06031_c3aaad67e70611f184bd52540072b1e8
    ReservedCode1: e78HYufv70prdMBYoMMH7/nl9jIneuNOz1AWZ/ab9ecDHL9M9PLORAeb96z8rfSVTz812UQB0P9nL6YUk13AkGxyVigQkvojtHagVw4HLT+A7dPNHM6ncv8Bz0x+SIAn+867Jn/HABNT5cyHsO81xfLCM23Y5z5ucBHWdBU1q5xAUpyLSCZgPyw+UvA=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 78db55555203ac71c8a419c882a06031_c3aaad67e70611f184bd52540072b1e8
    ReservedCode2: e78HYufv70prdMBYoMMH7/nl9jIneuNOz1AWZ/ab9ecDHL9M9PLORAeb96z8rfSVTz812UQB0P9nL6YUk13AkGxyVigQkvojtHagVw4HLT+A7dPNHM6ncv8Bz0x+SIAn+867Jn/HABNT5cyHsO81xfLCM23Y5z5ucBHWdBU1q5xAUpyLSCZgPyw+UvA=
---

# career-explore-calendar-2027

《2027 生涯探索年历》生成器 —— 一个 Marvis Skill，把一份已定稿的「全年生涯探索内容数据」变成两类可直接交付的成品：

1. **网页版**：42 个年历页 + 1 个结论分析页，全部零外链 HTML 单文件，双击 `index.html` 就能离线翻全年、看四季、看月份、看专业专属日。
2. **打印版**：A5 原稿按 2 列 × 2 行四合一排进 A4，四边带裁切线、无装订孔位，打印后沿虚线裁开即是 A5 小册；并可用本机 Chrome 一键导出 PDF。
3. **结论分析**（同一份数据派生）：按月 / 按季 / 按年把「做了什么」变成「得出什么结论」——网页版填三行即时出结论，打印版给可手写的月度 / 季度 / 年度结论页。

**它不做的事**：不生成新内容、不改题面、不编造数据。所有文字来自 `assets/data/2027生涯探索年历_data.json`，本 Skill 只负责版式、拆页与打印。

## 功能概览

| 维度 | 内容 |
|---|---|
| 月份 | 12 |
| 日页（全年每一天） | 365 |
| 专业专属日 | 24 |
| 工具卡 | 64 |
| 分流术语 | A 升学 / B 就业 / C 创业 / D 考编 / E 参军 |

日页题型分布（合计 365）：工具卡日 256、周闭环 44、节气观察 23、专业专属日 24、月度成果 12、季度体检 4、锚定日 1、归档日 1。

产出规模：
- 网页版 42 页年历站点 + 1 页结论分析工具（零外链，可离线）
- 打印版 810 个 A5 → 206 张 A4（含工具图纸分册与 12 张月度 + 4 张季度 + 2 张年度结论页）
- 可选 PDF 导出（Chrome CDP 批量打印）

## 目录结构

```
career-explore-calendar-2027/
├── SKILL.md                        # Skill 主文档：能力、数据口径、产出命令、版式契约
├── 使用说明_Skill安装与使用.md        # 面向使用者的安装与上手说明
├── README.md                       # 本文件
├── LICENSE                         # MIT
├── .gitignore
├── assets/
│   ├── data/
│   │   └── 2027生涯探索年历_data.json   # 唯一数据源（UTF-8，自包含）
│   └── tpl/
│       └── analysis.html           # 结论分析页模板（构建时注入数据与引擎）
├── references/
│   ├── 内容与事实规范.md
│   └── 版式与打印说明.md
└── scripts/
    ├── build_site.mjs              # 网页版年历站点构建
    ├── build_review.mjs            # 结论分析网页版构建
    ├── build_print.mjs             # A4 四合一打印版构建
    ├── cdp_pdf_batch.mjs           # 调用本机 Chrome 批量导出 PDF
    └── analysis_engine.mjs         # 结论判定引擎（网页版 / 打印版共用）
```

数据文件顶层字段：`meta` / `months` / `days` / `major_days` / `cards`。

## 环境要求

- Node.js 18+（脚本为原生 ESM `.mjs`，无需 `npm install`，零第三方依赖）
- 可选：本机 Chrome（仅 `cdp_pdf_batch.mjs` 导出 PDF 时需要）

## 三条构建命令

所有命令均在 **仓库根目录** 执行（脚本默认已指向 `assets/data` 与 `out/`）。

```bash
# 1) 网页版：42 页零外链站点 → out/site/
node scripts/build_site.mjs
#    产物：index.html / year.html / q1-q4.html / m01-m12.html / major_<专业>.html

# 2) 结论分析网页版：一页零外链交互工具 → out/site/analysis.html
node scripts/build_review.mjs
#    产物：analysis.html（12 个月逐月填写 + 即时月结论
#          + 4 个季度复盘区（含 R02 五指标手填）+ 年度汇总
#          + 打印/复制/重置，localStorage 记住填写；自带 9 项自检）

# 3) A4 四合一打印版：18 个 HTML → out/print/
node scripts/build_print.mjs
#    产物：print_index.html（屏幕入口，不打印）/ print_year.html /
#          print_m01..m12.html / print_majors.html / print_tools.html / print_tracker.html /
#          print_review.html（12 张月度 + 4 张季度 + 2 张年度结论页）
```

可选：打印版导出 PDF

```bash
node scripts/cdp_pdf_batch.mjs --dir out/print --outdir out/pdf --match "^print_"
# 只出某几个：
node scripts/cdp_pdf_batch.mjs --dir out/print --outdir out/pdf --only print_majors,print_m01,print_review
```

自定义数据或输出目录：

```bash
node scripts/build_site.mjs  --data ../assets/data/xxx.json --out ../out/site_v2
node scripts/build_print.mjs --data ../assets/data/xxx.json --out ../out/print_v2
```

> 结论分析的计算口径集中在 `scripts/analysis_engine.mjs`（`buildModels` / `monthConclusion` / `quarterConclusion` / `quarterFlags` / `yearConclusion`），网页版与打印版共用同一套函数，**不要各写一份判定逻辑**。

## 打印设置（不可再加缩放）

纸张 A4、纵向、缩放 100%、边距「无」、勾选「背景图形」。每格四边有裁切线，沿虚线裁开即为 A5 页。

## 安装到 Marvis

Marvis 的自定义 Skill 目录结构为「一个 Skill 一个文件夹，文件夹内直接放 `SKILL.md`」。

1. 下载发布包 `career-explore-calendar-2027_Skill安装包_clean.zip`（或克隆本仓库）。
2. 解压后确认**包根目录即包含 `SKILL.md`**（不要再套一层同名文件夹）。
3. 将整个文件夹复制到本机 Marvis 自定义 Skill 目录：
   `%APPDATA%\Tencent\Marvis\User\<你的用户ID>\skills\custom\`
   最终路径形如：
   `%APPDATA%\Tencent\Marvis\User\<用户ID>\skills\custom\career-explore-calendar-2027\SKILL.md`
4. 重启 Marvis 或重新加载技能列表，在技能面板中应能看到 `career-explore-calendar-2027`。
5. 之后用自然语言触发即可，例如「出 2027 生涯探索年历」「导出 A4 四合一打印版 PDF」「按年历数据出一份年度分析」。

`SKILL.md` 的 frontmatter 中 `name` / `description` 含全部触发词，请勿删改，否则技能不会被正确唤起。

## 分发说明

- 本仓库为**可分发源**：只含源码、数据与文档，不含构建产物（`out/`）、临时目录（`temp/`）、Chrome profile 与编辑器备份文件（`*.bak_*`），相关规则见 `.gitignore`。
- 发布包 `career-explore-calendar-2027_Skill安装包_clean.zip` 与仓库内容一致，根目录直接含 `SKILL.md`，可直接用于 Skill 安装分发。
- 分享给他人后，对方执行三条构建命令即可自行产出网页版 / 打印版 / PDF，无需联网。
- 修改数据后请重跑构建并复核页数与题型统计（`SKILL.md` 中列出的合计口径必须仍然成立）。

## 许可证

MIT License，Copyright (c) 2026 NCY。详见 [LICENSE](LICENSE)。
*（内容由AI生成，仅供参考）*
