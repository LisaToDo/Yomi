/* ============================================================
   Yomi 読み · app.js  (v2)
   修复与增强：
   - 【核心 Bug】kuromoji 选项名是 dicPath（此前写成 dictPath → 词典请求
     落到默认相对路径 "dict/" 并 404；且失败时 build 回调不触发，
     导致加载态永久卡住 =「下载很久没动静」）
   - 词典改为本地优先（site/dict/ 共 12 个文件），CDN 兜底
   - 并行预取 + 真实字节进度条；60 秒超时 + 重试按钮
   - 分页渲染：DOM 里永远只有一页，200 页的书也不会卡
   - 分块分词 + 定时让出主线程，长文处理时界面不假死
   ============================================================ */
"use strict";

/* ---------- 常量 ---------- */
const DICT_FILES = [
  "base.dat.gz", "cc.dat.gz", "check.dat.gz", "tid.dat.gz", "tid_pos.dat.gz",
  "tid_map.dat.gz", "unk.dat.gz", "unk_pos.dat.gz", "unk_map.dat.gz",
  "unk_char.dat.gz", "unk_compat.dat.gz", "unk_invoke.dat.gz",
];
const DICT_TOTAL_BYTES = 17452506;   // 12 个文件合计，用于进度估算
const DICT_TIMEOUT_MS = 60000;

const MAX_CHARS = 500000;            // 上限约 600 页
const PAGE_TARGET_CHARS = 3600;      // 每页渲染预算
const YIELD_MS = 45;                 // 每处理这么久让出一次主线程

const KANJI_RE = /[\u3400-\u4DBF\u4E00-\u9FFF々]/;

/* ---------- 元素 ---------- */
const $ = (id) => document.getElementById(id);
const inputText = $("input-text");
const btnAnnotate = $("btn-annotate");
const btnFile = $("btn-file");
const btnSample = $("btn-sample");
const btnClear = $("btn-clear");
const fileInput = $("file-input");
const charCount = $("char-count");
const loading = $("loading");
const loadingMsg = $("loading-msg");
const progressWrap = $("progress-wrap");
const progressFill = $("progress-fill");
const progressPct = $("progress-pct");
const btnRetry = $("btn-retry");
const reader = $("reader");
const pager = $("pager");
const pgInfo = $("pg-info");
const inputCard = $("input-card");
const toast = $("toast");

/* ---------- 状态 ---------- */
let tokenizer = null;
let tokenizerLoading = null;
let doc = null;             // { pages:[{html,plain}], words, stats }
let lastConvertError = "";  // /convert 最近一次错误信息（用于用户提示）
let pageIndex = 0;
let readerSize = 19;

/* ============================================================
   像素苹果 Logo
   ============================================================ */
const APPLE_MAP = [
  "................",
  "........SS......",
  "........SSVV....",
  "........SS......",
  "...DDDDDDDDDD...",
  "..DMMMMMMMMMMD..",
  ".DMLLHMMMMMMMMD.",
  ".DMLLHMMMMMMMMD.",
  "DMLLMMMMMMMMMMMD",
  "DMLMMMMMMMMMMMMD",
  "DMMMMMMMMMMMMMMD",
  "DMMMMMMMMMMMMMMD",
  ".DMMMMMMMMMMMD..",
  "..DDMMMMMMMMDD..",
  "....DDDDDDDD....",
  "................",
];
const APPLE_COLORS = {
  D: "#2C5A12", M: "#8CC63F", L: "#B7E15E",
  H: "#F2FADC", S: "#7A4A21", V: "#3F8F2C",
};
function buildAppleSVG() {
  let rects = "";
  APPLE_MAP.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== ".") {
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${APPLE_COLORS[ch]}"/>`;
      }
    });
  });
  return `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${rects}</svg>`;
}
document.querySelectorAll("[data-apple]").forEach((el) => {
  el.innerHTML = buildAppleSVG();
});

/* ============================================================
   工具函数
   ============================================================ */
function kataToHira(str) {
  if (!str) return str;
  return [...str].map((c) => {
    const code = c.charCodeAt(0);
    return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : c;
  }).join("");
}
function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[m]));
}

/* 日文新字体 → 简体中文（只收字形有差异的常用字，主要覆盖人名高频字）。
   没收录的字保持原样——宁可保留日文字形，也不出错。 */
