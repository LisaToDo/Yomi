/* Yomi 双语注音版 HTML 模板
   供 app.js 在浏览器里把「按页 JSON」装配成可离线阅读的独立 HTML：
   - 左框：假名注音日文；右框：按需机器翻译（localStorage 持久化，可直接点击编辑）
   - rt 划选隔离；等宽双栏；<920px 单列
   BOOK_JS 会用 window.BOOK_ID 作为译文缓存命名空间（生成时由 app.js 注入书名） */

/* 像素字体（Press Start 2P latin 子集，base64 内嵌，保证离线 HTML 里 Yomi logo 字形正确） */
const PIXEL_FONT_B64 = "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";
const PIXEL_FONT_FACE =
  "@font-face{font-family:'Press Start 2P';font-style:normal;font-weight:400;" +
  "src:url(data:font/woff2;base64," + PIXEL_FONT_B64 + ") format('woff2');}";

/* 印刷版布局（16K 横版：成品 260×185mm；文件含出血 263×191mm，四边出血线）
   一节 = 一张印刷页；@page 精确控制纸张尺寸，打印时选「另存为 PDF」即可。
   同一套规则也挂在 body.print-preview 上，供 JS 在屏幕上先量尺寸、自动缩字。 */
/* 青苹果像素 logo，全文档只定义一次，各页水印用 <use> 引用（不随页数膨胀体积） */
const APPLE_SYMBOL = `<symbol id="yomi-apple" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="8" y="1" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="1" width="1" height="1" fill="#3F8F2C"/><rect x="8" y="2" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="2" width="1" height="1" fill="#3F8F2C"/><rect x="10" y="2" width="1" height="1" fill="#3F8F2C"/><rect x="11" y="2" width="1" height="1" fill="#3F8F2C"/><rect x="8" y="3" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="3" width="1" height="1" fill="#3F8F2C"/><rect x="3" y="4" width="1" height="1" fill="#3F8F2C"/><rect x="4" y="4" width="1" height="1" fill="#3F8F2C"/><rect x="5" y="4" width="1" height="1" fill="#3F8F2C"/><rect x="6" y="4" width="1" height="1" fill="#3F8F2C"/><rect x="7" y="4" width="1" height="1" fill="#3F8F2C"/><rect x="8" y="4" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="4" width="1" height="1" fill="#3F8F2C"/><rect x="10" y="4" width="1" height="1" fill="#3F8F2C"/><rect x="11" y="4" width="1" height="1" fill="#3F8F2C"/><rect x="12" y="4" width="1" height="1" fill="#3F8F2C"/><rect x="2" y="5" width="1" height="1" fill="#3F8F2C"/><rect x="3" y="5" width="1" height="1" fill="#3F8F2C"/><rect x="4" y="5" width="1" height="1" fill="#3F8F2C"/><rect x="5" y="5" width="1" height="1" fill="#3F8F2C"/><rect x="6" y="5" width="1" height="1" fill="#3F8F2C"/><rect x="7" y="5" width="1" height="1" fill="#3F8F2C"/><rect x="8" y="5" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="5" width="1" height="1" fill="#3F8F2C"/><rect x="10" y="5" width="1" height="1" fill="#3F8F2C"/><rect x="11" y="5" width="1" height="1" fill="#3F8F2C"/><rect x="12" y="5" width="1" height="1" fill="#3F8F2C"/><rect x="13" y="5" width="1" height="1" fill="#3F8F2C"/><rect x="1" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="2" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="3" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="4" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="5" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="6" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="7" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="8" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="10" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="11" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="12" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="13" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="14" y="6" width="1" height="1" fill="#3F8F2C"/><rect x="1" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="2" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="3" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="4" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="5" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="6" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="7" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="8" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="10" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="11" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="12" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="13" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="14" y="7" width="1" height="1" fill="#3F8F2C"/><rect x="0" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="1" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="2" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="3" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="4" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="5" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="6" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="7" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="8" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="10" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="11" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="12" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="13" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="14" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="15" y="8" width="1" height="1" fill="#3F8F2C"/><rect x="0" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="1" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="2" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="3" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="4" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="5" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="6" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="7" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="8" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="10" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="11" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="12" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="13" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="14" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="15" y="9" width="1" height="1" fill="#3F8F2C"/><rect x="0" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="1" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="2" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="3" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="4" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="5" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="6" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="7" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="8" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="10" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="11" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="12" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="13" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="14" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="15" y="10" width="1" height="1" fill="#3F8F2C"/><rect x="0" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="1" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="2" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="3" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="4" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="5" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="6" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="7" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="8" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="10" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="11" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="12" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="13" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="14" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="15" y="11" width="1" height="1" fill="#3F8F2C"/><rect x="1" y="12" width="1" height="1" fill="#3F8F2C"/><rect x="2" y="12" width="1" height="1" fill="#3F8F2C"/><rect x="3" y="12" width="1" height="1" fill="#3F8F2C"/><rect x="4" y="12" width="1" height="1" fill="#3F8F2C"/><rect x="5" y="12" width="1" height="1" fill="#3F8F2C"/><rect x="6" y="12" width="1" height="1" fill="#3F8F2C"/><rect x="7" y="12" width="1" height="1" fill="#3F8F2C"/><rect x="8" y="12" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="12" width="1" height="1" fill="#3F8F2C"/><rect x="10" y="12" width="1" height="1" fill="#3F8F2C"/><rect x="11" y="12" width="1" height="1" fill="#3F8F2C"/><rect x="12" y="12" width="1" height="1" fill="#3F8F2C"/><rect x="13" y="12" width="1" height="1" fill="#3F8F2C"/><rect x="2" y="13" width="1" height="1" fill="#3F8F2C"/><rect x="3" y="13" width="1" height="1" fill="#3F8F2C"/><rect x="4" y="13" width="1" height="1" fill="#3F8F2C"/><rect x="5" y="13" width="1" height="1" fill="#3F8F2C"/><rect x="6" y="13" width="1" height="1" fill="#3F8F2C"/><rect x="7" y="13" width="1" height="1" fill="#3F8F2C"/><rect x="8" y="13" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="13" width="1" height="1" fill="#3F8F2C"/><rect x="10" y="13" width="1" height="1" fill="#3F8F2C"/><rect x="11" y="13" width="1" height="1" fill="#3F8F2C"/><rect x="12" y="13" width="1" height="1" fill="#3F8F2C"/><rect x="13" y="13" width="1" height="1" fill="#3F8F2C"/><rect x="4" y="14" width="1" height="1" fill="#3F8F2C"/><rect x="5" y="14" width="1" height="1" fill="#3F8F2C"/><rect x="6" y="14" width="1" height="1" fill="#3F8F2C"/><rect x="7" y="14" width="1" height="1" fill="#3F8F2C"/><rect x="8" y="14" width="1" height="1" fill="#3F8F2C"/><rect x="9" y="14" width="1" height="1" fill="#3F8F2C"/><rect x="10" y="14" width="1" height="1" fill="#3F8F2C"/><rect x="11" y="14" width="1" height="1" fill="#3F8F2C"/></symbol>`;

