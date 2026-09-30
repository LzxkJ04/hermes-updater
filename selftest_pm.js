// 离线自测: 安装包镜像源检测 (pm_*) —— 本地起一个"假镜像站"HTTP 服务, 完整验证目录解析/下探/选站/直链
// 用法: HU_SELFTEST=1 node selftest_pm.js
const Module = require("module");
const os = require("os");
const fs = require("fs");
const path = require("path");
const http = require("http");

const TMPH = path.join(os.tmpdir(), "hermes-pm-selftest-" + Date.now());
fs.mkdirSync(TMPH, { recursive: true });
process.env.USERPROFILE = TMPH;
process.env.HOME = TMPH;

function stub(name) {
  const f = function () { return stub(name + "()"); };
  return new Proxy(f, {
    get(t, p) { if (typeof p === "symbol" || p === "then") return undefined; return stub(name + "." + String(p)); },
    set() { return true; }, apply() { return stub(name + "()"); }, construct() { return stub("new " + name); },
  });
}
const appMock = new Proxy({}, {
  get(_, p) {
    if (p === "whenReady") return () => new Promise(() => {});
    if (p === "getVersion") return () => "2.30.0";
    if (p === "getPath") return (n) => path.join(TMPH, String(n));
    if (p === "setAppUserModelId" || p === "on" || p === "quit") return () => {};
    if (typeof p === "symbol") return undefined;
    return stub("app." + String(p));
  }, set() { return true; },
});
let clip = "";
const electronMock = new Proxy({}, {
  get(_, p) {
    if (p === "app") return appMock;
    if (p === "clipboard") return { writeText: (x) => { clip = String(x); }, readText: () => clip };
    if (typeof p === "symbol") return undefined;
    return stub("electron." + String(p));
  },
});
const origLoad = Module._load;
Module._load = function (req) { if (req === "electron") return electronMock; return origLoad.apply(this, arguments); };

// ---------------- 假镜像站 ----------------
const idx = (...items) => `<!DOCTYPE html><html><head><title>Index of /</title></head><body><h1>Index of /</h1><hr><pre>`
  + items.map((i) => `<a href="${i}">${i}</a>`).join("\n") + `</pre><hr></body></html>`;
const apacheIdx = (...items) => `<html><body><table>` + items.map((i) => `<tr><td><a href="${i}">${i}</a></td></tr>`).join("") + `</table></body></html>`;
const jsonIdx = (arr) => JSON.stringify({ children: arr.map((n) => ({ name: n })) });

const ROUTES = {
  // 站 A: 版本子目录形态 (npmmirror/huawei 常见) —— node 需要下探一层
  "/a/node/": { body: idx("v20.19.0/", "v22.11.0/", "v22.12.0/", "index.json") },
  "/a/node/v22.12.0/": { body: idx("node-v22.12.0-x64.msi", "node-v22.12.0-x64.zip", "SHASUMS256.txt") },
  "/a/node/v22.11.0/": { body: idx("node-v22.11.0-x64.msi") },
  "/a/python/": { body: apacheIdx("python-3.12.7-amd64.exe", "python-3.11.9-amd64.exe", "python-3.13.0-embed-amd64.zip") },
  "/a/git-for-windows/": { code: 404 },
  "/a/sevenzip/": { code: 403 },
  "/a/nginx/windows/": { body: idx("nginx-1.27.2.zip", "nginx-1.26.2.zip") },
  "/d/nodejs-release/": { hang: true },
  "/d/node/": { hang: true },
  "/d/nodejs/": { hang: true },
  "/a/cmake/": { body: jsonIdx(["cmake-3.31.0-windows-x86_64.msi", "cmake-3.30.5-windows-x86_64.zip"]) },
  // 站 B: 扁平形态, 但慢
  "/b/nodejs-release/": { body: idx("node-v20.19.0-x64.msi", "node-v22.11.0-x64.msi") },
  "/b/python/": { code: 404 },
  "/b/git-for-windows/": { body: idx("Git-2.47.1-64-bit.exe", "Git-2.46.2-64-bit.exe") },
  // 站 C: 只有目录没有目标文件 (模拟"有目录无文件"的三态)
  "/c/node/": { body: idx("README.md", "LICENSE") },
  "/c/python/": { body: idx("README.md") },
  // 站 D: 连接直接拒绝 (真故障 -> fail)
  "/d/": { hang: true },
};