const JP2SC = {
  "亜":"亚","悪":"恶","圧":"压","囲":"围","維":"维","絵":"绘","栄":"荣","衛":"卫",
  "禍":"祸","楽":"乐","渦":"涡","簡":"简","観":"观","願":"愿","気":"气","帰":"归",
  "宮":"宫","規":"规","亀":"龟","拠":"据","挙":"举","郷":"乡","験":"验","県":"县",
  "絹":"绢","権":"权","謙":"谦","検":"检","減":"减","渓":"溪","庫":"库","構":"构",
  "広":"广","効":"效","徳":"德","黒":"黑","穀":"谷","歳":"岁","桜":"樱","賛":"赞",
  "誌":"志","歯":"齿","詩":"诗","紙":"纸","蔵":"藏","資":"资","賜":"赐","車":"车",
  "種":"种","収":"收","獣":"兽","総":"总","縦":"纵","勢":"势","焼":"烧","織":"织",
  "進":"进","図":"图","粋":"粹","積":"积","繊":"纤","戦":"战","専":"专","荘":"庄",
  "倉":"仓","層":"层","騒":"骚","沢":"泽","単":"单","団":"团","遅":"迟","鉄":"铁",
  "転":"转","島":"岛","東":"东","動":"动","凍":"冻","読":"读","納":"纳","軟":"软",
  "濃":"浓","備":"备","飛":"飞","姫":"姬","評":"评","貧":"贫","婦":"妇","復":"复",
  "仏":"佛","変":"变","豊":"丰","養":"养","擁":"拥","輸":"输","優":"优","頼":"赖",
  "乱":"乱","類":"类","涙":"泪","霊":"灵","齢":"龄","歴":"历","錬":"炼","炉":"炉",
  "労":"劳","録":"录","論":"论","賄":"贿","呂":"吕","賀":"贺","恵":"惠","蛍":"萤",
  "軽":"轻","鶏":"鸡","芸":"艺","鯨":"鲸","劇":"剧","厳":"严","掛":"挂","鍵":"键",
  "顎":"颚","勧":"劝","寛":"宽","幹":"干","慣":"惯","関":"关","貴":"贵","給":"给",
  "許":"许","鏡":"镜","競":"竞","橋":"桥","業":"业","区":"区","駆":"驱","勲":"勋",
  "訓":"训","軍":"军","係":"系","窓":"窗","響":"响","魚":"鱼","語":"语","誤":"误",
  "護":"护","後":"后","項":"项","剛":"刚","採":"采","載":"载","財":"财","剤":"剂",
  "砕":"碎","災":"灾","桟":"栈","塩":"盐","縄":"绳","択":"择","渋":"涩","発":"发",
  "髪":"发","抜":"拔","巻":"卷","換":"换","緩":"缓","還":"还","艦":"舰","顔":"颜",
  "輝":"辉","機":"机","飢":"饥","幾":"几","擬":"拟","義":"义","窮":"穷","漁":"渔",
  "暁":"晓","謹":"谨","経":"经","継":"继","絞":"绞","節":"节","説":"说","設":"设",
  "線":"线","選":"选","鮮":"鲜","証":"证","詳":"详","賞":"赏","贈":"赠","則":"则",
  "対":"对","帯":"带","滞":"滞","隊":"队","達":"达","張":"张","帳":"帐","彫":"雕",
  "頂":"顶","鳥":"鸟","聴":"听","調":"调","貼":"贴","鎮":"镇","陳":"陈","墜":"坠",
  "締":"缔","跡":"迹","電":"电","伝":"传","農":"农","熱":"热","悩":"恼","筆":"笔",
  "標":"标","浜":"滨","頻":"频","聞":"闻","並":"并","別":"别","辺":"边","歩":"步",
  "補":"补","舗":"铺","麦":"麦","範":"范","販":"贩","噴":"喷","墳":"坟","紛":"纷",
  "雰":"氛","絡":"络","藍":"蓝","嵐":"岚","覧":"览","濫":"滥","療":"疗","遼":"辽",
  "糧":"粮","鈴":"铃","実":"实","紗":"纱","綺":"绮","樹":"树","竜":"龙",
  "龍":"龙","颯":"飒","蓮":"莲","結":"结","純":"纯","陽":"阳","輔":"辅","凜":"凛",
  "篤":"笃","緒":"绪","潑":"泼","錢":"钱","劍":"剑","驅":"驱","髮":"发","齊":"齐",
};
function toSimplified(s) {
  return [...s].map((c) => JP2SC[c] || c).join("");
}

/* 振假名只覆盖汉字：像「落ちこぼれ(おちこぼれ)」这种整词注音会让假名部分重复两遍，
   正规日文书里是「落(お)ちこぼれ」。做法：汉字全在词首时，把读音按末尾送假名切掉，
   剩下的就是汉字部分的读音，ruby 只包汉字。切不准（读音不以送假名结尾）就退回整词注音。 */
const RUBY_HEAD_KANJI_RE = /^([\u3400-\u4DBF\u4E00-\u9FFF々]+)([\u3040-\u309F]+)$/;
function buildRuby(surface, rt) {
  if (!rt || rt === surface) return escapeHTML(surface);
  const m = RUBY_HEAD_KANJI_RE.exec(surface);
  if (m) {
    const kanji = m[1], tail = m[2];
    /* 送假名 ≥2 个才拆，短词整词注音更整齐（送る → 送る(おくる)） */
    if (tail.length >= 2 && rt.length > tail.length && rt.slice(-tail.length) === tail) {
      const head = rt.slice(0, rt.length - tail.length);
      return `<ruby>${escapeHTML(kanji)}<rt>${escapeHTML(head)}</rt></ruby>${escapeHTML(tail)}`;
    }
  }
  return `<ruby>${escapeHTML(surface)}<rt>${escapeHTML(rt)}</rt></ruby>`;
}
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}
const POS_MAP = {
  "名詞": "名词", "動詞": "动词", "形容詞": "形容词", "副詞": "副词",
  "感動詞": "感叹词", "形容動詞": "形动", "連体詞": "连体词",
};
const shortPos = (pos) => POS_MAP[(pos || "").split(",")[0]] || (pos || "").split(",")[0];

