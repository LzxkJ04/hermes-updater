// HermesUpdater 静态交叉校验: i18n 对齐 / data-i18n 覆盖 / id 引用 / 重复 id / IPC 配对 / main t() key
const fs = require("fs");
const path = require("path");
const R = (p) => fs.readFileSync(path.join(__dirname, p), "utf8");
let fail = 0;
const bad = (m) => { console.log("❌ " + m); fail++; };
const ok = (m) => console.log("✅ " + m);

// ---- 1. app.js STR 字典 (zh/en 词条对齐) ----
const appjs = R("renderer/app.js");
function extractDict(src, name) {
  const start = src.indexOf(name + " = {");
  if (start < 0) return null;
  const seg = src.slice(start);
  const m = seg.match(/\n  \},/); // 字典体以 2 空格缩进闭合
  if (!m) return null;
  return seg.slice(0, m.index);
}
const zhSeg = extractDict(appjs, "const STR"), enSeg = extractDict(appjs, "const STR");
const segs = appjs.split("const STR = {");
let zhBody = "", enBody = "";
{
  // STR 含 zh:{...}, en:{...} 两段
  const after = appjs.split("const STR = {")[1] || "";
  const zm = after.indexOf("zh: {"), em = after.indexOf("en: {");
  if (zm >= 0 && em > zm) {
    const zhTxt = after.slice(zm + 5, em);
    const rest = after.slice(em + 5);
    const enTxt = rest.slice(0, rest.indexOf("\n  },"));
    const keys = (t) => [...t.matchAll(/"([^"]+)"\s*:/g)].map((x) => x[1]); // 词条可能多个挤一行, 不能只匹配行首
    const zk = keys(zhTxt), ek = keys(enTxt);
    const zset = new Set(zk), eset = new Set(ek);
    const onlyZ = zk.filter((k) => !eset.has(k)), onlyE = ek.filter((k) => !zset.has(k));
    if (onlyZ.length) bad(`STR 仅 zh 有: ${onlyZ.join(", ")}`);
    if (onlyE.length) bad(`STR 仅 en 有: ${onlyE.join(", ")}`);
    if (!onlyZ.length && !onlyE.length) ok(`STR 词条对齐: zh=${zk.length} en=${ek.length}`);
    global.__strKeys = zset;
  } else bad("STR 字典结构异常 (未找到 zh:/en: 段)");
}

// ---- 2. data-i18n key 必须在 STR 中 ----
const html = R("renderer/index.html");
const i18nAttrs = [...html.matchAll(/data-i18n(?:-ph|-title)?="([^"]+)"/g)].map((x) => x[1]);
const missing = i18nAttrs.filter((k) => !global.__strKeys.has(k));
if (missing.length) bad(`HTML data-i18n 缺词条: ${[...new Set(missing)].join(", ")}`);
else ok(`HTML data-i18n 全覆盖: ${new Set(i18nAttrs).size} key`);

// ---- 3. app.js 引用的 #id 必须存在于 HTML ----
const htmlIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map((x) => x[1]));
const usedIds = [...appjs.matchAll(/\$\("#([a-zA-Z][\w-]*)"\)/g)].map((x) => x[1]);
const ghost = [...new Set(usedIds.filter((i) => !htmlIds.has(i)))];
if (ghost.length) bad(`app.js 引用不存在 id: ${ghost.join(", ")}`);
else ok(`id 引用检查: ${new Set(usedIds).size} 个均存在`);

// ---- 4. 重复 id ----
const allIds = [...html.matchAll(/id="([^"]+)"/g)].map((x) => x[1]);
const dup = allIds.filter((v, i) => allIds.indexOf(v) !== i);
if (dup.length) bad(`重复 id: ${[...new Set(dup)].join(", ")}`);
else ok(`无重复 id: ${allIds.length} 个`);

// ---- 5. IPC 通道: main handle ↔ preload invoke 配对; main send ↔ preload on 配对 ----
const mainjs = R("main.js"), preload = R("preload.js");
const mainCh = new Set([...mainjs.matchAll(/ipcMain\.handle\("([^"]+)"/g)].map((x) => x[1]));
const invCh = new Set([...preload.matchAll(/ipcRenderer\.invoke\("([^"]+)"/g)].map((x) => x[1]));
const onCh = new Set([...preload.matchAll(/ipcRenderer\.on\("([^"]+)"/g)].map((x) => x[1]));
const sendCh = new Set([...mainjs.matchAll(/send\("([^"]+)"/g)].map((x) => x[1])); // webContents.send / 本地 send 助手
const invMiss = [...invCh].filter((c) => !mainCh.has(c));
const onMiss = [...onCh].filter((c) => !sendCh.has(c));
const handleMiss = [...mainCh].filter((c) => !invCh.has(c));
if (invMiss.length) bad(`preload invoke 无对应 handle: ${invMiss.join(", ")}`);
if (onMiss.length) bad(`preload on 无对应 send: ${onMiss.join(", ")}`);
if (handleMiss.length) bad(`main handle 未暴露给 preload: ${handleMiss.join(", ")}`);
if (!invMiss.length && !onMiss.length && !handleMiss.length) ok(`IPC 配对: handle ${mainCh.size}/${mainCh.size} + 事件 ${onCh.size}/${onCh.size}`);

// ---- 6. main.js t("...") key 必须在 I18N.zh (排除 notifyEvent() 误匹配) ----
const i18nZh = mainjs.split("const I18N = {")[1].split("zh: {")[1].split("\n  },")[0];
const zhKeys = new Set([...i18nZh.matchAll(/"([^"]+)"\s*:/g)].map((x) => x[1]));
const tCalls = [...mainjs.matchAll(/(?<![a-zA-Z.$])t\("([^"]+)"/g)].map((x) => x[1]);
const missT = [...new Set(tCalls.filter((k) => !zhKeys.has(k)))];
if (missT.length) bad(`main t() 缺 zh 词条: ${missT.join(", ")}`);
else ok(`main t() 词条: ${new Set(tCalls).size} 个全覆盖`);

// ---- 7. 已删功能残留引用 (快捷键) ----
const ghosts = ["btn-keys", "keys-dialog", "keys-list", "btn-save-settings"];
const found = ghosts.filter((g) => html.includes(g) || appjs.includes(g));
if (found.length) bad(`已删功能残留: ${found.join(", ")}`);
else ok("无已删功能残留引用");

console.log(fail ? `\n共 ${fail} 项失败` : "\n全部通过 ✔");
process.exit(fail ? 1 : 0);
