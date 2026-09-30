// HermesUpdater Electron 版 - 主进程
// 移植自 tkinter 版 hermes_updater.py 的后端逻辑
const { app, BrowserWindow, Tray, Menu, ipcMain, clipboard, shell, dialog, nativeImage, nativeTheme, net, powerSaveBlocker, Notification } = require("electron");
const { spawn, execFile, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");
const https = require("https");
const crypto = require("crypto");

const APP_NAME = "HermesUpdater";
const APP_DIR = path.join(os.homedir(), "AppData", "Roaming", APP_NAME);
const SETTINGS_PATH = path.join(APP_DIR, "settings.json");
const HISTORY_PATH = path.join(APP_DIR, "history.json");
const LOG_PATH = path.join(APP_DIR, "app.log");
fs.mkdirSync(APP_DIR, { recursive: true });

// ---------------- 设置 ----------------
const DEFAULTS = {
  install_path: path.join(os.homedir(), "AppData", "Local", "hermes"),
  branch: "main",
  auto_switch: "auto",          // auto | direct | system | manual | mirror
  manual_proxy: "",
  mirror_url: "https://ghproxy.cn/",
  flag_gateway: true,
  flag_keep_stash: true,
  kill_before_update: true,
  restore_zh_patches: true,
  zh_patches_source: "",
  keep_backups: 3,
  notify_updates: true,
  auto_update: false,
  auto_execute: false,          // 自动检查发现新版本后自动执行更新
  auto_update_interval_min: 60,
  minimize_to_tray: true,
  dark_mode: false,             // 默认浅色
  theme_system: false,          // 跟随系统深浅色 (开启时忽略 dark_mode)
  ui_zoom: 100,                 // 界面缩放 %
  term_font: 12,                // 终端字号 px
  term_scheme: "theme",         // 终端配色 theme=跟随主题 | black=经典黑 | custom=自定义
  term_bg: "#0F172A",           // 自定义终端背景色
  term_fg: "#E2E8F0",           // 自定义终端文字色
  start_page: "dash",           // 启动页
  confirm_update: true,         // 更新前弹确认框
  cleanup_after: true,          // 更新后清理多余进程
  keep_gateway: true,           // 清理时保留 Gateway
  notify_done: true,            // 更新完成托盘气泡
  check_on_start: true,         // 启动时自动检查
  auto_save_settings: false,    // 修改设置后自动保存
  unsaved_guard: true,          // 离开设置页时提醒未保存的修改
  history_max: 50,              // 更新历史上限
  git_timeout: 120,             // git 默认超时(秒)
  gateway_watch: true,          // Gateway 掉线/恢复托盘提醒 (每 5 分钟轮询)
  refresh_interval_sec: 30,     // 状态自动刷新间隔(秒)
  log_retention_days: 14,
  language: "zh",               // 界面语言 zh | en
  auto_fallback_mirror: true,   // 直连/代理失败时自动切换镜像源
  auto_retry: true,             // 更新失败后自动重试
  max_retries: 2,               // 自动重试次数上限 (0-5)
  disk_check: true,             // 更新前检查安装盘剩余空间
  notifications_enabled: true,  // 应用内通知中心
  accent: "blue",               // 强调色 blue | green | purple | orange | teal
  always_on_top: false,         // 窗口置顶
  profiles: [],                 // 配置方案 [{name, install_path, branch, auto_switch, manual_proxy, mirror_url}]
  show_line_time: true,         // 更新输出显示行时间戳
  inject_electron_mirror: true, // 更新时注入 Electron 二进制镜像 + npmmirror npm 源 (防打包阶段 fetch failed)
  auto_repair_env: true,        // 重试时自动叠加代理环境 (上次失败于打包/依赖下载)
  translate_auto: true,         // 输出行自动实时翻译 (面板开启时)
  translate_target: "zh-CN",    // 翻译目标语言 zh-CN | en
  translate_provider: "auto",   // 翻译引擎 auto | google | gcloud | deepl | lingva | mymemory | youdao | offline
  translate_engines_order: "",  // 自动模式自定义引擎顺序 (逗号分隔, 留空=默认)
  translate_custom_dict: [],    // 自定义词典 ["en=zh", ...] (离线词典优先级最高)
  translate_panel_width: 340,   // 翻译面板宽度 (拖拽持久化)
  path_auto_detect: true,       // 启动时自动识别安装路径 (当前路径无效时探测常见位置)
  path_auto_apply: true,        // 识别到有效路径后自动切换 (关闭则仅提醒)
  path_deep_scan: false,        // 深度扫描: 轮询所有盘符一级目录找 hermes*
  path_history: [],             // 最近使用/识别过的安装路径 (最多 8 条)
  preflight_check: true,        // 更新前自动预检 (安装路径 / git 仓库 / 磁盘剩余)
  min_free_gb: 1,               // 预检磁盘剩余下限 (GB)
  path_watch: true,             // 运行时监控安装路径 (失效时自动提醒并尝试修复)
  log_auto_refresh: true,       // 日志页每 5 秒自动刷新
  backup_auto: false,           // 每日自动备份数据包 (文档目录/HermesUpdater-Backups)
  backup_keep: 5,               // 自动备份保留份数 (1-30)
  bk_enabled: true,             // 启用「备份与恢复」(Hermes 配置/数据)
  bk_dir: "",                   // 备份目录 (空=默认 文档/HermesUpdater-Backups/agent)
  bk_auto: false,               // 定时自动备份 Hermes 数据
  bk_auto_every: "daily",       // daily | weekly
  bk_keep: 7,                   // 备份保留份数 (1-60)
  bk_scope: ["config", "sessions", "skills", "plugins", "zhpatches"], // 备份内容: 会话/技能/插件/配置... (见 BK_SCOPE_KEYS)
  bk_zip: true,                 // 压缩为 zip (关闭则保留文件夹)
  bk_stop_proc: true,           // 备份/恢复前停止 Hermes 进程 (保证一致性)
  bk_verify: true,              // 备份后做完整性校验
  bk_auto_time: "03:00",        // 定时备份时刻 HH:MM (配合 bk_auto / bk_auto_every)
  bk_prune_after: true,         // 每次备份后自动清理超额份数
  bk_hash: false,               // 生成 manifest.sha256 校验清单
  bk_restore_autobackup: true,  // 恢复前先自动备份当前状态 (留后路)
  bk_restore_scope: [],         // 恢复时只还原这些范围 (空=整份还原)
  bk_notify: true,              // 备份完成/失败弹桌面通知
  bk_exclude: "",               // 排除规则 (每行一条, 支持 * 通配, 相对安装目录)
  bk_open_after: false,         // 备份完成后自动打开备份目录
  bk_on_update: true,           // 每次更新 Hermes 前自动备份一次 (更新失败可回滚用户数据)
  bk_compress_level: "optimal", // 压缩级别 optimal | fastest | none
  bk_retention_days: 0,         // 按天数保留 (超过 N 天自动清理, 0=只看份数)
  bk_notify_fail_only: false,   // 只在失败时弹通知 (成功静默)
  bk_skip_empty: false,         // 跳过空文件 / 空目录
  bk_include_hidden: true,      // 包含 . 开头的隐藏项
  bk_verify_restore: false,     // 恢复后校验落盘文件数
  bk_schedule_days: "",         // 每周备份的周几 (0=周日, 逗号分隔; 空=周一)
  quiet_start: "",              // 自动检查免打扰开始 (HH:MM, 空=不禁用)
  quiet_end: "",                // 免打扰结束 (支持跨午夜, 如 23:00~08:00)
  tray_badge: true,             // 托盘角标: 有可更新提交时显示 ⬆️N
  notify_desktop: true,         // 桌面系统通知 (更新完成/失败/新版本, 最小化也可见)
  snooze_until: 0,              // 新版本稍后提醒截止时间戳 (ms, 0=未启用)
  auto_countdown_sec: 60,       // 自动更新倒计时确认 (秒, 0=立即执行, 上限 600)
  net_watch: true,              // 网络巡检: 定时探测当前方案, 连续失败告警/恢复提示
  net_watch_min: 10,            // 巡检间隔 (分钟, 最小 5)
  ins_repo: "https://github.com/anthropics/hermes-agent.git", // 安装源仓库
  ins_branch: "main",           // 安装默认分支/标签
  ins_dir: "",                  // 安装目标目录 (空=沿用 install_path)
  ins_npm_mirror: "default",    // npm 源 default | npmmirror | custom
  ins_npm_custom: "",           // 自定义 npm registry URL
  ins_git_accel: true,          // clone 走当前镜像加速前缀
  ins_mirror_url: "",           // 安装专用加速前缀 (空=沿用主设置 mirror_url)
  ins_mirror_fallback: true,    // 克隆失败自动换候选镜像重试
  unins_backup: true,           // 卸载前自动备份配置 (config.yaml/zh-patches → 文档目录备份区)
  unins_stop_procs: true,       // 卸载前自动停止占用的 Hermes 进程
  unins_unregister: true,       // 卸载后自动从「已知安装」列表移除该路径
  unins_strict_confirm: false,  // 彻底删除需输入目录名二次确认
  unins_default_mode: "trash",  // 默认卸载方式 trash | modules | permanent | unregister
  upd_target: "",               // 更新目标 "branch:main" | "tag:v1.2.3" (空=跟随默认分支)
  upd_target_lock: false,       // 每次更新前强制 checkout 到指定目标
  chg_max: 200,                 // 更新日志中心拉取提交上限 (50-1000)
  chg_group: true,              // 更新日志按 tag 分组展示
  hooks: [],                    // 更新钩子 [{name, cmd, phase: pre|post|fail, enabled, timeout, abort}]
  webhook_url: "",              // Webhook 推送 URL (POST JSON)
  webhook_secret: "",           // X-Hermes-Secret 请求头
  webhook_upd_ok: true,         // 推送: 更新成功
  webhook_upd_fail: true,       // 推送: 更新失败
  webhook_ins: true,            // 推送: 安装/卸载完成
  dash_tools: true,             // 仪表盘显示「安装/卸载/维护」快捷中心
  dash_unins_confirm: true,     // 仪表盘快捷卸载前需二次确认
  dash_install_hist: true,      // 仪表盘显示最近安装/卸载记录摘要
  dash_hist_rows: 3,            // 安装记录摘要显示条数 (1-10)
  ins_auto_validate: true,      // 安装完成后自动验证
  ins_auto_apply: true,         // 验证通过自动设为当前管理路径
  ins_shortcut: false,          // 安装后创建桌面快捷方式 (找到 hermes.cmd 时)
  ins_timeout_min: 30,          // 安装整体超时 (分钟)
  ins_hist_keep: 10,            // 安装历史保留条数
  sched_days: "",               // 定时计划: 周几检查更新 "0-6" 逗号分隔 (0=周日), 空=关闭
  sched_time: "09:00",          // 定时计划时间 HH:MM
  whatsnew_max: 30,             // 更新内容预览最多显示条数 (10-100)
  post_smoke: true,             // 更新成功后自动冒烟验证 (hermes --version 可执行)
  watchdog_enabled: false,      // Gateway 守护: 掉线自动拉起
  watchdog_min: 5,              // 守护巡检间隔 (分钟, 最小 2)
};
let S = loadSettings();

// ---------------- i18n (主进程: 托盘/气泡/更新文案) ----------------
const I18N = {
  zh: {
    "tray.dash": "📊 仪表盘", "tray.update": "🔄 更新", "tray.settings": "⚙️ 设置",
    "tray.diag": "🩺 诊断", "tray.log": "📜 运行日志", "tray.check": "检查新版本", "tray.quit": "退出",
    "tray.backup": "💾 备份与恢复", "tray.bk.now": "📦 立即备份", "tray.bk.restore": "♻️ 恢复备份…", "tray.bk.dir": "📂 打开备份目录", "tray.bk.settings": "⚙️ 备份设置", "tray.bk.done": "💾 备份完成", "tray.bk.fail": "💾 备份失败",
    "balloon.newver.title": "发现 Hermes 新版本",
    "balloon.newver.body": (n) => `落后 ${n} 个提交, 打开更新工具点击「立即更新」`,
    "balloon.done.ok.title": "Hermes 更新完成 ✅", "balloon.done.ok.body": "已更新到最新版本",
    "balloon.done.fail.title": "Hermes 更新失败 ❌",
    "balloon.done.fail.body": (rc) => `更新失败 (rc=${rc}), 请打开工具查看原因`,
    "gw.up.title": "Gateway 已恢复运行 ✅", "gw.up.body": "Hermes Gateway 检测恢复正常",
    "gw.down.title": "Gateway 掉线 ⚠️", "gw.down.body": "检测到 Gateway 未运行, 点击处理",
    "msg.busy": "已有更新在进行中",
    "path.applied": (p) => `已自动识别并切换 Hermes 安装路径: ${p}`,
    "path.found": (p) => `检测到 Hermes 安装: ${p} (可在设置中一键应用)`,
    "path.none": "未检测到有效 Hermes 安装, 请在设置中手动指定",
    "path.browse": "选择 Hermes 安装目录",
    "report.title": "导出诊断报告",
    "u.net": (m) => `更新: 网络方式 ${m}`,
    "u.clean1": (n) => `[清理] 已结束 ${n} 个残留 Hermes 进程`,
    "u.backup.ok": (s) => `[备份] OK ${s}`, "u.backup.fail": (s) => `[备份] 失败 ${s}`,
    "u.zh.ok": (d) => `[zh-patches] 已恢复 -> ${d}`, "u.zh.fail": (e) => `[zh-patches] 恢复失败: ${e}`,
    "u.commits": (n) => `[更新内容] 本次共 ${n} 个新提交:`,
    "u.commits.more": (n) => `  ... 其余 ${n} 条已省略`,
    "u.cleanup2": (n, d) => `[清理] 已关闭 ${n} 个多余 Hermes 进程 (${d})`,
    "u.killall.ok": (n) => `[收尾] 更新成功，已结束全部 Hermes 进程 (含 Gateway)，共 ${n} 个`,
    "bk.none": "未检测到有效 Hermes 安装, 无法备份", "bk.stop": "已停止 Hermes 进程", "bk.auto": "定时备份",
    "bk.disabled": "「备份与恢复」已在设置中关闭, 请先启用后再操作", "bk.export.title": "导出备份到...",
    "bk.done": (n) => `💾 备份完成: ${n}`, "bk.fail": (e) => `💾 备份失败: ${e}`,
    "bk.restored": (n) => `♻️ 已从备份恢复: ${n}`, "bk.restore.fail": (e) => `♻️ 恢复失败: ${e}`,
    "bk.del": (n) => `🗑️ 已删除备份: ${n}`, "bk.pruned": (n) => `已清理 ${n} 份超额备份`, "bk.exported": (f) => `已导出: ${f}`,
    "bk.nohash": "该备份没有 sha256 清单 (创建时未开启「生成校验清单」)",
    "bk.verify.ok": (n) => `✅ 校验通过: ${n} 个文件一致`, "bk.verify.bad": (n) => `❌ 校验失败: ${n} 个文件不一致或缺失`,
    "bk.scope.config": "配置", "bk.scope.env": "环境变量", "bk.scope.auth": "认证", "bk.scope.sessions": "会话", "bk.scope.skills": "技能/软件", "bk.scope.plugins": "插件", "bk.scope.zhpatches": "中文补丁",
    "bk.scope.memories": "记忆库", "bk.scope.vault": "凭据库", "bk.scope.hooks": "钩子脚本", "bk.scope.cron": "定时任务", "bk.scope.kanban": "看板", "bk.scope.projects": "项目库", "bk.scope.state": "状态库",
    "bk.scope.shared": "共享数据", "bk.scope.pets": "宠物", "bk.scope.platforms": "平台配置", "bk.scope.pairing": "配对/消息", "bk.scope.sandbox": "沙箱", "bk.scope.data": "数据包", "bk.scope.logs": "运行日志",
    "bk.pre": "恢复前", "bk.pre.done": (n) => `[恢复前] 已先备份当前状态: ${n}`, "bk.pre.fail": (e) => `[恢复前] 自动备份失败: ${e}`,
    "bk.preupd": "更新前", "bk.preupd.start": "📦 更新前自动备份用户数据...",
    "bk.preupd.ok": (n) => `📦 更新前备份完成: ${n}`, "bk.preupd.fail": (e) => `📦 更新前备份失败(不阻断更新): ${e}`,
    "bk.verify": (n, m) => `🔍 恢复校验: ${n} 项已落盘, ${m} 项缺失`,
    "res.ok": "✅ 更新成功，已是最新版本。",
    "res.partial": (b) => `⚠️ 更新流程结束 (rc=0) 但仍有落后 ${b} 个提交，可能未完全成功，请重试。`,
    "tag.build": "Node编译", "tag.deps": "Node依赖", "tag.locked": "文件占用", "tag.net": "网络", "tag.unknown": "未知",
    "fail.build": (rc, t) => `❌ 更新失败 (rc=${rc})[${t}]：缺 Visual Studio C++ 构建工具(get-windows 预编译包下载失败后回退编译)。建议: ① 确认代理可访问 github.com 后重试; ② 或安装 VS Build Tools C++ 工作负载。`,
    "fail.deps": (rc, t) => `❌ 更新失败 (rc=${rc})[${t}]：Node 依赖安装失败。建议重试; 反复失败则删除 hermes-agent\\node_modules 后再更新。`,
    "fail.locked": (rc, t) => `❌ 更新失败 (rc=${rc})[${t}]：文件被占用或权限不足。建议清理残留进程后重试。`,
    "fail.net": (rc, t) => `❌ 更新失败 (rc=${rc})[${t}]：网络/代理问题，请检查代理设置后重试。`,
    "fail.unknown": (rc, t) => `❌ 更新失败 (rc=${rc})[${t}]：请查看更新输出。`,
    "note.reason": "原因:", "note.behind": (n) => `落后 ${n}`, "note.newcommits": (n) => `新增 ${n} 提交`, "note.uptodate": "已是最新",
    "log.none": "(暂无日志)", "ver.fail": "(获取失败)",
    "zh.src.missing": (s) => `母本目录不存在: ${s}`, "zh.restored": (d) => `已恢复 -> ${d}`,
    "probe.direct": "直连 GitHub", "probe.system": "系统代理", "probe.manual": "手动代理", "probe.mirror": "镜像",
    "m.auto": "自动探测", "m.direct": "直连", "m.system": "系统代理", "m.manual": "手动代理", "m.mirror": "镜像",
    "netwatch.down": (l) => `❌ 网络巡检: 当前方案连续不可达 (${l}), 建议到诊断页运行测速对比`,
    "netwatch.up": (l) => `✅ 网络巡检: 网络已恢复 (${l})`,
    "ins.start": (r, v) => `[安装] 开始安装 Hermes (${v}) <- ${r}`,
    "ins.done": (d) => `✅ 安装完成: ${d}`,
    "ins.fail": (m) => `❌ 安装失败: ${m}`,
    "ins.apply": (d) => `[安装] 验证通过, 已设为当前管理路径: ${d}`,
    "u.fallback": (m) => `[镜像回退] 当前方式直连 GitHub 失败, 已自动切换到镜像 ${m}`,
    "u.fallback.fail": "[镜像回退] 直连与所有候选镜像均不可达, 按原方式继续尝试",
    "u.mirror.try": (m, r) => `[镜像探测] ${m} -> ${r}`,
    "u.retry": (a, left) => `[自动重试] 第 ${a} 次尝试失败, 剩余 ${left} 次重试...`,
    "u.retry.attempt": (a, l) => `[自动重试] 第 ${a} 次尝试, 网络方式 ${l}`,
    "tag.mirror": "镜像失效",
    "fail.mirror": (rc, t) => `❌ 更新失败 (rc=${rc})[${t}]：镜像无法代理 git 仓库。建议: ① 设置页换一个镜像地址或改用「自动探测」; ② 确认代理可直连 GitHub 后重试。`,
    "u.repair.env": "[自动修复] 已注入 Electron 二进制镜像 + npmmirror npm 源 (桌面打包阶段不再直连 GitHub)",
    "u.repair.proxy": (p) => `[自动修复] 已叠加代理环境 ${p} (上次失败于打包/依赖下载阶段)`,
    "u.target.apply": (t2) => `[目标] 已切换更新目标: ${t2}`,
    "u.target.fail": (m) => `[目标] 切换失败: ${m}`,
    "u.target.tag": (t2) => `[目标] 已锁定到标签 ${t2} (分离 HEAD, 供回溯使用)`,
    "hook.run": (n, c) => `[钩子:${n}] 执行: ${c}`,
    "hook.ok": (n) => `[钩子:${n}] 完成 ✔`,
    "hook.fail": (n, rc) => `[钩子:${n}] 失败 (exit=${rc})`,
    "hook.err": (e) => `[钩子] 异常: ${e}`,
    "hook.abort": "[钩子] 前置钩子失败且策略为中止 — 已取消本次更新",
    "hook.none": (p) => `[钩子:${p}] 未启用任何钩子, 跳过`,
    "tag.pack": "打包下载",
    "fail.pack": (rc, t) => `❌ 更新失败 (rc=${rc})[${t}]：桌面应用打包阶段下载 Electron 资源失败。已自动注入 Electron 镜像环境, 重试通常可一次成功。`,
    "u.disk.warn": (gb) => `[磁盘] 安装盘剩余空间仅 ${gb} GB, 更新可能因空间不足失败`,
    "u.start": "[开始] 开始检查并更新 Hermes Agent...",
    "notif.newver": (b, r) => `落后 ${b} 个提交 (远端 ${r})`,
    "notif.gw.up": "Gateway 已恢复运行", "notif.gw.down": "Gateway 掉线/已停止",
    "notif.upd.ok": "更新成功", "notif.upd.fail": (rc) => `更新失败 (rc=${rc})`,
    "notif.upd.start": "开始更新 Hermes Agent",
    "u.autoexec": (b) => `[自动更新] 检测到落后 ${b} 个提交, 自动开始更新`,
    "u.cancelled": "[取消] 已请求终止更新进程, 等待子进程退出...",
    "res.cancelled": "⛔ 更新已取消 (手动终止)",
    "note.cancelled": "已取消",
    "msg.notup": "当前没有进行中的更新",
    "msg.noproc": "未找到可终止的更新进程",
    "m.start": "[维护] 开始一键维护: git gc 仓库瘦身 + npm cache verify 缓存校验...",
    "m.gc.ok": "[维护] git gc 完成: 仓库对象已压缩瘦身",
    "m.gc.fail": (e) => `[维护] git gc 失败: ${e}`,
    "m.npm.ok": (n) => `[维护] npm cache verify 完成: 校验通过 ${n} 项`,
    "m.npm.done": (c) => `[维护] npm cache verify 结束 (exit=${c})`,
    "m.npm.fail": (e) => `[维护] npm cache verify 失败: ${e}`,
    "m.done": "[维护] 一键维护完成 ✔",
    "u.smoke.start": "[冒烟] 更新成功, 自动验证新版本可执行...",
    "u.smoke.ok": (v) => `[冒烟] 验证通过 ✅ (${v})`,
    "u.smoke.fail": (e) => `[冒烟] 验证失败 ⚠️ (${e}) — 可到诊断页运行 doctor 排查`,
    "wd.restarted": "🐕 守护: 检测到 Gateway 掉线, 已自动拉起",
    "wd.restart.fail": (rc) => `🐕 守护: Gateway 自动拉起失败 (rc=${rc}), 将在下次巡检重试`,
  },
  en: {
    "tray.dash": "📊 Dashboard", "tray.update": "🔄 Update", "tray.settings": "⚙️ Settings",
    "tray.diag": "🩺 Diagnostics", "tray.log": "📜 Logs", "tray.check": "Check for updates", "tray.quit": "Quit",
    "tray.backup": "💾 Backup & Restore", "tray.bk.now": "📦 Back up now", "tray.bk.restore": "♻️ Restore from backup…", "tray.bk.dir": "📂 Open backup folder", "tray.bk.settings": "⚙️ Backup settings", "tray.bk.done": "💾 Backup finished", "tray.bk.fail": "💾 Backup failed",
    "balloon.newver.title": "New Hermes version found",
    "balloon.newver.body": (n) => `${n} commit(s) behind. Open the updater and click "Update now".`,
    "balloon.done.ok.title": "Hermes update finished ✅", "balloon.done.ok.body": "Updated to the latest version.",
    "balloon.done.fail.title": "Hermes update failed ❌",
    "balloon.done.fail.body": (rc) => `Update failed (rc=${rc}). Open the updater to see why.`,
    "gw.up.title": "Gateway back online ✅", "gw.up.body": "Hermes Gateway is running again.",
    "gw.down.title": "Gateway offline ⚠️", "gw.down.body": "Gateway is not running. Click to handle.",
    "msg.busy": "An update is already in progress",
    "path.applied": (p) => `Hermes install path auto-detected and switched to: ${p}`,
    "path.found": (p) => `Hermes install detected: ${p} (apply it in Settings)`,
    "path.none": "No valid Hermes install detected. Please set the path in Settings.",
    "path.browse": "Select Hermes install folder",
    "report.title": "Export Diagnostics Report",
    "u.net": (m) => `Update: network method ${m}`,
    "u.clean1": (n) => `[Cleanup] Killed ${n} leftover Hermes process(es)`,
    "u.backup.ok": (s) => `[Backup] OK ${s}`, "u.backup.fail": (s) => `[Backup] FAILED ${s}`,
    "u.zh.ok": (d) => `[zh-patches] Restored -> ${d}`, "u.zh.fail": (e) => `[zh-patches] Restore failed: ${e}`,
    "u.commits": (n) => `[Changes] ${n} new commit(s):`,
    "u.commits.more": (n) => `  ... ${n} more omitted`,
    "u.cleanup2": (n, d) => `[Cleanup] Closed ${n} extra Hermes process(es) (${d})`,
    "u.killall.ok": (n) => `[Finalize] Update succeeded; terminated all Hermes processes (incl. Gateway), ${n} total`,
    "bk.none": "No valid Hermes install detected, cannot back up", "bk.stop": "Hermes processes stopped", "bk.auto": "Scheduled backup",
    "bk.disabled": "Backup & Restore is disabled in Settings; enable it first", "bk.export.title": "Export backup to...",
    "bk.done": (n) => `💾 Backup finished: ${n}`, "bk.fail": (e) => `💾 Backup failed: ${e}`,
    "bk.restored": (n) => `♻️ Restored from backup: ${n}`, "bk.restore.fail": (e) => `♻️ Restore failed: ${e}`,
    "bk.del": (n) => `🗑️ Backup deleted: ${n}`, "bk.pruned": (n) => `Pruned ${n} excess backup(s)`, "bk.exported": (f) => `Exported: ${f}`,
    "bk.nohash": "This backup has no sha256 manifest (hash manifest was off when it was created)",
    "bk.verify.ok": (n) => `✅ Verify passed: ${n} file(s) match`, "bk.verify.bad": (n) => `❌ Verify failed: ${n} file(s) differ or missing`,
    "bk.scope.config": "Config", "bk.scope.env": "Env vars", "bk.scope.auth": "Auth", "bk.scope.sessions": "Sessions", "bk.scope.skills": "Skills/software", "bk.scope.plugins": "Plugins", "bk.scope.zhpatches": "zh-patches",
    "bk.scope.memories": "Memories", "bk.scope.vault": "Vault", "bk.scope.hooks": "Hooks", "bk.scope.cron": "Cron jobs", "bk.scope.kanban": "Kanban", "bk.scope.projects": "Projects", "bk.scope.state": "State DB",
    "bk.scope.shared": "Shared data", "bk.scope.pets": "Pets", "bk.scope.platforms": "Platforms", "bk.scope.pairing": "Pairing", "bk.scope.sandbox": "Sandboxes", "bk.scope.data": "Data", "bk.scope.logs": "Logs",
    "bk.pre": "pre-restore", "bk.pre.done": (n) => `[Pre-restore] Current state backed up as: ${n}`, "bk.pre.fail": (e) => `[Pre-restore] Auto backup failed: ${e}`,
    "bk.preupd": "pre-update", "bk.preupd.start": "📦 Auto-backing up user data before update...",
    "bk.preupd.ok": (n) => `📦 Pre-update backup done: ${n}`, "bk.preupd.fail": (e) => `📦 Pre-update backup failed (update continues): ${e}`,
    "bk.verify": (n, m) => `🔍 Restore verified: ${n} item(s) on disk, ${m} missing`,
    "res.ok": "✅ Update succeeded. Already up to date.",
    "res.partial": (b) => `⚠️ Update finished (rc=0) but still ${b} commit(s) behind. It may not be complete, please retry.`,
    "tag.build": "Node build", "tag.deps": "Node deps", "tag.locked": "File locked", "tag.net": "Network", "tag.unknown": "Unknown",
    "fail.build": (rc, t) => `❌ Update failed (rc=${rc})[${t}]: Visual Studio C++ build tools missing (get-windows fell back to compiling). Try: 1) verify proxy can reach github.com and retry; 2) install VS Build Tools C++ workload.`,
    "fail.deps": (rc, t) => `❌ Update failed (rc=${rc})[${t}]: Node dependency install failed. Retry; if it keeps failing, delete hermes-agent\\node_modules and update again.`,
    "fail.locked": (rc, t) => `❌ Update failed (rc=${rc})[${t}]: file locked or access denied. Kill leftover processes and retry.`,
    "fail.net": (rc, t) => `❌ Update failed (rc=${rc})[${t}]: network/proxy issue. Check proxy settings and retry.`,
    "fail.unknown": (rc, t) => `❌ Update failed (rc=${rc})[${t}]: see update output for details.`,
    "note.reason": "reason:", "note.behind": (n) => `behind ${n}`, "note.newcommits": (n) => `+${n} commits`, "note.uptodate": "up to date",
    "log.none": "(no logs yet)", "ver.fail": "(failed)",
    "zh.src.missing": (s) => `Source dir does not exist: ${s}`, "zh.restored": (d) => `Restored -> ${d}`,
    "probe.direct": "Direct GitHub", "probe.system": "System proxy", "probe.manual": "Manual proxy", "probe.mirror": "Mirror",
    "m.auto": "Auto probe", "m.direct": "Direct", "m.system": "System proxy", "m.manual": "Manual proxy", "m.mirror": "Mirror",
    "netwatch.down": (l) => `❌ Net watch: current method unreachable repeatedly (${l}), try speed test on Diagnostics page`,
    "netwatch.up": (l) => `✅ Net watch: connectivity restored (${l})`,
    "ins.start": (r, v) => `[Install] Installing Hermes (${v}) from ${r}`,
    "ins.done": (d) => `✅ Install finished: ${d}`,
    "ins.fail": (m) => `❌ Install failed: ${m}`,
    "ins.apply": (d) => `[Install] Validated, set as managed path: ${d}`,
    "u.fallback": (m) => `[Mirror fallback] GitHub unreachable via current method, switched to mirror ${m}`,
    "u.fallback.fail": "[Mirror fallback] Neither direct nor any candidate mirror reachable, continuing as-is",
    "u.mirror.try": (m, r) => `[Mirror probe] ${m} -> ${r}`,
    "u.retry": (a, left) => `[Auto retry] Attempt ${a} failed, ${left} retry(ies) left...`,
    "u.retry.attempt": (a, l) => `[Auto retry] Attempt ${a}, network method ${l}`,
    "tag.mirror": "Mirror broken",
    "fail.mirror": (rc, t) => `❌ Update failed (rc=${rc})[${t}]: mirror cannot proxy the git repo. Try: 1) change mirror URL in Settings or use "Auto probe"; 2) verify proxy can reach GitHub directly, then retry.`,
    "u.repair.env": "[Auto repair] Injected Electron binary mirror + npmmirror npm registry (desktop packaging no longer hits GitHub directly)",
    "u.repair.proxy": (p) => `[Auto repair] Overlaid proxy env ${p} (previous failure was at packaging/dependency download stage)`,
    "u.target.apply": (t2) => `[Target] Update target switched: ${t2}`,
    "u.target.fail": (m) => `[Target] Switch failed: ${m}`,
    "u.target.tag": (t2) => `[Target] Locked to tag ${t2} (detached HEAD, for time travel)`,
    "hook.run": (n, c) => `[Hook:${n}] Run: ${c}`,
    "hook.ok": (n) => `[Hook:${n}] Done ✔`,
    "hook.fail": (n, rc) => `[Hook:${n}] Failed (exit=${rc})`,
    "hook.err": (e) => `[Hook] Error: ${e}`,
    "hook.abort": "[Hook] Pre-update hook failed with abort policy — update cancelled",
    "hook.none": (p) => `[Hook:${p}] No hooks enabled, skipped`,
    "tag.pack": "Package download",
    "fail.pack": (rc, t) => `❌ Update failed (rc=${rc})[${t}]: failed to download Electron resources during desktop packaging. Electron mirror env has been auto-injected; a retry usually succeeds.`,
    "u.disk.warn": (gb) => `[Disk] Only ${gb} GB free on install drive, update may fail`,
    "u.start": "[Start] Checking and updating Hermes Agent...",
    "notif.newver": (b, r) => `${b} commit(s) behind (remote ${r})`,
    "notif.gw.up": "Gateway is back online", "notif.gw.down": "Gateway offline/stopped",
    "notif.upd.ok": "Update succeeded", "notif.upd.fail": (rc) => `Update failed (rc=${rc})`,
    "notif.upd.start": "Updating Hermes Agent",
    "u.autoexec": (b) => `[Auto-update] ${b} commit(s) behind, starting update automatically`,
    "u.cancelled": "[Cancel] Termination requested, waiting for child process to exit...",
    "res.cancelled": "⛔ Update cancelled (manually stopped)",
    "note.cancelled": "cancelled",
    "msg.notup": "No update in progress",
    "msg.noproc": "No update process found to stop",
    "m.start": "[Maintain] Starting: git gc repo slimming + npm cache verify...",
    "m.gc.ok": "[Maintain] git gc done: repo objects compacted",
    "m.gc.fail": (e) => `[Maintain] git gc failed: ${e}`,
    "m.npm.ok": (n) => `[Maintain] npm cache verify done: ${n} entries verified`,
    "m.npm.done": (c) => `[Maintain] npm cache verify finished (exit=${c})`,
    "m.npm.fail": (e) => `[Maintain] npm cache verify failed: ${e}`,
    "m.done": "[Maintain] All done ✔",
    "u.smoke.start": "[Smoke] Updated, verifying the new version...",
    "u.smoke.ok": (v) => `[Smoke] Verification passed ✅ (${v})`,
    "u.smoke.fail": (e) => `[Smoke] Verification FAILED ⚠️ (${e}) — run doctor on the Diagnostics page`,
    "wd.restarted": "🐕 Watchdog: Gateway was offline, restarted automatically",
    "wd.restart.fail": (rc) => `🐕 Watchdog: failed to restart Gateway (rc=${rc}), will retry next sweep`,
  },
};
function t(key, ...args) {
  const lang = I18N[S.language] ? S.language : "zh";
  const v = (I18N[lang] || I18N.zh)[key];
  if (v === undefined) return (I18N.zh[key] !== undefined ? I18N.zh[key] : key);
  return typeof v === "function" ? v(...args) : v;
}
function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8")) }; }
  catch { return { ...DEFAULTS }; }
}
function saveSettings() { fs.writeFileSync(SETTINGS_PATH, JSON.stringify(S, null, 2), "utf8"); }

