# career-explore-calendar-2027 · Skill 安装与使用说明（给接收方）

这是 Marvis 的 Skill 包：装上之后，说一句话就能重新生成《2027 生涯探索年历》的网页版、A4 四合一打印版和 PDF，也能按新数据重出。

## 一、安装（在 Marvis 客户端里做）
1. 把本 zip 放到这台电脑上任意位置（路径要能访问到，例如桌面）。
2. 在 Marvis 对话框里直接说：「安装这个本地 Skill：<zip 的完整路径>」，或者把 zip 拖进对话框。
3. 系统会调用本地 Skill 安装（source = custom），装完后在技能列表里能看到 `career-explore-calendar-2027`。
4. 无需重启；已装过旧版会覆盖更新。

> 前提：Skill 装在使用者的这台电脑上，运行时读写的是本机文件。

## 二、装上之后怎么用（直接说人话即可）
- 「出一份 2027 生涯探索年历的网页版」→ 生成 43 页零外链站点（out/site）
- 「出 A4 四合一打印版」→ 18 个打印页（2×2 排 A5、带裁切线、无装订孔）
- 「导出打印版 PDF」→ 调本机 Chrome 批量打成 PDF（out/pdf_print）
- 「加/改某些日期的内容，按新数据重出」→ 改 assets/data 里的 JSON 后重跑
- 「月度 / 季度 / 年度结论分析怎么出」→ 走网页版 analysis.html 或打印版结论页

## 三、自己跑脚本（不走对话时）
需要 Node 18+（本机演示用的是 Node v22），PDF 导出另需本机装有 Chrome 或 Edge。
在 Skill 根目录执行：

```bash
node scripts/build_site.mjs                                   # 网页版 → out/site
node scripts/build_review.mjs                                 # 结论分析页 → out/site/analysis.html
node scripts/build_print.mjs                                  # 打印版 → out/print
node scripts/cdp_pdf_batch.mjs --dir out/print --outdir out/pdf_print --match "^print_"
```

换自定义数据：`node scripts/build_site.mjs --data ../assets/data/xxx.json --out ../out/site_v2`

## 四、包里有什么
- `SKILL.md`：能力说明、三条产出命令、版式契约、结论分析口径（月/季/年权重与四档阈值）
- `assets/data/2027生涯探索年历_data.json`：全年内容源（365 天、24 专业日、64 工具卡）
- `scripts/`：build_site / build_review / build_print / analysis_engine / cdp_pdf_batch
- `out/site`：网页版成品 43 页（含 analysis.html）
- `out/print`：打印版 18 页 HTML；`out/pdf_print`：已导出的打印版 PDF；`out/pdf/print_review.pdf`：结论页 PDF
- `references/`：口径与校验说明

## 五、改动前必读
- 结论分析的判定口径集中在 `scripts/analysis_engine.mjs`，网页版与打印版共用同一份，别各写一套。
- 打印版改动版式或格子内容后必须重跑溢出量测（每格 scrollHeight − clientHeight > 1px 即溢出）。
- 打印设置：A4、纵向、缩放 100%、边距「无」、勾选「背景图形」，与页面自带 @page 配套，不可再加缩放。
