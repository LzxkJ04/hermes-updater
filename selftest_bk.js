// 离线功能自测: 用 mock 顶掉 electron, 直接 require main.js 跑备份/恢复引擎
// 用法: HU_SELFTEST=1 node selftest_bk.js   (跑完自删临时目录)
const Module = require("module");
const os = require("os");
const fs = require("fs");
const path = require("path");

// ---- electron mock ----
function stub(name) {
  const f = function () { return stub(name + "()"); };
  return new Proxy(f, {
    get(t, p) {
      if (typeof p === "symbol") return undefined;
      if (p === "then") return undefined;
      return stub(name + "." + String(p));
    },
    set() { return true; },
    apply() { return stub(name + "()"); },
    construct() { return stub("new " + name); },
  });
}
const appMock = new Proxy({}, {
  get(_, p) {
    if (p === "whenReady") return () => new Promise(() => {}); // 永不 resolve: 不启动窗口/托盘/定时器
    if (p === "getVersion") return () => "2.27.0";
    if (p === "getPath") return (n) => path.join(os.homedir(), n === "documents" ? "Documents" : String(n));
    if (p === "setAppUserModelId" || p === "on" || p === "quit" || p === "exit") return () => {};
    if (p === "requestSingleInstanceLock") return () => false;
    if (typeof p === "symbol") return undefined;
    return stub("app." + String(p));
  },
  set() { return true; },
});
const electronMock = new Proxy({}, {
  get(_, p) {
    if (p === "app") return appMock;
    if (typeof p === "symbol") return undefined;
    return stub("electron." + String(p));
  },
});
const origLoad = Module._load;
Module._load = function (req, parent, isMain) {
  if (req === "electron") return electronMock;
  return origLoad.apply(this, arguments);
};

process.env.HU_SELFTEST = "1";
const M = require("./main.js");

// ---- 测试环境 ----
const TMP = path.join(os.tmpdir(), "hermes-bk-selftest-" + Date.now());
const BKD = path.join(TMP, "bk");
const FAKE = path.join(TMP, "install");
fs.mkdirSync(BKD, { recursive: true });
fs.mkdirSync(FAKE, { recursive: true });

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  PASS  " + m); } else { fail++; console.log("  FAIL  " + m); } };