// ---------------- 日志 ----------------
function log(msg) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const line = `[${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}] ${msg}`;
  try { fs.appendFileSync(LOG_PATH, line + "\n", "utf8"); } catch {}
  try { cleanupOldLog(); } catch {}
}
function cleanupOldLog() {
  const days = parseInt(S.log_retention_days) || 14;
  try {
    const st = fs.statSync(LOG_PATH);
    if (Date.now() - st.mtimeMs > days * 86400e3) fs.unlinkSync(LOG_PATH);
  } catch {}
}

// ---------------- 历史 ----------------
function getHistory() { try { return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8")); } catch { return []; } }
function appendHistory(e) {
  const h = getHistory(); h.unshift(e);
  const max = parseInt(S.history_max) || 50;
  while (h.length > Math.min(Math.max(max, 10), 500)) h.pop();
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(h, null, 2), "utf8");
}

// ---------------- 桌面系统通知 (Windows toast) ----------------
// Electron 22 在 Windows 需要 AppUserModelID 才能弹 toast; 点击通知聚焦主窗口
app.setAppUserModelId("com.hermes.updater");
function desktopNotify(kind, text) {
  if (S.notify_desktop === false) return;
  try {
    // 窗口可见且聚焦时不打扰 (应用内已有 toast/通知中心)
    if (win && win.isVisible() && win.isFocused()) return;
    const titles = {
      ok: t("notif.upd.ok"), fail: t("notif.upd.fail", ""), newver: t("balloon.newver.title"),
      gw: t("notif.gw.up"), path: t("tray.settings"),
    };
    const n = new Notification({
      title: `HermesUpdater · ${titles[kind] || t("tray.dash")}`.replace(/[:：]?\s*$/, ""),
      body: String(text || "").slice(0, 200),
      icon: path.join(__dirname, "app.ico"), silent: false,
    });
    n.on("click", () => { try { if (win) { win.show(); win.focus(); } } catch {} });
    n.show();
  } catch {}
}

// ---------------- 更新钩子执行器 (pre/post/fail) ----------------
function runHooks(phase, sendLine, env = {}) {
  const hooks = (Array.isArray(S.hooks) ? S.hooks : []).filter((h) => h && h.enabled !== false && h.phase === phase && String(h.cmd || "").trim());
  if (!hooks.length) return Promise.resolve(true);
  return (async () => {
    for (const h of hooks) {
      const name = String(h.name || phase);
      const to = Math.min(Math.max(parseInt(h.timeout) || 60, 5), 600) * 1000;
      sendLine(t("hook.run", name, h.cmd));
      const rc = await new Promise((resolve) => {
        try {
          const p = spawn("cmd.exe", ["/d", "/s", "/c", String(h.cmd)], { windowsHide: true, windowsVerbatimArguments: true, timeout: to, cwd: agentDir(), env: { ...baseEnv(), ...env } });
          p.stdout.on("data", (d) => decodeBuf(d).split(/\r?\n/).filter(Boolean).forEach((l) => sendLine(`  [hook] ${l}`)));
          p.stderr.on("data", (d) => decodeBuf(d).split(/\r?\n/).filter(Boolean).forEach((l) => sendLine(`  [hook!] ${l}`)));
          p.on("error", (e) => { sendLine(t("hook.err", String(e).slice(0, 120))); resolve(-1); });
          p.on("close", (code) => resolve(code ?? -1));
        } catch (e) { sendLine(t("hook.err", String(e).slice(0, 120))); resolve(-1); }
      });
      if (rc !== 0) {
        sendLine(t("hook.fail", name, rc));
        if (phase === "pre" && h.abort !== false) { sendLine(t("hook.abort")); return false; }
      } else sendLine(t("hook.ok", name));
    }
    return true;
  })();
}

// ---------------- Webhook 推送 (POST JSON) ----------------
function sendWebhook(event, extra = {}) {
  const url = String(S.webhook_url || "").trim();
  if (!url || !/^https?:\/\//.test(url)) return;
  try {
    const u = new URL(url);
    const mod = u.protocol === "https:" ? https : http;
    const payload = JSON.stringify({ event, app: "HermesUpdater", version: app.getVersion(), time: new Date().toISOString(), ...extra });
    const req = mod.request(u, {
      method: "POST", timeout: 10000,
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload), ...(S.webhook_secret ? { "X-Hermes-Secret": String(S.webhook_secret) } : {}) },
    }, (res) => { res.resume(); log(`[Webhook] ${event} -> HTTP ${res.statusCode}`); });
    req.on("error", (e) => log(`[Webhook] ${event} 失败: ${String(e).slice(0, 120)}`));
    req.on("timeout", () => { try { req.destroy(); } catch {} log(`[Webhook] ${event} 超时`); });
    req.write(payload);
    req.end();
  } catch (e) { log(`[Webhook] ${event} 异常: ${String(e).slice(0, 120)}`); }
}

// ---------------- 新版本稍后提醒 (snooze) ----------------
function snoozeActive() { return (Number(S.snooze_until) || 0) > Date.now(); }

// ---------------- 应用内通知中心 ----------------
const NOTIF_PATH = path.join(APP_DIR, "notifications.json");
function getNotifications() { try { return JSON.parse(fs.readFileSync(NOTIF_PATH, "utf8")); } catch { return []; } }
function notifyEvent(kind, text) {
  if (S.notifications_enabled === false) return;
  try {
    const list = getNotifications();
    list.unshift({ kind, text, time: (() => { const d = new Date(), p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; })(), read: false });
    while (list.length > 100) list.pop();
    fs.writeFileSync(NOTIF_PATH, JSON.stringify(list, null, 2), "utf8");
    try { win && win.webContents.send("notification", list[0]); } catch {}
    if (["ok", "fail", "newver", "gw"].includes(kind)) desktopNotify(kind, text);
  } catch {}
}

// ---------------- 磁盘空间检查 ----------------
function getFreeDiskGB(dir) {
  return new Promise((resolve) => {
    const drive = path.parse(path.resolve(dir)).root.replace(/\\$/, ""); // 如 "C:"
    execFile("powershell", ["-NoProfile", "-Command", `Math.Round((Get-PSDrive -Name '${drive[0]}').Free/1GB, 1)`],
      { windowsHide: true, timeout: 15000 }, (e, out) => {
        const v = parseFloat(out);
        resolve(e || isNaN(v) ? null : v);
      });
  });
}

// ---------------- 网络探测 ----------------
function testUrl2(url, proxy, timeout = 8000) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const opts = { hostname: u.hostname, port: u.port || 443, path: u.pathname, method: "GET", timeout };
      if (proxy) {
        const p = new URL(proxy);
        // 通过 http 代理隧道: 简化处理 - 直连测试失败时由用户手动选代理
        opts.host = p.hostname; opts.port = p.port || 8080;
      }
      const req = https.request(opts, (res) => resolve([200, 301, 302, 403].includes(res.statusCode)));
      req.on("timeout", () => { req.destroy(); resolve(false); });
      req.on("error", () => resolve(false));
      req.end();
    } catch { resolve(false); }
  });
}

function detectSystemProxy() {
  return new Promise((resolve) => {
    const key = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
    execFile("reg", ["query", key, "/v", "ProxyEnable"], { windowsHide: true }, (e1, o1) => {
      if (e1 || !/0x1/.test(o1 || "")) return resolve(envProxy());
      execFile("reg", ["query", key, "/v", "ProxyServer"], { windowsHide: true }, (e2, o2) => {
        if (e2) return resolve(envProxy());
        const m = (o2 || "").match(/REG_SZ\s+(\S+)/);
        resolve(m ? m[1] : envProxy());
      });
    });
  });
  function envProxy() {
    for (const v of ["HTTPS_PROXY", "HTTP_PROXY", "https_proxy", "http_proxy"])
      if (process.env[v]) return process.env[v];
    return null;
  }
}

function proxyEnv(proxy) {
  return {
    HTTP_PROXY: proxy, HTTPS_PROXY: proxy, http_proxy: proxy, https_proxy: proxy,
    npm_config_proxy: proxy, npm_config_https_proxy: proxy,
  };
}

async function pickMethod() {
  const sysProxy = await detectSystemProxy();
  const manual = S.manual_proxy || "";
  const mirror = (S.mirror_url || "").replace(/\/$/, "") + "/";
  const label = { direct: "直连", system: "系统代理", manual: "手动代理", mirror: "镜像", auto: "自动" }[S.auto_switch] || "自动";
  if (S.auto_switch === "direct") return { env: {}, label: "直连" };
  if (S.auto_switch === "system") return sysProxy ? { env: proxyEnv(sysProxy), label: `系统代理 ${sysProxy}` } : { env: {}, label: "直连(无系统代理)" };
  if (S.auto_switch === "manual") return manual ? { env: proxyEnv(manual), label: `手动代理 ${manual}` } : { env: {}, label: "直连(未配置手动代理)" };
  if (S.auto_switch === "mirror") {
    const m = await pickWorkingMirror(null);
    return m ? { env: mirrorEnv(m), label: `镜像 ${m}` } : { env: {}, label: "直连(镜像不可用)" };
  }
  // auto: 依次探测
  const GITHUB = "https://github.com";
  if (await testUrl2(GITHUB)) return { env: {}, label: "直连" };
  if (sysProxy && await testUrl2(GITHUB, sysProxy, 6000)) return { env: proxyEnv(sysProxy), label: `系统代理 ${sysProxy}` };
  const wm = await pickWorkingMirror(null);
  if (wm) return { env: mirrorEnv(wm), label: `镜像 ${wm}` };
  if (manual && await testUrl2(GITHUB, manual, 6000)) return { env: proxyEnv(manual), label: `手动代理 ${manual}` };
  if (sysProxy) return { env: proxyEnv(sysProxy), label: `系统代理(兜底) ${sysProxy}` };
  return { env: {}, label: "直连(兜底)" };
}
function mirrorEnv(mirror) {
  // ghproxy 系镜像为"前缀式": https://镜像/https://github.com/owner/repo
  // 旧写法只拼镜像根导致 git 报 "not valid: is this a git repository?"
  const base = (mirror || "").replace(/\/$/, "") + "/";
  return {
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: `url.${base}https://github.com/.insteadOf`,
    GIT_CONFIG_VALUE_0: "https://github.com/",
  };
}

// ---------------- 镜像候选与 git 可用性探测 ----------------
const FALLBACK_MIRRORS = [
  "https://ghproxy.net/", "https://ghfast.top/", "https://ghproxy.cc/",
  "https://ghproxy.link/", "https://ghproxy.cn/", "https://gh.ddlc.top/",
  "https://mirror.ghproxy.com/", "https://gh-proxy.com/",
];
function candidateMirrors() {
  const first = (S.mirror_url || "").replace(/\/$/, "") + "/";
  return [first, ...FALLBACK_MIRRORS.filter((m) => m !== first)].filter((m) => m && /^https?:\/\//.test(m));
}
async function originRepoPath() {
  const out = await git(["remote", "get-url", "origin"], 20000);
  const m = (out || "").match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\s*\/?\s*$/i);
  return m ? `${m[1]}/${m[2]}` : null;
}
// git 协议级探测: info/refs 必须返回 200 且 content-type 为 x-git-upload-pack-advertisement
// (实测 ghproxy.cn 失效时返回 200 + text/html, 只看状态码会误判可用)
function probeGitUrl(url, timeout = 7000) {
  return new Promise((resolve) => {
    try {
      const req = https.request(url, { method: "GET", timeout }, (res) => {
        const ct = (res.headers["content-type"] || "").toLowerCase();
        const ok = res.statusCode === 200 && ct.includes("x-git-upload-pack-advertisement");
        res.resume();
        resolve(ok);
      });
      req.on("timeout", () => { req.destroy(); resolve(false); });
      req.on("error", () => resolve(false));
      req.end();
    } catch { resolve(false); }
  });
}
async function probeMirrorGit(mirror) {
  const repo = await originRepoPath();
  if (!repo) return false;
  return probeGitUrl(`${mirror}https://github.com/${repo}/info/refs?service=git-upload-pack`);
}
// 依次探测候选镜像, 返回第一个 git 可用的
async function pickWorkingMirror(sendLine) {
  for (const m of candidateMirrors()) {
    const ok = await probeMirrorGit(m);
    if (sendLine) sendLine(ok ? t("u.mirror.try", m, "OK") : t("u.mirror.try", m, "FAIL"));
    if (ok) return m;
  }
  return null;
}

// ---------------- Hermes 操作 ----------------
const install = () => S.install_path;
const agentDir = () => path.join(install(), "hermes-agent");
const hermesCmd = () => path.join(install(), "bin", "hermes.cmd");

// ---------------- 安装路径自动识别 ----------------
// 校验一个候选安装目录: 存在性 / hermes.cmd / hermes-agent / 可写性 / 磁盘剩余
function validateInstallPath(p) {
  const r = { path: p, exists: false, hasCmd: false, hasAgent: false, hasGit: false, writable: false, freeGB: null, valid: false };
  try {
    r.exists = fs.existsSync(p) && fs.statSync(p).isDirectory();
    if (!r.exists) return r;
    r.hasCmd = fs.existsSync(path.join(p, "bin", "hermes.cmd"));
    r.hasAgent = fs.existsSync(path.join(p, "hermes-agent"));
    r.hasGit = fs.existsSync(path.join(p, "hermes-agent", ".git"));
    try { fs.accessSync(p, fs.constants.W_OK); r.writable = true; } catch {}
    try { const st = fs.statfsSync(p); r.freeGB = +((st.bavail * st.bsize) / 1073741824).toFixed(1); } catch {}
    r.valid = r.hasCmd && r.hasAgent;
  } catch {}
  return r;
}
// 枚举本机存在的盘符 (C:\ ~ Z:\)
function listDrives() {
  const out = [];
  for (let c = 67; c <= 90; c++) { const d = String.fromCharCode(c) + ":\\"; try { if (fs.existsSync(d)) out.push(d); } catch {} }
  return out;
}
// 探测所有候选位置并逐一校验, 有效安装排最前
async function detectHermesInstalls(deep) {
  const cands = new Set();
  const add = (p) => { try { if (p) cands.add(path.resolve(String(p).trim())); } catch {} };
  add(S.install_path);
  const env = process.env;
  [
    [env.LOCALAPPDATA, "hermes"],
    [env.LOCALAPPDATA, path.join("Programs", "hermes")],
    [env.APPDATA, "hermes"],
    [env.ProgramFiles, "hermes"],
    [env["ProgramFiles(x86)"], "hermes"],
    [env.USERPROFILE, "hermes"],
    [env.USERPROFILE, ".hermes"],
  ].forEach(([b, ...rest]) => { if (b) add(path.join(b, ...rest)); });
  (S.path_history || []).forEach(add);
  // 盘符常见位置浅扫
  for (const d of listDrives()) {
    ["hermes", "Hermes", path.join("Program Files", "hermes"), path.join("Program Files", "Hermes"), path.join("apps", "hermes")].forEach((x) => add(path.join(d, x)));
  }
  // 深度扫描: 每个盘符根目录一级找 hermes* (稍慢, 设置项控制)
  if (deep) {
    for (const d of listDrives()) {
      try { for (const name of fs.readdirSync(d)) { if (/^hermes/i.test(name)) add(path.join(d, name)); } } catch {}
    }
  }
  // PATH 里的 hermes 命令 -> 反推安装根目录 (...\bin\hermes.cmd -> 上两级)
  try {
    const where = await new Promise((res) => execFile("where.exe", ["hermes"], { windowsHide: true, timeout: 8000 }, (e, so) => res(e ? "" : so || "")));
    String(where).split(/\r?\n/).forEach((line) => { const lp = line.trim(); if (lp) add(path.dirname(path.dirname(lp))); });
  } catch {}
  const results = [];
  for (const c of cands) { const v = validateInstallPath(c); if (v.exists) results.push(v); }
  results.sort((a, b) => (b.valid - a.valid) || (b.hasCmd - a.hasCmd) || a.path.localeCompare(b.path));
  return results;
}
// 启动自动识别: 当前路径无效时探测, 按设置自动切换或仅提醒
async function autoDetectOnStartup() {
  try {
    if (!S.path_auto_detect) return;
    const cur = validateInstallPath(S.install_path);
    if (cur.valid) return;
    log(`[路径] 当前安装路径无效 (${S.install_path}), 开始自动识别...`);
    const found = await detectHermesInstalls(!!S.path_deep_scan);
    const best = found.find((f) => f.valid);
    if (best && S.path_auto_apply !== false) {
      S.install_path = best.path;
      S.path_history = [...new Set([best.path, ...(S.path_history || [])])].slice(0, 8);
      saveSettings();
      log(`[路径] 已自动切换到有效安装: ${best.path}`);
      notifyEvent("path", t("path.applied", best.path));
      try { win && win.webContents.send("settings-updated", { ...S }); } catch {}
    } else if (best) {
      log(`[路径] 检测到有效安装 (按设置为仅提醒): ${best.path}`);
      notifyEvent("path", t("path.found", best.path));
      try { win && win.webContents.send("settings-updated", null); } catch {}
    } else {
      log("[路径] 未检测到有效 Hermes 安装, 请在设置中手动指定");
      notifyEvent("path", t("path.none"));
    }
  } catch (e) { log(`[路径] 自动识别出错: ${e}`); }
}
// 运行时路径监控: 有效 -> 失效的跳变才触发 (60 秒一轮, 更新期间跳过)
let pathWatchTimer = null, lastPathValid = null;
function setupPathWatch() {
  if (pathWatchTimer) { clearInterval(pathWatchTimer); pathWatchTimer = null; }
  if (!S.path_watch) { lastPathValid = null; return; }
  pathWatchTimer = setInterval(async () => {
    try {
      if (updating) return;
      const v = validateInstallPath(S.install_path).valid;
      if (lastPathValid === true && !v) {
        log(`[路径监控] 安装路径失效 (${S.install_path})`);
        if (S.path_auto_detect !== false) await autoDetectOnStartup();
        else { notifyEvent("path", t("path.none")); try { win && win.webContents.send("settings-updated", null); } catch {} }
      }
      lastPathValid = validateInstallPath(S.install_path).valid;
    } catch {}
  }, 60000);
}