const PRINT_LAYOUT = `
  html,body{background:#fff;}
  .top{display:none!important;}
  main{max-width:none;margin:0;padding:0;}
  section{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto minmax(0,1fr);width:263mm;height:191mm;margin:0;gap:6mm;padding:8mm 10mm;border:none;border-radius:0;box-shadow:none;overflow:hidden;position:relative;background:#fff;page-break-after:always;break-after:page;}
  section:last-child{page-break-after:auto;break-after:auto;}
  section h2{grid-column:1/-1;font-size:9pt;border-bottom:1px dashed var(--line);padding-bottom:2mm;display:flex;justify-content:space-between;align-items:baseline;gap:6mm;}
  .hd-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .hd-page{font-weight:400;opacity:.75;flex-shrink:0;}
  /* 逐段配对：.pair 内左原文右译文，横向同一行——读左边立刻能定位右边。
     .wm-proof 是取证暗水印，必须 absolute 脱离网格流，否则它会占掉
     grid-template-rows 的第二行，把 .pairs 挤到隐式行，底框位置整个飘掉 */
  .wm-proof{position:absolute;}
  .pairs{grid-column:1/-1;border:2px solid var(--line);border-radius:3px;padding:5mm 0;min-height:0;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;row-gap:2mm;position:relative;align-content:start;}
  .pair{display:contents;}
  .pj{font-size:10.5pt;line-height:2.05;padding:1mm 5mm;border-right:1px dashed var(--line);}
  .pj rt{font-size:.5em;}
  .pz{font-size:9.5pt;line-height:1.8;padding:1mm 5mm;}
  .pz p{margin:0;}
  .pz-ph{font-family:sans-serif;opacity:.5;font-size:.85em;}
  .tr-bar,.tr-btn,.tr-loading,.tr-err,.tr-hint,.pz-ph{display:none!important;}
  /* 水印：左右两栏各占一半，苹果在左栏中心、Yomi 在右栏中心 */
  .wm-apple{right:50%;}
  .wm-yomi{left:50%;}
  .wm-apple svg{width:46mm;height:46mm;}
  .wm-yomi{font-size:13mm;letter-spacing:.1em;}
  .cropmark{position:absolute;background:#000;z-index:5;}
`;