/* ---------- 加载态 ---------- */
function showLoading(msg, withProgress) {
  loading.hidden = false;
  loadingMsg.textContent = msg;
  progressWrap.hidden = !withProgress;
  progressPct.hidden = !withProgress;
  btnRetry.hidden = true;
  if (withProgress) setProgress(0);
}
function setProgress(ratio) {
  const p = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  progressFill.style.width = p + "%";
  progressPct.textContent = p + "%";
}
function hideLoading() { loading.hidden = true; }
function showLoadError(msg, onRetry) {
  loading.hidden = false;
  loadingMsg.textContent = msg;
  progressWrap.hidden = true;
  progressPct.hidden = true;
  btnRetry.hidden = false;
  btnRetry.onclick = onRetry;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ============================================================
   词典加载 v2.1：本地优先 → 多 CDN 轮换 → 单文件超时 → 实时报数
   （v2.0 的隐患：prefetch 没有超时，若某个 CDN 连接悬挂，
     Promise 永不 resolve，界面就停在半路没动静）
   ============================================================ */
const CDN_SOURCES = [
  { base: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/",       label: "jsdelivr" },
  { base: "https://fastly.jsdelivr.net/npm/kuromoji@0.1.2/dict/",    label: "jsdelivr-fastly" },
  { base: "https://unpkg.com/kuromoji@0.1.2/dict/",                  label: "unpkg" },
];
/* 词典来源候选：同源相对路径优先（8080 正常打开时），失败则回退到 8080 绝对地址
   （预览面板 / file:// 打开时同源拿不到 dict），再失败才走 CDN */
const DICT_BASES = [
  { base: "dict/", label: "本地" },
  { base: "http://127.0.0.1:8080/dict/", label: "本地(8080)" },
];
const FILE_TIMEOUT_MS = 45000;   // 单文件超时

/* 只更新文案，不动进度条 */
function setLoadingMsg(msg) { loadingMsg.textContent = msg; }

async function pickDictBase() {
  for (const cand of DICT_BASES) {
    try {
      const res = await fetch(cand.base + "unk_char.dat.gz", { cache: "no-store" });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        if (buf.byteLength === 306) return cand;   // 本地小文件校验通过
      }
    } catch { /* 该来源不可用，试下一个 */ }
  }
  return null;
}

/* 并行预取一个源：汇总真实字节进度 + 单文件超时，任一失败即整体失败（换源重试） */
function prefetchDict(base, label) {
  const loaded = new Map();
  let done = 0;
  return new Promise((resolve, reject) => {
    let settled = false;
    const ok = () => { if (!settled) { settled = true; resolve(); } };
    const fail = (m) => { if (!settled) { settled = true; reject(new Error(m)); } };

    DICT_FILES.forEach((name) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", base + name, true);
      xhr.responseType = "arraybuffer";
      xhr.timeout = FILE_TIMEOUT_MS;
      const report = (bytes) => {
        loaded.set(name, bytes);
        let sum = 0; loaded.forEach((v) => { sum += v; });
        setProgress(sum / DICT_TOTAL_BYTES);
      };
      xhr.onprogress = (e) => { if (e.lengthComputable) report(e.loaded); };
      xhr.onload = () => {
        if (xhr.status === 200 || (xhr.status === 0 && xhr.response && xhr.response.byteLength > 0)) {
          report(xhr.response.byteLength);
          done += 1;
          setLoadingMsg(`正在加载日语词典 ${done}/${DICT_FILES.length} · ${name}（${label}）…`);
          if (done === DICT_FILES.length) ok();
        } else {
          fail(`词典文件 ${name} 加载失败（HTTP ${xhr.status}，源：${label}）`);
        }
      };
      xhr.ontimeout = () => fail(`词典文件 ${name} 下载超时（${FILE_TIMEOUT_MS / 1000}s，源：${label}）`);
      xhr.onerror = () => fail(`词典文件 ${name} 网络错误（源：${label}）`);
      xhr.send();
    });
  });
}

/* 用指定 base 构建 tokenizer（60 秒看门狗） */
function buildTokenizer(base) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) { settled = true; reject(new Error("词典构建超时（60 秒）")); }
    }, DICT_TIMEOUT_MS);
    /* 关键：选项名是 dicPath —— 之前误写为 dictPath 导致全部 404 */
    kuromoji.builder({ dicPath: base }).build((err, tk) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) reject(new Error(String(err)));
      else { tokenizer = tk; resolve(); }
    });
  });
}

async function ensureTokenizer() {
  if (tokenizer) return;
  if (tokenizerLoading) return tokenizerLoading;

  tokenizerLoading = (async () => {
    const localPick = await pickDictBase();
    const sources = [];
    if (localPick) sources.push(localPick);
    sources.push(...CDN_SOURCES);

    let lastErr = null;
    for (const s of sources) {
      try {
        showLoading(`正在加载日语词典（源：${s.label}）…`, true);
        await prefetchDict(s.base, s.label);
        setLoadingMsg("正在解压并构建词典…");
        setProgress(1);
        await sleep(30);
        await buildTokenizer(s.base);
        return;                                   // 成功
      } catch (e) {
        console.warn(`词典源 ${s.label} 失败:`, e.message);
        lastErr = e;
      }
    }
    throw lastErr || new Error("所有词典源均不可用");
  })();

  return tokenizerLoading.catch((e) => { tokenizerLoading = null; throw e; });
}