function baseEnv() { const e = { ...process.env }; delete e.NODE_OPTIONS; return e; }

function runHermes(args, timeout = 600000, extraEnv = {}) {
  return new Promise((resolve) => {
    const env = { ...baseEnv(), ...extraEnv };
    // Node 22 起 spawn .cmd 必须经 cmd.exe
    const p = spawn("cmd.exe", ["/d", "/s", "/c", `"${hermesCmd()}" ${args.join(" ")}`], {
      env, cwd: agentDir(), windowsHide: true,
      shell: false, windowsVerbatimArguments: true,
    });
    let out = "";
    const timer = setTimeout(() => { try { p.kill(); } catch {} resolve([-1, out + "\n[超时]"]); }, timeout);
    p.stdout.on("data", (d) => { out += decodeBuf(d); });
    p.stderr.on("data", (d) => { out += decodeBuf(d); });
    p.on("error", (e) => { clearTimeout(timer); resolve([-2, String(e)]); });
    p.on("close", (rc) => { clearTimeout(timer); resolve([rc ?? -1, out]); });
  });
}
function decodeBuf(buf) {
  try { return buf.toString("utf8"); } catch { return buf.toString("latin1"); }
}

function git(args, timeout, extraEnv = {}) {
  timeout = timeout || (parseInt(S.git_timeout) * 1000 || 30000); // 设置页"git 超时(秒)"生效点
  return new Promise((resolve) => {
    const p = spawn("git", args, { env: { ...baseEnv(), ...extraEnv }, cwd: agentDir(), windowsHide: true });
    let out = "";
    const t = setTimeout(() => { try { p.kill(); } catch {} resolve(""); }, timeout);
    p.stdout.on("data", (d) => (out += d.toString("utf8")));
    p.stderr.on("data", (d) => (out += d.toString("utf8")));
    p.on("close", () => { clearTimeout(t); resolve(out); });
    p.on("error", () => { clearTimeout(t); resolve(""); });
  });
}

async function getStatus() {
  const { env, label } = await pickMethod();
  const version = await runHermes(["--version"], 60000, env);
  await git(["fetch", "origin"], 300000, env);
  const head = (await git(["rev-parse", "--short", "HEAD"])).trim();
  const cnt = (await git(["rev-list", "--left-right", "--count", `HEAD...origin/${S.branch}`])).trim();
  const rhead = (await git(["rev-parse", "--short", `origin/${S.branch}`])).trim();
  let behind = 0, ahead = 0;
  if (cnt) { const [a, b] = cnt.split(/\s+/); ahead = parseInt(a) || 0; behind = parseInt(b) || 0; }
  const [gwRc, gwOut] = await runHermes(["gateway", "status"], 60000, env);
  const failed = behind < 0 || !head;
  // 上次更新是否真正完成: git 已追上远端(head 匹配)但上次 rc!=0 时, 不能误判为"已是最新"
  let incomplete = false, incompleteReason = "";
  try {
    const us = loadUpdateState();
    if (us && us.incomplete && head && us.head === head && behind <= 0) { incomplete = true; incompleteReason = us.reason || ""; }
  } catch {}
  return {
    ok: !failed && !incomplete, version: (version[1] || "").split("\n")[0] || t("ver.fail"),
    head, rhead, behind: head ? behind : -1, ahead,
    gateway: (gwOut || "").split("\n")[0] || `(rc=${gwRc})`, method: label,
    incomplete, incompleteReason,
  };
}

function updateStateFile() { try { return path.join(app.getPath("userData"), "update-state.json"); } catch { return ""; } }
function loadUpdateState() {
  try { const f = updateStateFile(); if (!f || !fs.existsSync(f)) return null; return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; }
}
function saveUpdateState(obj) {
  try { const f = updateStateFile(); if (f) fs.writeFileSync(f, JSON.stringify(obj), "utf8"); } catch {}
}

function backupBeforeUpdate() {
  return new Promise((resolve) => {
    const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "").slice(0, 8) + "-" +
      new Date().toTimeString().slice(0, 8).replace(/:/g, "");
    const bdir = path.join(install(), "backups", ts);
    try {
      fs.mkdirSync(bdir, { recursive: true });
      const cfg = path.join(install(), "config.yaml");
      if (fs.existsSync(cfg)) fs.copyFileSync(cfg, path.join(bdir, "config.yaml"));
      const zp = path.join(agentDir(), "zh-patches");
      if (fs.existsSync(zp)) fs.cpSync(zp, path.join(bdir, "zh-patches"), { recursive: true });
      git(["rev-parse", "HEAD"]).then((h) => {
        try { fs.writeFileSync(path.join(bdir, "HEAD.txt"), h.trim(), "utf8"); } catch {}
        // 备份自动清理: 只删 backups 下时间戳命名目录, 保留最近 keep_backups 份
        const root = path.join(install(), "backups");
        let removed = 0;
        try {
          const keep = Math.max(parseInt(S.keep_backups) || 0, 0);
          const dirs = fs.readdirSync(root).filter((d) => /^\d{8}-\d{6}$/.test(d)).sort().reverse();
          for (const d of dirs.slice(keep)) { try { fs.rmSync(path.join(root, d), { recursive: true, force: true }); removed++; } catch {} }
        } catch {}
        resolve([true, bdir + (removed ? ` (已清理 ${removed} 个旧备份)` : "")]);
      });
    } catch (e) { resolve([false, String(e)]); }
  });
}

function killHermesProcesses(excludePids = [], killGateway = true) {
  return new Promise((resolve) => {
    const agent = agentDir().replace(/\\/g, "/").toLowerCase();
    const inst = install().replace(/\\/g, "/").toLowerCase();
    const excl = new Set(excludePids);
    execFile("wmic", ["process", "get", "ProcessId,CommandLine"], { windowsHide: true, maxBuffer: 32e6 },
      (e, out) => {
        const finish = (killed, detail) => resolve([killed, detail]);
        if (e || !out) {
          // PowerShell 回退
          execFile("powershell", ["-NoProfile", "-Command",
            "Get-CimInstance Win32_Process | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress"],
            { windowsHide: true, maxBuffer: 32e6 }, (e2, o2) => {
              if (e2 || !o2) return finish(0, "枚举进程失败");
              try {
                const arr = JSON.parse(o2);
                const procs = Array.isArray(arr) ? arr : [arr];
                const targets = [];
                for (const p of procs) {
                  const cl = (p.CommandLine || "").replace(/\\/g, "/").toLowerCase();
                  if (!cl.includes(agent) && !cl.includes(inst)) continue;
                  const pid = parseInt(p.ProcessId);
                  if (!pid || excl.has(pid) || pid === process.pid) continue;
                  if (!killGateway && /gateway/i.test(cl)) continue;
                  targets.push(pid);
                }
                doKill(targets);
              } catch { finish(0, "解析失败"); }
            });
          return;
        }
        const targets = [];
        for (const ln of (out || "").split("\n")) {
          const cl = ln.replace(/\\/g, "/").toLowerCase();
          if (!cl.includes(agent) && !cl.includes(inst)) continue;
          const m = ln.match(/(\d+)\s*$/);
          if (!m) continue;
          const pid = parseInt(m[1]);
          if (!pid || excl.has(pid) || pid === process.pid) continue;
          if (!killGateway && /gateway/i.test(ln)) continue;
          targets.push(pid);
        }
        doKill(targets);
      });
    function doKill(pids) {
      if (!pids.length) return resolve([0, ""]);
      let done = 0;
      for (const pid of pids) {
        execFile("taskkill", ["/F", "/PID", String(pid)], { windowsHide: true }, () => {
          if (++done === pids.length) resolve([pids.length, pids.join(",")]);
        });
      }
    }
  });
}

// ---------------- 更新流 ----------------
let updating = false;
let updProc = null;    // 当前更新的子进程 (取消更新用)
let updCancel = false; // 用户已请求取消
let psbId = null;      // powerSaveBlocker id (更新期间防止系统睡眠中断更新)
async function startUpdate(win) {
  if (updating) return { ok: false, msg: t("msg.busy") };
  updating = true;
  updCancel = false;
  try { if (psbId === null || !powerSaveBlocker.isStarted(psbId)) psbId = powerSaveBlocker.start("prevent-app-suspension"); } catch {}
  try { win && win.webContents.send("update-started", {}); } catch {} // 手动/自动统一: 渲染层收到后准备更新页 UI
  startUpdate._buf = [];
  startUpdate._t0 = Date.now();
  git(["rev-parse", "--short", "HEAD"]).then((h) => { startUpdate._oldHead = h.trim(); }).catch(() => {});
  const send = (ch, data) => { try { win.webContents.send(ch, data); } catch {} };
  const sendLine = (msg) => {
    startUpdate._buf.push(msg);
    if (startUpdate._buf.length > 4000) startUpdate._buf.splice(0, 1000);
    send("update-line", msg);
  };
  (async () => {
    let env = {}, label = "";
    notifyEvent("update", t("notif.upd.start"));
    sendLine(t("u.start"));
    // 更新前自动备份 (bk_on_update): 更新把代码换掉前先留一份用户数据, 失败可回滚
    if (S.bk_enabled !== false && S.bk_on_update) {
      sendLine(t("bk.preupd.start"));
      const pb = await bkBackupNow(t("bk.preupd"), S.bk_scope);
      if (pb && pb.ok) { sendLine(t("bk.preupd.ok", pb.name)); log(`[备份] ${t("bk.preupd.ok", pb.name)}`); }
      else { sendLine(t("bk.preupd.fail", (pb && pb.msg) || "?")); log(`[备份] ${t("bk.preupd.fail", (pb && pb.msg) || "?")}`); }
    }
    // 更新前磁盘空间检查 (仅警告, 不阻断; 整个更新流程只查一次)
    if (S.disk_check !== false) {
      const free = await getFreeDiskGB(install());
      if (free != null && free < 2) { sendLine(t("u.disk.warn", free)); log(t("u.disk.warn", free)); }
    }
    // 更新目标: 开启锁定时, 更新前强制 checkout 到指定分支/标签
    // (partial clone 离线时 checkout 输出可能含 fatal 但已成功 -> 用 rev-parse 验证)
    const tgt0 = String(S.upd_target || "").trim();
    if (tgt0 && S.upd_target_lock) {
      const [k0, ...rr0] = tgt0.split(":"); const nm0 = rr0.join(":");
      if (k0 === "branch") {
        await git(["checkout", "-B", nm0, `origin/${nm0}`], 180000);
        const v0 = (await git(["rev-parse", "--abbrev-ref", "HEAD"], 30000) || "").trim();
        sendLine(v0 === nm0 ? t("u.target.apply", `branch:${nm0}`) : t("u.target.fail", "git checkout"));
      } else if (k0 === "tag") {
        await git(["fetch", "--all", "--prune", "--tags"], 180000);
        await git(["checkout", `tags/${nm0}`], 90000);
        const v0 = (await git(["describe", "--tags", "--exact-match"], 30000) || "").trim();
        sendLine(v0 === nm0 ? t("u.target.tag", nm0) : t("u.target.fail", "git checkout"));
      }
    }
    // 前置钩子: 任一「中止」策略钩子失败 -> 取消本次更新
    if (!(await runHooks("pre", sendLine))) {
      const d0 = new Date(); const pad0 = (n) => String(n).padStart(2, "0");
      try { appendHistory({ time: `${d0.getFullYear()}-${pad0(d0.getMonth() + 1)}-${pad0(d0.getDate())} ${pad0(d0.getHours())}:${pad0(d0.getMinutes())}:${pad0(d0.getSeconds())}`, rc: -3, label: "hook", dur: "0s", result: "fail", old: (startUpdate._oldHead || "").slice(0, 7), new: "", note: "pre-hook abort" }); } catch {}
      send("update-done", { rc: -3, result: t("hook.abort"), rkey: "fail" });
      notifyEvent("fail", t("hook.abort"));
      sendWebhook("update.fail", { rc: -3, reason: "pre-hook abort" });
      updating = false;
      try { if (psbId !== null && powerSaveBlocker.isStarted(psbId)) powerSaveBlocker.stop(psbId); } catch {}
      psbId = null;
      return;
    }
    // 自动重试: 失败(rc!=0 或 git fetch 失败但 rc=0)时重新探测网络方式再试
    const maxAttempts = (S.auto_retry === false ? 0 : Math.min(Math.max(parseInt(S.max_retries) || 2, 0), 5)) + 1;
    let rc = -1, attempt = 0, prevPackFail = false;
    while (true) {
      attempt++;
      ({ env, label } = await pickMethod());
      // 内置自动修复: 注入 Electron 二进制镜像 + npmmirror npm 源, 桌面打包阶段不再直连 GitHub (尽量一次成功)
      if (S.inject_electron_mirror !== false) {
        env = {
          ...env,
          ELECTRON_MIRROR: "https://npmmirror.com/mirrors/electron/",
          ELECTRON_BUILDER_BINARIES_MIRROR: "https://npmmirror.com/mirrors/electron-builder-binaries/",
          npm_config_registry: "https://registry.npmmirror.com",
        };
        sendLine(t("u.repair.env"));
      }
      // 内置自动修复: 上次失败于打包/依赖下载阶段时, 重试叠加系统/手动代理环境
      if (attempt > 1 && prevPackFail && S.auto_repair_env !== false) {
        const sysProxy = await detectSystemProxy();
        const useP = sysProxy || S.manual_proxy || "";
        if (useP && !(env.HTTPS_PROXY || env.https_proxy)) {
          env = { ...env, ...proxyEnv(useP) };
          sendLine(t("u.repair.proxy", useP));
        }
      }
      log(t("u.net", label));
      if (attempt > 1) sendLine(t("u.retry.attempt", attempt, label));
      // 自动镜像回退: 非 mirror/auto 方式下, 若当前代理环境访问不了 GitHub 则在候选镜像中逐个探测 git 可用性
      if (S.auto_fallback_mirror !== false && !["mirror", "auto"].includes(S.auto_switch)) {
        const probe = env.HTTPS_PROXY || env.https_proxy || null;
        if (!(await testUrl2("https://github.com", probe, 6000))) {
          const wm = await pickWorkingMirror(sendLine);
          if (wm) {
            env = { ...env, ...mirrorEnv(wm) };
            label += ` +镜像 ${wm}`;
            sendLine(t("u.fallback", wm));
          } else {
            sendLine(t("u.fallback.fail"));
          }
        }
      }
      if (S.kill_before_update) {
        const [kc, kd] = await killHermesProcesses([], true);
        sendLine(t("u.clean1", kc));
        if (kc) await new Promise((r) => setTimeout(r, 1500));
      }
      const tgtBranch = String(S.upd_target || "").startsWith("branch:") ? S.upd_target.slice(7) : (S.branch || "main");
      const args = ["update", "--yes", "--branch", tgtBranch];
      if (S.flag_gateway) args.push("--gateway");
      if (S.flag_keep_stash) args.push("--keep-stash");
      if (attempt === 1) {
        const [bok, binfo] = await backupBeforeUpdate();
        sendLine(bok ? t("u.backup.ok", binfo) : t("u.backup.fail", binfo));
      }
      rc = await new Promise((resolve) => {
        const p = spawn("cmd.exe", ["/d", "/s", "/c", `"${hermesCmd()}" ${args.join(" ")}`], {
          env: { ...baseEnv(), ...env }, cwd: agentDir(), windowsHide: true, windowsVerbatimArguments: true,
        });
        updProc = p;
        p.stdout.on("data", (d) => decodeBuf(d).split(/\r?\n/).filter(Boolean).forEach((l) => sendLine(l)));
        p.stderr.on("data", (d) => decodeBuf(d).split(/\r?\n/).filter(Boolean).forEach((l) => sendLine(l)));
        p.on("error", (e) => { sendLine(`[ERROR] ${e}`); updProc = null; resolve(-1); });
        p.on("close", (code) => { updProc = null; resolve(code ?? -1); });
      });
      // 判定是否需要重试: rc!=0, 或 hermes 脚本 rc=0 但 git fetch 失败(镜像失效等)
      const failText = (startUpdate._buf || []).join("\n").toLowerCase();
      const fetchFailed = failText.includes("not valid: is this a git repository") || failText.includes("failed to fetch updates from origin");
      prevPackFail = rc !== 0 && (failText.includes("fetch failed") || failText.includes("lifecycle script") || failText.includes("npm error") || failText.includes("builder") || failText.includes("returned non-zero exit status"));
      if (updCancel || (rc === 0 && !fetchFailed) || attempt >= maxAttempts) break;
      sendLine(t("u.retry", attempt, maxAttempts - attempt));
    }
    // 用户取消: 不分类失败原因、不再自动重试, 直接收尾 (记入历史便于统计)
    if (updCancel) {
      sendLine(t("u.cancelled"));
      const dur = Math.round((Date.now() - (startUpdate._t0 || Date.now())) / 1000);
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      try {
        appendHistory({
          time: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
          rc: -2, label, dur: `${dur}s`, result: "fail",
          old: (startUpdate._oldHead || "").slice(0, 7), new: "",
          note: t("note.cancelled"),
        });
      } catch {}
      send("update-done", { rc: -2, result: t("res.cancelled"), rkey: "fail" });
      updating = false;
      try { if (psbId !== null && powerSaveBlocker.isStarted(psbId)) powerSaveBlocker.stop(psbId); } catch {}
      psbId = null;
      return;
    }
    if (S.restore_zh_patches) {
      const src = S.zh_patches_source, dst = path.join(agentDir(), "zh-patches");
      if (src && fs.existsSync(src)) {
        try { fs.cpSync(src, dst, { recursive: true, force: true }); sendLine(t("u.zh.ok", dst)); }
        catch (e) { sendLine(t("u.zh.fail", e)); }
      }
    }
    // 更新成功时列出本次拉取的提交清单
    if (rc === 0 && startUpdate._oldHead) {
      try {
        const clog = await git(["log", "--format=- %h %s", `${startUpdate._oldHead}..HEAD`], 60000);
        const clines = clog.split("\n").filter(Boolean);
        if (clines.length) {
          startUpdate._commitCount = clines.length;
          sendLine(t("u.commits", clines.length));
          clines.slice(0, 30).forEach((l) => sendLine("  " + l));
          if (clines.length > 30) sendLine(t("u.commits.more", clines.length - 30));
        }
      } catch {}
    }
    // 更新后冒烟验证 (可关): 验证 hermes --version 可执行, 尽早发现更新后的环境问题
    if (rc === 0 && S.post_smoke !== false) {
      try {
        sendLine(t("u.smoke.start"));
        const [vrc, vout] = await runHermes(["--version"], 90000);
        const vline = (vout || "").split("\n").map((x) => x.trim()).filter(Boolean)[0] || "";
        if (vrc === 0 && vline) sendLine(t("u.smoke.ok", vline));
        else sendLine(t("u.smoke.fail", `rc=${vrc}`));
      } catch (e) { sendLine(t("u.smoke.fail", String(e).slice(0, 80))); }
    }
    // 更新成功后: tag 目标固定 (更新走默认分支, 成功后钉到指定标签)
    const tgt1 = String(S.upd_target || "").trim();
    if (rc === 0 && tgt1.startsWith("tag:")) {
      const nm1 = tgt1.slice(4);
      await git(["fetch", "--all", "--prune", "--tags"], 180000);
      await git(["checkout", `tags/${nm1}`], 90000);
      const v1 = (await git(["describe", "--tags", "--exact-match"], 30000) || "").trim();
      sendLine(v1 === nm1 ? t("u.target.tag", nm1) : t("u.target.fail", "git checkout"));
    }
    // 后置/失败钩子
    await runHooks(rc === 0 ? "post" : "fail", sendLine);
    // 失败原因分类 (对齐 tkinter 版)
    const done = await classifyAndFinish(rc, label, win, sendLine);
    send("update-done", done);
    // 更新完成托盘气泡 (可关)
    notifyEvent(done.rc === 0 ? "ok" : "fail", done.rc === 0 ? t("notif.upd.ok") : t("notif.upd.fail", done.rc));
    if (done.rc === 0) { if (S.webhook_upd_ok !== false) sendWebhook("update.ok", { rc: 0 }); }
    else if (S.webhook_upd_fail !== false) sendWebhook("update.fail", { rc: done.rc, result: String(done.result || "").slice(0, 200) });
    if (S.notify_done !== false) {
      try {
        const okc = done.rc === 0;
        tray && tray.displayBalloon({ icon: path.join(__dirname, "app.ico"), title: okc ? t("balloon.done.ok.title") : t("balloon.done.fail.title"), content: okc ? t("balloon.done.ok.body") : t("balloon.done.fail.body", done.rc) });
      } catch {}
    }
    updating = false;
    try { if (psbId !== null && powerSaveBlocker.isStarted(psbId)) powerSaveBlocker.stop(psbId); } catch {} // 更新结束恢复允许睡眠
    psbId = null;
  })();
  return { ok: true };
}

// 取消更新: 终止当前更新的子进程树 (cmd.exe -> hermes -> node/electron-builder)
ipcMain.handle("cancel-update", () => {
  if (!updating) return { ok: false, msg: t("msg.notup") };
  if (!updProc || !updProc.pid) return { ok: false, msg: t("msg.noproc") };
  updCancel = true;
  log(`[更新] 用户请求取消 (pid=${updProc.pid})`);
  try { execFile("taskkill", ["/F", "/T", "/PID", String(updProc.pid)], { windowsHide: true }, () => {}); } catch {}
  return { ok: true };
});

// 一键维护: git gc 仓库瘦身 + npm cache verify 缓存校验 (诊断页)
let maintaining = false;
ipcMain.handle("maintain", (e) => {
  if (maintaining) return { ok: false, msg: t("msg.busy") };
  if (updating) return { ok: false, msg: t("msg.busy") };
  maintaining = true;
  const wc = e.sender;
  const send = (m) => { try { wc.send("maintain-line", m); } catch {} };
  (async () => {
    send(t("m.start"));
    try { await git(["gc", "--quiet"], 300); send(t("m.gc.ok")); }
    catch (err) { send(t("m.gc.fail", err)); }
    await new Promise((resolve) => {
      const p = spawn("cmd.exe", ["/d", "/s", "/c", "npm cache verify"], { cwd: agentDir(), windowsHide: true });
      let buf = "";
      p.stdout.on("data", (d) => { buf += decodeBuf(d); });
      p.stderr.on("data", (d) => { buf += decodeBuf(d); });
      p.on("close", (code) => {
        const m = buf.match(/Content verified:\s*(\d+)/i);
        send(m ? t("m.npm.ok", m[1]) : t("m.npm.done", code));
        resolve();
      });
      p.on("error", (err) => { send(t("m.npm.fail", err)); resolve(); });
    });
    send(t("m.done"));
    try { wc.send("maintain-done", { ok: true }); } catch {}
    maintaining = false;
  })();
  return { ok: true };
});

async function classifyAndFinish(rc, label, win, sendLine) {
  // 重新核对落后数
  const head = (await git(["rev-parse", "--short", "HEAD"])).trim();
  const cnt = (await git(["rev-list", "--left-right", "--count", `HEAD...origin/${S.branch}`])).trim();
  let behind = -1;
  if (cnt) { const [, b] = cnt.split(/\s+/); behind = parseInt(b) || 0; }
  const dur = Math.round((Date.now() - (startUpdate._t0 || Date.now())) / 1000);
  let result, rkey, tag;
  if (rc === 0 && behind <= 0) { result = t("res.ok"); rkey = "ok"; tag = ""; }
  else if (rc === 0) { result = t("res.partial", behind); rkey = "partial"; tag = ""; }
  else {
    // 按更新输出分类失败原因 (对齐 tkinter 版 _classify_failure)
    const text = (startUpdate._buf || []).join("\n").toLowerCase();
    const has = (...keys) => keys.some((k) => text.includes(k));
    if (has("node-gyp", "find vs", "visual studio", "node-pre-gyp", "gyp err")) {
      tag = t("tag.build"); result = t("fail.build", rc, tag);
    } else if (has("not valid: is this a git repository", "failed to fetch updates from origin")) {
      tag = t("tag.mirror"); result = t("fail.mirror", rc, tag);
    } else if (has("fetch failed", "lifecycle script", "npm run builder", "returned non-zero exit status", "electron-builder", "run-electron-builder")) {
      // 桌面打包阶段下载 Electron 资源失败 (npm error TypeError: fetch failed 等)
      tag = t("tag.pack"); result = t("fail.pack", rc, tag);
    } else if (has("npm err", "node-deps", "npm ci")) {
      tag = t("tag.deps"); result = t("fail.deps", rc, tag);
    } else if (has("winerror 5", "拒绝访问", "permission denied", "access is denied")) {
      tag = t("tag.locked"); result = t("fail.locked", rc, tag);
    } else if (has("empty reply", "connection reset", "timed out", "timeout", "could not resolve", "failed to connect", "unable to access", "ssl")) {
      tag = t("tag.net"); result = t("fail.net", rc, tag);
    } else {
      tag = t("tag.unknown"); result = t("fail.unknown", rc, tag);
    }
    rkey = "fail";
  }
  // 记录上次更新结果, 供刷新状态判定"是否真正完成" (防止 git pull 成功但依赖构建失败误报已是最新)
  try { saveUpdateState({ at: Date.now(), head, rc, incomplete: rkey === "fail", reason: rkey === "fail" ? (tag || "") : "" }); } catch {}
  // 更新后清理:
  // - 更新成功(rc===0) -> 无条件结束全部 Hermes 进程(含 Gateway), 确保新版生效
  // - 更新失败 -> 沿用 cleanup_after / keep_gateway 设置, 仍保留 Gateway
  if (rc === 0) {
    const [kc] = await killHermesProcesses([], true);
    sendLine(t("u.killall.ok", kc));
  } else if (S.cleanup_after !== false) {
    const [kc, kd] = await killHermesProcesses([], S.keep_gateway === false);
    if (kc) sendLine(t("u.cleanup2", kc, kd));
  }
  // 完整 YYYY-MM-DD HH:MM:SS 格式 (旧记录 MM-DD HH:MM 由渲染层兼容解析)
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  appendHistory({
    time: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    rc, label, dur: `${dur}s`, result: rkey,
    old: (startUpdate._oldHead || "").slice(0, 7), new: head.slice(0, 7),
    note: rkey === "fail" ? `${t("note.reason")}${tag}` : (behind > 0 ? t("note.behind", behind) : (rkey === "ok" ? (startUpdate._commitCount ? t("note.newcommits", startUpdate._commitCount) : t("note.uptodate")) : "")),
  });
  return { rc, result, rkey };
}

