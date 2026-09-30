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
    if (p === "getVersion") return () => "2.30.0";
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
  S.em_detect_tools = false; S.em_only_installed = true; S.em_missing_policy = "omit";
  S.em_cross_fallback = true; S.em_learn = true; S.em_learned = {}; S.em_skip_sites = "";
  S.em_npm_auto = true; S.em_pypi_pip_only = false; S.em_electron = ""; S.em_builder = "";
  S.em_npm = ""; S.em_node = ""; S.em_custom_dir = ""; S.em_extra = ""; S.em_probe_scope = "group";
};

(async () => {
  console.log("沙箱家目录 =", TMPH);
  console.log("NPMRC 路径 =", M.NPMRC_PATH);

  console.log("\n[1] 站点清单 (实测校验过的站点)");
  const sites = M.emPresetList();
  ok(sites.length === 21, `站点数 = ${sites.length} (期望 21)`);
  for (const k of ["mix", "npmmirror", "tbmirror", "cdn", "huawei", "aliyun", "tencent", "tuna", "ustc", "nju", "bfsu", "sjtug",
    "zju", "goproxycn", "rsproxy", "hfm", "ghfast", "ghproxy", "ghnet", "official", "custom"]) {
    ok(sites.some((s) => s.key === k), `包含站点 ${k}`);
  }
  ok(M.EM_CANDIDATE_KEYS.length === 19, `参与自动探测的站点 = ${M.EM_CANDIDATE_KEYS.length}`);

  console.log("\n[2] 工具链分组覆盖 (29 组)");
  const want = ["npm", "node", "electron", "builder", "playwright", "puppeteer", "selenium", "chromedriver", "geckodriver",
    "edgedriver", "sass", "sharp", "sqlite3", "bcrypt", "canvas", "esbuild", "turbo", "parcel", "rollup", "bun",
    "pypi", "conda", "go", "cargo", "rustup", "hf", "julia", "maven", "helm"];
  const have = M.EM_GROUPS.map((g) => g.key);
  const missing = want.filter((w) => !have.includes(w));
  ok(missing.length === 0 && have.length === want.length, `分组数 = ${have.length}, 缺: ${missing.join(",") || "无"}`);
  const noVars = M.EM_GROUPS.filter((g) => !g.vars || !g.vars.length).map((g) => g.key);
  ok(noVars.length === 0, `每组都有环境变量: ${noVars.join(",") || "全部有"}`);
  const noProbe = M.EM_GROUPS.filter((g) => typeof g.probe !== "function").map((g) => g.key);
  ok(noProbe.length === 0, `每组都有真实文件探测函数: ${noProbe.join(",") || "全部有"}`);
  const allVars = new Set(M.EM_GROUPS.flatMap((g) => g.vars));
  for (const v of ["npm_config_registry", "NPM_CONFIG_REGISTRY", "PNPM_CONFIG_REGISTRY", "YARN_REGISTRY", "BUN_REGISTRY", "DENO_REGISTRY",
    "NODEJS_ORG_MIRROR", "NVM_NODE_MIRROR", "NVM_NPM_MIRROR", "npm_config_disturl", "ELECTRON_MIRROR", "ELECTRON_BUILDER_BINARIES_MIRROR",
    "PLAYWRIGHT_DOWNLOAD_HOST", "PUPPETEER_DOWNLOAD_HOST", "SELENIUM_CDNURL", "CHROMEDRIVER_CDNURL", "GECKODRIVER_CDNURL", "EDGEDRIVER_CDNURL",
    "SASS_BINARY_SITE", "SHARP_BINARY_SITE", "SQLITE3_BINARY_SITE", "BCRYPT_BINARY_SITE", "CANVAS_BINARY_SITE",
    "ESBUILD_BINARY_HOST", "TURBO_BINARY_HOST", "PARCEL_BINARY_HOST", "ROLLUP_BINARY_HOST",
    "UV_DEFAULT_INDEX", "PIP_INDEX_URL", "POETRY_PYPI_MIRROR_URL", "CONDA_CHANNEL_ALIAS", "GOPROXY", "CARGO_REGISTRY", "RUSTUP_DIST_SERVER",
    "BUN_INSTALL_BASE_URL", "HF_ENDPOINT", "JULIA_PKG_SERVER", "MAVEN_REPO_URL", "HELM_REPO_URL"]) {
    ok(allVars.has(v), `覆盖变量 ${v}`);
  }

  console.log("\n[3] 真实文件探测地址 (不能用目录 —— 镜像站普遍禁目录列表)");
  reset();
  const gEl = M.EM_GROUP_MAP.electron, gBd = M.EM_GROUP_MAP.builder, gNpm = M.EM_GROUP_MAP.npm, gPy = M.EM_GROUP_MAP.pypi;
  const elU = M.emProbeUrls(gEl, M.emSiteValue("npmmirror", gEl));
  ok(elU.length === 1 && /SHASUMS256\.txt$/.test(elU[0]), `electron 用真实文件探测 -> ${elU[0]}`);
  const bdU = M.emProbeUrls(gBd, M.emSiteValue("npmmirror", gBd));
  ok(bdU.length === 1 && /winCodeSign-2\.6\.0\.7z$/.test(bdU[0]), `builder 用真实文件探测 -> ${bdU[0]}`);
  const pyU = M.emProbeUrls(gPy, M.emSiteValue("tuna", gPy));
  ok(pyU.length === 1 && /\/pip\/$/.test(pyU[0]), `pypi 用真实文件探测 -> ${pyU[0]}`);
  const nodeU = M.emProbeUrls(M.EM_GROUP_MAP.node, M.emSiteValue("npmmirror", M.EM_GROUP_MAP.node));
  ok(nodeU.length === 2, `node 两级探测 (index.json -> SHASUMS) = ${nodeU.length} 条`);
  const goU = M.emProbeUrls(M.EM_GROUP_MAP.go, "https://goproxy.cn,direct");
  ok(goU.length === 1 && goU[0].startsWith("https://goproxy.cn/"), `goproxy 去掉 ,direct 后探测 -> ${goU[0]}`);
  const cargoU = M.emProbeUrls(M.EM_GROUP_MAP.cargo, "sparse+https://rsproxy.cn/index/");
  ok(cargoU.length === 1 && cargoU[0] === "https://rsproxy.cn/index/config.json", `cargo 去掉 sparse+ -> ${cargoU[0]}`);

  console.log("\n[4] 站点 x 分组的取值与「站点没有该仓库」判断");
  reset();
  ok(M.emSiteValue("npmmirror", gNpm) === "https://registry.npmmirror.com", `npmmirror npm = ${M.emSiteValue("npmmirror", gNpm)}`);
  ok(M.emSiteValue("tuna", gPy) === "https://pypi.tuna.tsinghua.edu.cn/simple", `tuna pypi = ${M.emSiteValue("tuna", gPy)}`);
  ok(M.emSiteValue("ustc", gEl) === "", "中科大没有 electron 仓库");
  ok(M.emSiteValue("aliyun", gEl) === "", "阿里云没有 electron 仓库 (实测 404)");
  ok(M.emSiteValue("tencent", gNpm) === "", "腾讯云没有 npm 源 (实测 404)");
  ok(M.emSiteValue("cdn", gBd) === "", "npmmirror CDN 没有 electron-builder 工具包 (实测 404)");
  ok(M.emSiteValue("npmmirror", M.EM_GROUP_MAP.esbuild) === "", "npmmirror 没有 esbuild 二进制 (实测 404)");
  ok(M.emSiteValue("npmmirror", M.EM_GROUP_MAP.playwright) === "https://registry.npmmirror.com/-/binary/playwright/",
    `npmmirror playwright = ${M.emSiteValue("npmmirror", M.EM_GROUP_MAP.playwright)}`);
  ok(M.emSiteValue("huawei", M.EM_GROUP_MAP.playwright) === "https://mirrors.huaweicloud.com/playwright/",
    `huawei playwright = ${M.emSiteValue("huawei", M.EM_GROUP_MAP.playwright)}`);
  ok(M.emSiteHas("cd", gEl) === false, "未定义的站点 key 返回 false");
  for (const k of M.EM_CANDIDATE_KEYS) ok(M.EM_SITE_SUBS[k] !== undefined, `站点 ${k} 有子路径白名单`);

  console.log("\n[5] 选源: 跨站回退 / 缺仓策略 / 手填优先");
  reset();
  S.em_preset = "tuna";                                   // tuna 没有 maven
  ok(M.emGroupValue(M.EM_GROUP_MAP.maven).indexOf("tuna") < 0, `tuna 没有 maven, 自动换站 -> ${M.emGroupValue(M.EM_GROUP_MAP.maven)}`);
  const pickMvn = M.emGroupPick(M.EM_GROUP_MAP.maven);
  ok(pickMvn.moved === true && !!pickMvn.value, `回退标记 moved=true, 实际用 ${pickMvn.label}`);
  S.em_cross_fallback = false;
  ok(M.emGroupValue(M.EM_GROUP_MAP.maven) === "", "关闭跨站回退 + omit 策略 -> 不注入");
  S.em_missing_policy = "official";
  ok(/repo1\.maven\.org/.test(M.emGroupValue(M.EM_GROUP_MAP.maven)), `official 策略回退官方源 -> ${M.emGroupValue(M.EM_GROUP_MAP.maven)}`);
  S.em_cross_fallback = true; S.em_missing_policy = "omit";
  S.em_preset = "custom";
  ok(M.emGroupValue(gNpm) === "", "custom 站点且没有手填 -> 不注入");
  S.em_ov = { npm: "https://my.npm/" };
  ok(M.emGroupValue(gNpm) === "https://my.npm/", `逐组手工覆盖优先 -> ${M.emGroupValue(gNpm)}`);
  S.em_ov = {}; S.em_preset = "mix";
  reset();
  S.em_preset = "tuna";
  S.em_skip_sites = M.EM_CANDIDATE_KEYS.join(",");
  ok(M.emGroupValue(gPy) === "", "全部站点拉黑后不注入");
  S.em_skip_sites = "";
  reset();
  S.em_learned = { pypi: ["ustc"] };
  ok(M.emOrderedSites(gPy)[0] === "ustc", `学习结果排在候选首位 -> ${M.emOrderedSites(gPy).slice(0, 3).join(",")}`);

  console.log("\n[6] ELECTRON_CUSTOM_DIR 归一化 (写 \"v\" 会拼出错误路径)");
  ok(M.emNormDir("") === "" && M.emDir("") === "v" + (process.versions.electron || ""), `留空 -> v{版本} (${M.emDir("")})`);
  ok(M.emNormDir("v") === "", "孤零零的 \"v\" 视为无效 (之前会注入错的 ELECTRON_CUSTOM_DIR)");
  ok(M.emNormDir("33.4.11") === "v33.4.11", "纯版本号自动补 v");
  ok(M.emNormDir("v33.4.11") === "v33.4.11", "已带 v 保持不变");
  ok(M.emNormDir("{{ version }}") === "{{ version }}", "模板原样保留");

  console.log("\n[7] emEnvAll: 生成要注入的全部变量");
  reset();
  S.em_preset = "mix";
  let r = M.emEnvAll();
  const env = r.env;
  ok(Object.keys(env).length > 30, `注入变量数 = ${Object.keys(env).length}`);
  for (const [k, v] of [["npm_config_registry", "https://registry.npmmirror.com"], ["YARN_REGISTRY", "https://registry.npmmirror.com"],
    ["ELECTRON_MIRROR", "https://registry.npmmirror.com/-/binary/electron/"],
    ["ELECTRON_BUILDER_BINARIES_MIRROR", "https://registry.npmmirror.com/-/binary/electron-builder-binaries/"],
    ["PLAYWRIGHT_DOWNLOAD_HOST", "https://registry.npmmirror.com/-/binary/playwright/"],
    ["SASS_BINARY_SITE", "https://registry.npmmirror.com/-/binary/node-sass/"],
    ["UV_DEFAULT_INDEX", "https://pypi.tuna.tsinghua.edu.cn/simple"], ["GOPROXY", "https://goproxy.cn"],
    ["CARGO_REGISTRY", "sparse+https://rsproxy.cn/index/"], ["RUSTUP_DIST_SERVER", "https://mirrors.ustc.edu.cn/rust-static"],
    ["HF_ENDPOINT", "https://hf-mirror.com"], ["JULIA_PKG_SERVER", "https://mirrors.huaweicloud.com/julia"],
    ["MAVEN_REPO_URL", "https://maven.aliyun.com/repository/public"],
    ["HELM_REPO_URL", "https://mirrors.huaweicloud.com/helm"],
    ["CONDA_CHANNEL_ALIAS", "https://mirrors.tuna.tsinghua.edu.cn/anaconda"],
    ["BUN_INSTALL_BASE_URL", "https://registry.npmmirror.com/-/binary/bun/"]]) {
    ok(env[k] === v, `${k} = ${env[k]}`);
  }
  ok(env.ESBUILD_BINARY_HOST === undefined, "esbuild 全站都没有 -> 不注入 (不再给一个下不动的 GitHub 地址)");
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
  ok(r.used.electron.site === "huawei", `used 里记录实际站点 -> ${r.used.electron.site}`);
  ok(r.env.npm_config_registry === "https://registry.npmmirror.com", "其他组不受影响");
  S.em_site_of = {};

  console.log("\n[8] em_extra 解析");
  S.em_extra = "# 注释\nFOO=bar\n\n  KEEP = 1  \nBADLINE\n";
  const ex = M.emExtraEnv();
  ok(ex.FOO === "bar" && ex.KEEP === "1", `解析并 trim -> ${JSON.stringify(ex)}`);
  ok(!("BADLINE" in ex), "忽略无等号行");
  S.em_extra = "";
  ok(M.emEnvAll().env.FOO === undefined, "清空后不再注入");

  console.log("\n[9] 逐组开关 / 工具链识别");
  reset();
  S.em_groups = { pypi: false };
  ok(M.emGroupOn(gPy) === false, "em_groups.pypi=false 时该组关闭");
  ok(M.emGroupOn(gNpm) === true, "未列出的组默认开启");
  S.em_groups = {}; S.em_detect_tools = true; S.em_only_installed = true;
  const detNode = M.emDetectAny(["node"]);
  ok(typeof detNode === "boolean", `本机 node 识别 = ${detNode}`);
  ok(M.emDetectAny(["definitely-not-a-real-cmd-xyz"]) === false, "不存在的命令识别为 false");
  S.em_groups = {};
  ok(M.emGroupOn(M.EM_GROUP_MAP.node) === detNode, `只装已安装工具链: node 组 = ${M.emGroupOn(M.EM_GROUP_MAP.node)}`);
  ok(M.emGroupOn(M.EM_GROUP_MAP.hf) === true, "无 detect 列表的组 (hf) 始终开启");
  S.em_only_installed = false;
  ok(M.emGroupOn(M.EM_GROUP_MAP.node) === true, "关闭「只注入已安装」后 node 组恢复");
  S.em_detect_tools = false;

  console.log("\n[10] 分组矩阵 (设置页 UI 用)");
  reset();
  const matrix = M.emGroupMatrix();
  ok(matrix.length === M.EM_GROUPS.length, `矩阵行数 = ${matrix.length}`);
  const rowEl = matrix.find((x) => x.key === "electron");
  const elKeys = rowEl.options.map((o) => o.key);
  ok(elKeys.includes("npmmirror") && elKeys.includes("huawei") && elKeys.includes("ghfast") && elKeys.includes("official"),
    `electron 候选站点 = ${elKeys.join("/")}`);
  ok(!elKeys.includes("aliyun") && !elKeys.includes("tencent"), "没有 electron 的站点不出现在 electron 候选中");
  const rowPy = matrix.find((x) => x.key === "pypi");
  ok(rowPy && rowPy.options.length >= 6 && rowPy.options.every((o) => o.value), `pypi 候选站点 = ${rowPy.options.length} 个且都带地址`);
  ok(matrix.every((x) => Array.isArray(x.vars) && x.vars.length), "每行都列出环境变量名");

  console.log("\n[11] ~/.npmrc 写入/移除 (保留用户原有内容)");
  fs.writeFileSync(M.NPMRC_PATH, "strict-ssl=true\n//registry.example.com/:_authToken=SECRET\n", "utf8");
  ok(M.emNpmrcWrite(true).ok, "写入返回 ok");
  let body = fs.readFileSync(M.NPMRC_PATH, "utf8");
  for (const re of [/registry=https:\/\/registry\.npmmirror\.com/, /electron_mirror=https:\/\/registry\.npmmirror\.com\/-\/binary\/electron\//, /electron_builder_binaries_mirror=/, /disturl=/, /sass_binary_site=/]) {
    ok(re.test(body), `npmrc 含 ${re.source}`);
  }
  ok(/strict-ssl=true/.test(body) && /_authToken=SECRET/.test(body), "保留用户原有配置");
  M.emNpmrcWrite(true);
  body = fs.readFileSync(M.NPMRC_PATH, "utf8");
  ok((body.match(/# >>> HermesUpdater managed/g) || []).length === 1, "重复写入不产生重复块");
  ok(M.emNpmrcWrite(false).ok, "移除返回 ok");
  body = fs.readFileSync(M.NPMRC_PATH, "utf8");
  ok(!/HermesUpdater managed/.test(body) && /_authToken=SECRET/.test(body), "移除托管块且用户配置仍在");

  console.log("\n[12] 三态探测 testUrl3 (区别「该站无此仓库」与「网络不通」)");
  const realNa = await M.testUrl3("https://registry.npmmirror.com/-/binary/definitely-not-here-xyz/", 8000);
  ok(realNa === "na" || realNa === "fail", `不存在的路径 -> ${realNa}`);
  const bad = await M.testUrl3("http://127.0.0.1:9/never", 1500);
  ok(bad === "fail", `连不上的地址 -> ${bad}`);

  console.log("\n[13] 真实网络探测 (需要可访问国内网络, 仅供观察)");
  reset();
  S.em_preset = "mix";
  const probed = await M.emProbeAll(null, true);
  const reach = probed.filter((x) => x.ok);
  const nas = probed.filter((x) => x.state === "na");
  const dead = probed.filter((x) => x.state === "fail");
  console.log(`       探测 ${probed.length} 条 (站点 x 分组), ${reach.length} 可用 / ${nas.length} 该站无此仓库 / ${dead.length} 网络不通`);
  for (const x of reach.slice().sort((a, b) => a.ms - b.ms).slice(0, 10)) console.log(`       ✅ ${x.label.padEnd(20)} ${String(x.grp).padEnd(12)} ${x.ms}ms`);
  for (const x of dead.slice(0, 4)) console.log(`       ❌ ${x.label.padEnd(20)} ${String(x.grp).padEnd(12)} 网络不通`);
  ok(reach.length > 0, `至少一条镜像可达 (${reach.length}/${probed.length})`);
  // 旧版把"该站没这个仓库"也报成 FAIL, 用户看到一屏 FAIL 以为镜像全挂;
  // 现在只探测"站点确实有这个仓库"的组合, 所以 FAIL 比例应该很低
  ok(reach.length >= Math.max(5, Math.round(probed.length * 0.3)),
    `可用比例 ${reach.length}/${probed.length} —— 旧版这里会是一屏 FAIL (${nas.length} 条判为"该站无此仓库", ${dead.length} 条真不通)`);
  const best = await M.emPickSitesByGroup(null, false);
  ok(Object.keys(best).length > 0, `逐组选源得到 ${Object.keys(best).length} 组结果`);
  const picked = Object.values(best)[0];
  ok(picked && picked.value, `选源结果带真实地址 -> ${picked && picked.value}`);
  r = M.emEnvAll();
  ok(Object.keys(r.env).length > 20, `按探测结果生成 ${Object.keys(r.env).length} 个变量`);
  ok(!!(S.em_learned && Object.keys(S.em_learned).length), `自动学习已记录 ${Object.keys(S.em_learned || {}).length} 组可用站点`);

  console.log(`\n===== 结果: ${pass} 通过 / ${fail} 失败 =====`);
  try { fs.rmSync(TMPH, { recursive: true, force: true }); } catch {}
  console.log("沙箱家目录已清理:", TMPH);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("自测异常:", e); try { fs.rmSync(TMPH, { recursive: true, force: true }); } catch {} process.exit(2); });