/* ============================================================
   分词 + 注音 + 分页
   ============================================================ */
function isContentWord(token) {
  const p1 = token.pos;
  if (!["名詞", "動詞", "形容詞", "副詞", "感動詞", "形容動詞"].includes(p1)) return false;
  if (p1 === "名詞" && (token.pos_detail_1 === "非自立" || token.pos_detail_1 === "代名詞")) return false;
  if (p1 === "動詞" && token.pos_detail_1 === "非自立") return false;
  return true;
}

/* kuromoji 崩溃字符实测（fuzz 全字符区复现）：
   - U+0000（NUL，PDF 提取残留的常客）→ "Cannot read properties of undefined (reading 'length')"
   - 增补平面字符/变体选择符/零宽字符等一并清洗，代理对替换为 〓 */
const INVISIBLE_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060\uFE00-\uFE0F\uFEFF]/g;
const ASTRAL_RE = /[\u{10000}-\u{10FFFF}]/gu;
const sanitizeLine = (s) => s.replace(INVISIBLE_RE, "").replace(ASTRAL_RE, "〓");

/* 分词 + 失败降级：坏块逐字重试，仍失败的按纯文本原样输出，绝不让整本书报废 */
function tokenizeSafe(line) {
  try {
    return tokenizer.tokenize(line);
  } catch (e) {
    console.warn("分词失败，进入降级模式:", e.message, "行首:", line.slice(0, 30));
    const out = [];
    for (const ch of line) {
      try {
        out.push(...tokenizer.tokenize(ch));
      } catch {
        out.push({ surface_form: ch, reading: "*", pos: "記号", pos_detail_1: "一般", basic_form: "*" });
      }
    }
    return out;
  }
}

/* 把被分词拆开的活用尾巴合回一个词：信じ＋て＋いた → 信じていた、回さ＋れ＋た → 回された。
   这样「整词标原型读音」才有意义（否则只会在「信じ」上标 しんじる）。 */
function mergeVerbTokens(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const next = tokens[i + 1];
    const isVerb = t.pos === "動詞";
    const isSahen = t.pos === "名詞" && t.pos_detail_1 === "サ変接続" &&
      next && next.pos === "動詞" && next.pos_detail_1 === "非自立";
    if (!isVerb && !isSahen) { out.push(t); continue; }

    const kana = (x) => (x.reading && x.reading !== "*" ? x.reading : "");
    let surface = t.surface_form;
    let reading = kana(t);
    const firstBase = isVerb
      ? (t.basic_form && t.basic_form !== "*" ? t.basic_form : t.surface_form)
      : t.surface_form;
    let auxBase = "";   // 簇内最后一个补助动词的原形（〜始める/出す/続ける/しまう 的中心词是它，不是第一个动词）
    let causative = false;  // 出现过 せる/させる（使役）
    let passive = false;    // 出现过 れる/られる（受身・可能）
    let j = i + 1;

    if (isSahen) { surface += next.surface_form; reading += kana(next); j++; }

    while (j < tokens.length) {
      const n = tokens[j];
      const tail = n.pos === "助動詞" ||
        (n.pos === "助詞" && (n.surface_form === "て" || n.surface_form === "で")) ||
        (n.pos === "動詞" && (n.pos_detail_1 === "非自立" || n.pos_detail_1 === "接尾"));
      if (!tail) break;
      surface += n.surface_form;
      reading += kana(n);
      if (n.pos === "動詞" && n.pos_detail_1 === "非自立" &&
          n.basic_form && n.basic_form !== "*" &&
          n.basic_form !== "いる" && n.basic_form !== "ある") {
        auxBase = n.basic_form;
      }
      if (n.pos === "動詞" && n.pos_detail_1 === "接尾") {
        const bf = n.basic_form || "";
        if (bf === "せる" || bf === "させる") causative = true;
        if (bf === "れる" || bf === "られる") passive = true;
      }
      j++;
    }

    /* 纯使役（せる/させる）：原形是「書かす/食べさせる」这类派生形，词典里查不到，
       且 kuromoji 会把 basic_form 判成前接动词（驚かせる→驚く 完全错），
       所以退回用当前形的读音，不标原型音。使役受身（考えさせられる）仍标 考える。 */
    const keepSurfaceAsBase = causative && !passive;

    out.push({
      surface_form: surface,
      reading: reading || "*",
      /* 〜ている 类头词是第一个动词（読む）；〜始める/出す/続ける 类头词是最后的补助动词 */
      basic_form: keepSurfaceAsBase
        ? surface
        : (isSahen ? firstBase + (auxBase || "する") : (auxBase || firstBase)),
      pos: "動詞",
      pos_detail_1: t.pos_detail_1,
    });
    i = j - 1;
  }
  return out;
}

/* 原型读音缓存：动词按词典形（basic_form）注音，方便直接查词 */
const DICT_READING_CACHE = new Map();
function dictReadingOf(form) {
  if (!form || !tokenizer) return "";
  if (DICT_READING_CACHE.has(form)) return DICT_READING_CACHE.get(form);
  let out = "";
  try {
    const ts = tokenizer.tokenize(form) || [];
    out = ts.map((t) => (t.reading && t.reading !== "*" ? kataToHira(t.reading) : t.surface_form)).join("");
  } catch { out = ""; }
  DICT_READING_CACHE.set(form, out);
  return out;
}