// ---------------- 窗口 / 托盘 ----------------
let win = null, tray = null;
let _boundsTimer = null;
function saveBoundsDebounced() {
  if (_boundsTimer) clearTimeout(_boundsTimer);
  _boundsTimer = setTimeout(() => {
    try { if (win && !win.isDestroyed() && win.isVisible()) { S.win_bounds = win.getBounds(); saveSettings(); } } catch {}
  }, 800);
}
function createWindow() {
  const b = S.win_bounds || {};
  win = new BrowserWindow({
    width: b.width || 1180, height: b.height || 760,
    x: b.x, y: b.y,
    minWidth: 920, minHeight: 600,
    backgroundColor: (S.theme_system || S.dark_mode) ? "#0B1220" : "#F1F5F9", show: false, frame: true,
    icon: path.join(__dirname, "app.ico"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false },
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  win.once("ready-to-show", () => { win.show(); try { win.setAlwaysOnTop(!!S.always_on_top); } catch {} });
  win.on("resize", saveBoundsDebounced);
  win.on("move", saveBoundsDebounced);
  win.on("close", (e) => {
    try { S.win_bounds = win.getBounds(); saveSettings(); } catch {}
    if (S.minimize_to_tray && !app.isQuitting) { e.preventDefault(); win.hide(); }
  });
  makeTray();
}
function makeTray() {
  try {
    // 语言切换会重建托盘: 先销毁旧实例防泄漏
    if (tray) { try { tray.destroy(); } catch {} tray = null; }
    const icon = nativeImage.createFromPath(path.join(__dirname, "app.ico"));
    tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
    tray.setToolTip("HermesUpdater");
    updateTrayBadge(lastTrayBehind); // 语言切换等重建后恢复角标
    const goto = (key) => { win.show(); win.webContents.send("nav", key); };
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: t("tray.dash"), click: () => goto("dash") },
      { label: t("tray.update"), click: () => goto("update") },
      { label: t("tray.settings"), click: () => goto("settings") },
      { label: t("tray.diag"), click: () => goto("diag") },
      { label: t("tray.log"), click: () => goto("log") },
      {
        label: t("tray.backup"), submenu: [
          { label: t("tray.bk.now"), click: async () => { const r = await bkBackupNow("", S.bk_scope); try { tray && tray.displayBalloon({ icon: path.join(__dirname, "app.ico"), title: r.ok ? t("tray.bk.done") : t("tray.bk.fail"), content: r.ok ? `${r.name} (${r.items.length} 项)` : (r.msg || "") }); } catch {} } },
          { label: t("tray.bk.restore"), click: () => { win.show(); win.webContents.send("nav", "backup"); } },
          { label: t("tray.bk.dir"), click: () => { try { bkOpenDir(); } catch {} } },
          { type: "separator" },
          { label: t("tray.bk.settings"), click: () => { win.show(); win.webContents.send("nav", "settings"); } },
        ]
      },
      { type: "separator" },
      { label: t("tray.check"), click: () => { goto("dash"); win.webContents.send("do-check"); } },
      { type: "separator" },
      { label: t("tray.quit"), click: () => { app.isQuitting = true; app.quit(); } },
    ]));
    tray.on("double-click", () => win.show());
    // 点击托盘气泡直达更新页 (新版本提醒 / 完成 / 失败通知都适用)
    tray.on("balloon-click", () => { win.show(); win.webContents.send("nav", "update"); });
  } catch (e) { log(`托盘创建失败: ${e}`); }
}

// 单实例锁: 二次启动时聚焦已有窗口 (防多开造成设置/历史文件读写竞争)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      try { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } catch {}
    }
  });
}

app.whenReady().then(() => {
  applyThemeSource();
  createWindow();
  setupAutoUpdate();
  setupGatewayWatch();
  setupSchedule();
  setupNetWatch();
  setupWatchdog();
  setupPathWatch();
  setupBkAuto(); // 备份与恢复: 定时自动备份 (开关在设置页, 改动即时生效)
  autoDetectOnStartup(); // 安装路径自动识别 (后台执行, 不阻塞启动)
  setTimeout(autoBackup, 30000); // 启动 30 秒后做当日自动备份
  setInterval(autoBackup, 6 * 3600e3); // 之后每 6 小时补查一次 (每天只写一份)
});
function applyThemeSource() {
  try { nativeTheme.themeSource = S.theme_system ? "system" : (S.dark_mode ? "dark" : "light"); } catch {}
}
app.on("window-all-closed", () => { if (process.platform !== "win32") app.quit(); });
app.on("before-quit", () => { app.isQuitting = true; });

// 托盘更新角标: behind>0 时图标旁显示 ⬆️N (设置项可关); 记住最近值便于托盘重建时恢复
let lastTrayBehind = 0;
function updateTrayBadge(behind) {
  lastTrayBehind = behind > 0 ? behind : 0;
  try { if (tray) tray.setTitle(S.tray_badge === false || lastTrayBehind === 0 ? "" : `⬆️${lastTrayBehind}`); } catch {}
}
// 新版本托盘气泡 (每个远端版本只提醒一次) + 自动定时检查
let lastNotifiedRhead = null;
function notifyNewVersion(behind, rhead) {
  updateTrayBadge(behind);
  if (!S.notify_updates || !rhead || rhead === lastNotifiedRhead) return;
  lastNotifiedRhead = rhead;
  log(`[提醒] 发现新版本: 落后 ${behind} 个提交 (远端 ${rhead})`);
  notifyEvent("newver", t("notif.newver", behind, rhead));
  // 桌面通知开启时由 desktopNotify 负责 (避免 toast+气泡双重打扰)
  if (S.notify_desktop === false) { try { tray && tray.displayBalloon({ icon: path.join(__dirname, "app.ico"), title: t("balloon.newver.title"), content: t("balloon.newver.body", behind) }); } catch {} }
}
// Gateway 掉线/恢复监视 (状态翻转才提醒, 不重复骚扰)
let lastGwRunning = null, gwTimer = null;
function setupGatewayWatch() {
  if (gwTimer) { clearInterval(gwTimer); gwTimer = null; }
  if (S.gateway_watch === false) return;
  gwTimer = setInterval(async () => {
    try {
      if (updating) return;
      const [rc, out] = await runHermes(["gateway", "status"], 60000);
      const running = rc === 0 && /running/i.test(out || "");
      if (lastGwRunning !== null && running !== lastGwRunning) {
        log(`[Gateway监视] 状态变化: ${running ? "已恢复运行" : "已停止/掉线"}`);
        notifyEvent(running ? "gw" : "gw", running ? t("notif.gw.up") : t("notif.gw.down"));
        try {
          tray && tray.displayBalloon({
            icon: path.join(__dirname, "app.ico"),
            title: running ? t("gw.up.title") : t("gw.down.title"),
            content: running ? t("gw.up.body") : t("gw.down.body"),
          });
        } catch {}
      }
      lastGwRunning = running;
    } catch {}
  }, 5 * 60000);
}

// Gateway 守护: 定时巡检, 掉线时自动拉起 (与掉线提醒互补; 更新中/正在拉起时跳过)
let wdTimer = null, wdBusy = false;
function setupWatchdog() {
  if (wdTimer) { clearInterval(wdTimer); wdTimer = null; }
  if (!S.watchdog_enabled) return;
  const mins = Math.max(2, parseInt(S.watchdog_min) || 5);
  wdTimer = setInterval(async () => {
    if (updating || wdBusy) return;
    try {
      const [rc, out] = await runHermes(["gateway", "status"], 60000);
      const running = rc === 0 && /running/i.test(out || "");
      if (running) return;
      wdBusy = true;
      log(`[守护] 巡检发现 Gateway 未运行, 自动拉起 (每 ${mins} 分钟巡检)`);
      const [rrc] = await runHermes(["gateway", "restart"], 120000);
      wdBusy = false;
      log(`[守护] gateway restart rc=${rrc}`);
      notifyEvent(rrc === 0 ? "gw" : "fail", rrc === 0 ? t("wd.restarted") : t("wd.restart.fail", rrc));
    } catch { wdBusy = false; }
  }, mins * 60000);
  log(`[守护] Gateway 守护已开启, 每 ${mins} 分钟巡检`);
}

// 免打扰时段: HH:MM~HH:MM, 支持跨午夜 (23:00~08:00); 配置不完整视为不禁用
function inQuietHours() {
  const s = (S.quiet_start || "").trim(), e = (S.quiet_end || "").trim();
  if (!/^\d{1,2}:\d{2}$/.test(s) || !/^\d{1,2}:\d{2}$/.test(e)) return false;
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const cur = new Date().getHours() * 60 + new Date().getMinutes();
  const a = toMin(s), b = toMin(e);
  return a <= b ? cur >= a && cur <= b : cur >= a || cur <= b;
}

// 备份目录统一解析: Electron documents 与 USERPROFILE\Documents 可能不一致 (OneDrive/自定义重定向),
// 取含备份文件更多的候选, 保证写入/恢复/打开三者一致
function backupDir() {
  let doc = "";
  try { doc = app.getPath("documents"); } catch {}
  const cands = [...new Set([doc && path.join(doc, "HermesUpdater-Backups"), path.join(os.homedir(), "Documents", "HermesUpdater-Backups")])].filter(Boolean);
  let best = cands[0], bestN = -1;
  for (const c of cands) {
    let n = 0;
    try { n = fs.existsSync(c) ? fs.readdirSync(c).filter((f) => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(f)).length : 0; } catch {}
    if (n > bestN) { bestN = n; best = c; }
  }
  return best;
}

// 每日自动备份: 文档目录/HermesUpdater-Backups/backup-YYYY-MM-DD.json, 保留最近 N 份
async function autoBackup() {
  if (!S.backup_auto) return;
  try {
    const dir = backupDir();
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `backup-${new Date().toISOString().slice(0, 10)}.json`);
    if (fs.existsSync(file)) return; // 今天已备份
    const mask = (s) => String(s || "").replace(/(:\/\/[^:/@]+:)[^@]+@/, "$1***@"); // 代理密码脱敏
    fs.writeFileSync(file, JSON.stringify({
      app: "HermesUpdater", exportedAt: new Date().toISOString(),
      settings: { ...S, manual_proxy: mask(S.manual_proxy), profiles: (S.profiles || []).map((x) => ({ ...x, manual_proxy: mask(x.manual_proxy) })) },
      history: getHistory(),
    }, null, 2));
    const keep = Math.min(Math.max(parseInt(S.backup_keep) || 5, 1), 30);
    const files = fs.readdirSync(dir).filter((f) => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    while (files.length > keep) fs.unlinkSync(path.join(dir, files.shift()));
    log(`[备份] 自动备份完成: ${file}`);
  } catch (e) { log(`[备份] 自动备份失败: ${e}`); }
}

