// 离线自测: 国内镜像统一加速 (mock electron + 重定向 USERPROFILE 到临时目录, 不碰真实 ~/.npmrc)
// 用法: HU_SELFTEST=1 node selftest_em.js
const Module = require("module");
const os = require("os");
const fs = require("fs");
const path = require("path");

const TMPH = path.join(os.tmpdir(), "hermes-em-selftest-" + Date.now());
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
    if (p === "getVersion") return () => "2.29.0";
    if (p === "getPath") return (n) => path.join(TMPH, String(n));
    if (p === "setAppUserModelId" || p === "on" || p === "quit") return () => {};
    if (typeof p === "symbol") return undefined;
    return stub("app." + String(p));
  }, set() { return true; },
});
const electronMock = new Proxy({}, { get(_, p) { if (p === "app") return appMock; if (typeof p === "symbol") return undefined; return stub("electron." + String(p)); } });
const origLoad = Module._load;
Module._load = function (req) { if (req === "electron") return electronMock; return origLoad.apply(this, arguments); };

process.env.HU_SELFTEST = "1";
const M = require("./main.js");
const S = M.S;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  PASS  " + m); } else { fail++; console.log("  FAIL  " + m); } };
const reset = () => {
  S.em_preset = "mix"; S.em_per_group = false; S.em_site_of = {}; S.em_ov = {}; S.em_groups = {};
  S.em_detect_tools = false; S.em_only_installed = true; S.em_missing_policy = "official";
  S.em_npm_auto = true; S.em_pypi_pip_only = false; S.em_electron = ""; S.em_builder = "";
  S.em_npm = ""; S.em_node = ""; S.em_custom_dir = ""; S.em_extra = "";
};