const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]);
  const r = ROUTES[u] || ROUTES[u.replace(/\/index\.html$/, "/")];
  if (r && r.hang) return; // 不响应 -> 超时
  if (!r) { res.writeHead(404, { "Content-Type": "text/html" }); return res.end("<h1>404</h1>"); }
  if (r.code && r.code !== 200) { res.writeHead(r.code, { "Content-Type": "text/html" }); return res.end("err"); }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(r.body || "");
});

process.env.HU_SELFTEST = "1";
const M = require("./main.js");
const S = M.S;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  PASS  " + m); } else { fail++; console.log("  FAIL  " + m); } };

(async () => {
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const PORT = srv.address().port;
  const base = `http://127.0.0.1:${PORT}`;
  console.log("假镜像站 =", base);

  // 把 11 个真实站点重定向到本地假站 (不碰公网)
  const remap = { npmmirror: "/a/", huawei: "/b/", tuna: "/c/", aliyun: "/d/", ustc: "/a/", nju: "/b/", bfsu: "/c/", sjtug: "/d/", zju: "/a/", tencent: "/b/", netease: "/c/" };
  for (const [k, p] of Object.entries(remap)) M.PM_SITES[k].root = base + p;
  S.pm_depth = 2; S.pm_timeout = 6; S.pm_retry = 0; S.pm_conc = 6; S.pm_skip_sites = "";
  S.pm_prefer = {}; S.pm_best = {}; S.pm_last_sum = {};
  S.pm_copy_only = true; S.pm_dl_dir = path.join(TMPH, "dl");

  console.log("\n[1] 目录页解析 (三种真实格式)");
  const p1 = M.pmParseIndex(idx("v1.0.0/", "file.zip", "https://x/y", "mailto:a@b", "../", "?C=N"));
  ok(p1.includes("v1.0.0") && p1.includes("file.zip"), `nginx autoindex -> ${JSON.stringify(p1.slice(0, 4))}`);
  ok(!p1.some((x) => /^https?:/.test(x) || x.startsWith("mailto")) && !p1.includes(".."), "过滤绝对 URL / mailto / 上级目录 / 查询串");
  const p2 = M.pmParseIndex(apacheIdx("Git-2.47.1-64-bit.exe", "sub/"));
  ok(p2.length === 2 && p2[0] === "Git-2.47.1-64-bit.exe", `apache autoindex -> ${JSON.stringify(p2)}`);
  const p3 = M.pmParseIndex(jsonIdx(["cmake-3.31.0-windows-x86_64.msi"]));
  ok(p3.length === 1 && p3[0].startsWith("cmake-"), `JSON children -> ${JSON.stringify(p3)}`);
  ok(M.pmParseIndex("").length === 0 && M.pmParseIndex("<html></html>").length === 0, "空/无链接页面 -> 空数组");

  console.log("\n[2] 版本号自然序比较");
  const vs = ["node-v9.0.0-x64.msi", "node-v22.12.0-x64.msi", "node-v22.9.0-x64.msi", "node-v100.1.0-x64.msi"].sort(M.pmVerCmp);
  ok(vs[3] === "node-v100.1.0-x64.msi" && vs[2] === "node-v22.12.0-x64.msi" && vs[1] === "node-v22.9.0-x64.msi", `自然序 -> ${JSON.stringify(vs)}`);
  ok(M.pmVerCmp("Git-2.47.1.2-64-bit.exe", "Git-2.47.1-64-bit.exe") > 0, "Git 2.47.1.2 > 2.47.1");
  ok(M.pmVKey("v22.11.0").join(".") === "22.11.0", `pmVKey -> ${M.pmVKey("v22.11.0").join(".")}`);

  console.log("\n[3] 单包单站探测: 三层形态全覆盖");
  const rNode = await M.pmProbeOne("node", "npmmirror", 6000);
  ok(rNode.state === "ok" && rNode.best === "node-v22.12.0-x64.msi", `版本子目录下探 depth=${rNode.depth} best=${rNode.best}`);
  ok(rNode.url === base + "/a/node/v22.12.0/node-v22.12.0-x64.msi", `直链拼接 -> ${rNode.url}`);
  const rNodeN = await M.pmProbeOne("node", "ustc", 6000);
  ok(rNodeN.state === "ok" && rNodeN.best === "node-v22.12.0-x64.msi", `版本子目录取最新 = ${rNodeN.best}`);
  const rNodeB = await M.pmProbeOne("node", "huawei", 6000);
  ok(rNodeB.state === "ok" && rNodeB.best === "node-v22.11.0-x64.msi", `扁平目录 -> ${rNodeB.best}`);
  const rPy = await M.pmProbeOne("python", "npmmirror", 6000);
  ok(rPy.state === "ok" && rPy.best === "python-3.12.7-amd64.exe", `apache 目录取最新 -> ${rPy.best}`);
  const rGit = await M.pmProbeOne("git", "npmmirror", 6000);
  ok(rGit.state === "na", `404 目录 -> state=na (不是 fail) = ${rGit.state}`);
  const r7z = await M.pmProbeOne("sevenzip", "npmmirror", 6000);
  ok(r7z.state === "na", `403 目录 -> state=na = ${r7z.state}`);
  const rNginx = await M.pmProbeOne("nginx", "npmmirror", 6000);
  ok(rNginx.state === "ok" && rNginx.best === "nginx-1.27.2.zip", `nginx/windows/ 扁平 -> ${rNginx.best}`);
  const rCmake = await M.pmProbeOne("cmake", "npmmirror", 6000);
  ok(rCmake.state === "ok" && rCmake.best === "cmake-3.31.0-windows-x86_64.msi", `JSON 目录 -> ${rCmake.best}`);
  const rDirOnly = await M.pmProbeOne("node", "tuna", 6000);
  ok(rDirOnly.state === "ok" && !rDirOnly.best, `有目录无目标文件 -> state=ok 但 best 空 (${rDirOnly.state}/${rDirOnly.best || "-"})`);
  const rFail = await M.pmProbeOne("node", "aliyun", 3000);
  ok(rFail.state === "fail", `不响应的站 -> state=fail = ${rFail.state}`);

  console.log("\n[4] 全量探测 + 自动选最快站 + 结果落盘");
  const res = await M.pmProbeAll(null, { scope: "core", sites: ["npmmirror", "huawei", "tuna", "aliyun"] });
  ok(res.rows.length === 4 * 4, `组合数 = ${res.rows.length} (4 包 × 4 站)`);
  const b = res.best;
  ok(b.node && b.node.site, `node 选到站 = ${b.node && b.node.siteLabel} (${b.node && b.node.ms}ms)`);
  const okRows = res.rows.filter((r) => r.pkg === "node" && r.state === "ok" && r.best).sort((a, c) => a.ms - c.ms);
  ok(okRows.length > 0 && b.node.site === okRows[0].site, `自动选最快站 = ${b.node.site} (候选 ${okRows.map((r) => r.site + r.ms).join("/")})`);
  ok(/^node-v\d+\.\d+\.\d+-x64\.msi$/.test(b.node.best), `node 直链文件名合法 = ${b.node.best}`);
  ok(b.python && b.python.site === "npmmirror", `python 只 npmmirror 有 -> ${b.python && b.python.site}`);
  ok(b.git && b.git.site === "huawei", `git 只有华为有 -> ${b.git && b.git.site}`);
  ok(b.sevenzip && b.sevenzip.site === "" && b.sevenzip.na, `7-Zip 全站无收录 -> na 并回退官网 = ${b.sevenzip && (b.sevenzip.na + " " + (b.sevenzip.official || "").slice(0, 30))}`);
  ok(!!S.pm_best.node && S.pm_last_sum.jobs === 16, "结果写入 S.pm_best / S.pm_last_sum");
  ok((b.node.alt || []).length >= 1, `备选站记录 = ${(b.node.alt || []).map((x) => x.site).join(",") || "无"}`);

  console.log("\n[5] 手动 pin 站点优先");
  const pin = M.pmPinSite("node", "zju");
  ok(pin.ok && S.pm_prefer.node === "zju", "pin 写入设置");
  await M.pmProbeAll(null, { scope: "core", pkgs: ["node"], sites: ["npmmirror", "zju"] });
  ok(S.pm_best.node.site === "zju", `pin 生效 -> 选中 ${S.pm_best.node.site}`);
  M.pmPinSite("node", "");
  ok(!S.pm_prefer.node, "取消 pin");

  console.log("\n[6] 直链 / 下载命令 / 报告");
  await M.pmProbeAll(null, { scope: "core", sites: ["npmmirror", "huawei"] });
  const cmd = M.pmDownloadCmd("node");
  ok(cmd.startsWith("curl -L --retry 3 -C -") && /\.msi"/.test(cmd), `curl 下载命令 -> ${cmd.slice(0, 120)}…`);
  ok(cmd.includes(path.join(TMPH, "dl")), "下载目录取自设置");
  S.pm_dl_tool = "powershell";
  ok(M.pmDownloadCmd("node").startsWith("powershell -NoProfile"), "PowerShell 下载命令");
  S.pm_dl_tool = "aria2";
  ok(M.pmDownloadCmd("node").startsWith("aria2c -c -x8"), "aria2 下载命令");
  S.pm_dl_tool = "curl";
  const dl = M.pmDownload("node");
  ok(dl.ok && dl.copied && clip.startsWith("curl -L") && clip.includes(".msi"), "只复制模式: 写入剪贴板且不下载");
  const pkgList = M.pmPkgList();
  ok(pkgList.length === Object.keys(M.PM_PKGS).length, `包清单 = ${pkgList.length} 个`);
  ok(pkgList.every((p) => p.key && p.label && p.official && Array.isArray(p.alt)), "包清单字段齐全");
  const rep = M.pmReportText();
  ok(rep.includes("HermesUpdater 安装包镜像源报告") && rep.includes("报告结束"), "报告头尾");
  ok(rep.split("\r\n").filter((l) => l.startsWith("[")).length === pkgList.length, "报告逐包列出");
  ok(M.pmSiteList().length === 11, `站点清单 = ${M.pmSiteList().length}`);

  console.log("\n[7] 跳过站点 / 站点黑名单");
  S.pm_skip_sites = "tuna,bfsu,netease";
  const res2 = await M.pmProbeAll(null, { scope: "core", pkgs: ["node"] });
  ok(!res2.rows.some((r) => ["tuna", "bfsu", "netease"].includes(r.site)), `黑名单生效 (探测 ${res2.rows.length} 组)`);
  S.pm_skip_sites = "";

  console.log("\n[8] 包管理器换源命令");
  const mgr = M.pmMgrSourceCmds();
  ok(mgr.list.length >= 6 && mgr.list.every((x) => x.mgr && x.cmd), `换源命令 ${mgr.list.length} 条`);
  ok(mgr.list.some((x) => x.cmd.includes("chocolatey")), "含 Chocolatey 阿里云镜像");
  ok(typeof mgr.installed === "object", `本机包管理器 = ${JSON.stringify(mgr.installed)}`);
  S.pm_copy_only = true;
  const ap = M.pmMgrApply(["choco"]);
  ok(ap.ok && ap.copied && /choco source add/.test(clip), "换源命令可复制执行");

  console.log("\n[9] pm 文案中英对齐");
  const zh = Object.keys(M.I18N.zh).filter((k) => k.startsWith("pm."));
  const en = Object.keys(M.I18N.en).filter((k) => k.startsWith("pm."));
  ok(zh.length === en.length && zh.length >= 7, `pm.* 中英一致 = ${zh.length}/${en.length}`);
  S.language = "zh";
  ok(M.t("pm.probe.head", 4, 4, 16, 8).includes("16"), "pm.probe.head 占位符");

  srv.close();
  console.log(`\n===== 结果: ${pass} 通过 / ${fail} 失败 =====`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("自测异常:", e); process.exit(2); });