// ---------------- 备份与恢复 (Hermes Agent 配置/数据, 独立于数据包备份) ----------------
function bkRoot() {
  const d = (S.bk_dir || "").trim();
  if (d) { try { fs.mkdirSync(d, { recursive: true }); return d; } catch {} }
  return path.join(backupDir(), "agent");
}
// 各备份范围 -> 候选源(绝对路径) + 还原时相对 install() 的落点
// 只收"用户数据"(配置/会话/技能/插件/记忆/凭据/数据库...), 不收 tools/ desktop/ webui/ 等体积巨大或随版本重建的目录
function bkMap() {
  const inst = install(), ag = agentDir();
  const F = (rel) => ({ src: path.join(inst, rel), rel });            // install() 根下
  const A = (rel) => ({ src: path.join(ag, rel), rel: "hermes-agent/" + rel }); // hermes-agent/ 下
  return {
    config: [F("config.yaml"), A("config.yaml")],
    env: [F(".env")],
    auth: [F("auth.json")],
    sessions: [F("sessions")],                                  // 会话
    skills: [F("skills")],                                      // 技能 / 软件
    plugins: [F("plugins"), F("desktop-plugins")],              // 插件
    zhpatches: [F("zh-patches"), F("zh-patches-source"), A("zh-patches")],
    memories: [F("memories")],                                  // 记忆库
    vault: [F("vault")],                                        // 凭据 / 密钥
    hooks: [F("hooks")],
    cron: [F("cron")],                                          // 定时任务
    kanban: [F("kanban.db"), F("kanban")],                      // 看板
    projects: [F("projects.db")],                               // 项目库
    state: [F("state.db")],                                     // 主状态库
    shared: [F("shared"), F("shared-state.db")],                // 共享数据
    pets: [F("pets")],
    platforms: [F("platforms")],                                // 渠道 / 平台配置
    pairing: [F("pairing"), F("pending_messages")],             // 配对与待发消息
    sandbox: [F("sandboxes")],                                  // 沙箱
    data: [F("data"), A("data")],                               // 数据包
    logs: [F("logs"), A("logs")],
  };
}
// 备份范围清单 (顺序即 UI 展示顺序); 渲染层通过 bk-scopes 拉取, 避免两边硬编码漂移
const BK_SCOPE_KEYS = ["config", "env", "auth", "sessions", "skills", "plugins", "zhpatches", "memories", "vault", "hooks", "cron", "kanban", "projects", "state", "shared", "pets", "platforms", "pairing", "sandbox", "data", "logs"];
// 范围 -> i18n key 映射: 用查表代替动态拼接出来的 key, 让静态校验能覆盖到每一条词条
const BK_SCOPE_I18N = { config: "bk.scope.config", env: "bk.scope.env", auth: "bk.scope.auth", sessions: "bk.scope.sessions", skills: "bk.scope.skills", plugins: "bk.scope.plugins", zhpatches: "bk.scope.zhpatches", memories: "bk.scope.memories", vault: "bk.scope.vault", hooks: "bk.scope.hooks", cron: "bk.scope.cron", kanban: "bk.scope.kanban", projects: "bk.scope.projects", state: "bk.scope.state", shared: "bk.scope.shared", pets: "bk.scope.pets", platforms: "bk.scope.platforms", pairing: "bk.scope.pairing", sandbox: "bk.scope.sandbox", data: "bk.scope.data", logs: "bk.scope.logs" };
// 反查: 备份产物里的相对路径 -> 属于哪个范围 (恢复时按范围过滤用)
function bkScopeOfRel(rel) {
  const r = String(rel || "").replace(/\\/g, "/");
  for (const k of BK_SCOPE_KEYS) {
    for (const { rel: rr } of (bkMap()[k] || [])) if (r === rr || r.startsWith(rr + "/")) return k;
  }
  return "";
}
// 排除规则: 设置里按行填写, 支持 * 通配与目录前缀; 命中则跳过
function bkExcluded(rel) {
  const raw = (S.bk_exclude || "").trim();
  if (!raw) return false;
  const r = String(rel || "").replace(/\\/g, "/");
  return raw.split(/\r?\n/).map((x) => x.trim()).filter(Boolean).some((pat) => {
    const p = pat.replace(/\\/g, "/").replace(/\/+$/, "");
    if (!p) return false;
    if (p.includes("*")) {
      const re = new RegExp("^" + p.split("*").map((s) => s.replace(/[.+?^${}()|[\]]/g, "\\$&")).join(".*") + "$");
      return re.test(r);
    }
    return r === p || r.startsWith(p + "/");
  });
}
// 带过滤的复制: 支持「跳过空文件/空目录」与「是否包含 . 开头的隐藏项」
// 返回是否真的复制了内容 (用于 bk_skip_empty 时剔除空目录)
function bkCopyFiltered(src, dst) {
  const st = fs.statSync(src);
  if (!st.isDirectory()) {
    if (S.bk_skip_empty && st.size === 0) return false;
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    return true;
  }
  let got = false;
  const walk = (s, d) => {
    let ents = [];
    try { ents = fs.readdirSync(s, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (!S.bk_include_hidden && e.name.startsWith(".")) continue;
      const ss = path.join(s, e.name), dd = path.join(d, e.name);
      try {
        if (e.isDirectory()) walk(ss, dd);
        else {
          if (S.bk_skip_empty && fs.statSync(ss).size === 0) continue;
          fs.mkdirSync(path.dirname(dd), { recursive: true });
          fs.copyFileSync(ss, dd);
          got = true;
        }
      } catch {}
    }
  };
  fs.mkdirSync(dst, { recursive: true });
  walk(src, dst);
  return S.bk_skip_empty ? got : true;
}
// SHA256 清单: 备份时生成 manifest.sha256, 便于事后校验是否被改动
function bkWriteHash(root, dir, items) {
  const lines = [];
  const walk = (base, relPref) => {
    let ents = [];
    try { ents = fs.readdirSync(base, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const rel = relPref ? `${relPref}/${e.name}` : e.name;
      const full = path.join(base, e.name);
      if (e.isDirectory()) walk(full, rel);
      else {
        try {
          const h = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
          lines.push(`${h}  ${rel}`);
        } catch {}
      }
    }
  };
  for (const rel of items) {
    const full = path.join(dir, rel);
    if (!fs.existsSync(full)) continue;
    if (fs.statSync(full).isDirectory()) walk(full, rel);
    else {
      try {
        const h = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
        lines.push(`${h}  ${rel}`);
      } catch {}
    }
  }
  fs.writeFileSync(path.join(dir, "manifest.sha256"), lines.join("\n") + "\n", "utf8");
  return lines.length;
}
const BK_NAME_RE = /^HermesAgent-\d{14}(-[\w\u4e00-\u9fa5-]+)?(\.zip)?$/;
function bkNameOk(n) { return BK_NAME_RE.test(String(n || "")); }
// 名字容错: 产物可能是 zip 也可能是目录, 调用方给的名字可能带/不带 .zip
// (例如 bkBackupNow 返回的名字历史上不带扩展名), 统一解析成磁盘上真实存在的那个
function bkResolve(name) {
  const root = bkRoot();
  const raw = String(name || "");
  if (!bkNameOk(raw)) return null;
  const tries = /\.(zip)$/i.test(raw) ? [raw, raw.replace(/\.zip$/i, "")] : [raw, raw + ".zip"];
  for (const t2 of tries) { if (fs.existsSync(path.join(root, t2))) return t2; }
  return null;
}
function bkSanitizeNote(s) { return String(s || "").replace(/[^\w\u4e00-\u9fa5-]/g, "").slice(0, 20); }
function bkPs(cmd) { // PowerShell 压缩/解压 (Windows 内置, 无需额外依赖)
  execFileSync("powershell", ["-NoProfile", "-Command", cmd], { windowsHide: true, timeout: 600000, maxBuffer: 32e6 });
}
function bkExpandZip(zip, dst) {
  fs.mkdirSync(dst, { recursive: true });
  bkPs(`Expand-Archive -Path '${zip.replace(/'/g, "''")}' -DestinationPath '${dst.replace(/'/g, "''")}' -Force`);
  // Compress-Archive 打包目录时会把该目录本身写进 zip, 解压结果是 dst/<备份名>/...
  // 必须下潜到真正的内容根, 否则恢复时会把整个文件夹原样塞进安装目录而不是覆盖回原位
  try {
    const ents = fs.readdirSync(dst);
    if (ents.length === 1) {
      const only = path.join(dst, ents[0]);
      if (fs.statSync(only).isDirectory() && (BK_NAME_RE.test(ents[0]) || fs.existsSync(path.join(only, "manifest.json")))) return only;
    }
  } catch {}
  return dst;
}
function bkMetaPath(root, name) { return path.join(root, name.replace(/\.zip$/, "") + ".meta.json"); }
function bkPruneSync() {
  try {
    const root = bkRoot();
    if (!fs.existsSync(root)) return 0;
    const keep = Math.min(Math.max(parseInt(S.bk_keep) || 7, 1), 60);
    const entries = fs.readdirSync(root).filter((f) => /^HermesAgent-\d{14}/.test(f) && !f.endsWith(".meta.json"));
    const stamps = [...new Set(entries.map((f) => (f.match(/^HermesAgent-(\d{14})/) || [])[1]).filter(Boolean))].sort().reverse();
    // 按天数保留 (bk_retention_days > 0): 超过 N 天的直接清理, 与「保留份数」是并集
    const days = parseInt(S.bk_retention_days) || 0;
    const tooOld = (st) => {
      if (days <= 0) return false;
      const ts = Date.UTC(+st.slice(0, 4), +st.slice(4, 6) - 1, +st.slice(6, 8), +st.slice(8, 10), +st.slice(10, 12), +st.slice(12, 14));
      return (Date.now() - ts) / 864e5 > days;
    };
    let removed = 0;
    for (const st of stamps) {
      if (!tooOld(st) && stamps.indexOf(st) < keep) continue; // 既没超期, 又在保留份数内 -> 留着
      for (const f of entries.filter((e) => e.startsWith("HermesAgent-" + st))) {
        try { fs.rmSync(path.join(root, f), { recursive: true, force: true }); removed++; } catch {}
      }
      try { fs.rmSync(bkMetaPath(root, `HermesAgent-${st}`), { force: true }); } catch {}
    }
    if (removed) log(`[备份] ${t("bk.pruned", removed)}`);
    return removed;
  } catch { return 0; }
}
async function bkBackupNow(note, scopeOverride) {
  try {
    if (S.bk_enabled === false) return { ok: false, msg: t("bk.disabled") };
    const inst = install();
    if (!fs.existsSync(inst)) return { ok: false, msg: t("bk.none") };
    const root = bkRoot();
    fs.mkdirSync(root, { recursive: true });
    if (S.bk_stop_proc) {
      const [kc] = await killHermesProcesses([], true);
      if (kc) log(`[备份] ${t("bk.stop")}: ${kc}`);
      await new Promise((r) => setTimeout(r, 1200));
    }
    const scope = (scopeOverride && scopeOverride.length) ? scopeOverride : ((S.bk_scope && S.bk_scope.length) ? S.bk_scope : ["config"]);
    const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const safe = bkSanitizeNote(note);
    const name = `HermesAgent-${stamp}${safe ? "-" + safe : ""}`;
    const work = path.join(root, name);
    fs.mkdirSync(work, { recursive: true });
    const map = bkMap(), items = [];
    let skippedByExclude = 0;
    for (const key of scope) {
      for (const { src, rel } of (map[key] || [])) {
        if (!fs.existsSync(src)) continue;
        if (bkExcluded(rel)) { skippedByExclude++; continue; }
        const dst = path.join(work, rel);
        try {
          const kept = bkCopyFiltered(src, dst); // 按 bk_skip_empty / bk_include_hidden 过滤后复制
          if (kept) items.push(rel); else log(`[备份] 跳过(空/隐藏规则) ${rel}`);
        } catch (e) { log(`[备份] 跳过 ${rel}: ${e}`); }
      }
    }
    let head = "";
    try { head = (await git(["rev-parse", "--short", "HEAD"], 30000) || "").trim(); } catch {}
    // SHA256 清单要在压缩前写入, 否则会被打进 zip 之外
    let hashes = 0;
    if (S.bk_hash && items.length) { try { hashes = bkWriteHash(root, work, items); } catch (e) { log(`[备份] sha256 清单失败: ${e}`); } }
    const manifest = { app: "HermesUpdater", version: app.getVersion(), createdAt: new Date().toISOString(), installPath: inst, hermesHead: head, scope, items, note: safe || "", hasHash: hashes > 0, excluded: skippedByExclude };
    fs.writeFileSync(path.join(work, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
    fs.writeFileSync(bkMetaPath(root, name), JSON.stringify({ ...manifest, name, isZip: !!S.bk_zip }, null, 2), "utf8");
    let finalPath = work, sizeMB = 0;
    if (S.bk_zip && items.length) {
      const zip = path.join(root, name + ".zip");
      const lvl = { optimal: "Optimal", fastest: "Fastest", none: "NoCompression" }[String(S.bk_compress_level || "optimal")] || "Optimal";
      try {
        bkPs(`Compress-Archive -Path '${work.replace(/'/g, "''")}' -DestinationPath '${zip.replace(/'/g, "''")}' -CompressionLevel ${lvl} -Force`);
        fs.rmSync(work, { recursive: true, force: true });
        finalPath = zip;
      } catch (e) { log(`[备份] 压缩失败, 保留目录形式: ${e}`); }
    }
    try { sizeMB = Math.max(0, Math.round(fs.statSync(finalPath).size / 10485.76) / 100); } catch {}
    const finalName = path.basename(finalPath); // 真实产物名 (压缩成功时带 .zip), 保证与 bkList 返回的名字一致
    if (S.bk_verify && !items.length) return { ok: false, msg: `${t("bk.fail", "无可备份内容 (scope 内未找到文件)")}` };
    if (S.bk_verify && !fs.existsSync(finalPath)) return { ok: false, msg: t("bk.fail", "产物缺失") };
    let pruned = 0;
    if (S.bk_prune_after !== false) pruned = bkPruneSync();
    log(`[备份] ${t("bk.done", finalName)} (${items.length} 项, ${sizeMB} MB, ${scope.map((k) => t(BK_SCOPE_I18N[k] || "bk.scope.config")).join("/")})`);
    if (S.bk_notify !== false && S.bk_notify_fail_only !== true) {
      try { new Notification({ title: t("tray.bk.done"), body: `${finalName} · ${items.length} 项 · ${sizeMB} MB` }).show(); } catch {}
    }
    if (S.bk_open_after && finalPath) { try { shell.openPath(finalPath.endsWith(".zip") ? root : finalPath); } catch {} }
    return { ok: true, name: finalName, path: finalPath, sizeMB, items, pruned, hashes, excluded: skippedByExclude, msg: t("bk.done", finalName) };
  } catch (e) {
    bkNotifyFail(e);
    return { ok: false, msg: t("bk.fail", e) };
  }
}
// 失败通知: bk_notify 打开即可 (bk_notify_fail_only 只影响成功通知)
function bkNotifyFail(e) {
  if (S.bk_notify === false) return;
  try { new Notification({ title: t("tray.bk.fail"), body: String(e).slice(0, 200) }).show(); } catch {}
}
function bkList() {
  const root = bkRoot();
  if (!fs.existsSync(root)) return [];
  const out = [];
  for (const f of fs.readdirSync(root)) {
    const m = f.match(/^HermesAgent-(\d{14})(?:-([\w\u4e00-\u9fa5-]+))?(\.zip)?$/);
    if (!m) continue;
    const full = path.join(root, f);
    let sizeMB = 0, items = [], note = "", createdAt = "", scope = [], version = "", head = "", hasHash = false;
    try { sizeMB = Math.max(0, Math.round(fs.statSync(full).size / 10485.76) / 100); } catch {}
    try {
      const mf = JSON.parse(fs.readFileSync(bkMetaPath(root, f), "utf8"));
      items = mf.items || []; note = mf.note || ""; createdAt = mf.createdAt || ""; scope = mf.scope || []; version = mf.version || ""; head = mf.hermesHead || ""; hasHash = !!mf.hasHash;
    } catch {}
    const stamp = m[1];
    const time = `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)} ${stamp.slice(8, 10)}:${stamp.slice(10, 12)}:${stamp.slice(12, 14)}`;
    out.push({ name: f, isZip: f.endsWith(".zip"), time, sizeMB, items, note, createdAt, scope, version, head, hasHash });
  }
  return out.sort((a, b) => b.time.localeCompare(a.time));
}
async function bkRestore(name) {
  let tmpdir = null;
  try {
    if (S.bk_enabled === false) return { ok: false, msg: t("bk.disabled") };
    const inst = install();
    if (!fs.existsSync(inst)) return { ok: false, msg: t("bk.none") };
    const root = bkRoot();
    const real = bkResolve(name); // 兼容带/不带 .zip 的名字
    if (!real) return { ok: false, msg: t("bk.none") };
    const full = path.join(root, real);
    let dir = full;
    if (real.endsWith(".zip")) { tmpdir = path.join(os.tmpdir(), `hermes-bk-r-${Date.now()}`); dir = bkExpandZip(full, tmpdir); }
    let manifest = {};
    try { manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8")); } catch {}
    let items = (manifest.items && manifest.items.length) ? manifest.items : fs.readdirSync(dir).filter((x) => x !== "manifest.json");
    // 恢复范围过滤: 设置里勾了 bk_restore_scope 就只还原这些范围 (空=整份)
    const onlyScope = Array.isArray(S.bk_restore_scope) ? S.bk_restore_scope.filter(Boolean) : [];
    const skippedScope = [];
    if (onlyScope.length) {
      items = items.filter((rel) => {
        const k = bkScopeOfRel(rel);
        if (k && onlyScope.includes(k)) return true;
        skippedScope.push(rel);
        return false;
      });
    }
    // 恢复前留后路: 先把当前状态备份一份, 失败不阻断恢复 (只告警)
    let preBackup = "";
    if (S.bk_restore_autobackup !== false) {
      try {
        const pb = await bkBackupNow(t("bk.pre"), (manifest.scope && manifest.scope.length) ? manifest.scope : S.bk_scope);
        if (pb && pb.ok) { preBackup = pb.name; log(`[备份] ${t("bk.pre.done", pb.name)}`); }
        else log(`[备份] ${t("bk.pre.fail", (pb && pb.msg) || "?")}`);
      } catch (e) { log(`[备份] ${t("bk.pre.fail", e)}`); }
    }
    if (S.bk_stop_proc) { await killHermesProcesses([], true); await new Promise((r) => setTimeout(r, 1200)); }
    let copied = 0;
    for (const rel of items) {
      const src = path.join(dir, rel);
      if (!fs.existsSync(src)) continue;
      if (bkExcluded(rel)) continue;
      const dst = path.join(inst, rel);
      try {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        if (fs.statSync(src).isDirectory()) fs.cpSync(src, dst, { recursive: true, force: true });
        else fs.copyFileSync(src, dst);
        copied++;
      } catch (e) { log(`[恢复] 跳过 ${rel}: ${e}`); }
    }
    log(`[备份] ${t("bk.restored", real)} (${copied} 项)`);
    // 恢复后校验 (bk_verify_restore): 逐个确认落盘, 报告缺失数
    let verified = 0, missing = 0;
    if (S.bk_verify_restore) {
      for (const rel of items) {
        try { if (fs.existsSync(path.join(inst, rel))) verified++; else missing++; } catch { missing++; }
      }
      log(`[备份] ${t("bk.verify", verified, missing)}`);
    }
    if (S.bk_notify !== false) {
      try { new Notification({ title: t("bk.restored", real), body: `${copied} 项${preBackup ? " · " + t("bk.pre.done", preBackup) : ""}` }).show(); } catch {}
    }
    return { ok: true, name: real, copied, preBackup, skipped: skippedScope.length, msg: t("bk.restored", real) };
  } catch (e) {
    return { ok: false, msg: t("bk.restore.fail", e) };
  } finally {
    if (tmpdir) { try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {} }
  }
}
async function bkDelete(name) {
  try {
    const root = bkRoot();
    const real = bkResolve(name); // 兼容带/不带 .zip 的名字
    if (!real) return { ok: false, msg: t("bk.none") };
    const full = path.join(root, real);
    fs.rmSync(full, { recursive: true, force: true });
    try { fs.rmSync(bkMetaPath(root, real), { force: true }); } catch {}
    log(`[备份] ${t("bk.del", real)}`);
    return { ok: true, name: real, msg: t("bk.del", real) };
  } catch (e) { return { ok: false, msg: String(e) }; }
}
async function bkExport(name, dest) {
  try {
    const root = bkRoot();
    const real = bkResolve(name); // 兼容带/不带 .zip 的名字
    if (!real) return { ok: false, msg: t("bk.none") };
    const full = path.join(root, real);
    let out = (dest || "").trim();
    if (!out) { // 未给目标路径 -> 弹保存对话框 (zip 用 .zip, 目录形式用文件夹名)
      const isZip = full.endsWith(".zip");
      const r = await dialog.showSaveDialog(win, {
        title: t("bk.export.title"),
        defaultPath: path.join(app.getPath("documents"), real.replace(/\.zip$/, "") + (isZip ? ".zip" : "")),
        filters: isZip ? [{ name: "ZIP", extensions: ["zip"] }] : [],
      });
      if (r.canceled || !r.filePath) return { ok: false, msg: "" };
      out = r.filePath;
    }
    if (fs.statSync(full).isDirectory()) fs.cpSync(full, out, { recursive: true, force: true });
    else fs.copyFileSync(full, out);
    log(`[备份] ${t("bk.exported", out)}`);
    return { ok: true, dest: out, msg: t("bk.exported", out) };
  } catch (e) { return { ok: false, msg: String(e) }; }
}
// 完整性校验: 按 manifest.sha256 逐文件重算 sha256 对比, 用来判断备份是否完好/被改动
async function bkVerify(name) {
  let tmpdir = null;
  try {
    const root = bkRoot();
    const real = bkResolve(name);
    if (!real) return { ok: false, msg: t("bk.none") };
    const full = path.join(root, real);
    let dir = full;
    if (real.endsWith(".zip")) { tmpdir = path.join(os.tmpdir(), `hermes-bk-v-${Date.now()}`); dir = bkExpandZip(full, tmpdir); }
    const hp = path.join(dir, "manifest.sha256");
    if (!fs.existsSync(hp)) return { ok: false, msg: t("bk.nohash") };
    let checked = 0; const bad = [];
    for (const line of fs.readFileSync(hp, "utf8").split(/\r?\n/).filter(Boolean)) {
      const m = /^([0-9a-f]{64})\s{2}(.+)$/.exec(line);
      if (!m) continue;
      const f = path.join(dir, m[2]);
      if (!fs.existsSync(f)) { bad.push(m[2]); continue; }
      let h = "";
      try { h = crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex"); } catch {}
      checked++;
      if (h !== m[1]) bad.push(m[2]);
    }
    if (bad.length) { log(`[备份] ${t("bk.verify.bad", bad.length)}: ${real}`); return { ok: false, checked, bad, msg: t("bk.verify.bad", bad.length) }; }
    log(`[备份] ${t("bk.verify.ok", checked)}: ${real}`);
    return { ok: true, checked, bad: [], msg: t("bk.verify.ok", checked) };
  } catch (e) { return { ok: false, msg: String(e) }; }
  finally { if (tmpdir) { try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {} } }
}
async function bkOpenDir() {
  try { fs.mkdirSync(bkRoot(), { recursive: true }); shell.openPath(bkRoot()); return { ok: true }; }
  catch (e) { return { ok: false, msg: String(e) }; }
}
async function bkPrune() { const n = bkPruneSync(); return { ok: true, removed: n, msg: t("bk.pruned", n) }; }
// 定时自动备份 (bk_auto / bk_auto_every / bk_auto_time; 开关在设置页改动即时生效, 无需重启)
// 每分钟巡检一次: 到点且距上次备份已超过一个周期才执行, 避免每次启动都在启动后 1 分钟补跑
function setupBkAuto() {
  const periodMs = () => (S.bk_auto_every === "weekly" ? 7 : 1) * 864e5;
  let last = 0;
  const atTime = () => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(S.bk_auto_time || "").trim());
    return m ? (parseInt(m[1], 10) % 24) * 60 + (parseInt(m[2], 10) % 60) : 3 * 60;
  };
  const weeklyDays = () => {
    const raw = String(S.bk_schedule_days || "").trim();
    const d = raw.split(",").map((x) => parseInt(x.trim())).filter((x) => x >= 0 && x <= 6);
    return d.length ? d : [1]; // 空=周一
  };
  const tick = () => {
    if (!S.bk_auto || S.bk_enabled === false) return;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    if (cur !== atTime()) return;                                        // 只在设定时刻那一分钟触发
    if (S.bk_auto_every === "weekly" && !weeklyDays().includes(now.getDay())) return;
    if (Date.now() - last < periodMs() - 36e5) return;             // 同周期内不重复
    last = Date.now();
    bkBackupNow(t("bk.auto"), S.bk_scope).then((r) => log(`[备份] 自动: ${r.ok ? "OK " + r.name : r.msg}`)).catch(() => {});
  };
  setInterval(tick, 60000);
}

// 自动更新倒计时确认: 推送渲染层横幅, 用户可"立即更新"或"本次跳过", 超时自动开更
function countdownConfirm(behind, seconds) {
  return new Promise((resolve) => {
    let left = seconds, done = false;
    const push = () => { try { win && win.webContents.send("auto-countdown", { left, total: seconds, behind }); } catch {} };
    const finish = (go) => {
      if (done) return;
      done = true;
      clearInterval(timer);
      startUpdate._countdownResolve = null;
      try { win && win.webContents.send("auto-countdown", { left: 0, total: seconds, behind, ended: true, go }); } catch {}
      resolve(go);
    };
    const timer = setInterval(() => {
      left--;
      if (left <= 0) return finish(true);
      push();
    }, 1000);
    startUpdate._countdownResolve = finish;
    push();
  });
}

// 安装健康评分 (0-100): 路径/命令/Agent/Git 各 20 分 + 磁盘剩余 20 分 (>=5GB 满分, >=1GB 半分)
function healthScore(v) {
  let s = 0;
  if (v.exists) s += 20;
  if (v.hasCmd) s += 20;
  if (v.hasAgent) s += 20;
  if (v.hasGit) s += 20;
  if (v.freeGB != null) s += v.freeGB >= 5 ? 20 : v.freeGB >= 1 ? 10 : 0;
  return s;
}

// 网络巡检: 定时用当前方案实测 github.com; 连续 2 次失败告警 (防抖), 恢复时提示
let netWatchTimer = null, netDown = false, netFailStreak = 0;
function setupNetWatch() {
  if (netWatchTimer) { clearInterval(netWatchTimer); netWatchTimer = null; }
  const minsCfg = parseInt(S.net_watch_min);
  if (S.net_watch === false || !(minsCfg > 0)) return; // 0 = 关闭巡检
  const mins = Math.max(5, minsCfg || 10);
  netWatchTimer = setInterval(async () => {
    if (updating) return;
    try {
      const m = await pickMethod();
      const started = Date.now();
      const ok = await new Promise((resolve) => {
        try {
          execFile("curl", ["-sS", "-o", "NUL", "-w", "%{http_code}", "--max-time", "10", "https://github.com"],
            { windowsHide: true, timeout: 12000, env: { ...process.env, ...m.env } }, (err, stdout) => {
              const code = parseInt((stdout || "").trim()) || 0;
              resolve(!err && code >= 200 && code < 400);
            });
        } catch { resolve(false); }
      });
      const ms = Date.now() - started;
      netFailStreak = ok ? 0 : netFailStreak + 1;
      if (!ok && !netDown && netFailStreak >= 2) {
        netDown = true;
        log(`[网络巡检] 连续 ${netFailStreak} 次不可达 (${m.label})`);
        notifyEvent("gw", t("netwatch.down", m.label));
      } else if (ok && netDown) {
        netDown = false;
        log(`[网络巡检] 已恢复 (${m.label} · ${ms}ms)`);
        notifyEvent("gw", t("netwatch.up", `${m.label} · ${ms}ms`));
      }
    } catch {}
  }, mins * 60000);
  log(`[网络巡检] 已开启, 每 ${mins} 分钟`);
}

// 自动检查公共体: 自动定时与每周计划共用 (reason 仅用于日志)
async function runAutoCheck(reason) {
  if (updating) return;
  if (inQuietHours()) { if (reason === "sched") log("[计划] 处于免打扰时段, 跳过本次计划检查"); return; }
  try {
    const st = await getStatus();
    if (st.behind > 0) {
      if (snoozeActive()) { log(`[自动检查] 落后 ${st.behind}, 处于稍后提醒期 (至 ${new Date(S.snooze_until).toLocaleString()}), 跳过提醒与自动更新`); return; }
      log(`[${reason === "sched" ? "计划" : "自动检查"}] 发现新版本: 落后 ${st.behind}`);
      notifyNewVersion(st.behind, st.rhead);
      // 自动执行更新 (可关): 倒计时确认防呆 (渲染层可立即更新/跳过本次), 0 秒=直接开更
      if (S.auto_execute) {
        const cd = Math.min(Math.max(parseInt(S.auto_countdown_sec) || 0, 0), 600);
        let go = true;
        if (cd > 0) {
          go = await countdownConfirm(st.behind, cd);
          if (!go) { log(`[自动更新] 用户跳过本次 (落后 ${st.behind})`); return; }
        }
        sendAutoExecLine(st.behind);
        startUpdate(win);
      }
    } else updateTrayBadge(0); // 已无更新 -> 清角标
  } catch (e) { log(`[自动检查] 失败: ${e}`); }
}

function setupAutoUpdate() {  if (startUpdate._autoTimer) clearInterval(startUpdate._autoTimer);
  if (!S.auto_update) return;
  const mins = Math.max(15, parseInt(S.auto_update_interval_min) || 60);
  startUpdate._autoTimer = setInterval(() => runAutoCheck("interval"), mins * 60000);
  log(`[自动检查] 已开启, 每 ${mins} 分钟`);
}

// 每周定时计划: sched_days "1,3,5" (0=周日) + sched_time "HH:MM", 到点触发一次检查
let schedLast = "";
function setupSchedule() {
  if (startUpdate._schedTimer) clearInterval(startUpdate._schedTimer);
  const days = String(S.sched_days || "").split(",").map((x) => parseInt(x.trim())).filter((x) => x >= 0 && x <= 6);
  if (!days.length) { schedLast = ""; return; }
  startUpdate._schedTimer = setInterval(() => {
    const now = new Date(), p = (n) => String(n).padStart(2, "0");
    const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const hhmm = `${p(now.getHours())}:${p(now.getMinutes())}`;
    if (!days.includes(now.getDay()) || hhmm !== String(S.sched_time || "").trim()) return;
    if (schedLast === key) return; // 一天内只触发一次
    schedLast = key;
    log(`[计划] 定时检查触发 (${days.map((d) => "周" + "日一二三四五六"[d]).join("/")}, ${hhmm})`);
    runAutoCheck("sched");
  }, 20000);
  log(`[计划] 已开启: ${days.map((d) => "周" + "日一二三四五六"[d]).join("/")} ${S.sched_time}`);
}
// 把自动执行提示写进更新输出区 (更新开始前渲染层还看不到, 先缓存到缓冲区)
function sendAutoExecLine(behind) {
  const line = t("u.autoexec", behind);
  log(line);
  try { win && win.webContents.send("update-line", line); } catch {}
}

// ---------------- IPC ----------------
ipcMain.handle("get-settings", () => ({ ...S, history_path: HISTORY_PATH, log_path: LOG_PATH }));
ipcMain.handle("save-settings", (e, patch) => {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return { ok: false, msg: "bad patch" }; // 防御: 拒绝字符串等误传, 避免展开成垃圾键
  const prevDark = S.dark_mode;
  const prevLang = S.language;
  const prevPath = S.install_path;
  S = { ...S, ...patch };
  // 安装路径变更且有效 -> 记入路径历史 (供自动识别快速命中)
  if (patch.install_path && patch.install_path !== prevPath && validateInstallPath(patch.install_path).valid) {
    S.path_history = [...new Set([patch.install_path, ...(S.path_history || [])])].slice(0, 8);
  }
  saveSettings();
  log("设置已保存");
  setupAutoUpdate();
  setupGatewayWatch();
  setupSchedule();
  setupNetWatch();
  setupWatchdog();
  setupPathWatch();
  applyThemeSource(); // 主题即时生效 (深色/浅色/跟随系统)
  if (win && patch.always_on_top !== undefined) { try { win.setAlwaysOnTop(!!patch.always_on_top); } catch {} } // 置顶即时生效
  if (patch.language && patch.language !== prevLang) makeTray(); // 语言切换 -> 托盘菜单即时换语言
  return { ok: true, darkChanged: patch.dark_mode !== undefined && patch.dark_mode !== prevDark };
});
// ---- 安装路径: 自动识别 / 单路径体检 / 浏览选择 ----
ipcMain.handle("detect-install-paths", async (e, deep) => await detectHermesInstalls(!!deep));
ipcMain.handle("check-install-path", (e, p) => validateInstallPath(p));
ipcMain.handle("browse-install-path", async () => {
  const r = await dialog.showOpenDialog(win, { title: t("path.browse"), properties: ["openDirectory"] });
  if (r.canceled || !r.filePaths || !r.filePaths[0]) return { ok: false };
  return { ok: true, path: r.filePaths[0], check: validateInstallPath(r.filePaths[0]) };
});
// 更新前预检: 安装路径 / git 仓库 / 磁盘剩余 (问题用 key 返回, 文案由渲染层本地化)
ipcMain.handle("preflight-check", () => {
  const c = validateInstallPath(S.install_path);
  const issues = [];
  if (!c.exists) issues.push("path");
  else if (!c.valid) issues.push("pathpartial");
  if (c.exists && !c.hasGit) issues.push("git");
  const minGB = parseInt(S.min_free_gb) || 1;
  if (c.freeGB != null && c.freeGB < minGB) issues.push("disk");
  return { ok: issues.length === 0, issues, check: c, minGB };
});
// 已知安装管理: 保存 / 移除 (操作 path_history)
ipcMain.handle("add-known-install", (e, p) => {
  if (typeof p !== "string" || !validateInstallPath(p.trim()).valid) return { ok: false };
  const v = path.resolve(p.trim());
  S.path_history = [...new Set([v, ...(S.path_history || [])])].slice(0, 8);
  saveSettings();
  log(`[路径] 已保存到已知安装: ${v}`);
  return { ok: true, history: S.path_history };
});
ipcMain.handle("remove-known-install", (e, p) => {
  if (typeof p !== "string") return { ok: false };
  const v = path.resolve(p.trim());
  S.path_history = (S.path_history || []).filter((x) => { try { return path.resolve(x) !== v; } catch { return true; } });
  saveSettings();
  log(`[路径] 已从已知安装移除: ${v}`);
  return { ok: true, history: S.path_history };
});
// 一键诊断报告: 安装体检 + 脱敏设置 + 更新历史 + 日志尾部 -> txt
ipcMain.handle("export-diag-report", async () => {
  const r = await dialog.showSaveDialog(win, {
    title: t("report.title"),
    defaultPath: path.join(app.getPath("documents"), `hermes-diag-${new Date().toISOString().slice(0, 10)}.txt`),
    filters: [{ name: "Text", extensions: ["txt"] }],
  });
  if (r.canceled || !r.filePath) return { ok: false };
  try {
    const c = validateInstallPath(S.install_path);
    let logTail = ""; try { logTail = fs.readFileSync(LOG_PATH, "utf8").split(/\r?\n/).slice(-80).join("\n"); } catch {}
    let hist = "[]"; try { hist = fs.readFileSync(HISTORY_PATH, "utf8"); } catch {}
    const mask = (s) => String(s || "").replace(/(:\/\/[^:/@]+:)[^@]+@/, "$1***@"); // 代理密码脱敏
    const lines = [
      "HermesUpdater 诊断报告 / Diagnostics Report",
      `生成时间: ${new Date().toLocaleString()}`,
      `应用版本: v${app.getVersion()}`,
      "",
      "[安装路径体检]",
      JSON.stringify(c, null, 2),
      `盘符: ${listDrives().join("  ")}`,
      "",
      "[设置 (代理密码已脱敏)]",
      JSON.stringify({ ...S, manual_proxy: mask(S.manual_proxy), profiles: (S.profiles || []).map((x) => ({ ...x, manual_proxy: mask(x.manual_proxy) })) }, null, 2),
      "",
      "[更新历史]",
      hist,
      "",
      "[日志尾部 80 行]",
      logTail,
      "",
    ];
    fs.writeFileSync(r.filePath, lines.join("\n"), "utf8");
    log(`诊断报告已导出: ${r.filePath}`);
    return { ok: true, filePath: r.filePath };
  } catch (e) { return { ok: false, msg: String(e) }; }
});
// 恢复默认设置 (保留语言, 历史记录不受影响)
ipcMain.handle("reset-settings", () => {
  S = { ...DEFAULTS, language: S.language };
  saveSettings();
  log("设置已恢复默认");
  applyThemeSource();
  setupAutoUpdate();
  setupGatewayWatch();
  setupSchedule();
  setupNetWatch();
  setupWatchdog();
  if (win) { try { win.setAlwaysOnTop(S.always_on_top === true); } catch {} }
  return { ok: true, settings: S };
});
ipcMain.handle("get-status", async () => {
  const r = await getStatus();
  if (r.behind > 0) notifyNewVersion(r.behind, r.rhead);
  updateTrayBadge(r.behind);
  return r;
});
// 快速首屏状态: 不做网络探测、不 git fetch, 本地命令 1~2 秒即回, 先填充卡片避免"看起来卡住"
function quickMethodLabel() {
  const map = { auto: "m.auto", direct: "m.direct", system: "m.system", manual: "m.manual", mirror: "m.mirror" };
  return t(map[S.auto_switch] || "m.auto");
}
ipcMain.handle("get-quick-status", async () => {
  const head = (await git(["rev-parse", "--short", "HEAD"], 10000)).trim();
  const [, vOut] = await runHermes(["--version"], 25000);
  const [, gwOut] = await runHermes(["gateway", "status"], 25000);
  return {
    ok: !!head,
    version: (vOut || "").split("\n")[0] || "",
    head,
    gateway: (gwOut || "").split("\n")[0] || "",
    method: quickMethodLabel(),
  };
});
ipcMain.handle("net-probe", async () => {
  const sysProxy = await detectSystemProxy();
  const G = "https://github.com";
  const results = [{ name: t("probe.direct"), ok: await testUrl2(G, null, 6000) }];
  if (sysProxy) results.push({ name: `${t("probe.system")} ${sysProxy}`, ok: await testUrl2(G, sysProxy, 6000) });
  if (S.manual_proxy) results.push({ name: `${t("probe.manual")} ${S.manual_proxy}`, ok: await testUrl2(G, S.manual_proxy, 6000) });
  const mirror = (S.mirror_url || "").replace(/\/$/, "") + "/";
  if (S.mirror_url) results.push({ name: `${t("probe.mirror")} ${mirror}`, ok: await testUrl2(mirror, null, 8000) });
  return results;
});
ipcMain.handle("export-settings", async () => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: "导出设置", defaultPath: "hermes-settings.json",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (canceled || !filePath) return { ok: false };
  fs.writeFileSync(filePath, JSON.stringify(S, null, 2), "utf8");
  return { ok: true, filePath };
});
ipcMain.handle("import-settings", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: "导入设置", filters: [{ name: "JSON", extensions: ["json"] }], properties: ["openFile"],
  });
  if (canceled || !filePaths || !filePaths[0]) return { ok: false };
  try {
    const obj = JSON.parse(fs.readFileSync(filePaths[0], "utf8"));
    S = { ...DEFAULTS, ...S, ...obj };
    saveSettings();
    setupAutoUpdate();
    log(`设置已导入: ${filePaths[0]}`);
    return { ok: true, settings: S };
  } catch (e) { return { ok: false, msg: String(e) }; }
});
ipcMain.handle("gateway-action", async (e, action) => {
  const [rc, out] = await runHermes(["gateway", action], 120000);
  log(`gateway ${action}: rc=${rc}`);
  return { ok: rc === 0, out };
});
ipcMain.handle("doctor", async () => {
  const [, out] = await runHermes(["doctor"], 120000);
  return out || "(无输出)";
});
ipcMain.handle("kill-processes", async () => {
  const [kc, kd] = await killHermesProcesses([], true);
  log(`清理进程: ${kc} (${kd})`);
  return { killed: kc, detail: kd };
});
ipcMain.handle("open-path", async (e, which) => {
  const p = which === "install" ? install() : which === "logdir" ? APP_DIR : which === "backupdir" ? backupDir() : LOG_PATH;
  try {
    if (which === "backupdir" && !fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); // 目录不存在先建, 避免打开失败
    await shell.openPath(p); return { ok: true };
  }
  catch (err) { return { ok: false, msg: String(err) }; }
});
// 从最新自动备份恢复 (与数据包导入同格式: 设置脱敏密码仍在原文, 备份存的是明文设置)
ipcMain.handle("restore-latest-backup", async () => {
  try {
    const dir = backupDir();
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort() : [];
    if (!files.length) return { ok: false, msg: "none" };
    const file = path.join(dir, files[files.length - 1]);
    const p = JSON.parse(fs.readFileSync(file, "utf8"));
    if (p.app !== "HermesUpdater") return { ok: false, msg: "invalid" };
    if (p.settings && typeof p.settings === "object" && !Array.isArray(p.settings)) { S = { ...DEFAULTS, ...p.settings }; saveSettings(); applyThemeSource(); setupAutoUpdate(); setupGatewayWatch(); setupSchedule(); setupWatchdog(); }
    if (Array.isArray(p.history)) fs.writeFileSync(HISTORY_PATH, JSON.stringify(p.history, null, 2), "utf8");
    log(`[备份] 已从最新备份恢复: ${file}`);
    return { ok: true, file };
  } catch (e) { return { ok: false, msg: String(e).slice(0, 120) }; }
});

