// 离线自测: 系统环境检测与安装 (se_*) —— mock electron + 重定向 USERPROFILE 到临时目录
// 用法: HU_SELFTEST=1 node selftest_se.js
const Module = require("module");
const os = require("os");
const fs = require("fs");
const path = require("path");

const TMPH = path.join(os.tmpdir(), "hermes-se-selftest-" + Date.now());
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
    if (p === "clipboard") return { writeText: (s) => { clip = String(s); }, readText: () => clip };
    if (typeof p === "symbol") return undefined;
    return stub("electron." + String(p));
  },
});
const origLoad = Module._load;
Module._load = function (req) { if (req === "electron") return electronMock; return origLoad.apply(this, arguments); };

process.env.HU_SELFTEST = "1";
const M = require("./main.js");
const S = M.S;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  PASS  " + m); } else { fail++; console.log("  FAIL  " + m); } };

(async () => {
  console.log("沙箱家目录 =", TMPH);

  console.log("\n[1] 待安装包清单 (SE_PKGS)");
  const wantPkgs = ["node", "git", "python", "pwsh", "vsbt", "vscommunity", "winsdk", "dotnet", "sevenzip", "winget", "choco", "scoop", "curl"];
  ok(wantPkgs.every((k) => M.SE_PKGS[k]), `包含全部待安装项 (缺 ${wantPkgs.filter((k) => !M.SE_PKGS[k]).join(",") || "无"})`);
  const noUrl = Object.keys(M.SE_PKGS).filter((k) => !M.SE_PKGS[k].url);
  ok(noUrl.length === 0, `每项都有官网兜底: ${noUrl.join(",") || "全部有"}`);
  ok(M.SE_MGRS.join(",") === "winget,choco,scoop", `包管理器顺序 = ${M.SE_MGRS.join(",")}`);

  console.log("\n[2] 安装命令拼装");
  ok(M.seInstallCmd("node", "winget").includes("winget install --id OpenJS.NodeJS.LTS"), "winget 装 node");
  ok(M.seInstallCmd("node", "choco") === "choco install nodejs-lts -y", `choco 装 node = ${M.seInstallCmd("node", "choco")}`);
  ok(M.seInstallCmd("node", "scoop") === "scoop install nodejs-lts", `scoop 装 node = ${M.seInstallCmd("node", "scoop")}`);
  const wv = M.seInstallCmd("vsbt", "winget");
  ok(wv.includes("Microsoft.VisualStudio.2022.BuildTools") && wv.includes("Workload.VCTools") && wv.includes("--includeRecommended"), "winget 装 VS 生成工具带 C++ 工作负载");
  ok(M.seInstallCmd("vsbt", "scoop") === "", "scoop 无 VS 生成工具包 -> 空");
  ok(M.seInstallCmd("choco", "winget") === "", "winget 无法安装自身 -> 空");
  ok(M.seInstallCmd("nope", "winget") === "", "未知 key -> 空");
  const txt = M.seInstallCmdText(["node", "node", "git", "choco"], "winget");
  ok(txt.cmds.length === 2, `去重后命令数 = ${txt.cmds.length} (期望 2)`);
  ok(txt.text.includes(" && "), "多命令用 && 串接");
  ok(txt.unsupported.length === 1 && txt.unsupported[0] === "Chocolatey", `不支持的项单独列出 = ${txt.unsupported.join(",")}`);

  console.log("\n[3] 检测项定义完整性");
  const r = M.seCheckAll(false);
  ok(r && r.ok === true, "seCheckAll 返回 ok");
  ok(Array.isArray(r.items) && r.items.length >= 20, `检测项数 = ${r.items.length} (期望 >=20)`);
  const badShape = r.items.filter((i) => !i.key || !i.label || !i.level || typeof i.ok !== "boolean" || !i.detail);
  ok(badShape.length === 0, `每项字段齐全: ${badShape.map((i) => i.key).join(",") || "全部正常"}`);
  const keys = r.items.map((i) => i.key);
  const missingOrder = M.SE_ORDER.filter((k) => !keys.includes(k));
  ok(missingOrder.length === 0, `SE_ORDER 覆盖全部实测项: 缺 ${missingOrder.join(",") || "无"}`);
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  ok(dupes.length === 0, `无重复检测项: ${dupes.join(",") || "无"}`);
  const lv = new Set(r.items.map((i) => i.level));
  ok([...lv].every((x) => ["info", "opt", "warn", "block"].includes(x)), `等级取值合法 = ${[...lv].join(",")}`);
  ok(r.items.filter((i) => i.level === "block").length >= 3, `必需项 >=3 个 (实际 ${r.items.filter((i) => i.level === "block").length})`);

  console.log("\n[4] 真实机器探测 (只读, 不做任何安装)");
  const d = M.seDetect(true);
  ok(!!d.os.name && /Windows/.test(d.os.name), `系统 = ${d.os.name} ${d.os.release} ${d.os.arch}`);
  ok(d.os.build > 0, `Windows 构建号 = ${d.os.build}`);
  ok(typeof d.admin === "boolean", `管理员权限 = ${d.admin}`);
  ok(typeof d.devmode === "boolean", `开发者模式 = ${d.devmode}`);
  ok(typeof d.longpath === "boolean", `长路径支持 = ${d.longpath}`);
  ok(d.disk.ok ? d.disk.freeGB > 0 : true, `磁盘 = ${d.disk.root} 可用 ${d.disk.freeGB.toFixed(1)}GB / 共 ${d.disk.totalGB.toFixed(0)}GB`);
  ok(d.ramGB > 0, `内存 = ${d.ramGB.toFixed(1)} GB`);
  ok(d.node.found, `Node.js = ${d.node.version} @ ${d.node.path}`);
  ok(typeof d.git.found === "boolean", `Git = ${d.git.found ? d.git.version : "未装(未报错)"}`);
  ok(typeof d.vs.found === "boolean", `VS = ${d.vs.found ? d.vs.path + " " + d.vs.version : "未装"}`);
  ok(typeof d.vcOk === "boolean", `C++ 工具链 = ${d.vcOk}`);
  ok(!!d.mgr || Object.values(d.pkgmgr).every((x) => !x), `包管理器 = ${d.mgr || "(无)"} / winget:${d.pkgmgr.winget} choco:${d.pkgmgr.choco} scoop:${d.pkgmgr.scoop}`);
  ok(r.verdict.length > 0 && r.env.length > 0, `结论 = ${r.verdict}`);
  ok(r.env.includes("Node"), `环境摘要 = ${r.env}`);
  console.log(`  ---- 体检明细 ----`);
  for (const i of r.items) console.log(`  ${i.ok ? "OK " : "BAD"} [${i.level.padEnd(5)}] ${i.label}: ${i.detail}`);

  console.log("\n[5] 体检报告文本");
  const rep = M.seReportText();
  ok(rep.includes("HermesUpdater 系统环境体检报告"), "报告含标题");
  ok(rep.includes("结论:") && rep.includes("概要:"), "报告含结论与概要");
  ok(rep.split("\r\n").filter((l) => /^\[(OK|BAD)/.test(l)).length === r.items.length, "报告逐项列出");
  ok(rep.includes("报告结束"), "报告含结束标记");

  console.log("\n[6] 忽略清单 / 严格度");
  S.se_skip = "sevenzip,curl,tar";
  const r2 = M.seCheckAll(false);
  ok(!r2.items.some((i) => ["sevenzip", "curl", "tar"].includes(i.key)), "忽略清单生效");
  S.se_skip = "";
  S.se_level = "block";
  const r3 = M.seCheckAll(false);
  ok(typeof r3.ready === "boolean", `严格度 block -> ready=${r3.ready}, 阻断项=${r3.blockers.join("、") || "无"}`);
  S.se_level = "all";
  const r4 = M.seCheckAll(false);
  ok(r4.blockers.length >= r3.blockers.length, `all 比 block 更严格 (${r4.blockers.length} >= ${r3.blockers.length})`);
  S.se_level = "warn";

  console.log("\n[7] 文案占位符与中英对齐");
  S.language = "zh"; ok(M.t("se.disk.val", "12.3", "500", "5").includes("12.3"), "se.disk.val {0} 占位符替换");
  S.language = "zh"; ok(M.t("se.bad", "X").includes("X"), "se.bad {0} 占位符替换");
  S.language = "en"; ok(M.t("se.bad", "X").includes("X"), "英文模板同样替换");
  S.language = "zh";
  const zhKeys = Object.keys(M.I18N.zh).filter((k) => k.startsWith("se."));
  const enKeys = Object.keys(M.I18N.en).filter((k) => k.startsWith("se."));
  ok(zhKeys.length === enKeys.length, `se.* 中英数量一致 = ${zhKeys.length}/${enKeys.length}`);
  const missEn = zhKeys.filter((k) => !(k in M.I18N.en));
  ok(missEn.length === 0, `英文无缺键: ${missEn.join(",") || "无"}`);

  console.log("\n[8] 只复制模式 (不真的执行安装)");
  S.se_copy_only = true;
  const ins = M.seInstallKeys(["node"], "winget");
  ok(ins.ok && ins.copied && clip.includes("OpenJS.NodeJS.LTS"), "只复制模式写入剪贴板且不执行");
  const ins2 = M.seInstallKeys([], "winget");
  ok(ins2.ok === false, "空列表 -> 失败返回");
  const ins3 = M.seInstallKeys(["choco"], "winget");
  ok(ins3.ok === false && ins3.msg === "unsupported", "无可用包 -> unsupported");
  S.se_copy_only = false;

  console.log("\n[9] 提权修复项 (elevated=false -> 只复制命令, 不弹 UAC)");
  const f1 = await M.seApplyFix("devmode", false);
  ok(f1.ok && f1.copied && /AllowDevelopmentWithoutDevLicense/.test(clip), "开发者模式修复命令正确");
  const f2 = await M.seApplyFix("longpath", false);
  ok(f2.ok && f2.copied && /LongPathsEnabled/.test(clip) && /core\.longpaths true/.test(clip), "长路径修复命令含注册表 + git 两项");
  const f3 = await M.seApplyFix("unknown", false);
  ok(f3.ok === false && f3.msg === "unknown-fix", "未知修复项 -> 失败返回");
  const o1 = M.seOpenUrl("nope");
  ok(o1.ok === false && o1.msg === "no-url", "未知官网项 -> 失败返回");
  const o2 = M.seOpenUrl("vsbt");
  ok(o2.ok === true && /visualstudio\.microsoft\.com/.test(o2.url), `VS 官网地址 = ${o2.url}`);

  console.log(`\n===== 结果: ${pass} 通过 / ${fail} 失败 =====`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("自测异常:", e); process.exit(2); });