const BOOK_CSS = `
  ${PIXEL_FONT_FACE}
  :root{--paper:#FBF8EC;--ink:#2D4A1E;--g700:#3F8F2C;--line:#3F6F2C;}
  *{box-sizing:border-box;}
  body{margin:0;background:var(--paper);color:var(--ink);font-family:"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP","SimSun",serif;}
  .top{position:sticky;top:0;z-index:9;background:var(--g700);color:#fff;padding:8px 18px;font-family:sans-serif;display:flex;gap:12px;align-items:center;flex-wrap:wrap;box-shadow:0 3px 0 rgba(0,0,0,.15);}
  .top .brand{display:flex;align-items:center;gap:10px;flex-shrink:0;}
  .top .brand svg{width:26px;height:26px;image-rendering:pixelated;display:block;}
  .top .brand-name{font-family:'Press Start 2P',monospace;font-size:13px;font-weight:400;color:#fff;letter-spacing:2px;}
  .top .book-title{font-size:14px;font-weight:700;opacity:.95;}
  .mode{margin-left:auto;display:flex;gap:8px;}
  .mode button{font-family:sans-serif;font-size:12px;font-weight:700;border:2px solid #fff;background:transparent;color:#fff;border-radius:4px;padding:3px 10px;cursor:pointer;}
  .mode button.on{background:#fff;color:var(--g700);}
  main{max-width:1500px;margin:0 auto;padding:22px 20px 60px;}
  section{margin:20px 0;}
  section h2{font-family:sans-serif;font-size:13px;font-weight:700;color:#5a8f3c;margin:0 0 8px;border-bottom:2px dashed var(--line);padding-bottom:6px;display:flex;justify-content:space-between;align-items:baseline;gap:12px;}
  .hd-page{font-weight:400;opacity:.75;flex-shrink:0;}
  /* 手动翻译条：自动翻译失败或想重翻时用，译完整页隐藏 */
  .tr-bar{display:flex;gap:12px;align-items:center;margin:0 0 10px;}
  section.done .tr-bar{display:none;}
  /* 逐段配对：同一行左原文右译文，一行就是一段的对照 */
  .pairs{background:#fff;border:3px solid var(--line);border-radius:6px;padding:14px 0;box-shadow:5px 5px 0 rgba(63,143,44,.15);position:relative;display:grid;grid-template-columns:1fr 1fr;row-gap:4px;align-content:start;}
  .pair{display:contents;}
  .pj{font-size:17px;line-height:2.35;padding:4px 20px;border-right:1px dashed var(--line);}
  .pz{font-family:"Microsoft YaHei","PingFang SC",sans-serif;font-size:15px;line-height:1.95;color:#3D5231;padding:4px 20px;border-radius:4px;}
  .pz p{margin:0;}
  .pz[contenteditable="true"]{cursor:text;}
  .pz[contenteditable="true"]:focus{outline:2px dashed var(--g700);outline-offset:2px;}
  .pz-ph{opacity:.5;font-size:13px;}
  .body rt,.pj rt{font-size:.55em;color:#5a8f3c;user-select:none;-webkit-user-select:none;}
  /* 水印：左栏中心青苹果 logo、右栏中心像素字 Yomi，压在内容上层、10% 透明，不挡点击和编辑。
     .wm-apple 占左半栏（right:50%）、.wm-yomi 占右半栏（left:50%），flex 居中后正好各在各的栏中心 */
  .wm{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;user-select:none;-webkit-user-select:none;z-index:2;opacity:.1;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .wm svg{display:block;image-rendering:pixelated;}
  .wm-apple svg{width:180px;height:180px;}
  .wm-yomi{font-family:'Press Start 2P',monospace;color:var(--g700);font-size:52px;letter-spacing:.08em;}
  .wm-apple{right:50%;} .wm-yomi{left:50%;}
  /*__YOMI_WM_CSS_END__*/
  /* 取证标记：1px 白字，肉眼看不见，但会进入 PDF 文本层，被抹水印后仍可提取出处 */
  .wm-proof{position:absolute;left:0;top:0;font-size:1px;line-height:1;color:#fff;pointer-events:none;user-select:none;}
  ruby{ruby-align:center;}
  body.hide-furi rt{display:none;}
  body.hover-furi rt{visibility:hidden;} body.hover-furi ruby:hover rt{visibility:visible;}
  .tr-btn{font-family:sans-serif;font-size:13px;font-weight:700;border:2px solid var(--line);background:var(--paper);color:var(--g700);border-radius:4px;padding:6px 14px;cursor:pointer;box-shadow:3px 3px 0 rgba(63,143,44,.25);}
  .tr-btn:hover{background:var(--g700);color:#fff;}
  .tr-hint{font-size:12px;opacity:.55;margin-top:10px;font-family:sans-serif;}
  .tr-inner[contenteditable="true"]{cursor:text;}
  /* 悬停联动高亮：原文段落 ↔ 译文段落 成对点亮 */
  .pair-hl{background:rgba(111,168,39,.15);border-radius:2px;}
  .tr-inner[contenteditable="true"]:focus{outline:2px dashed var(--g700);outline-offset:4px;border-radius:4px;}
  .tr-loading,.tr-err{font-family:sans-serif;font-size:13px;opacity:.8;}
  .tr-err{color:#a04b2c;}
  /* html lang=ja 会让简体字（译/显/测等）回落到别的字体造成混排，UI 文字显式指定中文字体栈 */
  .top,.top *,section h2,.tr-btn,.tr-hint,.tr-loading,.tr-err{font-family:"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif;}
  .top .brand-name{font-family:'Press Start 2P',monospace;}
  /*__YOMI_PDF_CSS_START__*/
  /* 生成 PDF 时的青苹果进度遮罩：半透明暗底 + 居中小卡片，不整屏铺满 */
  .pdf-overlay{position:fixed;inset:0;background:rgba(45,74,30,.38);z-index:999;display:flex;align-items:center;justify-content:center;font-family:"Microsoft YaHei","PingFang SC",sans-serif;}
  .pdf-card{background:var(--paper);border:3px solid var(--g700);border-radius:10px;box-shadow:6px 6px 0 rgba(63,143,44,.3);padding:26px 42px;display:flex;flex-direction:column;align-items:center;gap:12px;}
  .pdf-card svg{width:72px;height:72px;image-rendering:pixelated;animation:pdfbob 1.6s ease-in-out infinite;}
  @keyframes pdfbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  .pdf-card p{margin:0;font-weight:700;color:var(--ink);font-size:15px;}
  .pdf-card .pdf-sub{font-size:12px;color:#6FA827;font-weight:400;}
  .pdf-bar{width:240px;height:14px;border:3px solid var(--g700);background:#fff;overflow:hidden;}
  .pdf-bar i{display:block;height:100%;width:40%;background:var(--g700);animation:pdfslide 1.2s linear infinite;}
  @keyframes pdfslide{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}
  /*__YOMI_PDF_CSS_END__*/
  /* 全书翻译进度：右下角小胶囊，不打断阅读 */
  #mt-progress{position:fixed;right:18px;bottom:18px;z-index:996;display:flex;align-items:center;gap:8px;background:var(--paper);border:2px solid var(--g700);border-radius:999px;padding:7px 14px;font-family:"Microsoft YaHei","PingFang SC",sans-serif;font-size:12px;color:var(--ink);box-shadow:3px 3px 0 rgba(63,143,44,.25);transition:opacity .45s,transform .45s;}
  #mt-progress .mt-ico{font-size:14px;animation:mtbob 1.4s ease-in-out infinite;}
  @keyframes mtbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  #mt-progress .mt-num{color:#537d2f;font-variant-numeric:tabular-nums;}
  #mt-progress .mt-bar{display:block;width:64px;height:6px;background:#e6efdc;border-radius:3px;overflow:hidden;}
  #mt-progress .mt-bar em{display:block;height:100%;width:0;background:var(--g700);transition:width .25s;}
  #mt-progress.mt-ok .mt-ico{animation:none;}
  #mt-progress.mt-hide{opacity:0;transform:translateY(8px);pointer-events:none;}
  @media print{#mt-progress{display:none!important;}}
  /* 自定义术语表面板 */
  .gl-panel{position:fixed;inset:0;background:rgba(45,74,30,.38);z-index:998;display:flex;align-items:center;justify-content:center;font-family:"Microsoft YaHei","PingFang SC",sans-serif;}
  .gl-card{background:var(--paper);border:3px solid var(--g700);border-radius:10px;box-shadow:6px 6px 0 rgba(63,143,44,.3);padding:20px 24px;width:min(560px,90vw);display:flex;flex-direction:column;gap:10px;}
  .gl-card h3{margin:0;font-size:15px;color:var(--ink);}
  .gl-card p{margin:0;font-size:12px;color:#6b7f5a;line-height:1.6;}
  .gl-card textarea{width:100%;height:170px;border:2px solid var(--line);border-radius:6px;padding:10px;font-size:13px;font-family:"Microsoft YaHei",monospace;box-sizing:border-box;resize:vertical;background:#fff;}
  .gl-row{display:flex;gap:10px;justify-content:flex-end;}
  .gl-row button{font-size:13px;font-weight:700;border:2px solid var(--line);background:var(--paper);color:var(--g700);border-radius:5px;padding:6px 16px;cursor:pointer;font-family:inherit;}
  .gl-row button.gl-save{background:var(--g700);color:#fff;}
  @media print{.gl-panel{display:none!important;}}
  @media(max-width:920px){ .pairs{grid-template-columns:1fr;} .pj{border-right:none;} }
  /* ---------- 印刷 / 打印预览 ---------- */
  @media print{
    @page{size:263mm 191mm;margin:0;}
    ${PRINT_LAYOUT}
  }
  body.print-preview{${PRINT_LAYOUT}}
`;