// 备份列表: [{file, time, sizeKB}]
ipcMain.handle("list-backups", () => {
  const dir = backupDir();
  try {
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse().map((f) => {
      let sizeKB = 0;
      try { sizeKB = Math.round(fs.statSync(path.join(dir, f)).size / 1024); } catch {}
      return { file: f, time: f.replace("backup-", "").replace(".json", ""), sizeKB };
    }) : [];
  } catch { return []; }
});

// 从指定备份恢复 (文件名白名单校验)
ipcMain.handle("restore-backup", async (e, name) => {
  const n = String(name || "");
  if (!/^backup-\d{4}-\d{2}-\d{2}\.json$/.test(n)) return { ok: false, msg: "bad name" };
  try {
    const file = path.join(backupDir(), n);
    const p = JSON.parse(fs.readFileSync(file, "utf8"));
    if (p.app !== "HermesUpdater") return { ok: false, msg: "invalid" };
    if (p.settings && typeof p.settings === "object" && !Array.isArray(p.settings)) { S = { ...DEFAULTS, ...p.settings }; saveSettings(); applyThemeSource(); setupAutoUpdate(); setupGatewayWatch(); setupSchedule(); setupWatchdog(); }
    if (Array.isArray(p.history)) fs.writeFileSync(HISTORY_PATH, JSON.stringify(p.history, null, 2), "utf8");
    try { win && win.webContents.send("settings-updated", null); } catch {}
    log(`[备份] 已从备份恢复: ${file}`);
    return { ok: true, file };
  } catch (err) { return { ok: false, msg: String(err).slice(0, 120) }; }
});

// ---------------- 备份与恢复 (Hermes Agent 配置/数据) IPC ----------------
ipcMain.handle("bk-scopes", () => BK_SCOPE_KEYS.slice());
ipcMain.handle("bk-list", () => bkList());
ipcMain.handle("bk-backup-now", (e, payload) => bkBackupNow(payload && payload.note, payload && payload.scope));
ipcMain.handle("bk-restore", (e, name) => bkRestore(name));
ipcMain.handle("bk-delete", (e, name) => bkDelete(name));
ipcMain.handle("bk-export", (e, payload) => bkExport(payload && payload.name, payload && payload.dest));
ipcMain.handle("bk-verify", (e, name) => bkVerify(name));
ipcMain.handle("bk-open-dir", () => bkOpenDir());
ipcMain.handle("bk-prune", () => bkPrune());