(async () => {
  console.log("沙箱家目录 =", TMPH);
  console.log("NPMRC 路径 =", M.NPMRC_PATH);

  console.log("\n[1] 站点清单");
  const sites = M.emPresetList();
  ok(sites.length === 8, `站点数 = ${sites.length} (期望 8)`);
  for (const k of ["mix", "npmmirror", "cdn", "huawei", "ustc", "tuna", "official", "custom"]) ok(sites.some((s) => s.key === k), `包含站点 ${k}`);
  ok(M.EM_CANDIDATE_KEYS.length === 7, `参与自动探测的站点 = ${M.EM_CANDIDATE_KEYS.length}`);

  console.log("\n[2] 工具链分组覆盖");
  const want = ["npm", "node", "electron", "builder", "playwright", "puppeteer", "chromedriver", "geckodriver", "edgedriver",
    "sass", "sharp", "sqlite3", "bcrypt", "canvas", "esbuild", "turbo", "parcel", "rollup", "bun",
    "pypi", "go", "cargo", "rustup", "hf", "julia", "maven", "helm"];
  const have = M.EM_GROUPS.map((g) => g.key);
  const missing = want.filter((w) => !have.includes(w));
  ok(missing.length === 0, `分组数 = ${have.length}, 缺: ${missing.join(",") || "无"}`);
  const noVars = M.EM_GROUPS.filter((g) => !g.vars || !g.vars.length).map((g) => g.key);
  ok(noVars.length === 0, `每组都有环境变量: ${noVars.join(",") || "全部有"}`);
  // 关键变量覆盖检查 (用户点名要的那些)
  const allVars = new Set(M.EM_GROUPS.flatMap((g) => g.vars));
  for (const v of ["npm_config_registry", "NPM_CONFIG_REGISTRY", "PNPM_CONFIG_REGISTRY", "YARN_REGISTRY", "BUN_REGISTRY",
    "NODEJS_ORG_MIRROR", "NVM_NODE_MIRROR", "npm_config_disturl", "ELECTRON_MIRROR", "ELECTRON_BUILDER_BINARIES_MIRROR",
    "PLAYWRIGHT_DOWNLOAD_HOST", "PUPPETEER_DOWNLOAD_HOST", "SELENIUM_CDNURL", "SASS_BINARY_SITE", "SHARP_BINARY_SITE",
    "UV_DEFAULT_INDEX", "PIP_INDEX_URL", "POETRY_PYPI_MIRROR_URL", "GOPROXY", "CARGO_REGISTRY", "RUSTUP_DIST_SERVER",
    "BUN_INSTALL_BASE_URL", "HF_ENDPOINT", "JULIA_PKG_SERVER", "MAVEN_REPO_URL", "HELM_REPO_URL"]) {
    ok(allVars.has(v), `覆盖变量 ${v}`);
  }

  console.log("\n[3] 站点 x 分组的取值与回退");
  reset();
  const gNpm = M.EM_GROUP_MAP.npm, gPy = M.EM_GROUP_MAP.pypi, gEl = M.EM_GROUP_MAP.electron;
  ok(M.emSiteValue("npmmirror", gNpm) === "https://registry.npmmirror.com", `npmmirror npm = ${M.emSiteValue("npmmirror", gNpm)}`);
  ok(M.emSiteValue("npmmirror", gPy) === "", "npmmirror 没有 pypi 仓库 (留空)");
  ok(M.emSiteValue("tuna", gPy) === "https://pypi.tuna.tsinghua.edu.cn/simple", `tuna pypi = ${M.emSiteValue("tuna", gPy)}`);
  ok(M.emSiteValue("ustc", gEl) === "", "中科大没有 electron 仓库");
  S.em_preset = "npmmirror";
  ok(M.emGroupValue(gPy) === "https://pypi.org/simple", `缺仓库时回退官方源 -> ${M.emGroupValue(gPy)}`);
  S.em_missing_policy = "skip";
  ok(M.emGroupValue(gPy) === "", "missing_policy=skip 时不注入");
  S.em_missing_policy = "official";
  S.em_ov = { npm: "https://my.npm/" };
  ok(M.emGroupValue(gNpm) === "https://my.npm/", `逐组手工覆盖优先 -> ${M.emGroupValue(gNpm)}`);
  S.em_ov = {};

  console.log("\n[4] 逐组开关 / 工具链识别");
  S.em_groups = { pypi: false };
  ok(M.emGroupOn(gPy) === false, "em_groups.pypi=false 时该组关闭");
  ok(M.emGroupOn(gNpm) === true, "未列出的组默认开启");
  S.em_groups = {}; S.em_detect_tools = true; S.em_only_installed = true;
  const detNode = M.emDetectAny(["node"]);
  ok(typeof detNode === "boolean", `本机 node 识别 = ${detNode}`);
  ok(M.emDetectAny(["definitely-not-a-real-cmd-xyz"]) === false, "不存在的命令识别为 false");
  S.em_only_installed = true; S.em_detect_tools = true;
  S.em_groups = {};
  const onNode = M.emGroupOn(M.EM_GROUP_MAP.node);
  ok(onNode === detNode, `只装已安装工具链: node 组 = ${onNode}`);
  ok(M.emGroupOn(M.EM_GROUP_MAP.hf) === true, "无 detect 列表的组 (hf) 始终开启");
  S.em_only_installed = false;
  ok(M.emGroupOn(M.EM_GROUP_MAP.node) === true, "关闭「只注入已安装」后 node 组恢复");
  S.em_detect_tools = false;

  console.log("\n[5] emEnvAll: 生成要注入的全部变量");
  reset();
  S.em_preset = "mix"; S.em_only_installed = false; S.em_detect_tools = false;
  let r = M.emEnvAll();
  const env = r.env;
  const keys = Object.keys(env);
  ok(keys.length > 25, `注入变量数 = ${keys.length}`);
  for (const [k, v] of [["npm_config_registry", "https://registry.npmmirror.com"], ["YARN_REGISTRY", "https://registry.npmmirror.com"],
    ["ELECTRON_MIRROR", "https://npmmirror.com/mirrors/electron/"], ["PLAYWRIGHT_DOWNLOAD_HOST", "https://npmmirror.com/mirrors/playwright/"],
    ["SASS_BINARY_SITE", "https://npmmirror.com/mirrors/node-sass/"], ["ESBUILD_BINARY_HOST", "https://npmmirror.com/mirrors/esbuild/"],
    ["UV_DEFAULT_INDEX", "https://pypi.tuna.tsinghua.edu.cn/simple"], ["GOPROXY", "https://goproxy.cn,direct"],
    ["CARGO_REGISTRY", "sparse+https://rsproxy.cn/index/"], ["RUSTUP_DIST_SERVER", "https://mirrors.ustc.edu.cn/rust-static"],
    ["HF_ENDPOINT", "https://hf-mirror.com"], ["JULIA_PKG_SERVER", "https://mirrors.tuna.tsinghua.edu.cn/julia"],
    ["HELM_REPO_URL", "https://mirrors.tuna.tsinghua.edu.cn/helm-charts"], ["BUN_INSTALL_BASE_URL", "https://npmmirror.com/mirrors/bun/"]]) {
    ok(env[k] === v, `${k} = ${env[k]}`);
  }
  ok(env.ELECTRON_CUSTOM_DIR === undefined, "ELECTRON_CUSTOM_DIR 留空不注入");
  S.em_custom_dir = "{{ version }}";
  ok(M.emEnvAll().env.ELECTRON_CUSTOM_DIR === "{{ version }}", "填了版本目录就注入");
  S.em_custom_dir = "";
  S.em_pypi_pip_only = true;
  r = M.emEnvAll();
  ok(r.env.PIP_INDEX_URL && !r.env.UV_DEFAULT_INDEX && !r.env.POETRY_PYPI_MIRROR_URL, "「只设 PIP_INDEX_URL」生效");
  S.em_pypi_pip_only = false;
  S.em_npm_auto = false;
  r = M.emEnvAll();
  ok(!r.env.npm_config_registry && !r.env.npm_config_disturl, "关闭 npm 国内源后不再注入 registry/disturl");
  S.em_npm_auto = true;
  S.em_site_of = { electron: "huawei" };
  r = M.emEnvAll();
  ok(r.env.ELECTRON_MIRROR === "https://mirrors.huaweicloud.com/electron/", `逐组选源生效 -> ${r.env.ELECTRON_MIRROR}`);
  ok(r.env.npm_config_registry === "https://registry.npmmirror.com", "其他组不受影响");
  S.em_site_of = {};

  console.log("\n[6] em_extra 解析");
  S.em_extra = "# 注释\nFOO=bar\n\n  KEEP = 1  \nBADLINE\n";
  const ex = M.emExtraEnv();
  ok(ex.FOO === "bar" && ex.KEEP === "1", `解析并 trim -> ${JSON.stringify(ex)}`);
  ok(!("BADLINE" in ex), "忽略无等号行");
  S.em_extra = "";
  ok(M.emEnvAll().env.FOO === undefined, "清空后不再注入");

  console.log("\n[7] 分组矩阵 (设置页 UI 用)");
  const matrix = M.emGroupMatrix();
  ok(matrix.length === M.EM_GROUPS.length, `矩阵行数 = ${matrix.length}`);
  const rowEl = matrix.find((x) => x.key === "electron");
  ok(rowEl && rowEl.options.length === 5, `electron 行可选站点 = ${rowEl ? rowEl.options.length : 0} (mix/npmmirror/cdn/华为云/官方)`);
  const rowPy = matrix.find((x) => x.key === "pypi");
  ok(rowPy && rowPy.options.every((o) => o.value), "pypi 行的候选站点都带真实地址 (已过滤无该仓库的站点)");

  console.log("\n[8] ~/.npmrc 写入/移除 (保留用户原有内容)");
  fs.writeFileSync(M.NPMRC_PATH, "strict-ssl=true\n//registry.example.com/:_authToken=SECRET\n", "utf8");
  ok(M.emNpmrcWrite(true).ok, "写入返回 ok");
  let body = fs.readFileSync(M.NPMRC_PATH, "utf8");
  for (const re of [/registry=https:\/\/registry\.npmmirror\.com/, /electron_mirror=https:\/\/npmmirror\.com\/mirrors\/electron\//, /electron_builder_binaries_mirror=/, /disturl=/, /sass_binary_site=/]) {
    ok(re.test(body), `npmrc 含 ${re.source}`);
  }
  ok(/strict-ssl=true/.test(body) && /_authToken=SECRET/.test(body), "保留用户原有配置");
  M.emNpmrcWrite(true);
  body = fs.readFileSync(M.NPMRC_PATH, "utf8");
  ok((body.match(/# >>> HermesUpdater managed/g) || []).length === 1, "重复写入不产生重复块");
  ok(M.emNpmrcWrite(false).ok, "移除返回 ok");
  body = fs.readFileSync(M.NPMRC_PATH, "utf8");
  ok(!/HermesUpdater managed/.test(body) && /_authToken=SECRET/.test(body), "移除托管块且用户配置仍在");

  console.log("\n[9] 真实网络探测 (需要可访问国内网络, 仅供观察)");
  reset();
  S.em_preset = "mix"; S.em_only_installed = false;
  const probed = await M.emProbeAll(null, true);
  const reach = probed.filter((x) => x.ok);
  console.log(`       探测 ${probed.length} 条 (站点 x 基础仓库), ${reach.length} 条可达`);
  for (const x of reach.slice(0, 8)) console.log(`       ✅ ${x.label.padEnd(22)} ${String(x.field).padEnd(8)} ${x.ms}ms`);
  for (const x of probed.filter((y) => !y.ok).slice(0, 4)) console.log(`       ❌ ${x.label.padEnd(22)} ${String(x.field).padEnd(8)} 不可达`);
  ok(reach.length > 0, `至少一条镜像可达 (${reach.length}/${probed.length})`);
  const best = await M.emPickSitesByGroup(null, false);
  ok(Object.keys(best).length > 0, `逐组选源得到 ${Object.keys(best).length} 组结果`);
  r = M.emEnvAll();
  ok(Object.keys(r.env).length > 25, `按探测结果生成 ${Object.keys(r.env).length} 个变量`);

  console.log(`\n===== 结果: ${pass} 通过 / ${fail} 失败 =====`);
  try { fs.rmSync(TMPH, { recursive: true, force: true }); } catch {}
  console.log("沙箱家目录已清理:", TMPH);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("自测异常:", e); try { fs.rmSync(TMPH, { recursive: true, force: true }); } catch {} process.exit(2); });