const BOOK_JS = `
(function(){
  var LANGPAIR='ja|zh-CN';
  var NAMESPACE=window.BOOK_ID||location.pathname;
  var TOTAL=document.querySelectorAll('section').length;
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  /* 缓存带版本号：换翻译引擎/术语表后旧译文自动作废重翻，不会拿烂译文凑数 */
  function cacheKey(pg){return 'yomi-tr:v3:'+NAMESPACE+':'+pg;}
  function setCache(pg,outs){try{localStorage.setItem(cacheKey(pg),JSON.stringify(outs));return true;}catch(e){return false;}}
  /* 按配对行取段：一段原文 + 该段内检出的人名（生成时由 kuromoji 标在 data-names 上） */
  function parasOf(sec){
    var out=[],ps=sec.querySelectorAll('.pj');
    for(var j=0;j<ps.length;j++){
      var clone=ps[j].cloneNode(true);
      var rts=clone.querySelectorAll('rt');
      for(var i=0;i<rts.length;i++)rts[i].remove();
      var t=clone.textContent.replace(/\s+/g,' ').trim();
      if(!t)continue;
      var names=[];
      var pair=ps[j].closest('.pair');
      try{names=JSON.parse((pair&&pair.getAttribute('data-names'))||'[]');}catch(e){}
      out.push({t:t,n:names});
    }
    return out;
  }
  function getCache(pg,units){
    try{
      var v=JSON.parse(localStorage.getItem(cacheKey(pg))||'null');
      if(!(v&&v.length))return null;
      /* 段数对不上的旧缓存（更早的切块版）视为无效，重翻 */
      if(units&&v.length!==units.length)return null;
      return v;
    }catch(e){return null;}
  }
  /* 术语表：日文 → 固定中文。免费机翻没有上下文，多义词（告白→忏悔/认罪）只能靠锁死译法。
     只收名词：动词占位后会把译文语法拆散（付き合うことになった → "__P1__ 发生了"）。
     长词排前，先匹长的，避免「特進クラス」被「クラス」抢先。 */
  var GLOSSARY=[
    ['特進クラス','特进班'],['進学校','升学名校'],['幼馴染','青梅竹马'],
    ['両想い','两情相悦'],['片思い','单相思'],['告白','表白'],['付き合い','交往'],
    ['生徒会','学生会'],['文化祭','文化祭'],['体育祭','运动会'],['修学旅行','修学旅行'],
    ['放課後','放学后'],['部活動','社团活动'],['委員会','委员会'],['委員長','班长'],
    ['担任','班主任'],['保健室','医务室'],['図書室','图书室'],['屋上','天台'],
    ['購買','小卖部'],['帰り道','回家的路上'],['待ち合わせ','碰头'],['教室','教室']
  ].sort(function(a,b){return b[0].length-a[0].length;});
  /* 用户自定义术语（localStorage，所有书共用，优先于内置表）：面板里每行「日文=中文」 */
  var GL_KEY='yomi-glossary:v1';
  function loadUserGloss(){
    try{
      var v=JSON.parse(localStorage.getItem(GL_KEY)||'[]');
      return Array.isArray(v)?v.filter(function(l){return l&&l.jp&&l.zh;}):[];
    }catch(e){return [];}
  }
  var USER_GLOSS=loadUserGloss();
  /* 统一成 [jp,zh] 数组再合并；重新按词长排序，长词先占位 */
  var ALL_GLOSS=USER_GLOSS.map(function(u){return [u.jp,u.zh];}).concat(GLOSSARY)
    .sort(function(a,b){return b[0].length-a[0].length;});
  /* 译后纠正：原文里没有电话，「声をかける」却被翻成「打电话给她」——只修这种高置信度错译 */
  var POSTFIX=[
    {jp:/声をかけ|声を掛け/, from:/打电话给([^，。！？\\s]{1,4})/g, to:'跟$1搭话'},
    {jp:/声をかけ|声を掛け/, from:/打电话/g, to:'搭话'},
    {jp:/告白/, from:/(?:忏悔|认罪|坦白|告解)/g, to:'表白'},
    /* 「私のことを本気で好きにならないこと」——机翻常倒果为因成「你不喜欢我」 */
    {jp:/本気で好きにならないこと/, from:/你?真的?(?:地)?不喜欢我/g, to:'不要真心喜欢上我'},
    {jp:/本気で好きにならないこと/, from:/不要认真地?爱上我/g, to:'不要真心喜欢上我'},
    /* 「これが守れますか」——守れる是"做得到/遵守"，不是"保护我" */
    {jp:/これが守れますか|守れますか/, from:/你能保护(?:这个|它|我|这些)?吗/g, to:'这些你能做到吗'},
    {jp:/これが守れますか|守れますか/, from:/你能保留这个吗/g, to:'这些你能做到吗'}
  ];
  /* 把术语/人名换成占位符（编号跨段唯一），译后按段回填 */
  function protect(text,names,seq){
    var s=text,subs=[];
    function put(word,zh){
      if(!word||s.indexOf(word)<0)return;
      var tok='__P'+(seq.n++)+'__';
      s=s.split(word).join(tok);
      subs.push([tok,zh]);
    }
    (names||[]).forEach(function(nm){if(nm&&nm.jp)put(nm.jp,nm.zh||nm.jp);});
    ALL_GLOSS.forEach(function(g){put(g[0],g[1]);});
    return {s:s,p:subs};
  }
  function unprotect(text,subs){
    subs.forEach(function(pr){
      /* Google 常在占位符两侧加空格：__ P3 __ */
      var re=new RegExp(pr[0].replace(/_/g,'[_ ]*'),'gi');
      if(re.test(text))text=text.replace(re,pr[1]);
    });
    return text;
  }
  function postfix(text,jp){
    POSTFIX.forEach(function(r){
      if(!r.jp.test(jp))return;
      r.from.lastIndex=0;
      text=text.replace(r.from,r.to);
    });
    /* 兜底：万一占位符没回填上，清掉，别让 __P3__ 露在译文里 */
    return text.replace(/__\\s*(?:NM|P)\\s*\\d+\\s*__/gi,'').replace(/ {2,}/g,' ').replace(/ +([，。！？、])/g,'$1').trim();
  }
  /* ---- 请求层 ----
     gtx 单次请求能吃下 3000+ 字符（用 POST，绕开 URL 长度限制），
     所以"一页发一次请求"纯属浪费往返：304 页就是 304 个来回。
     策略从上到下依次降级：
       ① 本地服务 /api/mt —— 服务端并发 5 路 + 进程内缓存，最快
       ② 浏览器直连 gtx POST —— HTML 被单独拷走时也能用
       ③ gtx GET —— POST 被 CORS 拦掉时退回
       ④ MyMemory —— 最后兜底 */
  var GTX_URL='https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=zh-CN&dt=t';
  var POST_OK=true,postFail=0;
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
  function gtxParse(txt){
    var j=JSON.parse(txt);
    if(!Array.isArray(j)||!j[0])throw new Error('gtx-empty');
    var s='';j[0].forEach(function(seg){if(seg&&seg[0])s+=seg[0];});
    if(!s)throw new Error('gtx-empty');
    return s;
  }
  function mtGtxPost(chunk){
    if(!POST_OK)return Promise.reject(new Error('gtx-post-off'));
    return fetch(GTX_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'q='+encodeURIComponent(chunk)})
      .then(function(r){if(!r.ok)throw new Error('gtx-'+r.status);return r.text();})
      .then(gtxParse)
      .catch(function(e){if(++postFail>=2)POST_OK=false;throw e;});
  }
  function mtGtxGet(chunk){
    return fetch(GTX_URL+'&q='+encodeURIComponent(chunk))
      .then(function(r){if(!r.ok)throw new Error('gtx-'+r.status);return r.text();})
      .then(gtxParse);
  }
  function mtMyMemory(chunk){
    return fetch('https://api.mymemory.translated.net/get?langpair='+LANGPAIR,{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:'q='+encodeURIComponent(chunk.slice(0,480))})
      .then(function(r){return r.json();})
      .then(function(j){
        if(j.responseStatus===200&&j.responseData&&j.responseData.translatedText)
          return j.responseData.translatedText;
        throw new Error(j.responseDetails||'mymemory');
      });
  }
  function mtOne(chunk){
    var n=0;
    function attempt(){
      n++;
      return mtGtxPost(chunk).catch(function(e){
        if(n>=2||!POST_OK)throw e;
        return sleep(300).then(attempt);
      });
    }
    return attempt()
      .catch(function(){return mtGtxGet(chunk);})
      .catch(mtMyMemory);
  }
  /* 本地代理：一次 POST 交给服务端，几百段一起排队 */
  var SRV=0;   /* 0 未知 / 1 可用 / -1 不可用（跳过，不再白试） */
  function mtServer(texts){
    if(SRV<0)return Promise.reject(new Error('no-server'));
    return fetch('api/mt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({texts:texts})})
      .then(function(r){if(!r.ok)throw new Error('srv-'+r.status);return r.json();})
      .then(function(j){
        if(!j||!Array.isArray(j.outs)||j.outs.length!==texts.length)throw new Error('srv-bad');
        SRV=1;return j.outs;
      })
      .catch(function(e){SRV=-1;throw e;});
  }
  var NL='__NL__';
  /* 浏览器直连的批量：段间用 __NL__ 拼一次发送，切回来即逐段对齐 */
  function localBatch(texts){
    if(texts.length===1)return mtOne(texts[0]).then(function(o){return [o];});
    return mtOne(texts.join(NL)).then(function(all){
      var parts=String(all).split(/__\\s*NL\\s*\\d*\\s*__/i).map(function(x){return x.trim();});
      if(parts.length===texts.length)return parts;
      return pool(texts,4,mtOne);
    });
  }
  function mtBatch(texts){
    if(!texts.length)return Promise.resolve([]);
    if(SRV<0)return localBatch(texts);
    return mtServer(texts).catch(function(){return localBatch(texts);});
  }
  function renderOuts(sec,outs){
    var pairs=sec.querySelectorAll('.pair');
    for(var i=0;i<pairs.length;i++){
      var z=pairs[i].querySelector('.pz');
      if(!z)continue;
      z.innerHTML='<p>'+esc(outs[i]||'')+'</p>';
      z.contentEditable='true';
    }
    sec.classList.add('done');
  }
  /* 未翻译段的占位提示（自动翻译排队时能看到在动） */
  function markWaiting(sec){
    sec.querySelectorAll('.pz').forEach(function(z){
      if(!z.querySelector('p')&&!z.querySelector('.pz-ph'))z.innerHTML='<span class="pz-ph">翻译中…</span>';
    });
  }
  function showErr(sec,e){
    var bar=sec.querySelector('.tr-bar');
    if(!bar)return;
    sec.classList.remove('done');
    bar.innerHTML='<button class="tr-btn">🔄 重试</button><span class="tr-err">翻译失败（'+((e&&e.message)||'网络')+'）</span>';
  }
  /* 并发池：同时最多 limit 个请求，结果按下标回填（保证段序不乱） */
  function pool(items,limit,fn){
    return new Promise(function(resolve,reject){
      if(!items.length){resolve([]);return;}
      var outs=new Array(items.length),err=null,ni=0,nd=0;
      function run(){
        while(ni<items.length&&ni-nd<limit){
          (function(k){
            fn(items[k]).then(function(o){outs[k]=o;},function(e){err=err||e;}).then(function(){
              nd++;
              if(nd===items.length){err?reject(err):resolve(outs);}
              else run();
            });
          })(ni);
          ni++;
        }
      }
      run();
    });
  }
  /* 把待翻的页拼成"任务包"：一包约 2200 字符，通常覆盖 3-8 页。
     包越大请求越少、越快；包越小失败影响面越小。2200 是实测的平衡点。 */
  var PACK_CHARS=2200,PACK_PARALLEL=3;
  function buildPacks(secs){
    var packs=[],cur=null;
    secs.forEach(function(sec){
      var units=parasOf(sec);
      if(!units.length)return;
      var len=0;
      units.forEach(function(u){len+=u.t.length+8;});
      if(cur&&cur.chars+len>PACK_CHARS){packs.push(cur);cur=null;}
      if(!cur)cur={chars:0,items:[]};
      cur.items.push({sec:sec,units:units});
      cur.chars+=len;
      if(len>=PACK_CHARS){packs.push(cur);cur=null;}
    });
    if(cur)packs.push(cur);
    return packs;
  }
  /* 一包一次请求：几个页的段落拼起来送翻，回来按段拆回各页 */
  function runPack(pack){
    pack.items.forEach(function(it){markWaiting(it.sec);});
    var units=[];
    pack.items.forEach(function(it){it.units.forEach(function(u){units.push(u);});});
    var seq={n:0};
    var prot=units.map(function(u){return protect(u.t,u.n,seq);});
    return mtBatch(prot.map(function(x){return x.s;})).then(function(raw){
      var k=0;
      pack.items.forEach(function(it){
        var outs=[];
        for(var j=0;j<it.units.length;j++,k++){
          var t=(raw&&raw[k]!=null)?String(raw[k]):'';
          outs.push(t?postfix(unprotect(t,prot[k].p),it.units[j].t):'');
        }
        setCache(it.sec.id.slice(1),outs);
        renderOuts(it.sec,outs);
      });
    });
  }
  /* 单页重试（点「重试」按钮时用）：走同一条通道，只是包里只装这一页 */
  function translatePage(sec){
    var units=parasOf(sec);
    var c=getCache(sec.id.slice(1),units);
    if(c){renderOuts(sec,c);return Promise.resolve('cached');}
    return runPack({chars:0,items:[{sec:sec,units:units}]});
  }
  function restoreAll(){
    var n=0;
    document.querySelectorAll('section').forEach(function(sec){
      var units=parasOf(sec);
      var c=getCache(sec.id.slice(1),units);   /* 段数对不上的旧缓存不渲染 */
      if(c){renderOuts(sec,c);n++;}
    });
    return n;
  }
  /* 右下角全书进度 */
  var PROG=null,PROG_N=0,PROG_D=0,PROG_F=0;
  function initProgress(n){
    PROG_N=n;PROG_D=0;PROG_F=0;
    var el=document.createElement('div');
    el.id='mt-progress';
    el.innerHTML='<span class="mt-ico">🍏</span><b class="mt-txt">翻译全书</b>'
      +'<span class="mt-num">0 / '+n+'</span><i class="mt-bar"><em></em></i>';
    document.body.appendChild(el);
    PROG=el;
  }
  function tickProgress(bad){
    if(!PROG)return;
    PROG_D++;
    if(bad)PROG_F++;
    var pct=PROG_N?Math.min(100,Math.round(PROG_D/PROG_N*100)):100;
    var num=PROG.querySelector('.mt-num'),bar=PROG.querySelector('.mt-bar em');
    if(num)num.textContent=PROG_D+' / '+PROG_N;
    if(bar)bar.style.width=pct+'%';
    if(PROG_D>=PROG_N){
      var txt=PROG.querySelector('.mt-txt');
      if(txt)txt.textContent=PROG_F?'部分页失败':'翻译完成';
      PROG.classList.add('mt-ok');
      setTimeout(function(){if(PROG)PROG.classList.add('mt-hide');},1500);
    }
  }
  /* 打开即自动翻译：缓存先恢复，其余按「包」并发补翻，翻好一页立刻可读 */
  (function autoRun(){
    restoreAll();
    var pend=[].slice.call(document.querySelectorAll('section')).filter(function(s){
      return !s.classList.contains('done')&&s.querySelector('.pj');
    });
    if(!pend.length)return;
    var packs=buildPacks(pend);
    if(!packs.length)return;
    initProgress(pend.length);
    var ni=0,nd=0;
    function pump(){
      while(ni<packs.length&&ni-nd<PACK_PARALLEL){
        (function(pack){
          runPack(pack).then(function(){
            pack.items.forEach(function(){tickProgress(false);});
          },function(e){
            pack.items.forEach(function(it){showErr(it.sec,e);tickProgress(true);});
          }).then(function(){nd++;pump();});
        })(packs[ni++]);
      }
    }
    pump();
  })();
  /* 译文可编辑：失焦后把当前段落写回本地缓存（翻译有误可直接改） */
  /* 悬停联动：鼠标放到某行（原文或译文），整行两侧同时点亮 */
  document.addEventListener('mouseover',function(ev){
    var t=ev.target;
    if(!t||!t.closest)return;
    var cell=t.closest('.pj,.pz');
    var hls=document.querySelectorAll('.pair-hl');
    for(var h=0;h<hls.length;h++)hls[h].classList.remove('pair-hl');
    if(!cell)return;
    var pair=cell.closest('.pair');
    if(!pair)return;
    var a=pair.querySelector('.pj'),b=pair.querySelector('.pz');
    if(a)a.classList.add('pair-hl');
    if(b)b.classList.add('pair-hl');
  });
  document.addEventListener('focusout',function(ev){
    var z=ev.target&&ev.target.closest?ev.target.closest('.pz'):null;
    if(!z||z.contentEditable!=='true')return;
    var sec=z.closest('section'); if(!sec||!sec.classList.contains('done'))return;
    var zs=sec.querySelectorAll('.pz'); if(!zs.length)return;
    var outs=[]; for(var i=0;i<zs.length;i++)outs.push(zs[i].textContent);
    setCache(sec.id.slice(1),outs);
  });
  document.addEventListener('click',function(ev){
    var b=ev.target.closest?ev.target.closest('.tr-btn'):null;
    if(!b)return;
    var sec=b.closest('section');
    var bar=sec.querySelector('.tr-bar');
    if(bar)bar.innerHTML='<span class="tr-loading">翻译中…</span>';
    markWaiting(sec);
    translatePage(sec).catch(function(e){showErr(sec,e);});
  });
  var b=document.body;
  var btns=[['m1',function(){b.className='';}],['m2',function(){b.className='hover-furi';}],['m3',function(){b.className='hide-furi';}]];
  btns.forEach(function(pair){
    var el=document.getElementById(pair[0]);
    if(!el)return;
    el.onclick=function(){pair[1]();btns.forEach(function(p2){var e2=document.getElementById(p2[0]);if(e2)e2.classList.toggle('on',p2[0]===pair[0]);});};
  });
  /*__YOMI_PDF_JS_START__*/
  /* ---------- 下载 PDF：16K 横版含出血（文件 263×191mm，成品 260×185mm） ----------
     裁切线画在成品边角外侧出血区；内容装不下时按 5% 步进自动缩小字号（最低 30%）。
     window.__YOMI_PRINT 由本地服务注入：无头浏览器打开页面后按打印环境重新排版，保证不溢出。 */
  var MARKS=[
    'left:1.5mm;top:0.1mm;width:0.2mm;height:2.4mm',
    'left:0.1mm;top:3mm;width:1mm;height:0.2mm',
    'right:1.5mm;top:0.1mm;width:0.2mm;height:2.4mm',
    'right:0.1mm;top:3mm;width:1mm;height:0.2mm',
    'left:1.5mm;bottom:0.1mm;width:0.2mm;height:2.4mm',
    'left:0.1mm;bottom:3mm;width:1mm;height:0.2mm',
    'right:1.5mm;bottom:0.1mm;width:0.2mm;height:2.4mm',
    'right:0.1mm;bottom:3mm;width:1mm;height:0.2mm'
  ];
  function setZoom(sec,z){
    var kids=sec.children;
    for(var i=0;i<kids.length;i++){
      if(kids[i].classList&&kids[i].classList.contains('cropmark'))continue;
      kids[i].style.zoom=(z===1)?'':z;
    }
  }
  function currentZoom(sec){
    var b=sec.querySelector('.pairs');
    return (b&&b.style.zoom)?(parseFloat(b.style.zoom)||1):1;
  }
  /* 只缩不放：重复调用（页面端一次、无头端一次）也不会把已缩好的排版改回去。
     必须量 .pairs 自身的 scrollHeight——section 层面会被 overflow:hidden 掩盖。 */
  function boxOverflowing(sec){
    var a=sec.querySelector('.pairs');
    return a&&a.scrollHeight>a.clientHeight+1;
  }
  function fitSection(sec){
    var z=currentZoom(sec);
    var guard=0;
    while(boxOverflowing(sec) && z>0.3 && guard<40){
      z=Math.max(0.3,z-0.05);
      setZoom(sec,z);
      guard++;
    }
  }
  function preparePrint(){
    document.body.classList.add('print-preview');
    document.querySelectorAll('section').forEach(function(sec){
      if(!sec.querySelector('.cropmark')){
        MARKS.forEach(function(m){
          var d=document.createElement('div');
          d.className='cropmark';
          d.style.cssText=m;
          sec.appendChild(d);
        });
      }
      fitSection(sec);
    });
  }
  function clearPrint(){
    document.body.classList.remove('print-preview');
    document.querySelectorAll('section').forEach(function(sec){
      setZoom(sec,1);
      var phs=sec.querySelectorAll('.print-ph');
      for(var j=0;j<phs.length;j++)phs[j].remove();
      var marks=sec.querySelectorAll('.cropmark');
      for(var i=0;i<marks.length;i++)marks[i].remove();
    });
  }
  function showPdfOverlay(){
    if(document.getElementById('pdf-overlay'))return;
    var ov=document.createElement('div');
    ov.id='pdf-overlay';
    ov.className='pdf-overlay';
    var apple=document.querySelector('.top .brand svg');
    ov.innerHTML='<div class="pdf-card"><div class="pdf-apple">'+(apple?apple.outerHTML:'')+'</div>'
      +'<p>正在整理成 PDF…</p>'
      +'<div class="pdf-bar"><i></i></div>'
      +'<p class="pdf-sub">厚书可能需要 1-2 分钟，请不要关闭页面</p></div>';
    document.body.appendChild(ov);
  }
  function hidePdfOverlay(){
    var ov=document.getElementById('pdf-overlay');
    if(ov)ov.remove();
  }
  var pbtn=document.getElementById('btn-print');
  function bookName(){
    var t=(document.title||'Yomi').replace(/\\s*·\\s*Yomi.*$/,'').replace(/^[《」『]+|[》」』]+$/g,'').trim();
    return t||'Yomi';
  }
  /* 没有本地服务时（HTML 托管在 GitHub Pages、或直接双击文件打开）：
     页面里的 @page{size:263mm 191mm} 已经写好，浏览器打印本身就是成品版面，
     不需要服务端无头浏览器——只是要用户自己点一次「另存为 PDF」。 */
  function nativePrint(){
    hidePdfOverlay();clearPrint();pbtn.disabled=false;
    var first=false;
    try{ if(!localStorage.getItem('yomi-print-tip')){localStorage.setItem('yomi-print-tip','1');first=true;} }catch(e){}
    if(first){
      alert('已切换为浏览器打印（未连接本地服务）。\\n\\n在打印窗口里请设置：\\n· 目标打印机 → 另存为 PDF\\n· 边距 → 无\\n· 勾选「背景图形」\\n\\n版面已按 263×191mm 排好，直接保存就是成品。');
    }
    window.print();
  }
  /* 端点依次降级：同源（本地服务/GitHub 会 404）→ 固定 127.0.0.1（file:// 打开时）
     → 都不行就交给浏览器打印，不再弹"请启动 bat" */
  var PDF_EPS=['print-pdf','http://127.0.0.1:8080/print-pdf'];
  function postPrint(i,html){
    if(i>=PDF_EPS.length)return Promise.reject(new Error('no-server'));
    return fetch(PDF_EPS[i]+'?name='+encodeURIComponent(bookName()),{
      method:'POST',headers:{'Content-Type':'text/html'},body:html
    })
    .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.blob();})
    .catch(function(){return postPrint(i+1,html);});
  }
  if(pbtn)pbtn.onclick=function(){
    showPdfOverlay();                 /* 点击立即出遮罩（先给反馈） */
    preparePrint();
    var ovEl=document.getElementById('pdf-overlay');
    if(ovEl)ovEl.remove();            /* 序列化前摘掉，避免遮罩被打进 PDF */
    var html='<!DOCTYPE html>\\n'+document.documentElement.outerHTML;
    showPdfOverlay();                 /* 序列化完重新挂上（同步执行，肉眼无间隙） */
    pbtn.disabled=true;
    postPrint(0,html)
      .then(function(bl){
        var u=URL.createObjectURL(bl);
        var a=document.createElement('a');a.href=u;a.download=bookName()+'_印刷版.pdf';
        document.body.appendChild(a);a.click();document.body.removeChild(a);
        hidePdfOverlay();clearPrint();pbtn.disabled=false;
      })
      .catch(function(){nativePrint();});
  };
  window.addEventListener('beforeprint',preparePrint);
  window.addEventListener('afterprint',clearPrint);
  /* 本地服务注入的标记：无头浏览器打印前自动按打印环境排版 */
  if(window.__YOMI_PRINT){
    var autoFit=function(){preparePrint();};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',autoFit);
    else autoFit();
  }
  /*__YOMI_PDF_JS_END__*/

  /* 术语面板：点顶栏「术语」按钮，每行「日文=中文」；保存后清本书缓存并重翻 */
  (function(){
    var btn=document.getElementById('btn-gloss');
    if(!btn)return;
    var panel=null;
    function fmt(list){
      var out=[];
      for(var i=0;i<list.length;i++)out.push(list[i].jp+'='+list[i].zh);
      return out.join('\\n');
    }
    function parse(text){
      var out=[];
      text.split(/[\\n]+/).forEach(function(line){
        line=line.replace(/^\\s+|\\s+$/g,'');
        if(!line)return;
        var m=line.split(/[=＝:：]/);
        if(m.length>=2&&m[0].trim()&&m[1].trim())out.push({jp:m[0].trim(),zh:m[1].trim()});
      });
      return out;
    }
    btn.onclick=function(){
      if(panel){panel.remove();panel=null;return;}
      panel=document.createElement('div');
      panel.className='gl-panel';
      panel.innerHTML='<div class="gl-card"><h3>📚 自定义术语表</h3>'
        +'<p>每行一条，格式「日文=中文」。遇到翻错的词就加一条（如：告白=表白），全书生效，所有 Yomi 书共用。保存后当前书会自动重翻（手动改过的译文会被覆盖）。</p>'
        +'<textarea placeholder="告白=表白\\n特進クラス=特进班"></textarea>'
        +'<div class="gl-row"><button id="gl-cancel">取消</button><button id="gl-save" class="gl-save">保存并重翻</button></div></div>';
      document.body.appendChild(panel);
      panel.querySelector('textarea').value=fmt(USER_GLOSS);
      panel.addEventListener('click',function(ev){if(ev.target===panel){panel.remove();panel=null;}});
      panel.querySelector('#gl-cancel').onclick=function(){panel.remove();panel=null;};
      panel.querySelector('#gl-save').onclick=function(){
        USER_GLOSS=parse(panel.querySelector('textarea').value);
        try{localStorage.setItem(GL_KEY,JSON.stringify(USER_GLOSS));}catch(e){}
        var dead=[];
        try{
          for(var i=0;i<localStorage.length;i++){
            var k=localStorage.key(i);
            if(k&&k.indexOf('yomi-tr:')===0&&k.indexOf(NAMESPACE)>=0)dead.push(k);
          }
        }catch(e){}
        dead.forEach(function(k){localStorage.removeItem(k);});
        location.reload();
      };
    };
  })();

  /* 水印守卫：DOM 里被删掉就自动补回来（防误删、防随手改）。
     真正的"删不掉"靠服务端：下载 PDF 时服务端会无条件重注一遍水印。 */
  (function(){
    var APPLE='<span class="wm wm-apple" aria-hidden="true"><svg viewBox="0 0 16 16"><use href="#yomi-apple"/></svg></span>';
    var YOMI='<span class="wm wm-yomi" aria-hidden="true">Yomi</span>';
    function ensure(){
      var ps=document.querySelectorAll('.pairs'),i;
      for(i=0;i<ps.length;i++){
        if(!ps[i].querySelector('.wm-apple'))ps[i].insertAdjacentHTML('afterbegin',APPLE);
        if(!ps[i].querySelector('.wm-yomi'))ps[i].insertAdjacentHTML('beforeend',YOMI);
      }
    }
    ensure();
    try{new MutationObserver(ensure).observe(document.body,{childList:true,subtree:true});}catch(e){}
  })();
})();
`;