async function buildDocument(text, onProgress) {
  const lines = text.split("\n");
  const pages = [];
  const wordMap = new Map();

  let cur = { parts: [], chars: 0 };
  let totalTokens = 0;
  let lastYield = performance.now();

  const flushPage = () => {
    if (cur.parts.length) {
      pages.push({
        html: cur.parts.map((p) => `<p>${p.html}</p>`).join(""),
        plain: cur.parts.map((p) => p.plain).join("\n\n"),
        paras: cur.parts.map((p) => ({ html: p.html, names: p.names || [] })),
      });
      cur = { parts: [], chars: 0 };
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = sanitizeLine(lines[i]);

    if (line.trim()) {
      const tokens = mergeVerbTokens(tokenizeSafe(line));
      totalTokens += tokens.length;
      let html = "", plain = "";
      /* 人名检出：kuromoji 会把姓名拆成 姓+名 两个 token，相邻人名合并成一个，
         简体化后随段落写进 data-names，翻译时替换占位符回填，避免机翻转成罗马字 */
      const names = [];
      let nameBuf = "";
      let nameExtra = 0;
      const flushName = () => {
        if (nameBuf) {
          names.push({ jp: nameBuf, zh: toSimplified(nameBuf) });
          nameBuf = "";
          nameExtra = 0;
        }
      };

      for (const token of tokens) {
        const surface = token.surface_form;
        const raw = token.reading && token.reading !== "*" ? token.reading : null;
        const reading = raw ? kataToHira(raw) : null;
        const hasKanji = KANJI_RE.test(surface);
        /* 词形变化过的动词：改用词典形（原型）读音，便于直接查词。
           形容词不套用——活用尾巴短（多く/高く/美しかった 都能从原形推出来），
           标原型音反而变成「多く(おおい)」这种读者念不出来的错标。 */
        const inflected = token.basic_form && token.basic_form !== "*" && token.basic_form !== surface;
        const dictReading = inflected && token.pos === "動詞"
          ? (dictReadingOf(token.basic_form) || null)
          : null;
        const rtText = dictReading || reading;

        if (token.pos === "名詞" && token.pos_detail_1 === "固有名詞" &&
            (token.pos_detail_2 === "人名" || token.pos_detail_3 === "人名") && surface) {
          nameBuf += surface;
          nameExtra = 0;
        } else if (nameBuf && nameExtra < 2 && surface.length <= 2 && KANJI_RE.test(surface) &&
            (token.pos_detail_1 === "一般" || (token.pos === "動詞" && token.pos_detail_1 === "自立"))) {
          /* 名字的末字常被词典标成普通名词/动词（真織→織=動詞、花蓮→蓮=一般），
             紧跟人名且只有 1-2 个汉字就并入姓名；日语姓名后必须接助词，误吞风险低 */
          nameBuf += surface;
          nameExtra++;
        } else {
          flushName();
        }

        if (hasKanji && rtText && rtText !== surface) {
          html += buildRuby(surface, rtText);
          plain += `${surface}(${rtText})`;
        } else {
          html += escapeHTML(surface);
          plain += surface;
        }

        if (isContentWord(token)) {
          const key = token.basic_form && token.basic_form !== "*" ? token.basic_form : surface;
          const e = wordMap.get(key);
          if (e) e.count += 1;
          else wordMap.set(key, { surface, reading: reading || "", pos: token.pos, kanji: hasKanji, count: 1 });
        }
      }

      flushName();
      cur.parts.push({ html, plain, names });
      cur.chars += line.length;
      if (cur.chars >= PAGE_TARGET_CHARS) flushPage();
    }

    if (performance.now() - lastYield > YIELD_MS) {
      onProgress((i + 1) / lines.length);
      await sleep(0);
      lastYield = performance.now();
    }
  }
  flushPage();
  onProgress(1);

  const words = [...wordMap.values()];
  const chars = text.replace(/\s/g, "").length;
  return {
    pages,
    words,
    stats: {
      chars,
      tokens: totalTokens,
      unique: words.length,
      kanjiWords: words.filter((w) => w.kanji).length,
    },
  };
}

/* ============================================================
   渲染（分页：DOM 里永远只有一页）
   ============================================================ */
function renderPage() {
  if (!doc) return;
  reader.innerHTML = doc.pages[pageIndex] ? doc.pages[pageIndex].html : "";
  reader.scrollTop = 0;

  const n = doc.pages.length;
  pager.hidden = n <= 1;
  if (n > 1) pgInfo.textContent = `第 ${pageIndex + 1} / ${n} 页`;
  $("pg-prev").disabled = pageIndex === 0;
  $("pg-next").disabled = pageIndex === n - 1;
}

function renderAll() {
  pageIndex = 0;
  renderPage();
}

function downloadFile(name, content, mime) {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
   导出 / 复制（覆盖整本，不受分页影响）
   ============================================================ */
function exportHTML() {
  if (!doc) return;
  const fullHtml = doc.pages.map((p) => p.html).join("");
  const el = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><title>Yomi 标注结果</title>
<style>
  body{max-width:720px;margin:40px auto;padding:0 24px;font-family:"Yu Gothic","Meiryo","Noto Sans JP",serif;
       color:#1E3A08;background:#FBF8EC;font-size:19px;line-height:2.2;}
  h1{font-size:15px;color:#4E8516;border-bottom:3px solid #37620E;padding-bottom:8px;}
  rt{font-size:.5em;color:#4E8516;font-weight:700;}
  p{margin:0 0 1.5em;}
  footer{margin-top:32px;font-size:12px;color:#6FA827;border-top:2px dashed #CFEBAA;padding-top:12px;}
</style></head><body>
<h1>Yomi 読み · 假名标注</h1>
${fullHtml}
<footer>由 Yomi 生成 · ${new Date().toLocaleString("zh-CN")} · 共 ${doc.stats.chars} 字</footer>
</body></html>`;
  downloadFile("yomi-annotated.html", el, "text/html");
  showToast("已导出整本 HTML");
}
async function copyAnnotated() {
  if (!doc) return;
  const plain = doc.pages.map((p) => p.plain).join("\n\n");
  try {
    await navigator.clipboard.writeText(plain);
    showToast(`已复制全书（${doc.stats.chars} 字）`);
  } catch {
    showToast("复制失败，请手动选择文本");
  }
}

/* ============================================================
   文件导入
   ============================================================ */
async function readTXT(file) {
  const buf = await file.arrayBuffer();
  let text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  if (text.includes("\uFFFD")) {
    try { text = new TextDecoder("shift_jis").decode(buf); } catch { /* 保持原样 */ }
  }
  return text;
}
/* ---------- 浏览器端断句合并（Python 转换器的 JS 版） ----------
   没有本地服务时（GitHub Pages 托管、或直接双击 HTML），pdf.js 只能拿到逐行碎片，
   这里套用同一套规则：句末标点收段、超短行独立成段、整块短行视为歌词逐行成段。 */
const SENT_END = "。！？…‥」』）!?\"";
const endsSentence = (s) => !!s && SENT_END.includes(s.slice(-1));
/* 歌词 / 诗行：连续 ≥3 行、每行 ≤16 字、整块无句末标点 */
function markVerses(lines) {
  const flags = new Array(lines.length).fill(false);
  let i = 0;
  while (i < lines.length) {
    if (endsSentence(lines[i])) { i++; continue; }
    let j = i;
    while (j < lines.length && !endsSentence(lines[j]) && [...lines[j]].length <= 16) j++;
    if (j - i >= 3) for (let k = i; k < j; k++) flags[k] = true;
    i = Math.max(j, i + 1);
  }
  return flags;
}
function mergeLines(rawLines) {
  const lines = rawLines.map((s) => s.replace(/^\s+|\s+$/g, "")).filter(Boolean);
  if (!lines.length) return [];
  const lens = lines.map((l) => [...l].length).sort((a, b) => a - b);
  const median = lens[Math.floor(lens.length / 2)];
  const shortLimit = Math.max(6, median * 0.45);
  const verse = markVerses(lines);
  const paras = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (cur !== null) {
      if (verse[i]) { paras.push(cur); cur = null; }   /* 歌词行不吃进未完段：先结清前段 */
      else {
        cur += line;                                   /* 上段未完 → 续行 */
        if (endsSentence(cur)) { paras.push(cur); cur = null; continue; }  /* 已成段，别落进下面的独立段分支 */
      }
    }
    if (cur === null) {
      cur = line;
      if (endsSentence(cur) || [...line].length <= shortLimit || verse[i]) {
        paras.push(cur); cur = null;                   /* 句完 / 标题类短行 / 歌词行 → 独立段 */
      }
    }
  }
  if (cur !== null) paras.push(cur);
  return paras;
}
async function readPDFPages(file) {
  if (!window.pdfjsLib) throw new Error("PDF 组件未加载");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "pdf.worker.min.js";
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = {};
  let raw = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    let t = "";
    for (const item of tc.items) t += item.str + (item.hasEOL ? "\n" : "");
    const paras = mergeLines(t.split("\n"));
    pages[i] = { text: paras.join("\n") };
    raw += paras.join("\n") + "\n\n";
    showLoading(`正在读取 PDF：第 ${i} / ${pdf.numPages} 页…`, true);
    setProgress(i / pdf.numPages);
    if (i % 5 === 0) await sleep(0);
  }
  return { pages, raw };
}
async function readPDF(file) {
  return (await readPDFPages(file)).raw;
}
/* ============================================================
   整本书模式：PDF → 本地服务转换（竖排/横排 + 断句）→ 注音 → 双语 HTML 下载
   ============================================================ */
async function convertViaServer(file) {
  const buf = await file.arrayBuffer();
  /* 先试同源（本地服务器打开时），再试固定地址（预览面板等跨源场景） */
  const endpoints = ["convert", "http://127.0.0.1:8080/convert"];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: buf,
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.pages && Object.keys(data.pages).length) return data.pages;
      if (data && data.error) lastConvertError = data.error;
    } catch { /* 下一个端点 */ }
  }
  return null;
}

async function buildBilingualHtml(pages, title) {
  await ensureTokenizer();
  const entries = Object.entries(pages).filter(([, p]) => p.text && p.text.trim());
  if (!entries.length) throw new Error("转换结果里没有可读文本（可能是扫描版 PDF）");

  /* 页眉书名（h2 内用，转义 HTML；文件名转义在生成下载名时另做） */
  const escTitle = String(title || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  showLoading(`正在注音并生成双语文档（0 / ${entries.length} 页）…`, true);
  await sleep(30);
  let sections = "";
  let lastUi = 0;
  for (let i = 0; i < entries.length; i++) {
    const [num, info] = entries[i];
    const doc = await buildDocument(info.text, () => {});
    /* 逐段配对行：一段原文 + 对应译文格（译文打开后自动填），人名写进 data-names */
    const pairsHtml = doc.pages.flatMap((pg) => pg.paras || []).map((pa) => {
      const nmAttr = pa.names && pa.names.length
        ? ` data-names='${JSON.stringify(pa.names).replace(/&/g, "&amp;").replace(/'/g, "&#39;")}'`
        : "";
      return `<div class="pair"${nmAttr}><div class="pj">${pa.html}</div><div class="pz"><span class="pz-ph">（未翻译）</span></div></div>`;
    }).join("");
    /* 页眉：《书名》居左 + 页码居右，都在出血裁切线以内 */
    sections += `<section id="p${num}"><h2><span class="hd-title">《${escTitle}》</span><span class="hd-page">第 ${num} 页</span></h2>`
      + `<span class="wm-proof" aria-hidden="true">Yomi${new Date().toISOString().slice(0, 10).replace(/-/g, "")}</span>`
      + `<div class="tr-bar"><button class="tr-btn">🌐 翻译本页</button><span class="tr-hint">打开时自动翻译 · 译文可直接点击编辑，修改自动保存在本地</span></div>`
      + `<div class="pairs"><span class="wm wm-apple" aria-hidden="true"><svg viewBox="0 0 16 16"><use href="#yomi-apple"/></svg></span><span class="wm wm-yomi" aria-hidden="true">Yomi</span>${pairsHtml}</div></section>\n`;
    if (performance.now() - lastUi > 150 || i === entries.length - 1) {
      showLoading(`正在注音并生成双语文档（${i + 1} / ${entries.length} 页）…`, true);
      setProgress((i + 1) / entries.length);
      lastUi = performance.now();
      await sleep(0);
    }
  }
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, "_");
  const appleSvg = buildAppleSVG();
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escTitle} · Yomi 双语注音版</title>
<style>${BOOK_CSS}</style></head><body>
<svg width="0" height="0" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"><defs>${APPLE_SYMBOL}</defs></svg>
<div class="top"><span class="brand">${appleSvg}<b class="brand-name">Yomi</b></span>
<span class="book-title">《${escTitle}》</span>
<span class="mode"><button id="btn-print" title="点击直接下载 16K 横版（含出血 263×191mm）的印刷 PDF，需本地服务运行">🖨 下载 PDF</button><button id="btn-gloss" title="自定义术语表：遇到翻错的词，加一条「日文=中文」，全书重翻">📚 术语</button><button class="on" id="m1">常显假名</button><button id="m2">悬停显示</button><button id="m3">隐藏自测</button></span>
</div>
<main>
${sections}
</main>
<script>window.BOOK_ID = ${JSON.stringify(title)};</script>
<script>${BOOK_JS}</script>
</body></html>`;
}

async function handleFile(file) {
  try {
    let text;
    if (/\.pdf$/i.test(file.name)) {
      /* 首选：本地服务转换（竖排 Type3 PDF + 断句），失败再退回浏览器 pdf.js */
      showLoading("正在本地解析 PDF（竖排转换 + 断句合并）…", false);
      lastConvertError = "";
      let pages = await convertViaServer(file);
      let degraded = false;
      const title = file.name.replace(/\.pdf$/i, "");

      if (!pages) {
        /* 回退：浏览器端 pdf.js（横排、文字层完好的 PDF 可用；用同一套断句规则合并）
           纯静态部署（GitHub Pages）就走这条路，仍然能生成双语书，只是竖排 PDF 不行 */
        showLoading("未连接本地服务，改用浏览器解析 PDF…", false);
        const r = await readPDFPages(file);
        const raw = r.raw;
        if (!raw.trim()) {
          hideLoading();
          showToast(lastConvertError
            ? "本地转换失败：" + lastConvertError
            : "这份 PDF 没有文字层（可能是扫描版），请改用 TXT");
          return;
        }
        /* 竖排/特殊字体的 PDF 走浏览器解析必然出一字一行+乱码，直接拦下并指路 */
        const bad = (raw.match(/[〓\uFFFD\uE000-\uF8FF\u0000-\u0008\u000E-\u001F]/g) || []).length;
        const lines = raw.split("\n").filter((l) => l.trim());
        const singleCharLines = lines.filter((l) => [...l].length === 1).length;
        const brokenRatio = bad / Math.max(1, raw.length);
        const singleRatio = lines.length > 20 ? singleCharLines / lines.length : 0;
        if (brokenRatio > 0.05 || singleRatio > 0.3) {
          hideLoading();
          showToast("这份 PDF 是竖排或特殊字体，浏览器无法直接解析。请在本机双击「启动-Yomi.bat」用本地转换器处理（在线版只能处理横排 PDF）");
          return;
        }
        pages = r.pages;
        degraded = true;
      }

      let html;
      try {
        html = await buildBilingualHtml(pages, title);
      } catch (err) {
        hideLoading();
        showToast("生成失败：" + err.message);
        return;
      }
      hideLoading();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = title + "_横排注音版.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.open(url, "_blank");
      const size = html.length > 1048576 ? (html.length / 1048576).toFixed(1) + "MB" : Math.round(html.length / 1024) + "KB";
      showToast(degraded
        ? `《${title}》已生成（${size}）· 浏览器解析模式，分段质量略低于本地转换器`
        : `《${title}》双语注音版已生成（${size}），已开始下载并在新标签页打开`);
      return;
    } else {
      showLoading("正在读取文件…", false);
      text = await readTXT(file);
    }
    inputText.value = text.slice(0, MAX_CHARS);
    updateCharCount();
    hideLoading();
    showToast(`已载入 ${file.name}`);
    annotate();
  } catch (err) {
    console.error(err);
    showLoadError("文件读取失败：" + err.message, () => hideLoading());
  }
}

/* ============================================================
   主流程
   ============================================================ */
function updateCharCount() {
  charCount.textContent = inputText.value.length + " 字";
}

async function annotate() {
  const text = inputText.value.trim();
  if (!text) { showToast("先粘贴或上传一点日文吧"); return; }
  if (text.length > MAX_CHARS) showToast(`内容过长，本次处理前 ${MAX_CHARS} 字`);

  try {
    await ensureTokenizer();
  } catch (err) {
    console.error(err);
    showLoadError(
      "词典加载失败：" + err.message +
      "。请双击「启动-Yomi.bat」并从 http://127.0.0.1:8080 打开本页（本地词典无需联网）",
      () => annotate()
    );
    return;
  }

  showLoading("正在标注假名…", true);
  await sleep(30);
  try {
    const t0 = performance.now();
    doc = await buildDocument(text.slice(0, MAX_CHARS), setProgress);
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    hideLoading();
    renderAll();
    showToast(`完成：${doc.stats.chars} 字 / 分 ${doc.pages.length} 页 · 耗时 ${secs}s`);
  } catch (err) {
    console.error(err);
    showLoadError("标注失败：" + err.message, () => annotate());
  }
}

/* ============================================================
   事件绑定
   ============================================================ */
btnAnnotate.addEventListener("click", annotate);

btnClear.addEventListener("click", () => {
  inputText.value = ""; updateCharCount(); inputText.focus();
});

btnFile.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
  fileInput.value = "";
});

["dragover", "dragleave", "drop"].forEach((ev) => {
  inputCard.addEventListener(ev, (e) => {
    e.preventDefault();
    inputCard.classList.toggle("dragover", ev === "dragover");
    if (ev === "drop" && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
});

/* 示例文本（原创短篇） */
const SAMPLE = [
  "山のふもとの小さな町に、名もなき時計店があった。店主の佐伯さんは、毎朝六時に店のシャッターを上げて、古い扇風機の音を聞きながら、壊れた腕時計の修理を続ける。",
  "ある雨の日、少女が飛び込んできた。「この時計、動かないんです。でも、捨てることはできないんです」。彼女の手のひらには、文字盤の欠けた銀色の時計がのっていた。佐伯さんは虫眼鏡をのぞき込みながら、静かに笑った。「壊れたものには、壊れた理由があるさ」。",
  "少女の名前は美咲といった。彼女は祖父の形見であるその時計を、両手で抱えるようにして大事そうに見せてくれた。針は三時四十二分で止まっていた。佐伯さんは受け取った時計を机の上に置き、引き出しから小さなドライバーを取り出した。「一週間ほど預けてくれ。直るかどうか、約束はできないが」。美咲は深深と頭を下げて、雨の中を帰っていった。窓の外では、雨がしとしとと降り続いていて、遠くの山々は薄い霧に沈んでいた。",
].join("\n");

btnSample.addEventListener("click", () => {
  inputText.value = SAMPLE; updateCharCount(); annotate();
});

/* 假名显示模式 */
$("mode-seg").addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-btn");
  if (!btn) return;
  document.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  reader.classList.remove("mode-always", "mode-hover", "mode-off");
  reader.classList.add("mode-" + btn.dataset.mode);
});

/* 字号 */
function applyReaderSize() {
  document.documentElement.style.setProperty("--reader-size", readerSize + "px");
}
$("font-up").addEventListener("click", () => {
  readerSize = Math.min(30, readerSize + 2); applyReaderSize();
});
$("font-down").addEventListener("click", () => {
  readerSize = Math.max(14, readerSize - 2); applyReaderSize();
});

/* 翻页 */
$("pg-prev").addEventListener("click", () => {
  if (pageIndex > 0) { pageIndex--; renderPage(); }
});
$("pg-next").addEventListener("click", () => {
  if (doc && pageIndex < doc.pages.length - 1) { pageIndex++; renderPage(); }
});

/* 复制 / 导出 */
$("btn-copy").addEventListener("click", copyAnnotated);
$("btn-export").addEventListener("click", exportHTML);

inputText.addEventListener("input", updateCharCount);

/* ---------- 心跳：告诉本地服务器"页面还开着" ----------
   所有网页都关闭后收不到心跳，服务器约 5 分钟自动退出。
   非 8080 打开（file:// 或预览面板）时请求静默失败，无副作用。 */
function pingServer() { fetch("heartbeat", { cache: "no-store" }).catch(() => {}); }
pingServer();
setInterval(pingServer, 25000);

/* ---------- 启动 ---------- */
updateCharCount();