// ---------------- 空间清理向导 ----------------
let cleaning = false;
function dirSizeMB(p, deadline) {
  let total = 0;
  try {
    const st = [{ dir: p }];
    while (st.length) {
      const cur = st.pop();
      if (Date.now() > deadline) break;
      let es;
      try { es = fs.readdirSync(cur.dir, { withFileTypes: true }); } catch { continue; }
      for (const e of es) {
        const fp = path.join(cur.dir, e.name);
        try { if (e.isDirectory()) st.push({ dir: fp }); else total += fs.statSync(fp).size; } catch {}
      }
    }
  } catch {}
  return total / 1048576;
}
function cleanupTargets() {
  const items = [];
  const npmCache = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "npm-cache");
  if (fs.existsSync(npmCache)) items.push({ key: "npmcache", path: npmCache, sizeMB: dirSizeMB(npmCache, Date.now() + 8000) });
  const dir = backupDir();
  try {
    const keep = Math.min(Math.max(parseInt(S.backup_keep) || 5, 1), 30);
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort() : [];
    const excess = files.slice(0, Math.max(0, files.length - keep));
    if (excess.length) items.push({ key: "oldbackups", path: dir, sizeMB: 0, files: excess, note: `${excess.length} 份` });
  } catch {}
  try {
    const st = fs.statSync(LOG_PATH);
    if (st.size > 1048576) items.push({ key: "applog", path: LOG_PATH, sizeMB: st.size / 1048576 });
  } catch {}
  return items;
}
ipcMain.handle("cleanup-scan", () => (cleaning ? { ok: false, msg: "busy" } : { ok: true, items: cleanupTargets() }));
ipcMain.handle("cleanup-run", async (e, keys) => {
  if (cleaning) return { ok: false, msg: "busy" };
  cleaning = true;
  const send = (l) => { try { win && win.webContents.send("cleanup-line", String(l)); } catch {} };
  const ks = Array.isArray(keys) ? keys : [];
  const items = cleanupTargets().filter((i) => ks.includes(i.key));
  let freed = 0;
  try {
    for (const it of items) {
      if (it.key === "npmcache") {
        send(`[清理] npm cache clean --force (${(it.sizeMB || 0).toFixed(1)} MB)…`);
        const before = it.sizeMB;
        await new Promise((res) => execFile("cmd.exe", ["/d", "/s", "/c", "npm cache clean --force"], { windowsHide: true, timeout: 120000, windowsVerbatimArguments: true }, () => res()));
        const after = fs.existsSync(it.path) ? dirSizeMB(it.path, Date.now() + 5000) : 0;
        freed += Math.max(0, before - after);
        send(`[清理] npm 缓存完成, 释放约 ${(before - after).toFixed(1)} MB`);
      } else if (it.key === "oldbackups") {
        for (const f of it.files) { try { fs.unlinkSync(path.join(it.path, f)); } catch {} }
        send(`[清理] 已删除 ${it.files.length} 份超额旧备份`);
      } else if (it.key === "applog") {
        const keepBytes = 512 * 1024;
        const buf = fs.readFileSync(it.path);
        fs.writeFileSync(it.path, buf.slice(Math.max(0, buf.length - keepBytes)));
        send(`[清理] 日志已截断保留最后 512 KB`);
      }
    }
    log(`[清理] 空间清理完成, 释放约 ${freed.toFixed(1)} MB`);
    return { ok: true, freedMB: +freed.toFixed(1) };
  } catch (err) { return { ok: false, msg: String(err).slice(0, 140) }; }
  finally { cleaning = false; }
});
// 环境信息一键收集 (诊断页)
ipcMain.handle("env-info", async () => {
  const run = (cmd, args, timeout = 6000) => new Promise((res) => execFile(cmd, args, { windowsHide: true, timeout }, (e, o) => res(e ? "" : (o || "").trim())));
  const lines = [];
  lines.push(`应用: HermesUpdater v${app.getVersion()}`);
  lines.push(`运行时: Electron ${process.versions.electron} · Node ${process.versions.node} · Chromium ${process.versions.chrome}`);
  lines.push(`系统: ${os.platform()} ${os.release()} · ${os.cpus().length} 核 · 内存 ${Math.round(os.totalmem() / 1073741824)}GB`);
  lines.push(`git: ${(await run("git", ["--version"])) || "不可用"}`);
  const repo = path.join(install(), "hermes-agent");
  const branch = await run("git", ["-C", repo, "branch", "--show-current"]);
  const head = await run("git", ["-C", repo, "rev-parse", "--short", "HEAD"]);
  lines.push(`Hermes 仓库: ${branch && head ? `${branch} @ ${head}` : "不可用"} (${repo})`);
  const disks = [];
  for (let c = 67; c <= 90; c++) {
    const drive = `${String.fromCharCode(c)}:\\`;
    try { if (fs.existsSync(drive)) { const st = fs.statfsSync(drive); disks.push(`${drive.slice(0, 2)} 剩余 ${((st.bavail * st.bsize) / 1073741824).toFixed(0)}GB`); } } catch {}
  }
  lines.push(`磁盘: ${disks.join(" · ") || "不可用"}`);
  return lines.join("\n");
});
// ---- What's New: 更新前预览待拉取的提交 (HEAD..origin/branch) ----
ipcMain.handle("whats-new", async () => {
  const br = S.branch || "main";
  try {
    const max = Math.min(Math.max(parseInt(S.whatsnew_max) || 30, 10), 100);
    const out = await git(["log", `HEAD..origin/${br}`, `--max-count=${max}`, "--format=%h|%ci|%an|%s"], 60000);
    const commits = out.split("\n").filter((l) => l.includes("|")).map((l) => {
      const i = l.indexOf("|"), j = l.indexOf("|", i + 1), k = l.indexOf("|", j + 1);
      return { hash: l.slice(0, i), date: l.slice(i + 1, j), author: l.slice(j + 1, k), msg: l.slice(k + 1) };
    });
    let total = commits.length;
    try { const c = await git(["rev-list", "--count", `HEAD..origin/${br}`], 30000); total = parseInt((c || "").trim()) || commits.length; } catch {}
    return { ok: true, commits, total, branch: br };
  } catch (e) { return { ok: false, msg: String(e).slice(0, 120) }; }
});
// ---- 进程管理器: 列出命令行指向当前 Hermes 安装的进程 (含内存/是否 Gateway) ----
function listHermesProcs() {
  return new Promise((resolve) => {
    const agent = agentDir().replace(/\\/g, "/").toLowerCase();
    const inst = install().replace(/\\/g, "/").toLowerCase();
    execFile("powershell", ["-NoProfile", "-Command",
      "Get-CimInstance Win32_Process | Select-Object ProcessId,Name,WorkingSetSize,CommandLine | ConvertTo-Json -Compress"],
      { windowsHide: true, timeout: 20000, maxBuffer: 32e6 }, (e, out) => {
        if (e || !out) return resolve({ ok: false, msg: "enum fail" });
        try {
          const arr = JSON.parse(out);
          const procs = Array.isArray(arr) ? arr : [arr];
          const list = [];
          for (const p of procs) {
            const cl = String(p.CommandLine || "").replace(/\\/g, "/").toLowerCase();
            if (!cl.includes(agent) && !cl.includes(inst)) continue;
            if (parseInt(p.ProcessId) === process.pid) continue;
            list.push({
              pid: parseInt(p.ProcessId),
              name: path.basename(String(p.Name || "")),
              memMB: Math.round((parseInt(p.WorkingSetSize) || 0) / 1048576 * 10) / 10,
              gateway: /gateway/i.test(cl),
              cmd: String(p.CommandLine || "").slice(0, 160),
            });
          }
          list.sort((a, b) => b.memMB - a.memMB);
          resolve({ ok: true, list });
        } catch (er) { resolve({ ok: false, msg: String(er) }); }
      });
  });
}
ipcMain.handle("proc-list", () => listHermesProcs());
ipcMain.handle("proc-kill", (e, pid) => new Promise((resolve) => {
  const p = parseInt(pid);
  if (!p || p === process.pid) return resolve({ ok: false, msg: "bad pid" });
  execFile("taskkill", ["/F", "/PID", String(p)], { windowsHide: true }, (err) => {
    log(`[进程] 结束 PID ${p}: ${err ? `失败 (${err})` : "成功"}`);
    resolve({ ok: !err, msg: err ? String(err) : "" });
  });
}));
// ---- 更新统计: 基于更新历史聚合 (成功率 / 月度趋势 / 网络方式 / 失败原因) ----
ipcMain.handle("update-stats", () => {
  const hist = getHistory();
  let ok = 0, fail = 0, cancel = 0, durSum = 0, durN = 0;
  const byMonth = new Map(), byLabel = new Map(), byReason = new Map();
  for (const e of hist) {
    const res = (e.result === "ok" && e.rc === 0) ? "ok" : (e.rc === -2 || /取消|cancel/i.test(String(e.note || "")) ? "cancel" : "fail");
    if (res === "ok") ok++; else if (res === "cancel") cancel++; else fail++;
    const d = parseInt(e.dur) || 0;
    if (d > 0) { durSum += d; durN++; }
    const mk = String(e.time || "").slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(mk)) {
      if (!byMonth.has(mk)) byMonth.set(mk, { ok: 0, fail: 0, cancel: 0 });
      byMonth.get(mk)[res]++;
    }
    const lab = String(e.label || "?").trim() || "?";
    if (!byLabel.has(lab)) byLabel.set(lab, { ok: 0, fail: 0, cancel: 0 });
    byLabel.get(lab)[res]++;
    if (res === "fail") {
      const rn = String(e.note || "").replace(/^原因[:：]\s*/i, "").replace(/^reason:\s*/i, "").trim() || "unknown";
      byReason.set(rn, (byReason.get(rn) || 0) + 1);
    }
  }
  const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([month, v]) => ({ month, ...v }));
  const labels = [...byLabel.entries()].map(([label, v]) => ({ label, ...v, total: v.ok + v.fail + v.cancel })).sort((a, b) => b.total - a.total).slice(0, 6);
  const reasons = [...byReason.entries()].map(([reason, n]) => ({ reason, n })).sort((a, b) => b.n - a.n).slice(0, 5);
  const now = new Date();
  const tmKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const tm = byMonth.get(tmKey) || { ok: 0, fail: 0, cancel: 0 };
  return {
    total: hist.length, ok, fail, cancel,
    rate: hist.length ? Math.round((ok / hist.length) * 100) : 0,
    avgDur: durN ? Math.round(durSum / durN) : 0,
    thisMonth: { key: tmKey, ...tm },
    months, labels, reasons,
  };
});
ipcMain.handle("copy-text", (e, text) => { clipboard.writeText(text || ""); return { ok: true }; });
ipcMain.handle("get-history", () => getHistory());
ipcMain.handle("clear-history", () => { fs.writeFileSync(HISTORY_PATH, "[]", "utf8"); return true; });
// 通用文本导出 (更新输出/诊断结果/日志 -> txt)
// 数据一键备份/恢复 (设置 + 更新历史 打包为单个 JSON)
ipcMain.handle("export-data", async () => {
  const r = await dialog.showSaveDialog(win, {
    title: "导出数据包 (设置+历史)",
    defaultPath: path.join(app.getPath("documents"), `hermes-updater-data-${new Date().toISOString().slice(0, 10)}.json`),
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (r.canceled || !r.filePath) return { ok: false };
  try {
    const payload = { app: "HermesUpdater", version: 1, exportedAt: new Date().toISOString(), settings: S, history: getHistory() };
    fs.writeFileSync(r.filePath, JSON.stringify(payload, null, 2), "utf8");
    log(`数据包已导出: ${r.filePath}`);
    return { ok: true, filePath: r.filePath };
  } catch (e) { return { ok: false, msg: String(e) }; }
});
ipcMain.handle("import-data", async () => {
  const r = await dialog.showOpenDialog(win, {
    title: "导入数据包 (将覆盖当前设置与历史)",
    filters: [{ name: "JSON", extensions: ["json"] }], properties: ["openFile"],
  });
  if (r.canceled || !r.filePaths[0]) return { ok: false };
  try {
    const p = JSON.parse(fs.readFileSync(r.filePaths[0], "utf8"));
    if (p.app !== "HermesUpdater") return { ok: false, msg: "不是有效的 HermesUpdater 数据包" };
    let n = 0;
    if (p.settings && typeof p.settings === "object") { S = { ...DEFAULTS, ...p.settings }; saveSettings(); applyThemeSource(); setupAutoUpdate(); setupGatewayWatch(); setupSchedule(); setupWatchdog(); n++; }
    if (Array.isArray(p.history)) { fs.writeFileSync(HISTORY_PATH, JSON.stringify(p.history, null, 2), "utf8"); n++; }
    log(`数据包已导入 (${r.filePaths[0]}): ${n} 个部分`);
    return { ok: n > 0, settings: n > 0 ? { ...S } : null };
  } catch (e) { return { ok: false, msg: String(e) }; }
});
ipcMain.handle("export-text", async (e, { name, content }) => {
  const r = await dialog.showSaveDialog(win, {
    title: "导出文本", defaultPath: path.join(app.getPath("documents"), name || "export.txt"),
    filters: [{ name: "文本", extensions: ["txt"] }],
  });
  if (r.canceled || !r.filePath) return { ok: false };
  try { fs.writeFileSync(r.filePath, content, "utf8"); log(`文本已导出: ${r.filePath}`); return { ok: true, filePath: r.filePath }; }
  catch (err) { return { ok: false, msg: String(err) }; }
});
ipcMain.handle("delete-history", (e, i) => { const h = getHistory(); h.splice(i, 1); fs.writeFileSync(HISTORY_PATH, JSON.stringify(h, null, 2), "utf8"); return true; });
ipcMain.handle("export-history-csv", async () => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: "导出更新历史", defaultPath: "update-history.csv",
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (canceled || !filePath) return { ok: false };
  const rows = [["时间", "rc", "方式", "耗时", "结果", "旧版本", "新版本", "备注"],
    ...getHistory().map((x) => [x.time, x.rc, x.label, x.dur, x.result, x.old, x.new, x.note || ""])];
  fs.writeFileSync(filePath, "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n"), "utf8");
  return { ok: true, filePath };
});
ipcMain.handle("start-update", (e) => { startUpdate._t0 = Date.now(); return startUpdate(win); });
ipcMain.handle("get-logs", () => { try { return fs.readFileSync(LOG_PATH, "utf8"); } catch { return t("log.none"); } });
// 连通性测试: 与真实更新完全一致的网络方式 (pickMethod) + curl 实测 github.com; 结果持久化最近 5 条
const CONN_PATH = path.join(APP_DIR, "conn-tests.json");
function getConnTests() { try { return JSON.parse(fs.readFileSync(CONN_PATH, "utf8")); } catch { return []; } }
function recordConnTest(r) {
  try {
    const h = getConnTests();
    const d = new Date(), p = (n) => String(n).padStart(2, "0");
    h.unshift({ time: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`, ok: r.ok, label: r.label, ms: r.ms, code: r.code || 0 });
    while (h.length > 5) h.pop();
    fs.writeFileSync(CONN_PATH, JSON.stringify(h, null, 2));
  } catch {}
}
ipcMain.handle("get-conn-tests", () => getConnTests());
ipcMain.handle("test-connection", async () => {
  const m = await pickMethod();
  const started = Date.now();
  const r = await new Promise((resolve) => {
    try {
      execFile("curl", ["-sS", "-o", "NUL", "-w", "%{http_code}", "--max-time", "12", "https://github.com"],
        { windowsHide: true, timeout: 15000, env: { ...process.env, ...m.env } }, (err, stdout) => {
          const ms = Date.now() - started;
          const code = parseInt((stdout || "").trim()) || 0;
          if (!err && code >= 200 && code < 400) resolve({ ok: true, code, ms, label: m.label });
          else resolve({ ok: false, code, ms, label: m.label, msg: err ? String(err.message || err).split("\n")[0].slice(0, 120) : "" });
        });
    } catch (e) { resolve({ ok: false, ms: 0, label: m.label, msg: String(e).slice(0, 120) }); }
  });
  recordConnTest(r);
  return r;
});

// 测速对比: 直连/系统代理/手动代理 + 全部镜像候选 并发实测延迟, 供一键切换最快方案
// 镜像为"前缀式"代理, 只影响 git 不影响 curl github.com, 故镜像行测镜像主机本身的 HTTP 延迟
ipcMain.handle("speedtest", async () => {
  const GITHUB = "https://github.com";
  const sysProxy = await detectSystemProxy();
  const rows = [{ key: "direct", label: t("probe.direct"), env: {}, mirror: false }];
  if (sysProxy) rows.push({ key: "system", label: `${t("probe.system")} ${sysProxy}`, env: proxyEnv(sysProxy), mirror: false });
  if (S.manual_proxy) rows.push({ key: "manual", label: `${t("probe.manual")} ${S.manual_proxy}`, env: proxyEnv(S.manual_proxy), mirror: false });
  for (const m of candidateMirrors()) rows.push({ key: `mirror|${m.replace(/\/$/, "")}`, label: `${t("probe.mirror")} ${m.replace(/^https?:\/\//, "")}`, env: {}, url: m, mirror: true });
  const one = (r) => new Promise((resolve) => {
    const started = Date.now();
    const url = r.mirror ? r.url : GITHUB;
    try {
      execFile("curl", ["-sS", "-o", "NUL", "-w", "%{http_code}", "--max-time", "8", url],
        { windowsHide: true, timeout: 10000, env: { ...process.env, ...r.env } }, (err, stdout) => {
          const code = parseInt((stdout || "").trim()) || 0;
          const ok = !err && code > 0 && code < 500; // 镜像根路径可能 403/404, 能响应即视为可达
          resolve({ key: r.key, label: r.label, ok, ms: Date.now() - started, code });
        });
    } catch { resolve({ key: r.key, label: r.label, ok: false, ms: 0, code: 0 }); }
  });
  return await Promise.all(rows.map(one));
});

// 一键应用网络方案: direct/system/manual 原样切换; mirror|<url> 同时写入镜像地址
ipcMain.handle("apply-net-method", async (e, key) => {
  try {
    let k = String(key || "");
    if (k.startsWith("mirror|")) {
      const url = k.slice(7);
      if (!/^https?:\/\//.test(url)) return { ok: false, msg: "bad url" };
      S.mirror_url = url;
      k = "mirror";
    }
    if (!["auto", "direct", "system", "manual", "mirror"].includes(k)) return { ok: false, msg: "bad method" };
    S.auto_switch = k;
    saveSettings();
    log(`[网络] 已切换网络方式: ${k}${k === "mirror" ? ` (${S.mirror_url})` : ""}`);
    notifyEvent("path", t(`m.${k}`));
    try { win && win.webContents.send("settings-updated", null); } catch {}
    return { ok: true };
  } catch (err) { return { ok: false, msg: String(err).slice(0, 120) }; }
});

// 稍后提醒: N 小时内抑制新版本提醒与自动更新 (手动更新不受限); hours<=0 表示清除抑制
ipcMain.handle("snooze", (e, hours) => {
  const h = parseFloat(hours);
  if (!isFinite(h) || h <= 0) {
    S.snooze_until = 0;
    saveSettings();
    log("[提醒] 已取消稍后提醒抑制");
    return { ok: true, until: 0 };
  }
  const hh = Math.min(Math.max(h, 0.5), 24);
  S.snooze_until = Date.now() + hh * 3600e3;
  saveSettings();
  log(`[提醒] 已设置稍后提醒 ${hh} 小时 (至 ${new Date(S.snooze_until).toLocaleString()})`);
  return { ok: true, until: S.snooze_until };
});
ipcMain.handle("get-snooze", () => ({ until: Number(S.snooze_until) || 0, active: snoozeActive() }));

// ---------------- Hermes 安装引擎 ----------------
const INS_HIST_PATH = path.join(APP_DIR, "install-history.json");
let insProc = null, insCancel = false;
function insNow() { const d = new Date(), p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; }

function insHistory() { try { return JSON.parse(fs.readFileSync(INS_HIST_PATH, "utf8")); } catch { return []; } }
function appendInsHistory(rec) {
  const list = insHistory();
  list.unshift(rec);
  try { fs.writeFileSync(INS_HIST_PATH, JSON.stringify(list.slice(0, Math.max(1, parseInt(S.ins_hist_keep) || 10)), null, 2), "utf8"); } catch {}
  try { win && win.webContents.send("install-history-updated"); } catch {}
}
function insSendLine(l) { try { win && win.webContents.send("install-line", String(l)); } catch {} }
function insSendStage(stage, pct, text) { try { win && win.webContents.send("install-stage", { stage, pct, text }); } catch {} }

function insRegistryArg() {
  if (S.ins_npm_mirror === "npmmirror") return " --registry=https://registry.npmmirror.com";
  if (S.ins_npm_mirror === "custom" && String(S.ins_npm_custom || "").trim()) return ` --registry=${String(S.ins_npm_custom).trim()}`;
  return "";
}
function insMirrorBase() {
  const own = String(S.ins_mirror_url || "").trim();
  if (own) return own.replace(/\/?$/, "/");
  return String(S.mirror_url || "").trim().replace(/\/?$/, "/");
}
function insRepoUrl() {
  const url = String(S.ins_repo || "").trim();
  if (S.ins_git_accel && insMirrorBase() && url.startsWith("https://github.com/")) return insMirrorBase() + url;
  return url;
}
function insExe(cmd) { return spawn("cmd.exe", ["/d", "/s", "/c", cmd], { windowsHide: true, windowsVerbatimArguments: true }); }

// 安装专用镜像探测: 对安装源仓库逐个探测候选前缀的 git 可用性 (与更新用的 originRepoPath 解耦)
async function pickInstallMirror(repoUrl, sendLine) {
  const m0 = String(repoUrl || "").match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?\s*$/i);
  if (!m0) return null;
  const repo = `${m0[1]}/${m0[2]}`;
  const tried = insRepoUrl();
  for (const m of candidateMirrors()) {
    if (tried && tried.startsWith(m)) continue; // 跳过刚失败过的
    const ok = await probeGitUrl(`${m}https://github.com/${repo}/info/refs?service=git-upload-pack`, 8000);
    if (sendLine) sendLine(`[镜像] ${m} -> ${ok ? "OK" : "FAIL"}`);
    if (ok) return m;
  }
  return null;
}

// 流式执行命令, 返回 { rc, buf }; 超时强杀进程树
function insRun(cmd, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const buf = [];
    const p = insExe(cmd);
    insProc = p;
    const timer = setTimeout(() => { try { execFile("taskkill", ["/F", "/T", "/PID", String(p.pid)], { windowsHide: true }, () => {}); } catch {} }, timeoutMs);
    const onLine = (d) => decodeBuf(d).split(/\r?\n/).filter(Boolean).forEach((l) => { buf.push(l); if (buf.length <= 400) insSendLine(l); });
    p.stdout.on("data", onLine);
    p.stderr.on("data", onLine);
    p.on("error", (e) => { buf.push(`[ERROR] ${e}`); resolve({ rc: -1, buf }); });
    p.on("close", (code) => { clearTimeout(timer); if (insProc === p) insProc = null; resolve({ rc: code ?? -1, buf }); });
  });
}

// 环境预检: node/npm/git 版本 + 目标目录状态 + 磁盘剩余
async function insPreflight(dir) {
  const probe = (c) => new Promise((res) => {
    const t0 = Date.now();
    execFile("cmd.exe", ["/d", "/s", "/c", c], { windowsHide: true, timeout: 15000 }, (err, so) => {
      res(err ? { ok: false } : { ok: true, ver: String(so).split(/\r?\n/).find(Boolean) || "", ms: Date.now() - t0 });
    });
  });
  const [node, npm, git] = await Promise.all([probe("node --version"), probe("npm --version"), probe("git --version")]);
  let dirState = "absent", exists = false;
  try {
    exists = fs.existsSync(dir);
    if (exists) {
      const entries = fs.readdirSync(dir);
      dirState = fs.existsSync(path.join(dir, ".git")) ? "repo" : (entries.length ? "occupied" : "empty");
    }
  } catch { dirState = "occupied"; }
  let freeGB = null;
  try { freeGB = +(fs.statfsSync(path.dirname(dir) || dir).bsize * fs.statfsSync(path.dirname(dir) || dir).bfree / 1073741824).toFixed(1); } catch {}
  return { node, npm, git, dirState, exists, freeGB };
}

ipcMain.handle("install-preflight", async (e, dir) => {
  const d = String(dir || "").trim() || S.install_path;
  return { ...(await insPreflight(d)), dir: d };
});

// 获取可安装版本: branches + tags (git ls-remote, 25s 超时)
ipcMain.handle("get-install-versions", async () => {
  const url = insRepoUrl();
  if (!url) return { ok: false, msg: "repo url empty" };
  const grab = (flag) => new Promise((res) => {
    execFile("git", ["ls-remote", flag, url], { windowsHide: true, timeout: 25000, maxBuffer: 4e6 }, (err, so) => {
      if (err) return res([]);
      res(String(so).split(/\r?\n/).filter((l) => l.includes("refs/")).map((l) => l.split("refs/")[1].replace(/\/+$/, "").replace(/\^\{\}$/, "")).filter(Boolean));
    });
  });
  const [heads, tags] = await Promise.all([grab("refs/heads/"), grab("refs/tags/")]);
  return { ok: heads.length > 0 || tags.length > 0, branches: heads, tags: tags.reverse().slice(0, 50) };
});

// 安装镜像测速: 直连 + 自定义前缀 + 全部候选镜像, 两级判定 (git 协议可达 > HTTP 可达 > 不可达)
function probeHttpUrl(url, timeout = 6000) {
  return new Promise((resolve) => {
    try {
      const req = https.request(url, { method: "GET", timeout }, (res) => {
        const ok = res.statusCode >= 200 && res.statusCode < 400;
        res.resume();
        resolve(ok);
      });
      req.on("timeout", () => { req.destroy(); resolve(false); });
      req.on("error", () => resolve(false));
      req.end();
    } catch { resolve(false); }
  });
}
ipcMain.handle("install-mirror-test", async () => {
  const repoUrl = String(S.ins_repo || "").trim();
  const m0 = repoUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?\s*$/i);
  const repo = m0 ? `${m0[1]}/${m0[2]}` : "anthropics/hermes-agent";
  const custom = String(S.ins_mirror_url || "").trim().replace(/\/?$/, "/");
  const base = String(S.mirror_url || "").trim().replace(/\/?$/, "/");
  const mirrors = [...new Set([custom, base, ...FALLBACK_MIRRORS])].filter((m) => m && /^https?:\/\//.test(m));
  const probe = async (mirror, direct) => {
    const t0 = Date.now();
    const gitOk = await probeGitUrl(`${direct ? "" : mirror}https://github.com/${repo}/info/refs?service=git-upload-pack`, 8000);
    if (gitOk) return { mirror, ok: true, level: "git", ms: Date.now() - t0 };
    const t1 = Date.now();
    const httpOk = await probeHttpUrl(`${direct ? "" : mirror}https://github.com/`, 6000);
    return { mirror, ok: httpOk, level: httpOk ? "http" : "", ms: httpOk ? Date.now() - t1 : Date.now() - t0 };
  };
  const out = await Promise.all([
    probe("", true), // 直连 GitHub
    ...mirrors.map((m) => probe(m, false)),
  ]);
  const rank = { git: 0, http: 1, "": 2 };
  out.sort((a, b) => (rank[a.level] - rank[b.level]) || (a.ms - b.ms));
  return { ok: true, repo, results: out, effective: S.ins_git_accel ? insMirrorBase() : "" };
});

// 启动安装: clone(或复用已有仓库 fetch) -> npm install -> 收尾(快捷方式/验证/自动应用)
ipcMain.handle("start-install", async (e, opts) => {
  if (insProc) return { ok: false, msg: t("msg.busy") };
  const repo = String((opts && opts.repo) || S.ins_repo || "").trim();
  const ver = String((opts && opts.ver) || S.ins_branch || "main").trim();
  const dir = path.resolve(String((opts && opts.dir) || S.ins_dir || S.install_path || "").trim());
  if (!repo || !dir || dir.length < 4) return { ok: false, msg: "bad repo/dir" };
  // 记住本次配置
  Object.assign(S, { ins_repo: repo, ins_branch: ver, ins_dir: dir });
  saveSettings();

  insCancel = false;
  const t0 = Date.now();
  const deadline = t0 + Math.max(5, parseInt(S.ins_timeout_min) || 30) * 60000;
  const finish = async (ok, rc, note) => {
    appendInsHistory({ time: insNow(), repo, ver, dir, result: ok ? "ok" : (insCancel ? "cancel" : "fail"), dur: fmtDur(Date.now() - t0), note: note || "" });
    insSendStage("done", 100, ok ? "done" : "failed");
    try { win && win.webContents.send("install-done", { ok, rc, dur: fmtDur(Date.now() - t0), note: note || "" }); } catch {}
    if (ok && S.webhook_ins !== false) sendWebhook("install.done", { dir, ver });
    log(ok ? t("ins.done", dir) : t("ins.fail", note || `rc=${rc}`));
  };
  const fmtDur = (ms) => (ms >= 60000 ? `${Math.floor(ms / 60000)}m${Math.round((ms % 60000) / 1000)}s` : `${(ms / 1000).toFixed(1)}s`);

  log(t("ins.start", repo, ver));
  insSendStage("src", 2, ver);
  try { fs.mkdirSync(path.dirname(dir), { recursive: true }); } catch {}

  // 阶段1: 源码 (已有 git 仓库则 fetch 复用, 否则 clone)
  const isRepo = fs.existsSync(path.join(dir, ".git"));
  let cmd, srcRc;
  if (isRepo) {
    insSendLine(`[复用] 检测到已有 git 仓库, 执行 fetch + checkout ${ver}`);
    cmd = `git -C "${dir}" fetch --all --prune --tags && git -C "${dir}" checkout "${ver}" && git -C "${dir}" pull origin "${ver}"`;
  } else {
    const url = insRepoUrl();
    insSendLine(`[克隆] ${url} -> ${dir}${url !== repo ? " (镜像加速)" : ""}`);
    cmd = `git clone --progress --branch "${ver}" "${url}" "${dir}"`;
  }
  let r = await insRun(cmd, null, Math.max(60000, deadline - Date.now()));
  srcRc = r.rc;
  // 镜像自动回退: 直连/当前前缀克隆失败时, 逐个探测候选镜像并用第一个可用的重试
  if (srcRc !== 0 && !isRepo && S.ins_mirror_fallback !== false && !insCancel) {
    insSendLine("[镜像] 克隆失败, 自动探测可用镜像重试...");
    const wm = await pickInstallMirror(repo, insSendLine);
    if (wm) {
      const retryUrl = wm + repo;
      insSendLine(`[镜像] 重试克隆: ${retryUrl}`);
      r = await insRun(`git clone --progress --branch "${ver}" "${retryUrl}" "${dir}"`, null, Math.max(60000, deadline - Date.now()));
      srcRc = r.rc;
      if (srcRc !== 0 && /not found|Branch| didnt match|did not match/i.test(r.buf.join("\n"))) {
        insSendLine("[回退] 指定分支/标签不存在, 改用仓库默认分支");
        r = await insRun(`git clone --progress "${retryUrl}" "${dir}"`, null, Math.max(60000, deadline - Date.now()));
        srcRc = r.rc;
      }
    } else {
      insSendLine("[镜像] 无可用镜像, 按失败收尾");
    }
  }
  if (srcRc !== 0 && !isRepo && !insCancel && /not found|Branch| didnt match|did not match/i.test(r.buf.join("\n"))) {
    insSendLine("[回退] 指定分支/标签不存在, 改用仓库默认分支");
    r = await insRun(`git clone --progress "${insRepoUrl()}" "${dir}"`, null, Math.max(60000, deadline - Date.now()));
    srcRc = r.rc;
  }
  if (insCancel) return finish(false, -2, "已取消");
  if (srcRc !== 0) return finish(false, srcRc, "源码获取失败 (git)");
  insSendStage("deps", 45, "npm install");

  // 阶段2: 依赖 (无 package.json 跳过)
  if (fs.existsSync(path.join(dir, "package.json"))) {
    r = await insRun(`npm install --no-audit --no-fund${insRegistryArg()}`, dir, Math.max(60000, deadline - Date.now()));
    if (insCancel) return finish(false, -2, "已取消");
    if (r.rc !== 0) return finish(false, r.rc, "依赖安装失败 (npm)");
  } else {
    insSendLine("[跳过] 未找到 package.json, 跳过 npm install");
  }
  insSendStage("fin", 90, "收尾");

  // 阶段3: 收尾 (快捷方式 + 验证 + 自动应用)
  let note = "";
  if (S.ins_shortcut) {
    const cmdFile = [path.join(dir, "hermes.cmd"), path.join(dir, "bin", "hermes.cmd"), path.join(dir, "node_modules", ".bin", "hermes.cmd")].find((p2) => fs.existsSync(p2));
    if (cmdFile) {
      const lnk = path.join(app.getPath("desktop"), "Hermes.lnk");
      const ps = `$s=(New-Object -ComObject WScript.Shell).CreateShortcut('${lnk}');$s.TargetPath='${cmdFile}';$s.WorkingDirectory='${dir}';$s.Save()`;
      await insRun(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"')}"`, null, 20000);
      insSendLine(`[快捷方式] ${lnk}`);
    } else insSendLine("[快捷方式] 未找到 hermes.cmd, 跳过");
  }
  if (S.ins_auto_validate) {
    const v = await validateInstallPath(dir);
    if (v.valid) {
      note = `验证通过 (磁盘 ${v.freeGB ?? "?"}GB)`;
      if (S.ins_auto_apply && S.install_path !== dir) {
        S.install_path = dir;
        if (Array.isArray(S.path_history) && !S.path_history.includes(dir)) S.path_history.unshift(dir), (S.path_history = S.path_history.slice(0, 8));
        saveSettings();
        try { win && win.webContents.send("settings-updated"); } catch {}
        log(t("ins.apply", dir));
      }
    } else { note = "安装完成但验证未通过 (可能是源码仓库而非运行目录)"; }
  }
  notifyEvent("ok", t("ins.done", dir));
  return finish(true, 0, note), { ok: true };
});

ipcMain.handle("cancel-install", () => {
  if (!insProc) return { ok: false };
  insCancel = true;
  try { execFile("taskkill", ["/F", "/T", "/PID", String(insProc.pid)], { windowsHide: true }, () => {}); } catch {}
  log("[安装] 用户取消了安装");
  return { ok: true };
});

// 卸载套件: 预检 / 进程清理 / 配置备份 / 解除关联 / 多模式执行
function procsForDir(dir) {
  return new Promise((resolve) => {
    const target = String(dir).replace(/\\/g, "/").toLowerCase();
    execFile("powershell", ["-NoProfile", "-Command",
      "Get-CimInstance Win32_Process | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress"],
      { windowsHide: true, timeout: 20000, maxBuffer: 32e6 }, (e, out) => {
        if (e || !out) return resolve([]);
        try {
          const arr = JSON.parse(out);
          const procs = Array.isArray(arr) ? arr : [arr];
          resolve(procs
            .filter((p) => String(p.CommandLine || "").replace(/\\/g, "/").toLowerCase().includes(target) && parseInt(p.ProcessId) !== process.pid)
            .map((p) => parseInt(p.ProcessId)).filter(Boolean));
        } catch { resolve([]); }
      });
  });
}
function uninsBackup(dir) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
  const dst = path.join(backupDir(), `uninstall-${stamp}-${path.basename(dir)}`);
  fs.mkdirSync(dst, { recursive: true });
  const copied = [];
  for (const rel of ["config.yaml", path.join("hermes-agent", "config.yaml")]) {
    const p = path.join(dir, rel);
    if (fs.existsSync(p)) { fs.copyFileSync(p, path.join(dst, "config.yaml")); copied.push("config.yaml"); }
  }
  for (const rel of ["zh-patches", path.join("hermes-agent", "zh-patches")]) {
    const p = path.join(dir, rel);
    if (fs.existsSync(p)) { fs.cpSync(p, path.join(dst, "zh-patches"), { recursive: true }); copied.push("zh-patches"); }
  }
  try { fs.writeFileSync(path.join(dst, "uninstalled-from.txt"), `${dir}\n${insNow()}`, "utf8"); } catch {}
  return { dst, copied };
}
function uninsUnregister(dir) {
  let removed = false;
  try {
    const v = path.resolve(dir);
    const before = (S.path_history || []).length;
    S.path_history = (S.path_history || []).filter((x) => { try { return path.resolve(x) !== v; } catch { return true; } });
    if (S.path_history.length !== before) { saveSettings(); removed = true; }
  } catch {}
  return removed;
}
// 卸载预检: 目录/大小/仓库/配置/hermes.cmd/占用进程
ipcMain.handle("uninstall-preflight", async (e, dir) => {
  const d = path.resolve(String(dir || "").trim());
  const r = { dir: d, exists: fs.existsSync(d), sizeGB: null, isRepo: false, hasConfig: false, hasAgent: false, procs: 0 };
  if (!r.exists) return r;
  try { r.sizeGB = +(fs.statfsSync(d).bsize * (fs.statfsSync(d).blocks - fs.statfsSync(d).bfree) / 1073741824).toFixed(2); } catch {}
  r.isRepo = fs.existsSync(path.join(d, ".git"));
  r.hasConfig = fs.existsSync(path.join(d, "config.yaml")) || fs.existsSync(path.join(d, "hermes-agent", "config.yaml"));
  r.hasAgent = fs.existsSync(path.join(d, "bin", "hermes.cmd"));
  try { r.procs = (await procsForDir(d)).length; } catch {}
  return r;
});
// 卸载执行: trash 回收站 | modules 仅删依赖 | permanent 彻底删除 | unregister 仅解除关联
ipcMain.handle("uninstall-hermes", async (e, payload) => {
  const { dir: rawDir, mode: rawMode, opts } = (payload && typeof payload === "object" && !Array.isArray(payload)) ? payload : { dir: payload };
  const d = path.resolve(String(rawDir || "").trim());
  const mode = ["trash", "modules", "permanent", "unregister"].includes(rawMode) ? rawMode : (S.unins_default_mode || "trash");
  const o = opts && typeof opts === "object" ? opts : {};
  const home = os.homedir();
  if (d === path.parse(d).root) return { ok: false, msg: "拒绝操作: 目标是磁盘根目录" };
  if (d === home) return { ok: false, msg: "拒绝操作: 目标是用户主目录" };
  if (mode !== "unregister" && !fs.existsSync(d)) return { ok: false, msg: "目录不存在" };
  if (mode === "unregister") {
    uninsUnregister(d);
    appendInsHistory({ time: insNow(), repo: "-", ver: "-", dir: d, result: "uninstall", dur: "-", note: "解除关联 (文件未动)" });
    if (S.webhook_ins !== false) sendWebhook("uninstall.done", { dir: d });
    log(`[卸载] 已解除关联: ${d}`);
    return { ok: true, note: "已解除关联 (文件未动)" };
  }
  // 卸载前停止占用进程 (可关)
  if (o.stop_procs !== false && S.unins_stop_procs !== false) {
    const pids = await procsForDir(d);
    if (pids.length) {
      log(`[卸载] 停止 ${pids.length} 个占用进程 (${pids.join(",")})`);
      await Promise.all(pids.map((pid) => new Promise((res) => execFile("taskkill", ["/F", "/PID", String(pid)], { windowsHide: true }, () => res()))));
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
  // 卸载前备份配置 (可关)
  let backupInfo = null;
  if (o.backup !== false && S.unins_backup !== false) {
    try { backupInfo = uninsBackup(d); log(`[卸载] 配置已备份: ${backupInfo.dst}`); } catch (er) { log(`[卸载] 备份失败: ${er}`); }
  }
  const bk = backupInfo ? " + 配置备份" : "";
  try {
    if (mode === "modules") {
      let removed = [];
      for (const rel of ["node_modules", "dist", "build", ".cache"]) {
        const p = path.join(d, rel);
        if (fs.existsSync(p)) { fs.rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 }); removed.push(rel); }
      }
      appendInsHistory({ time: insNow(), repo: "-", ver: "-", dir: d, result: "uninstall", dur: "-", note: `仅删除依赖/构建产物 (${removed.join(", ") || "无"})` });
    if (S.webhook_ins !== false) sendWebhook("uninstall.done", { dir: d });
      log(`[卸载] 已删除依赖与构建产物: ${d} (${removed.join(", ")})`);
      return { ok: true, note: `已清理 ${removed.length} 项${bk}`, removed };
    }
    if (mode === "permanent") {
      fs.rmSync(d, { recursive: true, force: true, maxRetries: 3, retryDelay: 400 });
      if (S.unins_unregister !== false) uninsUnregister(d);
      appendInsHistory({ time: insNow(), repo: "-", ver: "-", dir: d, result: "uninstall", dur: "-", note: "彻底删除 (不可恢复)" });
    if (S.webhook_ins !== false) sendWebhook("uninstall.done", { dir: d });
      log(`[卸载] 已彻底删除: ${d}`);
      return { ok: true, note: `已彻底删除${bk}` };
    }
    // trash (默认): 移入回收站
    await shell.trashItem(d);
    if (S.unins_unregister !== false) uninsUnregister(d);
    appendInsHistory({ time: insNow(), repo: "-", ver: "-", dir: d, result: "uninstall", dur: "-", note: `已移入回收站${bk}` });
    if (S.webhook_ins !== false) sendWebhook("uninstall.done", { dir: d });
    log(`[卸载] 已移入回收站: ${d}`);
    return { ok: true, note: `已移入回收站${bk}` };
  } catch (err) { return { ok: false, msg: String(err).slice(0, 160) }; }
});

ipcMain.handle("get-install-history", () => insHistory());

// 一键备份安装配置 (config.yaml / zh-patches → 文档目录备份区), 仪表盘/维护可用
ipcMain.handle("backup-install-config", (e, dir) => {
  const d = path.resolve(String(dir || "").trim() || S.install_path);
  if (!fs.existsSync(d)) return { ok: false, msg: "目录不存在" };
  try {
    const b = uninsBackup(d);
    log(`[备份] 安装配置已备份: ${b.dst} (${b.copied.join(", ") || "无可备份项"})`);
    return { ok: true, dst: b.dst, copied: b.copied };
  } catch (err) { return { ok: false, msg: String(err).slice(0, 160) }; }
});

// 倒计时用户动作: go=立即更新 / skip=跳过本次
ipcMain.handle("countdown-action", (e, action) => {
  const f = startUpdate._countdownResolve;
  if (!f) return { ok: false };
  f(action === "go");
  return { ok: true };
});

// 导出 HTML 健康报告: 安装检查明细 + 健康评分 + 本月统计 + 最近更新历史
ipcMain.handle("export-health-report", async () => {
  try {
    const v = validateInstallPath(S.install_path);
    const score = healthScore(v);
    const hist = getHistory();
    const d = new Date(), p2 = (n) => String(n).padStart(2, "0");
    const dateStr = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
    const timeStr = `${dateStr} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
    const r = await dialog.showSaveDialog(win, {
      title: "导出健康报告",
      defaultPath: path.join(app.getPath("documents"), `HermesUpdater-健康报告-${dateStr}.html`),
      filters: [{ name: "HTML", extensions: ["html"] }],
    });
    if (r.canceled || !r.filePath) return { ok: false, canceled: true };
    const mon = dateStr.slice(0, 7);
    const mh = hist.filter((h) => (h.time || "").startsWith(mon));
    const okN = mh.filter((h) => h.result === "ok").length, partN = mh.filter((h) => h.result === "partial").length, failN = mh.filter((h) => h.result === "fail").length;
    const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const grade = score >= 90 ? ["优秀", "#10B981"] : score >= 70 ? ["良好", "#F59E0B"] : ["需关注", "#EF4444"];
    const rows = hist.slice(0, 50).map((h) => {
      const mark = h.result === "ok" ? "✅" : h.result === "partial" ? "⚠️" : "❌";
      return `<tr><td>${esc(h.time)}</td><td>${mark}</td><td>${esc(h.label || "")}</td><td>${esc(h.dur || "")}</td><td>${esc((h.old || "") + " → " + (h.new || ""))}</td><td>${esc(h.note || "")}</td></tr>`;
    }).join("");
    const chk = (b) => b === true ? '<span style="color:#10B981">✔</span>' : b === false ? '<span style="color:#EF4444">✘</span>' : "—";
    const html = `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>HermesUpdater 健康报告 ${dateStr}</title><style>
body{font-family:"Segoe UI","Microsoft YaHei",sans-serif;max-width:900px;margin:32px auto;padding:0 16px;color:#1F2937;background:#F8FAFC}
h1{font-size:22px} h2{font-size:16px;margin:28px 0 8px;border-bottom:2px solid #E2E8F0;padding-bottom:4px}
table{width:100%;border-collapse:collapse;font-size:13px;background:#fff}
th,td{border:1px solid #E2E8F0;padding:6px 10px;text-align:left} th{background:#F1F5F9}
.kv{display:grid;grid-template-columns:170px 1fr;gap:4px 12px;font-size:13px;background:#fff;border:1px solid #E2E8F0;padding:14px;border-radius:8px}
.score{font-size:40px;font-weight:700}
.muted{color:#64748B;font-size:12px}
.badge{display:inline-block;padding:2px 10px;border-radius:999px;color:#fff;font-size:13px}
</style></head><body>
<h1>📑 HermesUpdater 健康报告 <span class="badge" style="background:${grade[1]}">${grade[0]} ${score}/100</span></h1>
<p class="muted">生成时间 ${timeStr} · 工具版本 v2.16.0 · 报告基于本地检查与更新历史, 不含敏感凭据</p>
<h2>安装检查</h2>
<div class="kv">
<span><b>安装路径</b></span><span class="mono">${esc(S.install_path)}</span>
<span><b>健康评分</b></span><span class="score" style="color:${grade[1]}">${score}<small style="font-size:14px;color:#64748B">/100</small></span>
<span>路径存在</span><span>${chk(v.exists)}</span>
<span>hermes 命令</span><span>${chk(v.hasCmd)}</span>
<span>Agent 目录</span><span>${chk(v.hasAgent)}</span>
<span>git 仓库</span><span>${chk(v.hasGit)}</span>
<span>可写</span><span>${chk(v.writable)}</span>
<span>磁盘剩余</span><span>${v.freeGB != null ? v.freeGB + " GB" : "—"}</span>
<span>当前分支</span><span>${esc(S.branch || "main")}</span>
<span>网络方式</span><span>${esc(S.auto_switch || "auto")}${S.mirror_url ? " · 镜像 " + esc(S.mirror_url) : ""}</span>
</div>
<h2>本月统计 (${mon})</h2>
<div class="kv"><span>✅ 成功</span><span>${okN}</span><span>⚠️ 部分成功</span><span>${partN}</span><span>❌ 失败</span><span>${failN}</span></div>
<h2>最近更新历史 (最多 50 条)</h2>
<table><tr><th>时间</th><th>结果</th><th>触发方式</th><th>耗时</th><th>提交</th><th>备注</th></tr>${rows || '<tr><td colspan="6">暂无记录</td></tr>'}</table>
<p class="muted">HermesUpdater · 自动生成报告</p>
</body></html>`;
    fs.writeFileSync(r.filePath, html, "utf8");
    log(`[报告] 健康报告已导出: ${r.filePath}`);
    return { ok: true, filePath: r.filePath };
  } catch (e) { return { ok: false, msg: String(e).slice(0, 160) }; }
});

// 安装目录体积分析: 一级子目录/文件大小排行 (只读, 25s/8万文件上限保护)
function dirStats(dir, deadline) {
  let size = 0, files = 0, truncated = false;
  const stack = [dir];
  while (stack.length) {
    if (Date.now() > deadline || files > 80000) { truncated = true; break; }
    const cur = stack.pop();
    let ents = [];
    try { ents = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile()) { try { size += fs.statSync(p).size; files++; } catch {} }
    }
  }
  return { size, files, truncated };
}
ipcMain.handle("dir-size", async () => {
  try {
    const base = S.install_path || "";
    if (!fs.existsSync(base)) return { ok: false, msg: "bad path" };
    const deadline = Date.now() + 25000;
    let truncated = false;
    const items = [];
    let ents = [];
    try { ents = fs.readdirSync(base, { withFileTypes: true }); } catch {}
    for (const e of ents) {
      const p = path.join(base, e.name);
      if (e.isDirectory()) {
        const r = dirStats(p, deadline);
        items.push({ name: e.name, dir: true, size: r.size, files: r.files });
        truncated = truncated || r.truncated;
        if (Date.now() > deadline) break;
      } else if (e.isFile()) {
        try { items.push({ name: e.name, dir: false, size: fs.statSync(p).size, files: 1 }); } catch {}
      }
    }
    items.sort((a, b) => b.size - a.size);
    return { ok: true, base, items: items.slice(0, 25), truncated, total: items.reduce((s, x) => s + x.size, 0) };
  } catch (e) { return { ok: false, msg: String(e).slice(0, 120) }; }
});



// ---------------- 翻译引擎 (Google → MyMemory → 内置离线词典, 走系统代理) ----------------
const TR_CACHE = new Map(); // key: target|text -> {text, via}
function httpGetText(url, timeout = 8000) {
  return new Promise((resolve) => {
    let done = false, req = null;
    const fin = (v) => { if (!done) { done = true; clearTimeout(timer); try { req && req.abort(); } catch {} resolve(v); } };
    const timer = setTimeout(() => fin(null), timeout);
    try {
      req = net.request({ url, redirect: "follow" }); // Electron net 走 Chromium 网络栈, 自动跟随系统代理
      req.on("response", (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => { const st = res.statusCode || 0; fin(st >= 200 && st < 300 ? Buffer.concat(chunks).toString("utf8") : null); });
      });
      req.on("error", () => fin(null));
      req.end();
    } catch { fin(null); }
  });
}
async function trGoogle(text, target) {
  const u = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
  const body = await httpGetText(u, 4500);
  if (!body) return null;
  try {
    const data = JSON.parse(body);
    const out = (data[0] || []).map((seg) => (seg && seg[0]) || "").join("").trim();
    return out || null;
  } catch { return null; }
}
// Google 备用端点 (Chrome 词典扩展接口, 部分网络环境可达)
async function trGCloud(text, target) {
  const u = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=${encodeURIComponent(target)}&q=${encodeURIComponent(text.slice(0, 900))}`;
  const body = await httpGetText(u, 4500);
  if (!body) return null;
  try {
    const data = JSON.parse(body);
    let out = "";
    if (Array.isArray(data)) {
      if (typeof data[0] === "string") out = data.join("");
      else if (Array.isArray(data[0])) out = data.map((s) => (Array.isArray(s) ? s[0] : s)).join("");
    } else if (data && data.sentences) out = (data.sentences || []).map((s) => s.trans || "").join("");
    return (out || "").trim() || null;
  } catch { return null; }
}
// DeepL 免费网页接口 (无需密钥, POST)
function httpPostText(url, body, contentType, timeout = 6000) {
  return new Promise((resolve) => {
    let done = false, req = null;
    const fin = (v) => { if (!done) { done = true; clearTimeout(timer); try { req && req.abort(); } catch {} resolve(v); } };
    const timer = setTimeout(() => fin(null), timeout);
    try {
      req = net.request({ url, method: "POST", redirect: "follow" });
      req.setHeader("Content-Type", contentType);
      req.on("response", (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => { const st = res.statusCode || 0; fin(st >= 200 && st < 300 ? Buffer.concat(chunks).toString("utf8") : null); });
      });
      req.on("error", () => fin(null));
      req.end(body);
    } catch { fin(null); }
  });
}
async function trDeepl(text, target) {
  const tl = target.startsWith("zh") ? "ZH" : target.toUpperCase();
  const payload = JSON.stringify({
    jsonrpc: "2.0", method: "LMT_handle_texts",
    params: { splitting: "newlines", lang: { target_lang: tl }, texts: [{ text: text.slice(0, 900), requestAlternatives: 0 }] },
    id: Math.floor(Math.random() * 900000) + 100000,
  });
  const body = await httpPostText("https://www2.deepl.com/jsonrpc", payload, "application/json", 6000);
  if (!body) return null;
  try {
    const data = JSON.parse(body);
    const out = data && data.result && data.result.texts && data.result.texts[0] && data.result.texts[0].text;
    return out ? String(out).trim() : null;
  } catch { return null; }
}
// Lingva (Google 翻译开源前端, 多实例轮询)
async function trLingva(text, target) {
  const inst = ["https://lingva.ml", "https://lingva.lunar.icu", "https://translate.plausibility.cloud"];
  const src = target.startsWith("zh") ? "en" : "zh";
  const tl = target.startsWith("zh") ? "zh" : "en";
  for (const base of inst) {
    const body = await httpGetText(`${base}/api/v1/${src}/${tl}/${encodeURIComponent(text.slice(0, 700))}`, 5000);
    if (!body) continue;
    try {
      const data = JSON.parse(body);
      if (data && data.translation) return String(data.translation).trim();
    } catch {}
  }
  return null;
}
// 有道翻译开放接口 (免密钥, 尽力而为)
async function trYoudao(text, target) {
  const u = `https://fanyi.youdao.com/translate?doctype=json&type=AUTO&i=${encodeURIComponent(text.slice(0, 700))}`;
  const body = await httpGetText(u, 5000);
  if (!body) return null;
  try {
    const data = JSON.parse(body);
    const out = (data.translateResult || []).map((arr) => (arr || []).map((x) => x.tgt || "").join("")).join("\n").trim();
    return out || null;
  } catch { return null; }
}
async function trMyMemory(text, target) {
  const src = target.startsWith("zh") ? "en" : "zh-CN";
  const u = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=${src}|${target}`;
  const body = await httpGetText(u, 7000);
  if (!body) return null;
  try {
    const data = JSON.parse(body);
    const out = data && data.responseData && data.responseData.translatedText;
    return out && data.responseStatus === 200 ? String(out).trim() : null;
  } catch { return null; }
}
// 内置离线词典: 更新输出常用短语/词汇 en->zh (无需联网, 永远可用兜底)
const OFFLINE_PHRASES = [
  [/pulling updates/gi, "正在拉取更新..."], [/fetching updates/gi, "正在获取更新..."],
  [/found (\d+) new commits?\b/gi, "发现 $1 个新提交"], [/updating from fork/gi, "正在从 fork 更新"],
  [/your fork is not tracking the official hermes repository/gi, "你的 fork 未跟踪官方 Hermes 仓库"],
  [/this means you may miss updates from/gi, "这意味着你可能错过以下仓库的更新:"],
  [/skipping upstream setup \(non-interactive run\)/gi, "跳过上游设置（非交互运行）"],
  [/add it later with:/gi, "稍后可用以下命令添加:"],
  [/dependency generation cleanup skipped/gi, "依赖生成清理已跳过"],
  [/cleared (\d+) stale __pycache__ directories/gi, "已清理 $1 个过期 __pycache__ 目录"],
  [/preparing node dependencies/gi, "正在准备 Node 依赖..."],
  [/building the tui/gi, "正在构建 TUI..."], [/building the web ui/gi, "正在构建 Web UI..."],
  [/building desktop packaged app/gi, "正在构建桌面打包应用..."],
  [/packaging the desktop app/gi, "正在打包桌面应用..."],
  [/refreshed windows gateway launcher scripts/gi, "已刷新 Windows Gateway 启动脚本"],
  [/gateway started via cold-start after update \(pid: (\d+)\)/gi, "更新后已通过冷启动启动 Gateway (PID: $1)"],
  [/update complete/gi, "更新完成"], [/update failed/gi, "更新失败"],
  [/checking for updates/gi, "正在检查更新..."], [/up to date/gi, "已是最新版本"],
  [/backup created:?\s*/gi, "已创建备份: "], [/access is denied/gi, "拒绝访问"],
  [/permission denied/gi, "权限不足"], [/connection timed out/gi, "连接超时"],
  [/could not resolve/gi, "域名解析失败"], [/retry \((\d+)\/(\d+)\)/gi, "重试 ($1/$2)"],
  [/latest version:?/gi, "最新版本:"], [/no updates available/gi, "没有可用更新"],
];
const OFFLINE_WORDS = [
  ["pulling", "拉取"], ["fetching", "获取"], ["building", "构建"], ["packaging", "打包"],
  ["preparing", "准备"], ["checking", "检查"], ["updating", "更新"], ["upgrading", "升级"],
  ["installing", "安装"], ["cleaning", "清理"], ["skipping", "跳过"], ["downloading", "下载"],
  ["extracting", "解压"], ["running", "运行"], ["starting", "启动"], ["stopping", "停止"],
  ["restarting", "重启"], ["retrying", "重试"], ["refreshing", "刷新"], ["restoring", "恢复"],
  ["dependencies", "依赖"], ["dependency", "依赖"], ["directories", "目录"], ["directory", "目录"],
  ["repository", "仓库"], ["commit", "提交"], ["branch", "分支"], ["version", "版本"],
  ["failed", "失败"], ["success", "成功"], ["skipped", "已跳过"], ["complete", "完成"],
  ["completed", "已完成"], ["warning", "警告"], ["error", "错误"], ["stale", "过期"],
  ["gateway", "网关"], ["update", "更新"], ["install", "安装"], ["backup", "备份"],
];
function trOffline(text, target) {
  if (!target.startsWith("zh")) return text; // 目标为英文时原文返回
  let out = text, hit = false;
  // 自定义词典优先 (用户设置, 覆盖内置词条)
  for (const entry of S.translate_custom_dict || []) {
    const i = entry.indexOf("=");
    const en = entry.slice(0, i).trim(), zh = entry.slice(i + 1).trim();
    if (!en || !zh) continue;
    const re = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    if (re.test(out)) { out = out.replace(re, zh); hit = true; }
  }
  for (const [re, rep] of OFFLINE_PHRASES) { if (re.test(out)) { out = out.replace(re, rep); hit = true; } }
  for (const [en, zh] of OFFLINE_WORDS) {
    const re = new RegExp(`\\b${en}\\b`, "gi");
    if (re.test(out)) { out = out.replace(re, zh); hit = true; }
  }
  return hit ? out : null;
}
async function translateOne(text, target) {
  const key = target + "|" + text;
  if (TR_CACHE.has(key)) return TR_CACHE.get(key);
  const prov = S.translate_provider || "auto";
  // 熔断器: 某引擎连续失败 2 次即冷却 5 分钟, 冷却期内直接跳过 (避免每次翻译都白等超时)
  const ok = (p) => p === "offline" || !(TR_COOL[p] > Date.now());
  const KNOWN = ["google", "gcloud", "deepl", "lingva", "mymemory", "youdao"];
  let order = KNOWN;
  if (prov === "auto" && S.translate_engines_order) {
    const custom = S.translate_engines_order.split(",").map((x) => x.trim().toLowerCase()).filter((x) => KNOWN.includes(x));
    if (custom.length) order = [...new Set([...custom, ...KNOWN])];
  }
  const chain = prov === "auto" ? order.filter(ok) : [...new Set([prov, "offline"])].filter(ok);
  let result = null;
  for (const p of chain) {
    let r = null;
    try {
      if (p === "google") r = await trGoogle(text, target);
      else if (p === "gcloud") r = await trGCloud(text, target);
      else if (p === "deepl") r = await trDeepl(text, target);
      else if (p === "lingva") r = await trLingva(text, target);
      else if (p === "mymemory") r = await trMyMemory(text, target);
      else if (p === "youdao") r = await trYoudao(text, target);
      else r = trOffline(text, target);
    } catch { r = null; }
    if (r) { result = { text: r, via: p }; markOk(p); break; }
    if (p !== "offline") markFail(p);
  }
  if (TR_CACHE.size > 2000) TR_CACHE.clear();
  if (result) TR_CACHE.set(key, result);
  return result;
}
const TR_FAIL = {}, TR_COOL = {};
function markFail(p) { TR_FAIL[p] = (TR_FAIL[p] || 0) + 1; if (TR_FAIL[p] >= 2) { TR_COOL[p] = Date.now() + 5 * 60000; TR_FAIL[p] = 0; } }
function markOk(p) { TR_FAIL[p] = 0; }
ipcMain.handle("translate-lines", async (e, lines) => {
  const target = S.translate_target || "zh-CN";
  const arr = (Array.isArray(lines) ? lines : [String(lines || "")]).map(String).slice(0, 500).map((l) => l.slice(0, 1200));
  const out = [];
  for (const line of arr) {
    const res = await translateOne(line, target);
    out.push(res ? { src: line, dst: res.text, via: res.via } : { src: line, dst: "", via: "none" });
  }
  return out;
});
ipcMain.handle("clear-log-file", () => { try { fs.writeFileSync(LOG_PATH, "", "utf8"); return true; } catch { return false; } });
ipcMain.handle("restore-zh-patches", () => {
  const src = S.zh_patches_source, dst = path.join(agentDir(), "zh-patches");
  if (!src || !fs.existsSync(src)) return { ok: false, msg: t("zh.src.missing", src) };
  try { fs.cpSync(src, dst, { recursive: true, force: true }); return { ok: true, msg: t("zh.restored", dst) }; }
  catch (e) { return { ok: false, msg: String(e) }; }
});
ipcMain.handle("recent-commits", async () => {
  const out = await git(["log", "-15", "--format=%H|%ci|%s"], 30000);
  return out.split("\n").filter((l) => l.includes("|")).map((l) => { const [h, ci, ...m] = l.split("|"); return { hash: h.slice(0, 12), date: ci, msg: m.join("|") }; });
});
ipcMain.handle("rollback", async (e, commit) => {
  const out = await git(["checkout", commit], 120000);
  log(`回滚 ${commit.slice(0, 8)}: ${out.slice(0, 120)}`);
  return { ok: !/error|fatal/i.test(out), out };
});
ipcMain.handle("set-login-item", (e, enable) => {
  try { app.setLoginItemSettings({ openAtLogin: !!enable }); return true; } catch { return false; }
});
ipcMain.handle("window-control", (e, cmd) => {
  if (cmd === "minimize") win.minimize();
  if (cmd === "close") win.close();
  return true;
});
// ---------------- 通知中心 / 配置方案 / 关于 ----------------
ipcMain.handle("get-notifications", () => getNotifications());
ipcMain.handle("clear-notifications", () => { try { fs.writeFileSync(NOTIF_PATH, "[]", "utf8"); } catch {} return true; });
ipcMain.handle("mark-notifications-read", () => {
  try {
    const list = getNotifications();
    list.forEach((n) => { n.read = true; });
    fs.writeFileSync(NOTIF_PATH, JSON.stringify(list, null, 2), "utf8");
  } catch {}
  return true;
});
// 打开当前仓库的 GitHub Releases 页 (从 git remote 自动解析)
ipcMain.handle("open-releases", async () => {
  try {
    const out = await git(["remote", "get-url", "origin"], 20000);
    const m = (out || "").match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\s*$/i);
    if (!m) return { ok: false, msg: (out || "no github remote").trim().slice(0, 80) };
    const url = `https://github.com/${m[1]}/${m[2]}/releases`;
    await shell.openExternal(url);
    return { ok: true, url };
  } catch (e) { return { ok: false, msg: String(e) }; }
});
ipcMain.handle("save-profile", (e, name) => {
  name = String(name || "").trim();
  if (!name) return { ok: false, msg: "no name" };
  S.profiles = (S.profiles || []).filter((p) => p.name !== name);
  S.profiles.unshift({ name, install_path: S.install_path, branch: S.branch, auto_switch: S.auto_switch, manual_proxy: S.manual_proxy, mirror_url: S.mirror_url });
  saveSettings();
  log(`配置方案已保存: ${name}`);
  return { ok: true, profiles: S.profiles };
});
ipcMain.handle("delete-profile", (e, name) => {
  S.profiles = (S.profiles || []).filter((p) => p.name !== name);
  saveSettings();
  return { ok: true, profiles: S.profiles };
});
ipcMain.handle("apply-profile", (e, name) => {
  const p = (S.profiles || []).find((x) => x.name === name);
  if (!p) return { ok: false };
  S = { ...S, install_path: p.install_path, branch: p.branch, auto_switch: p.auto_switch, manual_proxy: p.manual_proxy, mirror_url: p.mirror_url };
  saveSettings();
  log(`配置方案已应用: ${name}`);
  return { ok: true, settings: { ...S } };
});
ipcMain.handle("get-app-info", () => ({
  version: app.getVersion(),
  electron: process.versions.electron,
  node: process.versions.node,
  dataDir: APP_DIR,
  historyPath: HISTORY_PATH,
  logPath: LOG_PATH,
  profileCount: (S.profiles || []).length,
}));
// ---------------- Git 工作区诊断 / 回到分支 / 修复依赖 ----------------
ipcMain.handle("repo-status", async () => {
  const branch = (await git(["rev-parse", "--abbrev-ref", "HEAD"], 15000)).trim();
  if (!branch) return { ok: false };
  const detached = branch === "HEAD";
  const st = await git(["status", "--porcelain"], 15000);
  const dirty = st.split("\n").filter((l) => l.trim()).length;
  const stashOut = await git(["stash", "list"], 15000);
  const stash = stashOut.split("\n").filter((l) => l.trim()).length;
  return { ok: true, branch: detached ? (await git(["rev-parse", "--short", "HEAD"], 15000)).trim() : branch, detached, dirty, stash };
});
// 回滚用的是 git checkout <commit>, 会留下分离 HEAD; 一键切回工作分支修复
ipcMain.handle("checkout-branch", async () => {
  const out = await git(["checkout", S.branch || "main"], 60000);
  const ok = !/error|fatal/i.test(out);
  log(`切回分支 ${S.branch}: ${out.slice(0, 100).replace(/\n/g, " ")}`);
  return { ok, out };
});