(async () => {
  console.log("install() =", M.install());
  console.log("bk dir    =", BKD);

  // 关闭会影响真实环境的行为
  M.S.bk_dir = BKD;
  M.S.bk_stop_proc = false;   // 测试期间绝不杀进程
  M.S.bk_notify = false;
  M.S.bk_open_after = false;

  // 1) 范围清单
  console.log("\n[1] 备份范围清单");
  const map = M.bkMap();
  const keys = Object.keys(map);
  ok(keys.length === M.BK_SCOPE_KEYS.length, `范围数 = ${keys.length} (期望 ${M.BK_SCOPE_KEYS.length})`);
  const missing = M.BK_SCOPE_KEYS.filter((k) => !map[k]);
  ok(missing.length === 0, `所有 key 都有映射${missing.length ? " 缺: " + missing : ""}`);
  for (const k of ["config", "env", "auth", "sessions", "skills", "plugins", "state", "logs"]) {
    const hit = (map[k] || []).filter((c) => fs.existsSync(c.src));
    ok(hit.length > 0, `范围 ${k} 命中真实文件: ${hit.map((h) => h.rel).join(", ") || "(无)"}`);
  }

  // 2) 小范围备份
  console.log("\n[2] 小范围备份 (config/env/auth)");
  const r1 = await M.bkBackupNow("selftest-small", ["config", "env", "auth"]);
  ok(!!r1.ok, "备份成功: " + (r1.name || r1.msg));
  ok((r1.items || []).length >= 3, `收录项数 = ${(r1.items || []).length}: ${(r1.items || []).join(", ")}`);
  const p1 = path.join(BKD, r1.name);
  ok(fs.existsSync(p1), "产物存在: " + path.basename(p1) + " (名字与磁盘一致)");

  // 3) 列表
  console.log("\n[3] 备份列表");
  const l1 = M.bkList();
  ok(l1.length === 1, `列表条数 = ${l1.length}`);
  ok(l1[0] && l1[0].items && l1[0].items.length >= 3, "列表条目带 items");
  ok(l1[0] && !!l1[0].sizeMB === true, `体积字段 = ${l1[0] && l1[0].sizeMB} MB`);

  // 4) 大范围备份 (会话/技能/插件/数据库/日志)
  console.log("\n[4] 大范围备份 (sessions/skills/plugins/state/logs...)");
  const big = ["sessions", "skills", "plugins", "state", "projects", "kanban", "shared", "cron", "pets", "logs"];
  const r2 = await M.bkBackupNow("selftest-big", big);
  ok(!!r2.ok, "备份成功: " + (r2.name || r2.msg));
  ok((r2.items || []).length >= 5, `收录项数 = ${(r2.items || []).length}`);
  ok(r2.sizeMB > 0, `体积 = ${r2.sizeMB} MB`);

  // 5) 排除规则
  console.log("\n[5] 排除规则 (*.log)");
  M.S.bk_exclude = "logs/*.log";
  const r3 = await M.bkBackupNow("selftest-exclude", ["logs"]);
  M.S.bk_exclude = "";
  ok(!!r3.ok || /无可备份内容/.test(r3.msg || ""), "排除规则生效 (结果: " + (r3.ok ? "ok" : r3.msg) + ")");

  // 6) 恢复到假安装目录
  console.log("\n[6] 恢复到临时安装目录");
  const realInstall = M.S.install_path;
  M.S.install_path = FAKE;
  M.S.bk_restore_scope = []; // 不过滤范围, 整份还原
  const rr = await M.bkRestore(r1.name);
  M.S.install_path = realInstall;
  ok(!!rr.ok, "恢复成功: " + (rr.msg || ""));
  console.log("       restore =", JSON.stringify({ copied: rr.copied, skipped: rr.skipped, pre: rr.preBackup }));
  const walk = (d, base) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name), base + e.name + "/") : [base + e.name]).slice(0, 12) : [];
  console.log("       FAKE 内容 =", walk(FAKE, "").join(", ") || "(空)");
  const restored = ["config.yaml", ".env", "auth.json"].filter((f) => fs.existsSync(path.join(FAKE, f)));
  ok(restored.length === 3, `落盘文件 = ${restored.join(", ") || "(无)"}`);

  // 6b) 恢复大份 zip (含 sessions/skills 等嵌套目录)
  console.log("\n[6b] 恢复大份 zip (嵌套目录)");
  M.S.install_path = FAKE;
  const rb2 = await M.bkRestore(r2.name);
  M.S.install_path = realInstall;
  ok(!!rb2.ok, "恢复成功: " + (rb2.msg || ""));
  const want = ["sessions", "skills", "plugins", "state.db", "projects.db", "logs"];
  const got = want.filter((f) => fs.existsSync(path.join(FAKE, f)));
  ok(got.length === want.length, `嵌套内容落盘 = ${got.join(", ")} (缺: ${want.filter((w) => !got.includes(w)).join(",") || "无"})`);
  ok(rb2.copied >= 10, `还原项数 = ${rb2.copied}`);

  // 6c) 恢复范围过滤
  console.log("\n[6c] 恢复范围过滤 (只还原 sessions)");
  const FAKE2 = path.join(TMP, "install2");
  fs.mkdirSync(FAKE2, { recursive: true });
  M.S.install_path = FAKE2;
  M.S.bk_restore_scope = ["sessions"];
  const rs = await M.bkRestore(r2.name);
  M.S.bk_restore_scope = [];
  M.S.install_path = realInstall;
  ok(!!rs.ok, "恢复成功: " + (rs.msg || ""));
  const w2 = walk(FAKE2, "");
  ok(fs.existsSync(path.join(FAKE2, "sessions")) && !fs.existsSync(path.join(FAKE2, "skills")),
    `只还原 sessions: ${w2.join(", ") || "(空)"} (skipped=${rs.skipped})`);

  // 6d) 完整性校验 (sha256 清单)
  console.log("\n[6d] 完整性校验 (sha256)");
  M.S.bk_hash = true;
  const rh = await M.bkBackupNow("selftest-hash", ["config", "env", "auth"]);
  ok(!!rh.ok && rh.hashes > 0, `带清单备份: ${rh.name} (hashes=${rh.hashes})`);
  const rv = await M.bkVerify(rh.name);
  ok(!!rv.ok, `校验通过 (checked=${rv.checked}): ${rv.msg}`);
  const rv2 = await M.bkVerify(rh.name.replace(/\.zip$/, "")); // 不带 .zip 的名字也要能用
  ok(!!rv2.ok, `无扩展名校验同样通过: ${rv2.msg}`);
  M.S.bk_hash = false;
  const rnh = await M.bkBackupNow("selftest-nohash", ["config"]);
  const rv3 = await M.bkVerify(rnh.name);
  ok(!rv3.ok && /sha256/.test(rv3.msg || ""), `无清单时给出明确提示: ${rv3.msg}`);
  M.S.bk_hash = true;

  // 7) 非法名防护
  console.log("\n[7] 非法备份名防护");
  const rb = await M.bkRestore("../../evil");
  ok(!rb.ok, "路径穿越被拒绝: " + rb.msg);

  // 8) 清理超额
  console.log("\n[8] 清理超额备份 (keep=2)");
  const before = M.bkList().length;
  M.S.bk_keep = 2;
  const pr = await M.bkPrune();
  const after = M.bkList().length;
  M.S.bk_keep = 7;
  ok(after <= 2, `清理前 ${before} -> 清理后 ${after} (removed=${pr && pr.removed})`);
  const metaLeft = fs.readdirSync(M.bkRoot()).filter((f) => f.endsWith(".meta.json")).length;
  ok(metaLeft <= after, `清理后无 meta.json 残留: ${metaLeft} <= ${after}`);

  // 9) 删除
  console.log("\n[9] 删除备份");
  const rest = M.bkList();
  if (rest.length) {
    const dl = await M.bkDelete(rest[0].name);
    ok(!!dl.ok, "删除成功: " + rest[0].name);
    ok(!M.bkList().some((b) => b.name === rest[0].name), "列表中已消失");
  } else { ok(false, "无备份可删除"); }

  console.log(`\n===== 结果: ${pass} 通过 / ${fail} 失败 =====`);
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
  console.log("临时目录已清理: " + TMP);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("自测异常:", e); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {} process.exit(2); });