// ---------------- v2.23.0: 更新日志中心 / 更新目标 / Webhook 测试 / 钩子保存 ----------------
ipcMain.handle("changelog-fetch", async () => {
  const dir = agentDir(); // git 仓库根在 install()/hermes-agent (与 git() 助手 cwd 一致)
  if (!fs.existsSync(path.join(dir, ".git"))) return { ok: false, msg: "not-git" };
  const max = Math.min(Math.max(parseInt(S.chg_max) || 200, 50), 1000);
  const out = await git(["log", `--max-count=${max}`, "--date=format:%Y-%m-%d", "--pretty=format:%h%x09%ad%x09%an%x09%s%x09%d"], 90000);
  const commits = out.split("\n").filter(Boolean).map((l) => {
    const c = l.split("\t");
    return { hash: c[0] || "", date: c[1] || "", author: c[2] || "", msg: c.slice(3, -1).join("\t") || "", ref: c[c.length - 1] || "" };
  });
  let groups = [];
  if (S.chg_group !== false) {
    let cur = null;
    for (const c of commits) {
      const m = /tag:\s*([^,)\s]+)/.exec(c.ref);
      if (m) { cur = { tag: m[1], hash: c.hash, date: c.date, commits: [c] }; groups.push(cur); }
      else if (cur) cur.commits.push(c);
      else {
        if (!groups.length || groups[0].tag) { cur = { tag: "", hash: c.hash, date: c.date, commits: [] }; groups.push(cur); }
        groups[0].commits.push(c);
      }
    }
    // git log 已是新->旧, 标签组按出现顺序即新->旧, 保持最新在前
  } else groups = [{ tag: "", hash: commits[0] ? commits[0].hash : "", date: commits[0] ? commits[0].date : "", commits }];
  return { ok: true, total: commits.length, groups };
});

ipcMain.handle("update-targets", async () => {
  const heads = await git(["ls-remote", "--heads", "origin"], 90000);
  const tags = await git(["ls-remote", "--tags", "origin"], 90000);
  if (!heads && !tags) return { ok: false, msg: "ls-remote failed (network/repo?)" };
  const parse = (s) => (s || "").split("\n").filter(Boolean).map((l) => (l.split("\t")[1] || "").replace(/^refs\/(heads|tags)\//, "").replace(/\^\{\}$/, "")).filter(Boolean);
  const cur = await git(["rev-parse", "--abbrev-ref", "HEAD"], 30000);
  return { ok: true, current: (cur || "").trim(), branches: parse(heads), tags: [...new Set(parse(tags))].reverse().slice(0, 100) };
});

ipcMain.handle("set-update-target", async (e, target) => {
  const s = String(target || "").trim();
  const [kind, ...rest] = s.split(":");
  const name = rest.join(":");
  if (!["branch", "tag"].includes(kind) || !name || !/^[\w.\-\/]+$/.test(name)) return { ok: false, msg: "invalid target" };
  await git(["fetch", "--all", "--prune", "--tags"], 180000);
  // partial clone (promisor) 离线时 checkout 输出可能含 "fatal" 但分支已切换成功
  // -> 不解析输出文本, 用 rev-parse 验证最终状态
  if (kind === "branch") await git(["checkout", "-B", name, `origin/${name}`], 90000);
  else await git(["checkout", `tags/${name}`], 90000);
  const verify = kind === "branch"
    ? await git(["rev-parse", "--abbrev-ref", "HEAD"], 30000)
    : await git(["describe", "--tags", "--exact-match"], 30000);
  const got = (verify || "").trim();
  const ok = got === name;
  if (ok) { S.upd_target = s; log(`[目标] 更新目标已保存: ${s}`); }
  return { ok, msg: got ? `now on ${got}` : "verify failed" };
});

ipcMain.handle("webhook-test", async () => {
  const url = String(S.webhook_url || "").trim();
  if (!/^https?:\/\//.test(url)) return { ok: false, msg: "invalid-url" };
  return await new Promise((resolve) => {
    try {
      const u = new URL(url);
      const mod = u.protocol === "https:" ? https : http;
      const payload = JSON.stringify({ event: "test", app: "HermesUpdater", version: app.getVersion(), time: new Date().toISOString() });
      const req = mod.request(u, { method: "POST", timeout: 10000, headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload), ...(S.webhook_secret ? { "X-Hermes-Secret": String(S.webhook_secret) } : {}) } }, (res) => {
        res.resume();
        resolve({ ok: res.statusCode < 400, status: res.statusCode });
      });
      req.on("error", (e) => resolve({ ok: false, msg: String(e).slice(0, 120) }));
      req.on("timeout", () => { try { req.destroy(); } catch {} resolve({ ok: false, msg: "timeout (10s)" }); });
      req.write(payload);
      req.end();
    } catch (e) { resolve({ ok: false, msg: String(e).slice(0, 120) }); }
  });
});

ipcMain.handle("hooks-save", (e, hooks) => {
  if (!Array.isArray(hooks)) return { ok: false, msg: "bad hooks" };
  S.hooks = hooks.slice(0, 20).map((h) => ({
    name: String(h.name || "").slice(0, 40), cmd: String(h.cmd || "").slice(0, 500),
    phase: ["pre", "post", "fail"].includes(h.phase) ? h.phase : "post",
    enabled: h.enabled !== false, timeout: Math.min(Math.max(parseInt(h.timeout) || 60, 5), 600),
    abort: h.abort !== false,
  }));
  saveSettings();
  return { ok: true, hooks: S.hooks };
});

ipcMain.handle("hooks-get", () => ({ ok: true, hooks: S.hooks || [] }));
let repairing = false;
ipcMain.handle("repair-deps", (e) => {
  if (repairing) return { ok: false, msg: "busy" };
  repairing = true;
  const send = (ch, d) => { try { e.sender.send(ch, d); } catch {} };
  (async () => {
    const { env, label } = await pickMethod();
    log(`依赖修复: 网络方式 ${label}`);
    send("repair-line", `[repair] npm ci --no-audit --no-fund (${label})`);
    const rc = await new Promise((resolve) => {
      const p = spawn("cmd.exe", ["/d", "/s", "/c", "npm ci --no-audit --no-fund"], {
        env: { ...baseEnv(), ...env }, cwd: agentDir(), windowsHide: true, windowsVerbatimArguments: true,
      });
      p.stdout.on("data", (d) => decodeBuf(d).split(/\r?\n/).filter(Boolean).forEach((l) => send("repair-line", l)));
      p.stderr.on("data", (d) => decodeBuf(d).split(/\r?\n/).filter(Boolean).forEach((l) => send("repair-line", l)));
      p.on("error", (er) => { send("repair-line", `[ERROR] ${er}`); resolve(-1); });
      p.on("close", (code) => resolve(code ?? -1));
    });
    repairing = false;
    log(`依赖修复完成: rc=${rc}`);
    send("repair-done", { rc });
  })();
  return { ok: true };
});

// 离线自测导出: 仅当 HU_SELFTEST=1 时暴露内部函数, 供 node 直接跑备份/恢复功能验证;
// Electron 正常启动时该分支不执行, 对运行零影响。
if (process.env.HU_SELFTEST === "1") {
  module.exports = { S, install, agentDir, backupDir, bkRoot, bkMap, BK_SCOPE_KEYS, bkNameOk, bkResolve, bkBackupNow, bkList, bkRestore, bkDelete, bkExport, bkVerify, bkPrune, bkPruneSync };
}
