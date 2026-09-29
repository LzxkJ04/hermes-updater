// HermesUpdater 渲染层: 页面切换 / 交互 / toast 点击反馈 / i18n 双语
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const rpc = window.api || null; // 浏览器预览时为 null -> 使用 mock

// ---------------- i18n ----------------
let LANG = "zh";
const STR = {
  zh: {
    "brand.sub": "更新工具", "boot.loading": "正在加载 HermesUpdater...",
    "nav.dash": "仪表盘", "nav.update": "更新", "nav.settings": "设置", "nav.diag": "诊断", "nav.log": "日志",
    "page.dash.t": "仪表盘", "page.dash.s": "Hermes Agent 更新总览",
    "page.update.t": "更新", "page.update.s": "检查并应用 Hermes 更新",
    "page.settings.t": "设置", "page.settings.s": "代理 / 更新行为 / 系统集成 / 维护",
    "page.diag.t": "诊断", "page.diag.s": "网络可达性 / 健康检查",
    "page.log.t": "运行日志", "page.log.s": "工具运行记录",
    "side.ready": "就绪", "side.checking": "正在检查...",
    "dash.banner.t": "Hermes Agent 更新仪表盘", "dash.banner.s": "实时总览 · 每 30 秒自动刷新",
    "dash.card.version": "当前版本", "dash.card.behind": "可更新提交", "dash.card.gateway": "Gateway 状态", "dash.card.method": "当前网络方式",
    "btn.check": "检查更新", "btn.update": "立即更新", "btn.refresh": "刷新状态",
    "btn.installdir": "📁 安装目录", "btn.logdir": "📂 日志文件夹", "btn.copyinfo": "📋 复制版本信息",
    "dash.quick": "⚡ 快捷操作", "btn.gw.restart": "Gateway 重启", "btn.gw.stop": "Gateway 停止",
    "btn.doctor": "健康检查 doctor", "btn.zhpatch": "恢复中文补丁", "btn.kill": "清理残留进程",
    "dash.recent": "🕘 最近更新", "btn.hist.manage": "管理历史", "btn.hist.csv": "导出 CSV",
    "upd.banner.s": "实时输出更新进度 · 支持回滚到历史版本", "upd.filter.ph": "🔍 过滤更新输出 (错误/阶段/提交)...",
    "btn.rollback": "回滚版本", "btn.copyout": "📋 复制输出", "btn.export.out": "📄 导出 txt", "upd.rb.title": "⏪ 回滚到历史提交",
    "btn.cancel.upd": "⛔ 取消更新", "cancel.confirm": "确定要取消当前更新吗?\n\n将终止更新进程 (已下载内容保留), 该次更新会记入历史。",
    "cancel.req": "已请求终止更新进程...", "cancel.err": "取消失败: 当前没有可终止的更新进程",
    "dash.heatmap": "🔥 更新热力图 (近 12 周)", "heat.legend": "少",
    "btn.maintain": "🧹 一键维护 (git gc + npm cache)", "maintain.running": "维护正在进行中", "maintain.done": "✅ 一键维护完成",
    "set.banner.s": "代理 / 更新行为 / 系统集成 / 维护", "set.net": "🌐 网络代理",
    "label.switch": "网络方式", "opt.auto": "自动探测（推荐）", "opt.direct": "直连", "opt.system": "系统代理", "opt.manual": "手动代理", "opt.mirror": "GitHub 镜像",
    "label.manual": "手动代理", "label.mirror": "镜像地址", "label.install": "安装路径", "label.branch": "分支",
    "path.detect.title": "自动识别安装路径", "path.browse": "浏览选择安装目录",
    "path.checking": "⏳ 正在检查路径...", "path.ok": "✔ 有效 Hermes 安装", "path.partial": "⚠ 目录存在但不是有效安装", "path.nodir": "✘ 目录不存在",
    "path.missing": "缺少", "path.free": (g) => `磁盘剩余 ${g} GB`, "path.nowrite": "目录不可写",
    "path.detecting": "⏳ 正在扫描常见位置（含盘符与 PATH）...", "path.detected.n": (n) => `识别到 ${n} 个候选，点击即应用：`,
    "path.none.found": "未找到有效的 Hermes 安装，可勾选「深度扫描」重试，或点 📂 手动选择",
    "path.applied.toast": (p) => `已应用安装路径: ${p}`, "path.autoswitch": "已自动识别并切换安装路径",
    "dash.card.install": "安装健康", "st.install.ok": (g) => `✔ 有效 · ${g}GB`, "st.install.partial": "△ 不完整", "st.install.bad": "✘ 路径失效",
    "chk.preflight": "更新前自动预检（安装路径 / git 仓库 / 磁盘剩余，路径失效时尝试自动识别修复）", "label.minfree": "预检磁盘剩余下限(GB)",
    "pre.path": "安装路径不存在", "pre.pathpartial": "安装目录不完整（缺 hermes.cmd 或 hermes-agent）", "pre.git": "hermes-agent 不是 git 仓库", "pre.disk": (f, m) => `磁盘剩余 ${f}GB，低于下限 ${m}GB`,
    "pre.detecting": "安装路径失效，正在自动识别...", "preflight.confirm": (n) => `更新前预检发现 ${n}，仍要继续更新吗？`, "preflight.switch": (p) => `检测到有效安装:\n${p}\n\n切换到该路径并继续更新？`,
    "preflight.fixed": "已切换到有效安装路径 ✔", "preflight.aborted": "已取消：请先在设置中修复安装路径",
    "label.known": "已知安装", "btn.known.save": "➕ 保存当前", "btn.known.apply": "应用", "btn.known.del": "删除",
    "known.empty": "暂无历史安装，识别或保存后显示在这里", "known.saved": "已保存到已知安装 ✔", "known.removed": "已从已知安装移除",
    "known.save.invalid": "当前路径无效，仅有效安装可保存", "chk.pathwatch": "运行时监控安装路径（失效时自动提醒并尝试修复）", "btn.export.report": "🩺 导出诊断报告",
    "set.behavior": "🔄 更新行为",
    "chk.gateway": "更新后自动启动 Gateway", "chk.ks": "保留本地改动 (--keep-stash)", "chk.kill": "更新前清理残留 Hermes 进程",
    "chk.rzp": "更新后恢复中文补丁", "chk.notify": "发现新版本时提醒", "chk.autoupd": "定时自动检查新版本",
    "label.zsrc": "zh-patches 母本目录", "label.bkp": "备份保留份数", "label.interval": "自动检查间隔(分钟)", "label.gittimeout": "git 超时(秒)",
    "chk.confirm": "更新前弹出确认对话框", "chk.cleanup": "更新完成后清理多余 Hermes 进程", "chk.keepgw": "清理时保留 Gateway 进程",
    "chk.gwwatch": "Gateway 掉线/恢复托盘提醒（每 5 分钟检测）", "chk.notifydone": "更新完成后托盘气泡通知",
    "set.system": "🖥️ 系统集成 / 外观",
    "chk.tray": "关闭时最小化到托盘", "chk.boot": "开机自动启动", "chk.dark": "深色主题",
    "chk.ontop": "窗口置顶（始终保持在最前）",
    "chk.themesys": "跟随系统深浅色（开启时忽略上方选项）", "chk.checkstart": "启动时自动检查版本",
    "chk.logauto": "日志页自动刷新（每 5 秒）",
    "btn.test.conn": "🔌 测试连接", "test.conn.doing": "正在按当前网络方式实测 github.com ...",
    "test.conn.ok": (label, ms) => `✅ 连通正常 · ${label} · 耗时 ${ms}ms`, "test.conn.fail": (m) => `❌ 连接失败 ${m}`,
    "label.quiet.start": "免打扰开始（自动检查）", "label.quiet.end": "免打扰结束",
    "chk.backupauto": "每日自动备份数据包（存文档目录）", "label.backupkeep": "备份保留份数(1-30)",
    "diag.conn": "🔌 最近连通性测试（最多 5 条）", "conn.none": "尚未进行过连通性测试（设置页 → 🔌 测试连接）",
    "btn.open.backups": "📂 打开备份目录", "btn.restore.latest": "♻️ 从最新备份恢复",
    "restore.latest.confirm": "将从最新自动备份恢复设置与更新历史，当前设置会被覆盖。继续？",
    "restore.latest.ok": (f) => `已从最新备份恢复 ✔ ${f}`, "restore.latest.none": "还没有自动备份（先在上方开启每日自动备份）",
    "restore.latest.fail": (m) => `恢复失败 ${m}`,
    "btn.envinfo": "🖥️ 环境信息", "env.running": "正在收集环境信息...", "chk.traybadge": "托盘角标：有可更新提交时显示 ⬆️N",
    "label.startpage": "启动页", "label.lang": "界面语言",
    "opt.page.dash": "📊 仪表盘", "opt.page.update": "🔄 更新", "opt.page.settings": "⚙️ 设置", "opt.page.diag": "🩺 诊断", "opt.page.log": "📜 运行日志",
    "label.zoom": "界面缩放", "label.termfont": "终端字号(px)", "label.refresh": "状态自动刷新(秒)", "label.logdays": "日志保留天数", "label.histmax": "历史上限(条)",
    "set.maint": "🧹 维护", "btn.export.settings": "导出设置", "btn.import.settings": "导入设置",
    "btn.export.data": "📦 备份数据包", "btn.import.data": "📥 恢复数据包", "btn.save": "💾 保存设置",
    "chk.fallback": "直连失败时自动切换镜像源", "chk.diskcheck": "更新前检查磁盘剩余空间", "chk.notifcenter": "启用应用内通知中心",
    "chk.desktopnot": "桌面系统通知（更新完成 / 失败 / 新版本，最小化到托盘也能收到）",
    "btn.snooze1": "🔕 稍后 1 小时", "btn.snooze3": "🔕 稍后 3 小时", "btn.snooze6": "🔕 稍后 6 小时", "btn.snooze.off": "取消提醒抑制",
    "snooze.on": (ts) => `🔕 已抑制新版本提醒至 ${ts}`, "snooze.done": (h) => `🔕 ${h} 小时内不再提醒新版本（手动更新不受限）`, "snooze.off": "✅ 已恢复新版本提醒",
    "btn.speedtest": "🚀 测速对比",
    "diag.speed": "🚀 网络方案测速对比", "diag.speed.hint": "点行尾「应用」一键切换到该方案",
    "spd.testing": "⏳ 并发测速中（最多 8 秒）…", "spd.apply": "应用", "spd.applied": (l) => `✅ 已切换网络方案: ${l}`, "spd.fastest": "⚡最快", "spd.now": "📍当前",
    "btn.cd.go": "🚀 立即更新", "btn.cd.skip": "⏭️ 本次跳过",
    "cd.text": (l, b) => `⏳ ${l} 秒后自动开始更新（发现 ${b} 个新提交，可跳过本次）`, "cd.skipped": "⏭️ 已跳过本次自动更新", "cd.going": "🚀 已确认，开始更新",
    "label.countdown": "自动更新倒计时(秒, 0=立即, ≤600)",
    "btn.healthreport": "📑 导出健康报告", "rpt.done": (p) => `📑 健康报告已导出: ${p}`, "rpt.fail": "健康报告导出失败",
    "install.score": (s, g) => `${s}分 ${g}`, "install.grade.excellent": "优秀", "install.grade.ok": "良好", "install.grade.warn": "需关注", "install.grade.bad": "异常",
    "install.chk.path": "路径存在", "install.chk.cmd": "hermes 命令", "install.chk.agent": "Agent 目录", "install.chk.git": "git 仓库", "install.chk.disk": "磁盘剩余",
    "label.netwatch": "网络巡检间隔(分钟, 0=关闭)",
    "nav.install": "安装 Hermes", "page.install.t": "安装 Hermes", "page.install.s": "一键安装 / 修复重装 / 卸载",
    "ins.banner.s": "一键安装 / 修复重装 / 卸载 / 环境预检",
    "ins.env.title": "🧭 环境预检", "ins.env.idle": "尚未检测 — 点击「环境预检」获取 node / npm / git / 磁盘 / 目标目录状态",
    "ins.env.node": "Node.js", "ins.env.npm": "npm", "ins.env.git": "Git", "ins.env.disk": "目标盘剩余", "ins.env.dir": "目标目录",
    "ins.env.dir.absent": "不存在 (全新安装)", "ins.env.dir.empty": "存在且为空", "ins.env.dir.repo": "已是 git 仓库 (将复用 fetch)", "ins.env.dir.occupied": "已占用且非仓库 (需换目录或先清理)",
    "ins.env.missing": "未检测到 ⚠️", "ins.env.ok": "✔",
    "ins.cfg.title": "🛠️ 安装配置", "ins.cfg.repo": "源仓库 (Git URL)", "ins.cfg.dir": "目标目录", "ins.cfg.ver": "版本 (分支 / 标签)",
    "ins.cfg.fetchvers": "🌐 获取版本列表", "ins.cfg.preflight": "🧭 环境预检", "ins.cfg.start": "🚀 开始安装", "ins.cfg.cancel": "⛔ 取消安装",
    "ins.cfg.fix": "🔧 修复重装", "ins.cfg.uninstall": "🗑️ 卸载…", "btn.browse": "📂 浏览",
    "ins.cfg.hint": "配置会随「开始安装」一并保存；克隆失败且指定分支不存在时自动回退默认分支。已有 git 仓库的目录自动走 fetch 复用模式（即「修复重装」）。",
    "ins.out.idle": "等待安装任务…",
    "ins.hist.title": "🕘 安装历史", "ins.hist.empty": "暂无安装记录",
    "ins.start.confirm": (v, d) => `开始安装 Hermes (${v})?\n\n目标目录: ${d}\n\n已存在 git 仓库时将复用并拉取更新, 否则全新克隆。`,
    "ins.starting": "⏳ 安装任务已启动…", "ins.done.ok": (dur, note) => `✅ 安装完成 (${dur})${note ? " · " + note : ""}`, "ins.done.fail": (rc, note) => `❌ 安装失败 (rc=${rc})${note ? " · " + note : ""}`,
    "ins.done.cancel": "⛔ 安装已取消",
    "ins.vers.ok": (b, t2) => `获取到 ${b} 个分支 / ${t2} 个标签 (已填入版本输入框候选)`, "ins.vers.fail": "获取版本列表失败 (检查仓库地址与网络)",
    "ins.preflight.ran": "环境预检完成", "ins.uninst.ask": "请先在「目标目录」填入要卸载的安装目录",
    "ins.hist.line": (h) => `${h.time}  ${h.result === "ok" ? "✅" : h.result === "cancel" ? "⛔" : h.result === "uninstall" ? "🗑️" : "❌"} ${h.ver} → ${h.dir} (${h.dur})${h.note ? " · " + h.note : ""}`,
    "ins.hist.uninstalled": "🗑️ 已移入回收站",
    "label.ins-timeout": "安装整体超时(分钟)", "label.ins-histkeep": "安装历史保留条数",
    "label.ins-npmmirror": "安装 npm 源", "opt.npm.default": "默认 (跟随系统)", "opt.npm.npmmirror": "npmmirror 国内镜像", "opt.npm.custom": "自定义",
    "label.ins-npmcustom": "自定义 npm registry",
    "chk.ins.gitaccel": "安装克隆走镜像加速", "chk.ins.autovalidate": "安装完成自动验证", "chk.ins.autoapply": "验证通过自动设为当前管理路径", "chk.ins.shortcut": "安装后创建桌面快捷方式",
    "btn.cleanup": "🧽 空间清理", "btn.netheal": "🧙 一键网络自愈",
    "cln.title": "🧽 可清理项目", "cln.run": "🧹 清理勾选项目",
    "cln.npmcache": "npm 下载缓存", "cln.oldbackups": "超额旧备份", "cln.applog": "应用日志 (截断保留 512 KB)",
    "cln.scanning": "⏳ 扫描可清理空间…", "cln.none": "没有可清理项目, 很干净 ✨", "cln.total": (n) => `可释放约 ${n} MB`,
    "cln.cleaning": "🧹 清理中…", "cln.done": (mb) => `✅ 清理完成, 释放约 ${mb} MB`, "cln.fail": "清理失败",
    "heal.start": "🧙 网络自愈: 并发测速全部方案…", "heal.apply": (l) => `🧙 自愈完成: 已切换到最优方案 (${l})`, "heal.none": "🧙 自愈失败: 所有方案均不可达, 请检查网络/代理",
    "btn.backup.list": "🕘 备份列表", "bkp.list.title": "历史备份 (点「恢复」回滚到该日配置)",
    "bkp.restore": "恢复", "bkp.empty": "备份目录为空", "bkp.restored": (f) => `✅ 已从备份恢复: ${f}`, "bkp.restore.confirm": (f) => `用 ${f} 的配置与历史覆盖当前数据?`,
    "label.sched.days": "定时计划 (周几, 0=周日)", "sched.plan": (d, tm) => `计划: ${d} ${tm}`,
    "log.lv.all": "全部级别", "log.lv.info": "仅常规", "log.lv.warn": "警告", "log.lv.err": "错误",
    "btn.dirsize": "💾 体积分析", "size.scanning": "⏳ 正在扫描安装目录体积（最多 25 秒）…",
    "size.title": "安装目录体积分析", "size.total": (s) => `总大小: ${s}`, "size.files": (n) => `${n} 个文件`, "size.truncated": "⚠️ 目录过大, 扫描被截断, 结果偏小",
    "size.fail": (m) => `体积分析失败: ${m}`,
    "chk.pathauto": "启动时自动识别安装路径（当前路径无效时探测常见位置）", "chk.pathapply": "自动切换到识别到的有效安装路径（关闭则仅提醒）", "chk.pathdeep": "自动识别时深度扫描所有盘符（更全面，稍慢）",
    "chk.autoretry": "更新失败后自动重试（换网络方式重试）", "label.maxretry": "自动重试次数(0-5)",
    "chk.autoexec": "自动检查发现新版本后自动执行更新",
    "label.accent": "强调色",
    "opt.accent.blue": "🔵 蓝色（默认）", "opt.accent.green": "🟢 绿色", "opt.accent.purple": "🟣 紫色", "opt.accent.orange": "🟠 橙色", "opt.accent.teal": "🩵 青色",
    "accent.applied": (n) => `强调色已切换: ${n}`, "accent.blue": "蓝色", "accent.green": "绿色", "accent.purple": "紫色", "accent.orange": "橙色", "accent.teal": "青色",
    "set.profiles": "💼 配置方案", "set.profiles.tip": "保存多套「安装路径 + 分支 + 网络方式」组合, 一键切换。",
    "label.prof.name": "方案名称", "label.prof.list": "已有方案",
    "btn.prof.save": "💾 保存当前为方案", "btn.prof.apply": "📥 应用方案", "btn.prof.delete": "🗑 删除方案",
    "prof.askname": "请先在上方输入框填写方案名称", "prof.saved": (n) => `方案「${n}」已保存 ✔`, "prof.applied": (n) => `方案「${n}」已应用, 设置已刷新 ✔`,
    "prof.deleted": (n) => `方案「${n}」已删除`, "prof.none": "请先选择一个方案",
    "btn.apply.proxy": "✅ 应用到设置", "proxy.applied": (m) => `已应用网络方式: ${m}`, "proxy.directonly": "仅直连可达, 无需更改", "proxy.noneok": "所有通路均不可达, 无法应用",
    "hist.d.time": "时间", "hist.d.result": "结果", "hist.d.method": "网络方式", "hist.d.dur": "耗时",
    "hist.d.old": "旧版本", "hist.d.new": "新版本", "hist.d.note": "备注", "hist.d.tap": "点击条目查看详情",
    "diag.banner.s": "网络可达性 / 健康检查", "btn.doctor2": "运行 doctor", "btn.netprobe": "🌐 网络探测",
    "btn.copydiag": "📋 复制结果", "btn.export.diag": "📄 导出结果", "diag.probe": "🌐 网络可达性探测", "diag.weekly": "📈 近 7 天更新周报",
    "log.banner.s": "工具运行记录", "log.filter.ph": "🔍 过滤关键字...",
    "btn.log.refresh": "立即刷新", "btn.log.copy": "📋 复制", "btn.log.open": "打开日志文件", "btn.log.clear": "清空日志",
    "hist.dlg": "🕘 更新历史管理", "hist.filter.ph": "🔍 过滤 (时间/结果/原因)...", "btn.hist.clearall": "清空全部", "btn.close": "关闭",
    "top.notif": "通知中心", "top.about": "关于",
    "notif.title": "🔔 通知中心", "notif.empty": "暂无通知", "btn.notif.clear": "清空通知",
    "about.title": "ℹ️ 关于 HermesUpdater", "about.version": "版本", "about.data": "数据目录", "btn.about.open": "📂 打开数据目录",
    "btn.releases": "🐙 GitHub Releases", "open.fail": (m) => `打开失败: ${m}`,
    // 动态文本
    "st.refreshing": "正在刷新状态...", "st.refreshed": "状态已刷新", "st.failed": "状态获取失败", "st.found": (n) => `发现 ${n} 个更新`,
    "st.checkfail": "检测失败", "st.uptodate": "已是最新", "st.behind": (b, a, r) => `落后 ${b} / 领先 ${a}${r ? " · 远端 " + r : ""}`,
    "st.preview": "预览模式", "st.readyNoCheck": "就绪 (未自动检查)",
    "stats.month": (ok, fail) => `本月统计:  ✅ 成功 ${ok}   ❌ 失败 ${fail}`,
    "trend.legend": "近 20 次 (右新左旧)", "hist.empty": "暂无更新记录", "hist.nomatch": "无匹配记录",
    "res.ok": "✅ 成功", "res.partial": "⚠️ 部分", "res.fail": "❌ 失败", "hist.deleted": "已删除该条记录",
    "hist.confirmclear": "确定清空全部更新历史? (不可恢复, 可先导出 CSV)", "hist.cleared": "更新历史已清空",
    "weekly.empty": "近 7 天暂无更新记录", "nodata": "暂无数据",
    "upd.busy": "已有更新在进行中", "upd.confirm": (b) => `当前状态: ${b}\n确定立即更新吗?\n\n更新前会自动备份并清理残留进程。`,
    "upd.cancelled": "已取消更新", "upd.preparing": "准备更新...", "upd.started": "开始更新...", "upd.done": "更新完成", "upd.fail": "更新失败",
    "st.upd.ok": "更新成功", "st.upd.fail": "更新失败",
    "theme.dark": "已切换深色主题", "theme.light": "已切换浅色主题",
    "top.trans": "翻译面板",
    "trans.title": "🌐 实时翻译", "trans.all": "翻译全部输出", "trans.clear": "清空", "trans.send": "翻译",
    "trans.input.ph": "输入文本手动翻译...", "trans.hint": "更新运行时, 输出将在此逐行实时显示翻译",
    "trans.empty": "请输入要翻译的文本", "trans.done": (n) => `已翻译 ${n} 行 ✔`, "trans.none": "（未获得翻译结果）",
    "trans.opened": "已打开翻译面板 🌐", "trans.closed": "已关闭翻译面板",
    "via.google": "Google", "via.mymemory": "MyMemory", "via.offline": "离线词典", "via.none": "",
    "chk.lintime": "更新输出显示行时间戳（[时:分:秒] 前缀）", "chk.transauto": "输出行自动实时翻译（翻译面板开启时逐行翻译）",
    "chk.injectmirror": "内置自动修复：注入 Electron/npm 镜像环境（打包阶段不再直连 GitHub，尽量一次成功）",
    "chk.autorepair": "重试时自动叠加代理环境（上次失败于打包/依赖下载阶段）",
    "label.trantarget": "翻译目标语言", "label.tranprovider": "翻译引擎",
    "opt.tgt.zh": "简体中文", "opt.tgt.en": "English",
    "opt.prov.auto": "自动（按下方自定义顺序，默认多引擎依次切换）", "opt.prov.google": "Google 翻译",
    "opt.prov.gcloud": "Google 备用端点（Chrome 接口）", "opt.prov.deepl": "DeepL（免密钥）",
    "opt.prov.lingva": "Lingva（Google 开源前端）", "opt.prov.mymemory": "MyMemory（免密钥）",
    "opt.prov.youdao": "有道翻译（免密钥）", "opt.prov.offline": "仅离线词典（无需联网）",
    "via.google": "Google", "via.gcloud": "Google备用", "via.deepl": "DeepL", "via.lingva": "Lingva",
    "via.mymemory": "MyMemory", "via.youdao": "有道", "via.offline": "离线词典", "via.none": "",
    "label.tranorder": "引擎顺序（自动模式用，逗号分隔，留空=默认）", "label.trandict": "自定义词典（每行 英文=中文）",
    "ph.tranorder": "google,deepl,mymemory,youdao,lingva,gcloud",
    "set.trans": "🌐 翻译 / 输出",
    "set.savednone": "所有修改已保存 ✔", "set.dirty": (n) => `⚠ 有 ${n} 项未保存的修改`,
    "btn.save2": "💾 保存设置", "btn.revert": "↩ 撤销修改", "btn.reset": "恢复默认",
    "set.reverted": "已撤销未保存的修改 ✔",
    "set.reset.confirm": "确定恢复全部默认设置吗？\n当前配置将被覆盖（更新历史不受影响）。",
    "set.reset.done": "已恢复默认设置 ✔",
    "set.filter.ph": "🔍 搜索设置项...", "set.nomatch": "没有匹配的设置项",
    "set.autosaved": "已自动保存 ✔", "set.unsaved.confirm": "设置有未保存的修改，确定要离开吗？",
    "chk.autosave": "修改设置后自动保存（无需手动点保存按钮）", "chk.unsavedguard": "离开设置页时提醒未保存的修改",
    "label.trmscheme": "终端配色", "label.trmcolors": "终端颜色（背景/文字）",
    "opt.trm.theme": "跟随深浅主题", "opt.trm.black": "经典黑（两主题都黑底）", "opt.trm.custom": "自定义颜色",
    "set.saved": "设置已保存 ✔", "set.savefail": "保存失败", "set.savedPreview": "设置已保存（预览）",
    "lang.saved": "语言已切换 ✔ Language switched",
    "open.install": "正在打开安装目录...", "open.logdir": "正在打开日志文件夹...", "open.fail": (m) => `打开失败: ${m}`,
    "info.copied": "版本信息已复制到剪贴板 ✔",
    "gw.sent": (n) => `Gateway ${n} 指令已发送...`, "gw.ok": (n) => `Gateway ${n} 完成 ✔`, "gw.fail": (n) => `Gateway ${n} 失败`,
    "gw.restart": "重启", "gw.stop": "停止",
    "doctor.running": "doctor 检查中, 结果将显示在诊断页...", "doctor.done": "doctor 检查完成 ✔",
    "probe.running": "网络探测中...", "probe.done": (ok, n) => `探测完成: ${ok}/${n} 条通路可达`,
    "probe.reachable": "可达", "probe.unreachable": "不可达",
    "probe.direct": "直连 GitHub", "probe.system": "系统代理", "probe.manual": "手动代理", "probe.mirror": "镜像",
    "diag.copied": "诊断结果已复制 ✔", "diag.empty": "诊断结果为空, 请先运行 doctor",
    "btn.repo": "🌿 Git 工作区检查", "btn.back2branch": "⬅️ 回到分支", "btn.repair": "🔧 修复依赖",
    "repo.running": "正在检查 Git 工作区...", "repo.fail": "Git 工作区检查失败 (目录无效?)",
    "repo.branch": "当前分支", "repo.detached": "⚠️ 分离 HEAD (回滚后状态, 点「回到分支」修复)", "repo.ondetached": "工作分支",
    "repo.dirty": (n) => n ? `本地改动 ${n} 个文件` : "工作区干净 (无本地改动)",
    "repo.stash": (n) => n ? `stash 暂存 ${n} 条` : "无 stash 暂存",
    "b2b.running": "正在切回分支...", "b2b.done": (b) => `已切回分支 ${b} ✔ 状态已刷新`, "b2b.fail": (o) => `切回失败: ${(o || "").slice(0, 80)}`,
    "repair.running": "依赖修复中 (npm ci), 输出见下方...", "repair.done": "依赖修复完成 ✔ 建议重启 Gateway", "repair.fail": (rc) => `依赖修复失败 (rc=${rc}), 可重试或改用完整更新`,
    "exported": (p) => `已导出: ${p}`, "export.fail": (m) => `导出失败: ${m}`, "export.cancelled": "导出已取消",
    "kill.running": "正在清理残留进程...", "kill.done": (n) => `已结束 ${n} 个残留进程`, "kill.none": "没有发现残留进程",
    "zh.ok": (m) => `中文补丁已恢复 ✔ ${m}`, "zh.fail": (m) => `恢复失败: ${m}`,
    "out.empty": "更新输出为空", "out.copied": "更新输出已复制 ✔",
    "rb.fetching": "正在获取最近提交...", "rb.go": "回滚到此",
    "rb.confirm": (h, d, m) => `确定回滚到此版本吗?\n\n提交: ${h}\n日期: ${d}\n说明: ${m}\n\n回滚后会自动刷新状态; 如异常可再次回滚到更新前提交。`,
    "rb.running": "正在回滚...", "rb.done": "回滚完成 ✔ 状态已刷新", "rb.fail": (o) => `回滚失败: ${(o || "").slice(0, 80)}`,
    "log.refreshed": "日志已刷新", "log.copied": "日志已复制 ✔", "log.confirmclear": "确定清空日志文件?", "log.cleared": "日志已清空",
    "set.imported": "设置已导入 ✔", "set.import.fail": (m) => `导入失败: ${m}`, "set.import.cancelled": "导入已取消",
    "data.confirm": "导入数据包将覆盖当前设置与更新历史, 确定继续?", "data.restored": "数据包已恢复 ✔",
    "nextcheck": (m, s) => `⏱ 下次自动检查: ${m}:${s} 后`,
    "err.script": (m) => `脚本错误: ${m}`, "err.async": (m) => `异步错误: ${m}`,
    "app.started": "HermesUpdater 已启动",
    "note.strip": /^(原因:|reason:)/,
    "btn.whatsnew": "🆕 更新内容预览", "wn.title": "🆕 更新内容预览 (HEAD → 远端)",
    "wn.refresh": "🔄 刷新", "wn.export": "📄 导出 txt",
    "wn.loading": "正在获取待更新提交...", "wn.empty": "没有待更新的提交, 已是最新 ✔",
    "wn.total": (n, br) => `共落后 ${n} 个提交 (origin/${br}, 最多显示设置中的条数)`,
    "wn.exported": "更新内容已导出 ✔", "wn.fail": (m) => `获取失败: ${m}`,
    "btn.proclist": "⚙️ 进程管理", "proc.title": "⚙️ Hermes 进程管理",
    "proc.refresh": "🔄 刷新", "proc.loading": "正在枚举进程...",
    "proc.empty": "当前没有 Hermes 相关进程在运行", "proc.kill": "结束",
    "proc.confirm": (pid) => `确定结束进程 PID ${pid} 吗？`,
    "proc.killed": (pid) => `已结束进程 ${pid} ✔`, "proc.killedfail": (pid) => `结束进程 ${pid} 失败`,
    "proc.gateway": "Gateway", "proc.hint": "仅列出命令行指向当前 Hermes 安装目录的进程；结束前会二次确认。",
    "btn.upstats": "📊 更新统计", "stats.title": "📊 更新统计 (基于更新历史)",
    "stats.total": "总更新次数", "stats.rate": "成功率", "stats.avgdur": "平均耗时",
    "stats.thismonth": "本月 (成功/失败/取消)", "stats.monthly": "近 6 个月分布 (成功/失败/取消)",
    "stats.bylabel": "按网络方式", "stats.byreason": "失败原因 Top5",
    "stats.nodata": "暂无更新历史, 更新一次后即可查看统计",
    "stats.ok": "成功", "stats.fail": "失败", "stats.cancel": "取消", "stats.count": (n) => `${n} 次`,
    "chk.postsmoke": "🩺 更新成功后自动冒烟验证（运行 hermes --version 确认新版本可用）",
    "chk.watchdog": "🐕 Gateway 守护：掉线时自动拉起（与掉线提醒互补）",
    "label.wnmax": "更新内容预览条数(10-100)", "label.watchdogmin": "守护巡检间隔(分钟, ≥2)",
    "label.chgmax": "更新日志拉取条数(50-1000)",
    "chk.upd.lock": "🎯 更新前强制锁定到「更新目标」（更新页可设置分支/标签目标）",
    "chk.chg.group": "📜 更新日志按 tag 分组展示",
    "upd.target.title": "🎯 更新目标", "upd.target.pick": "目标分支 / 标签",
    "upd.target.refresh": "🔄 拉取列表", "upd.target.apply": "📍 切换并保存目标", "upd.target.clear": "↩️ 恢复默认分支",
    "upd.target.hint": "切换后立即 checkout 远端分支/标签并保存为目标；开启设置页「更新前强制锁定目标」后, 每次更新都会先切到该目标。标签目标会在每次更新成功后重新钉住。",
    "upd.target.cur": "当前: ", "upd.target.none": "未设置 (跟随默认分支)", "upd.target.fetching": "拉取中…",
    "upd.target.fail": (m) => `切换失败 ${m || ""}`,
    "upd.target.group.branch": "— 分支 —", "upd.target.group.tag": "— 标签 —", "upd.target.applied": "目标已切换并保存 ✔", "upd.target.cleared": "已恢复默认分支 ✔",
    "upd.cl.title": "📜 更新日志中心", "upd.cl.fetch": "📥 生成更新日志", "upd.cl.export": "📄 导出 Markdown",
    "upd.cl.search": "🔍 搜索提交 / 作者 / hash",
    "upd.cl.idle": "点击「生成更新日志」从本地仓库提取提交历史", "upd.cl.loading": "正在提取提交历史…",
    "upd.cl.notgit": "当前安装目录不是 git 仓库, 无法生成", "upd.cl.empty": "没有匹配的提交",
    "upd.cl.ungrouped": "未发布", "upd.cl.commits": "条提交", "upd.cl.exported": "已导出",
    "set.hooks": "🪝 更新钩子",
    "set.hooks.tip": "在更新前 / 成功后 / 失败后自动执行自定义命令（如通知、清理、备份）。前置钩子可选「失败即中止更新」。",
    "set.hooks.hint": "超时范围 5-600 秒；前置(pre)钩子失败且勾选「失败中止」时本次更新不会开始。",
    "btn.hook.add": "➕ 添加钩子", "btn.hook.save": "💾 保存钩子",
    "hook.ph.pre": "更新前", "hook.ph.post": "成功后", "hook.ph.fail": "失败后",
    "hook.f.name": "名称", "hook.f.cmd": "命令", "hook.f.to": "超时s", "hook.f.abort": "失败中止",
    "hook.f.enabled": "启用", "hook.f.del": "✖", "hook.none.loaded": "尚未配置任何钩子",
    "set.webhook": "🌐 Webhook 推送",
    "set.webhook.tip": "更新/安装/卸载完成时向自定义 URL POST 一条 JSON（适合接入企业微信/钉钉/Slack 机器人）。",
    "label.webhook.url": "Webhook URL", "label.webhook.secret": "密钥请求头 (X-Hermes-Secret, 可空)",
    "chk.wh.ok": "推送更新成功", "chk.wh.fail": "推送更新失败", "chk.wh.ins": "推送安装/卸载完成",
    "btn.wh.test": "📡 发送测试", "wh.testing": "发送中…", "wh.ok": "测试成功 (HTTP", "wh.fail": "测试失败:", "wh.saved": "Webhook 设置已保存 (随设置保存生效)",
    "ins.mirror.test": "🚀 镜像测速", "ins.mirror.title": "🚀 安装镜像源测速",
    "ins.mirror.loading": "正在探测直连与候选镜像 (git 协议级, 约 8 秒)...",
    "ins.mirror.ok": "可达", "ins.mirror.fail": "不可达", "ins.mirror.direct": "直连 GitHub",
    "ins.mirror.okgit": "可达(git 协议)", "ins.mirror.okhttp": "可达(HTTP)",
    "ins.mirror.cur": (m) => `安装源仓库: ${m}`,
    "ins.mirror.eff": (m) => `当前生效前缀: ${m || "直连"}`,
    "ins.mirror.apply": "应用", "ins.mirror.applied": (m) => `已设为安装专用加速前缀: ${m || "直连"} ✔`,
    "ins.mirror.fastest": "最快", "ins.mirror.hint": "按 git 协议可达性与延迟排序；点「应用」把该镜像设为安装专用加速前缀（克隆失败也会自动换源重试）。",
    "label.ins.mirror": "安装专用加速前缀（空=沿用镜像地址）",
    "chk.ins.mirrorfb": "安装克隆失败时自动换候选镜像重试",
    "unins.title": "🗑️ 卸载 Hermes", "unins.mode": "卸载方式",
    "unins.m.trash": "🗑️ 移入回收站（推荐，可恢复）", "unins.m.modules": "🧹 仅删除依赖/构建产物（保留源码）",
    "unins.m.perm": "💥 彻底删除（不可恢复）", "unins.m.unreg": "📎 仅解除关联（不动文件）",
    "unins.opt.backup": "卸载前自动备份配置（config.yaml / zh-patches → 文档目录备份区）",
    "unins.opt.stop": "卸载前停止占用的 Hermes 进程",
    "unins.confirm.label": "为防误删，请输入目录名以确认彻底删除",
    "unins.run": "🗑️ 执行卸载", "unins.checking": "正在读取卸载预检...",
    "unins.missing": "目录不存在", "unins.yes": "有", "unins.no": "无",
    "unins.info.size": "占用", "unins.info.repo": "git 仓库", "unins.info.config": "配置文件",
    "unins.info.agent": "hermes.cmd", "unins.info.procs": "占用进程",
    "unins.permanent.confirm": (d) => `即将彻底删除且不可恢复！\n\n${d}\n\n确定继续？`,
    "unins.strict.hint": (n) => `请输入目录名 ${n} 以解锁彻底删除`,
    "unins.done": (n) => `卸载完成: ${n}`, "unins.fail": (m) => `卸载失败: ${m}`,
    "chk.unins.backup": "卸载前自动备份配置（卸载面板中可临时取消）",
    "chk.unins.stop": "卸载前自动停止占用的 Hermes 进程",
    "chk.unins.unreg": "卸载（回收站/彻底删除）后自动从「已知安装」移除该路径",
    "chk.unins.strict": "彻底删除需输入目录名二次确认（防误删）",
    "label.unins.mode": "默认卸载方式",
    "dash.qc.title": "⚡ 快捷操作中心", "dash.qc.upd": "🔄 更新与 Gateway", "dash.card.score": "健康评分",
    "dash.tools.title": "🛠️ 安装 · 卸载 · 维护",
    "dt.refresh": "🔄 刷新", "dt.target": "操作目标", "dt.preflight": "🧭 体检", "dt.uninsmode": "卸载方式",
    "dt.backup": "📦 备份配置", "dt.unregister": "📎 解除关联", "dt.unins": "🗑️ 快捷卸载",
    "dt.repair": "🚀 一键修复重装", "dt.goinstall": "📦 打开安装页", "dt.hist": "🕘 最近安装 / 卸载",
    "dt.current": "当前管理路径", "dt.valid": "有效安装", "dt.invalid": "无效/未安装",
    "dt.status": "状态", "dt.disk": "磁盘剩余", "dt.git": "git 仓库", "dt.cmd": "hermes.cmd", "dt.agent": "agent 源码",
    "dt.none": "暂无记录", "dt.needtarget": "请先选择操作目标",
    "dt.confirm.unins": (d, m) => `确定对以下目录执行「${m}」吗？\n\n${d}`,
    "dt.confirm.repair": (d) => `对以下目录执行修复重装（fetch 复用已有仓库 + npm install）？\n\n${d}`,
    "dt.repair.started": "修复重装已开始, 已跳转安装页查看进度...",
    "dt.backup.done": (dst) => `配置已备份: ${dst}`,
    "chk.dashtools": "仪表盘显示「安装 · 卸载 · 维护」快捷中心",
    "chk.dashconfirm": "仪表盘快捷卸载前需二次确认",
    "chk.dashhist": "仪表盘显示最近安装/卸载记录摘要",
    "label.dashhistrows": "安装记录摘要条数(1-10)",
  },
  en: {
    "brand.sub": "Updater", "boot.loading": "Loading HermesUpdater...",
    "nav.dash": "Dashboard", "nav.update": "Update", "nav.settings": "Settings", "nav.diag": "Diagnostics", "nav.log": "Logs",
    "page.dash.t": "Dashboard", "page.dash.s": "Hermes Agent update overview",
    "page.update.t": "Update", "page.update.s": "Check and apply Hermes updates",
    "page.settings.t": "Settings", "page.settings.s": "Proxy / Update / System / Maintenance",
    "page.diag.t": "Diagnostics", "page.diag.s": "Network reachability / Health check",
    "page.log.t": "Logs", "page.log.s": "App run log",
    "side.ready": "Ready", "side.checking": "Checking...",
    "dash.banner.t": "Hermes Agent Update Dashboard", "dash.banner.s": "Live overview · auto refresh every 30s",
    "dash.card.version": "Version", "dash.card.behind": "Pending commits", "dash.card.gateway": "Gateway status", "dash.card.method": "Network method",
    "btn.check": "Check updates", "btn.update": "Update now", "btn.refresh": "Refresh",
    "btn.installdir": "📁 Install dir", "btn.logdir": "📂 Log folder", "btn.copyinfo": "📋 Copy info",
    "dash.quick": "⚡ Quick actions", "btn.gw.restart": "Gateway restart", "btn.gw.stop": "Gateway stop",
    "btn.doctor": "Health check (doctor)", "btn.zhpatch": "Restore zh patches", "btn.kill": "Kill leftover processes",
    "dash.recent": "🕘 Recent updates", "btn.hist.manage": "Manage", "btn.hist.csv": "Export CSV",
    "upd.banner.s": "Live update output · rollback supported", "upd.filter.ph": "🔍 Filter output (errors/stages/commits)...",
    "btn.rollback": "Rollback", "btn.copyout": "📋 Copy output", "btn.export.out": "📄 Export txt", "upd.rb.title": "⏪ Rollback to a past commit",
    "btn.cancel.upd": "⛔ Cancel update", "cancel.confirm": "Cancel the running update?\n\nThe update process tree will be terminated (downloaded content is kept). This attempt will be recorded in history.",
    "cancel.req": "Termination requested...", "cancel.err": "Cancel failed: no update process to stop",
    "dash.heatmap": "🔥 Update heatmap (last 12 weeks)", "heat.legend": "Less",
    "btn.maintain": "🧹 Maintain (git gc + npm cache)", "maintain.running": "Maintenance already running", "maintain.done": "✅ Maintenance finished",
    "set.banner.s": "Proxy / Update / System / Maintenance", "set.net": "🌐 Network & Proxy",
    "label.switch": "Method", "opt.auto": "Auto detect (recommended)", "opt.direct": "Direct", "opt.system": "System proxy", "opt.manual": "Manual proxy", "opt.mirror": "GitHub mirror",
    "label.manual": "Manual proxy", "label.mirror": "Mirror URL", "label.install": "Install path", "label.branch": "Branch",
    "path.detect.title": "Auto-detect install path", "path.browse": "Browse for install folder",
    "path.checking": "⏳ Checking path...", "path.ok": "✔ Valid Hermes install", "path.partial": "⚠ Folder exists but is not a valid install", "path.nodir": "✘ Folder does not exist",
    "path.missing": "missing", "path.free": (g) => `${g} GB free`, "path.nowrite": "folder not writable",
    "path.detecting": "⏳ Scanning common locations (drives & PATH)...", "path.detected.n": (n) => `${n} candidate(s) found, click to apply:`,
    "path.none.found": "No valid Hermes install found. Try deep scan, or pick a folder via 📂",
    "path.applied.toast": (p) => `Install path applied: ${p}`, "path.autoswitch": "Install path auto-detected and switched",
    "dash.card.install": "Install health", "st.install.ok": (g) => `✔ Valid · ${g}GB`, "st.install.partial": "△ Incomplete", "st.install.bad": "✘ Invalid path",
    "chk.preflight": "Preflight before update (install path / git repo / free disk; auto-detect repair when path invalid)", "label.minfree": "Preflight min free disk (GB)",
    "pre.path": "install path does not exist", "pre.pathpartial": "install folder incomplete (missing hermes.cmd or hermes-agent)", "pre.git": "hermes-agent is not a git repo", "pre.disk": (f, m) => `${f}GB free, below the ${m}GB minimum`,
    "pre.detecting": "Install path invalid, auto-detecting...", "preflight.confirm": (n) => `Preflight found ${n}. Continue update anyway?`, "preflight.switch": (p) => `Valid install detected:\n${p}\n\nSwitch to it and continue updating?`,
    "preflight.fixed": "Switched to a valid install path ✔", "preflight.aborted": "Cancelled: fix the install path in Settings first",
    "label.known": "Known installs", "btn.known.save": "➕ Save current", "btn.known.apply": "Apply", "btn.known.del": "Remove",
    "known.empty": "No known installs yet. Detect or save one and it shows up here.", "known.saved": "Saved to known installs ✔", "known.removed": "Removed from known installs",
    "known.save.invalid": "Current path is invalid; only valid installs can be saved", "chk.pathwatch": "Watch install path at runtime (notify & auto-repair when it becomes invalid)", "btn.export.report": "🩺 Export diagnostics report",
    "set.behavior": "🔄 Update behavior",
    "chk.gateway": "Auto-start Gateway after update", "chk.ks": "Keep local changes (--keep-stash)", "chk.kill": "Kill Hermes processes before update",
    "chk.rzp": "Restore zh patches after update", "chk.notify": "Notify on new version", "chk.autoupd": "Scheduled update checks",
    "label.zsrc": "zh-patches source dir", "label.bkp": "Backups to keep", "label.interval": "Check interval (min)", "label.gittimeout": "git timeout (s)",
    "chk.confirm": "Confirm dialog before updating", "chk.cleanup": "Clean up extra Hermes processes after update", "chk.keepgw": "Keep Gateway process during cleanup",
    "chk.gwwatch": "Gateway down/up tray alerts (every 5 min)", "chk.notifydone": "Tray balloon when update finishes",
    "set.system": "🖥️ System & Appearance",
    "chk.tray": "Minimize to tray on close", "chk.boot": "Launch at startup", "chk.dark": "Dark theme",
    "chk.ontop": "Keep window on top",
    "chk.themesys": "Follow system theme (overrides above)", "chk.checkstart": "Check for updates on start",
    "chk.logauto": "Auto-refresh log page (every 5s)",
    "btn.test.conn": "🔌 Test connection", "test.conn.doing": "Testing github.com with current network method...",
    "test.conn.ok": (label, ms) => `✅ Connected · ${label} · ${ms}ms`, "test.conn.fail": (m) => `❌ Connection failed ${m}`,
    "label.quiet.start": "Quiet hours start (auto-check)", "label.quiet.end": "Quiet hours end",
    "chk.backupauto": "Auto-backup data package daily (Documents folder)", "label.backupkeep": "Backups to keep (1-30)",
    "diag.conn": "🔌 Recent connection tests (max 5)", "conn.none": "No connection tests yet (Settings → 🔌 Test connection)",
    "btn.open.backups": "📂 Open backup folder", "btn.restore.latest": "♻️ Restore latest backup",
    "restore.latest.confirm": "Restore settings & update history from the latest backup? Current settings will be overwritten.",
    "restore.latest.ok": (f) => `Restored from latest backup ✔ ${f}`, "restore.latest.none": "No auto backups yet (enable daily backup above first)",
    "restore.latest.fail": (m) => `Restore failed ${m}`,
    "btn.envinfo": "🖥️ Environment info", "env.running": "Collecting environment info...", "chk.traybadge": "Tray badge: show ⬆️N when updates available",
    "label.startpage": "Start page", "label.lang": "Language",
    "opt.page.dash": "📊 Dashboard", "opt.page.update": "🔄 Update", "opt.page.settings": "⚙️ Settings", "opt.page.diag": "🩺 Diagnostics", "opt.page.log": "📜 Logs",
    "label.zoom": "UI scale", "label.termfont": "Terminal font (px)", "label.refresh": "Status refresh (s)", "label.logdays": "Log retention (days)", "label.histmax": "History limit",
    "set.maint": "🧹 Maintenance", "btn.export.settings": "Export settings", "btn.import.settings": "Import settings",
    "btn.export.data": "📦 Backup data", "btn.import.data": "📥 Restore data", "btn.save": "💾 Save settings",
    "chk.fallback": "Auto-switch to mirror when direct fails", "chk.diskcheck": "Check free disk space before update", "chk.notifcenter": "Enable in-app notification center",
    "chk.desktopnot": "Desktop system notifications (update done / failed / new version, works when minimized)",
    "btn.snooze1": "🔕 Snooze 1h", "btn.snooze3": "🔕 Snooze 3h", "btn.snooze6": "🔕 Snooze 6h", "btn.snooze.off": "Cancel snooze",
    "snooze.on": (ts) => `🔕 New-version alerts muted until ${ts}`, "snooze.done": (h) => `🔕 Muted for ${h}h (manual update unaffected)`, "snooze.off": "✅ New-version alerts resumed",
    "btn.speedtest": "🚀 Speed test",
    "diag.speed": "🚀 Network method speed test", "diag.speed.hint": "Click Apply to switch to that method",
    "spd.testing": "⏳ Testing in parallel (up to 8s)…", "spd.apply": "Apply", "spd.applied": (l) => `✅ Switched to: ${l}`, "spd.fastest": "⚡Fastest", "spd.now": "📍Current",
    "btn.cd.go": "🚀 Update now", "btn.cd.skip": "⏭️ Skip once",
    "cd.text": (l, b) => `⏳ Auto-update in ${l}s (${b} new commits, you can skip)`, "cd.skipped": "⏭️ Skipped this auto-update", "cd.going": "🚀 Confirmed, updating",
    "label.countdown": "Auto-update countdown (s, 0=immediate, ≤600)",
    "btn.healthreport": "📑 Export health report", "rpt.done": (p) => `📑 Health report exported: ${p}`, "rpt.fail": "Health report export failed",
    "install.score": (s, g) => `${s}/100 ${g}`, "install.grade.excellent": "Excellent", "install.grade.ok": "Good", "install.grade.warn": "Attention", "install.grade.bad": "Broken",
    "install.chk.path": "Path exists", "install.chk.cmd": "hermes command", "install.chk.agent": "Agent dir", "install.chk.git": "git repo", "install.chk.disk": "Disk free",
    "label.netwatch": "Net-watch interval (min, 0=off)",
    "nav.install": "Install Hermes", "page.install.t": "Install Hermes", "page.install.s": "One-click install / repair / uninstall",
    "ins.banner.s": "Install / repair-reinstall / uninstall / preflight",
    "ins.env.title": "🧭 Environment preflight", "ins.env.idle": "Not checked yet — click Preflight to get node / npm / git / disk / target dir status",
    "ins.env.node": "Node.js", "ins.env.npm": "npm", "ins.env.git": "Git", "ins.env.disk": "Disk free", "ins.env.dir": "Target dir",
    "ins.env.dir.absent": "Absent (fresh install)", "ins.env.dir.empty": "Exists and empty", "ins.env.dir.repo": "Git repo (will fetch-reuse)", "ins.env.dir.occupied": "Occupied, not a repo (pick another dir or clean up)",
    "ins.env.missing": "Not found ⚠️", "ins.env.ok": "✔",
    "ins.cfg.title": "🛠️ Install settings", "ins.cfg.repo": "Source repo (Git URL)", "ins.cfg.dir": "Target directory", "ins.cfg.ver": "Version (branch / tag)",
    "ins.cfg.fetchvers": "🌐 Fetch versions", "ins.cfg.preflight": "🧭 Preflight", "ins.cfg.start": "🚀 Install", "ins.cfg.cancel": "⛔ Cancel install",
    "ins.cfg.fix": "🔧 Repair / reinstall", "ins.cfg.uninstall": "🗑️ Uninstall…", "btn.browse": "📂 Browse",
    "ins.cfg.hint": "Settings are saved together when you click Install; if the requested branch does not exist the default branch is used. Existing git repos are fetch-reused (= repair/reinstall).",
    "ins.out.idle": "Waiting for install task…",
    "ins.hist.title": "🕘 Install history", "ins.hist.empty": "No install records yet",
    "ins.start.confirm": (v, d) => `Install Hermes (${v})?\n\nTarget: ${d}\n\nExisting git repos will be fetch-reused, otherwise a fresh clone.`,
    "ins.starting": "⏳ Install task started…", "ins.done.ok": (dur, note) => `✅ Install finished (${dur})${note ? " · " + note : ""}`, "ins.done.fail": (rc, note) => `❌ Install failed (rc=${rc})${note ? " · " + note : ""}`,
    "ins.done.cancel": "⛔ Install cancelled",
    "ins.vers.ok": (b, t2) => `Got ${b} branches / ${t2} tags (added to version input candidates)`, "ins.vers.fail": "Failed to fetch version list (check repo URL and network)",
    "ins.preflight.ran": "Preflight finished", "ins.uninst.ask": "Fill the target directory to uninstall first",
    "ins.hist.line": (h) => `${h.time}  ${h.result === "ok" ? "✅" : h.result === "cancel" ? "⛔" : h.result === "uninstall" ? "🗑️" : "❌"} ${h.ver} → ${h.dir} (${h.dur})${h.note ? " · " + h.note : ""}`,
    "ins.hist.uninstalled": "🗑️ Moved to recycle bin",
    "label.ins-timeout": "Install overall timeout (min)", "label.ins-histkeep": "Install history entries kept",
    "label.ins-npmmirror": "Install npm registry", "opt.npm.default": "Default (system)", "opt.npm.npmmirror": "npmmirror (China)", "opt.npm.custom": "Custom",
    "label.ins-npmcustom": "Custom npm registry",
    "chk.ins.gitaccel": "Clone via mirror acceleration", "chk.ins.autovalidate": "Auto-validate after install", "chk.ins.autoapply": "Auto-apply validated path as managed path", "chk.ins.shortcut": "Create desktop shortcut after install",
    "btn.cleanup": "🧽 Space cleanup", "btn.netheal": "🧙 One-click network heal",
    "cln.title": "🧽 Cleanable items", "cln.run": "🧹 Clean selected",
    "cln.npmcache": "npm download cache", "cln.oldbackups": "Excess old backups", "cln.applog": "App log (truncate to 512 KB)",
    "cln.scanning": "⏳ Scanning cleanable space…", "cln.none": "Nothing to clean, all shiny ✨", "cln.total": (n) => `About ${n} MB can be freed`,
    "cln.cleaning": "🧹 Cleaning…", "cln.done": (mb) => `✅ Cleanup finished, ~${mb} MB freed`, "cln.fail": "Cleanup failed",
    "heal.start": "🧙 Network heal: speed-testing all methods…", "heal.apply": (l) => `🧙 Healed: switched to best method (${l})`, "heal.none": "🧙 Heal failed: no method reachable, check network/proxy",
    "btn.backup.list": "🕘 Backup list", "bkp.list.title": "Historical backups (click Restore to roll back)",
    "bkp.restore": "Restore", "bkp.empty": "Backup dir is empty", "bkp.restored": (f) => `✅ Restored from backup: ${f}`, "bkp.restore.confirm": (f) => `Overwrite current data with config/history from ${f}?`,
    "label.sched.days": "Weekly schedule (days, 0=Sun)", "sched.plan": (d, tm) => `Plan: ${d} ${tm}`,
    "log.lv.all": "All levels", "log.lv.info": "Info only", "log.lv.warn": "Warnings", "log.lv.err": "Errors",
    "btn.dirsize": "💾 Disk usage", "size.scanning": "⏳ Scanning install dir (up to 25s)…",
    "size.title": "Install directory usage", "size.total": (s) => `Total: ${s}`, "size.files": (n) => `${n} files`, "size.truncated": "⚠️ Too large, scan truncated (results are lower bounds)",
    "size.fail": (m) => `Disk usage failed: ${m}`,
    "chk.pathauto": "Auto-detect install path on startup (when current path is invalid)", "chk.pathapply": "Auto-switch to the detected valid install path (off = notify only)", "chk.pathdeep": "Deep-scan all drives when auto-detecting (thorough but slower)",
    "chk.autoretry": "Auto-retry after update failure (re-pick network method)", "label.maxretry": "Max auto retries (0-5)",
    "chk.autoexec": "Auto-run the update when a new version is found",
    "label.accent": "Accent color",
    "opt.accent.blue": "🔵 Blue (default)", "opt.accent.green": "🟢 Green", "opt.accent.purple": "🟣 Purple", "opt.accent.orange": "🟠 Orange", "opt.accent.teal": "🩵 Teal",
    "accent.applied": (n) => `Accent changed: ${n}`, "accent.blue": "Blue", "accent.green": "Green", "accent.purple": "Purple", "accent.orange": "Orange", "accent.teal": "Teal",
    "set.profiles": "💼 Profiles", "set.profiles.tip": "Save multiple \"install path + branch + network\" combos and switch instantly.",
    "label.prof.name": "Profile name", "label.prof.list": "Saved profiles",
    "btn.prof.save": "💾 Save current as profile", "btn.prof.apply": "📥 Apply profile", "btn.prof.delete": "🗑 Delete profile",
    "prof.askname": "Enter a profile name in the box above first", "prof.saved": (n) => `Profile "${n}" saved ✔`, "prof.applied": (n) => `Profile "${n}" applied, settings reloaded ✔`,
    "prof.deleted": (n) => `Profile "${n}" deleted`, "prof.none": "Select a profile first",
    "btn.apply.proxy": "✅ Apply to settings", "proxy.applied": (m) => `Network method applied: ${m}`, "proxy.directonly": "Only direct is reachable, nothing to change", "proxy.noneok": "No route reachable, nothing to apply",
    "hist.d.time": "Time", "hist.d.result": "Result", "hist.d.method": "Method", "hist.d.dur": "Duration",
    "hist.d.old": "Old", "hist.d.new": "New", "hist.d.note": "Note", "hist.d.tap": "Click an entry for details",
    "diag.banner.s": "Network reachability / Health check", "btn.doctor2": "Run doctor", "btn.netprobe": "🌐 Network probe",
    "btn.copydiag": "📋 Copy", "btn.export.diag": "📄 Export", "diag.probe": "🌐 Reachability probe", "diag.weekly": "📈 7-day update report",
    "log.banner.s": "App run log", "log.filter.ph": "🔍 Filter keywords...",
    "btn.log.refresh": "Refresh", "btn.log.copy": "📋 Copy", "btn.log.open": "Open log file", "btn.log.clear": "Clear log",
    "hist.dlg": "🕘 Update history", "hist.filter.ph": "🔍 Filter (time/result/note)...", "btn.hist.clearall": "Clear all", "btn.close": "Close",
    "top.notif": "Notifications", "top.about": "About",
    "notif.title": "🔔 Notifications", "notif.empty": "No notifications", "btn.notif.clear": "Clear all",
    "about.title": "ℹ️ About HermesUpdater", "about.version": "Version", "about.data": "Data folder", "btn.about.open": "📂 Open data folder",
    "btn.releases": "🐙 GitHub Releases", "open.fail": (m) => `Open failed: ${m}`,
    // 动态文本
    "st.refreshing": "Refreshing status...", "st.refreshed": "Status refreshed", "st.failed": "Failed to get status", "st.found": (n) => `${n} update(s) available`,
    "st.checkfail": "Detection failed", "st.uptodate": "Up to date", "st.behind": (b, a, r) => `${b} behind / ${a} ahead${r ? " · remote " + r : ""}`,
    "st.preview": "Preview mode", "st.readyNoCheck": "Ready (no auto check)",
    "stats.month": (ok, fail) => `This month:  ✅ ${ok} ok   ❌ ${fail} failed`,
    "trend.legend": "Last 20 (right=new)", "hist.empty": "No update history yet", "hist.nomatch": "No matching records",
    "res.ok": "✅ OK", "res.partial": "⚠️ Partial", "res.fail": "❌ Failed", "hist.deleted": "Record deleted",
    "hist.confirmclear": "Clear ALL update history? (Cannot be undone; export CSV first if needed)", "hist.cleared": "History cleared",
    "weekly.empty": "No updates in the last 7 days", "nodata": "No data",
    "upd.busy": "An update is already in progress", "upd.confirm": (b) => `Current status: ${b}\nUpdate now?\n\nA backup is made and leftover processes are killed first.`,
    "upd.cancelled": "Update cancelled", "upd.preparing": "Preparing...", "upd.started": "Updating...", "upd.done": "Done", "upd.fail": "Failed",
    "st.upd.ok": "Update succeeded", "st.upd.fail": "Update failed",
    "theme.dark": "Dark theme on", "theme.light": "Light theme on",
    "top.trans": "Translation panel",
    "trans.title": "🌐 Live Translation", "trans.all": "Translate all output", "trans.clear": "Clear", "trans.send": "Go",
    "trans.input.ph": "Type text to translate...", "trans.hint": "When an update runs, output lines appear here translated in real time",
    "trans.empty": "Enter text to translate first", "trans.done": (n) => `Translated ${n} lines ✔`, "trans.none": "(no translation result)",
    "trans.opened": "Translation panel opened 🌐", "trans.closed": "Translation panel closed",
    "via.google": "Google", "via.mymemory": "MyMemory", "via.offline": "Offline dict", "via.none": "",
    "chk.lintime": "Show per-line timestamps in update output ([HH:MM:SS] prefix)", "chk.transauto": "Auto-translate output lines in real time (while panel is open)",
    "chk.injectmirror": "Built-in auto-repair: inject Electron/npm mirror env (packaging no longer hits GitHub directly, higher one-shot success rate)",
    "chk.autorepair": "Overlay proxy env on retry (when previous failure was at packaging/dependency download)",
    "label.trantarget": "Target language", "label.tranprovider": "Translation engine",
    "opt.tgt.zh": "简体中文", "opt.tgt.en": "English",
    "opt.prov.auto": "Auto (custom order below; default multi-engine fallback)", "opt.prov.google": "Google Translate",
    "opt.prov.gcloud": "Google alt endpoint (Chrome dict)", "opt.prov.deepl": "DeepL (keyless)",
    "opt.prov.lingva": "Lingva (open-source Google frontend)", "opt.prov.mymemory": "MyMemory (keyless)",
    "opt.prov.youdao": "Youdao (keyless)", "opt.prov.offline": "Offline dictionary only (no network)",
    "via.google": "Google", "via.gcloud": "Google alt", "via.deepl": "DeepL", "via.lingva": "Lingva",
    "via.mymemory": "MyMemory", "via.youdao": "Youdao", "via.offline": "Offline dict", "via.none": "",
    "label.tranorder": "Engine order (auto mode, comma-separated, empty=default)", "label.trandict": "Custom dictionary (one per line: english=中文)",
    "ph.tranorder": "google,deepl,mymemory,youdao,lingva,gcloud",
    "set.trans": "🌐 Translation / Output",
    "set.savednone": "All changes saved ✔", "set.dirty": (n) => `⚠ ${n} unsaved change(s)`,
    "btn.save2": "💾 Save settings", "btn.revert": "↩ Revert changes", "btn.reset": "Reset defaults",
    "set.reverted": "Unsaved changes reverted ✔",
    "set.reset.confirm": "Reset ALL settings to defaults?\nCurrent configuration will be overwritten (update history is kept).",
    "set.reset.done": "Settings reset to defaults ✔",
    "set.filter.ph": "🔍 Search settings...", "set.nomatch": "No matching settings",
    "set.autosaved": "Auto-saved ✔", "set.unsaved.confirm": "You have unsaved settings. Leave anyway?",
    "chk.autosave": "Auto-save on change (no need to click Save)", "chk.unsavedguard": "Warn about unsaved changes when leaving settings",
    "set.saved": "Settings saved ✔", "set.savefail": "Save failed", "set.savedPreview": "Settings saved (preview)",
    "label.trmscheme": "Terminal color scheme", "label.trmcolors": "Terminal colors (bg/fg)",
    "opt.trm.theme": "Follow app theme", "opt.trm.black": "Classic black (dark in both themes)", "opt.trm.custom": "Custom colors",
    "lang.saved": "语言已切换 ✔ Language switched",
    "open.install": "Opening install folder...", "open.logdir": "Opening log folder...", "open.fail": (m) => `Open failed: ${m}`,
    "info.copied": "Version info copied ✔",
    "gw.sent": (n) => `Gateway ${n} command sent...`, "gw.ok": (n) => `Gateway ${n} done ✔`, "gw.fail": (n) => `Gateway ${n} failed`,
    "gw.restart": "restart", "gw.stop": "stop",
    "doctor.running": "Running doctor, results will show on Diagnostics page...", "doctor.done": "doctor finished ✔",
    "probe.running": "Probing network...", "probe.done": (ok, n) => `Probe done: ${ok}/${n} routes reachable`,
    "probe.reachable": "reachable", "probe.unreachable": "unreachable",
    "probe.direct": "Direct GitHub", "probe.system": "System proxy", "probe.manual": "Manual proxy", "probe.mirror": "Mirror",
    "diag.copied": "Diagnostics copied ✔", "diag.empty": "Diagnostics empty, run doctor first",
    "btn.repo": "🌿 Git workspace check", "btn.back2branch": "⬅️ Back to branch", "btn.repair": "🔧 Repair deps",
    "repo.running": "Checking Git workspace...", "repo.fail": "Git workspace check failed (invalid dir?)",
    "repo.branch": "Branch", "repo.detached": "⚠️ Detached HEAD (after rollback — click \"Back to branch\" to fix)", "repo.ondetached": "On working branch",
    "repo.dirty": (n) => n ? `${n} local file change(s)` : "Workspace clean (no local changes)",
    "repo.stash": (n) => n ? `${n} stash entrie(s)` : "No stash",
    "b2b.running": "Switching back to branch...", "b2b.done": (b) => `Back on branch ${b} ✔ status refreshed`, "b2b.fail": (o) => `Checkout failed: ${(o || "").slice(0, 80)}`,
    "repair.running": "Repairing deps (npm ci), see output below...", "repair.done": "Deps repaired ✔ restart Gateway recommended", "repair.fail": (rc) => `Dep repair failed (rc=${rc}), retry or run a full update`,
    "exported": (p) => `Exported: ${p}`, "export.fail": (m) => `Export failed: ${m}`, "export.cancelled": "Export cancelled",
    "kill.running": "Killing leftover processes...", "kill.done": (n) => `Killed ${n} leftover process(es)`, "kill.none": "No leftover processes found",
    "zh.ok": (m) => `zh patches restored ✔ ${m}`, "zh.fail": (m) => `Restore failed: ${m}`,
    "out.empty": "Update output is empty", "out.copied": "Output copied ✔",
    "rb.fetching": "Fetching recent commits...", "rb.go": "Rollback here",
    "rb.confirm": (h, d, m) => `Rollback to this version?\n\nCommit: ${h}\nDate: ${d}\nMessage: ${m}\n\nStatus refreshes after rollback; roll back again if anything breaks.`,
    "rb.running": "Rolling back...", "rb.done": "Rollback done ✔ status refreshed", "rb.fail": (o) => `Rollback failed: ${(o || "").slice(0, 80)}`,
    "log.refreshed": "Log refreshed", "log.copied": "Log copied ✔", "log.confirmclear": "Clear the log file?", "log.cleared": "Log cleared",
    "set.imported": "Settings imported ✔", "set.import.fail": (m) => `Import failed: ${m}`, "set.import.cancelled": "Import cancelled",
    "data.confirm": "Importing will OVERWRITE current settings and history. Continue?", "data.restored": "Data pack restored ✔",
    "nextcheck": (m, s) => `⏱ Next auto check in ${m}:${s}`,
    "err.script": (m) => `Script error: ${m}`, "err.async": (m) => `Async error: ${m}`,
    "app.started": "HermesUpdater started",
    "note.strip": /^(原因:|reason:)/,
    "btn.whatsnew": "🆕 What's New", "wn.title": "🆕 What's New (HEAD → remote)",
    "wn.refresh": "🔄 Refresh", "wn.export": "📄 Export txt",
    "wn.loading": "Fetching incoming commits...", "wn.empty": "No incoming commits, already up to date ✔",
    "wn.total": (n, br) => `${n} commit(s) behind origin/${br} (max shown is configurable in Settings)`,
    "wn.exported": "What's New exported ✔", "wn.fail": (m) => `Failed to fetch: ${m}`,
    "btn.proclist": "⚙️ Processes", "proc.title": "⚙️ Hermes Process Manager",
    "proc.refresh": "🔄 Refresh", "proc.loading": "Enumerating processes...",
    "proc.empty": "No Hermes-related process is running", "proc.kill": "Kill",
    "proc.confirm": (pid) => `Kill process PID ${pid}?`,
    "proc.killed": (pid) => `Process ${pid} killed ✔`, "proc.killedfail": (pid) => `Failed to kill process ${pid}`,
    "proc.gateway": "Gateway", "proc.hint": "Only processes whose command line points to the current Hermes install are listed; a confirmation is required before killing.",
    "btn.upstats": "📊 Stats", "stats.title": "📊 Update Statistics (from history)",
    "stats.total": "Total updates", "stats.rate": "Success rate", "stats.avgdur": "Avg duration",
    "stats.thismonth": "This month (ok/fail/cancel)", "stats.monthly": "Last 6 months (ok/fail/cancel)",
    "stats.bylabel": "By network method", "stats.byreason": "Top 5 failure reasons",
    "stats.nodata": "No update history yet — run an update to see statistics",
    "stats.ok": "OK", "stats.fail": "Fail", "stats.cancel": "Cancel", "stats.count": (n) => `${n}`,
    "chk.postsmoke": "🩺 Auto smoke-test after successful update (run hermes --version to confirm)",
    "chk.watchdog": "🐕 Gateway watchdog: auto-restart when offline (complements offline alerts)",
    "label.wnmax": "What's New max commits (10-100)", "label.watchdogmin": "Watchdog sweep interval (min, ≥2)",
    "label.chgmax": "Changelog fetch limit (50-1000)",
    "chk.upd.lock": "🎯 Force checkout to the update target before every update (set branch/tag on the update page)",
    "chk.chg.group": "📜 Group changelog by tag",
    "upd.target.title": "🎯 Update target", "upd.target.pick": "Target branch / tag",
    "upd.target.refresh": "🔄 Fetch list", "upd.target.apply": "📍 Switch & save target", "upd.target.clear": "↩️ Reset to default branch",
    "upd.target.hint": "Switching immediately checks out the remote branch/tag and saves it as the target. With \"force lock\" enabled in settings, every update checks out the target first. Tag targets are re-pinned after each successful update.",
    "upd.target.cur": "Current: ", "upd.target.none": "Not set (follow default branch)", "upd.target.fetching": "Fetching…",
    "upd.target.fail": (m) => `Switch failed ${m || ""}`,
    "upd.target.group.branch": "— Branches —", "upd.target.group.tag": "— Tags —", "upd.target.applied": "Target switched & saved ✔", "upd.target.cleared": "Reset to default branch ✔",
    "upd.cl.title": "📜 Changelog Center", "upd.cl.fetch": "📥 Generate changelog", "upd.cl.export": "📄 Export Markdown",
    "upd.cl.search": "🔍 Search commits / author / hash",
    "upd.cl.idle": "Click \"Generate changelog\" to extract commit history from the local repo", "upd.cl.loading": "Extracting commit history…",
    "upd.cl.notgit": "Current install dir is not a git repository", "upd.cl.empty": "No matching commits",
    "upd.cl.ungrouped": "Unreleased", "upd.cl.commits": "commits", "upd.cl.exported": "Exported",
    "set.hooks": "🪝 Update Hooks",
    "set.hooks.tip": "Run custom commands before / after / on failure of updates (notify, cleanup, backup...). Pre-hooks may abort the update on failure.",
    "set.hooks.hint": "Timeout 5-600s; a failing pre-hook with \"abort\" checked cancels the whole update.",
    "btn.hook.add": "➕ Add hook", "btn.hook.save": "💾 Save hooks",
    "hook.ph.pre": "Pre", "hook.ph.post": "Post", "hook.ph.fail": "On fail",
    "hook.f.name": "Name", "hook.f.cmd": "Command", "hook.f.to": "Timeout s", "hook.f.abort": "Abort on fail",
    "hook.f.enabled": "Enabled", "hook.f.del": "✖", "hook.none.loaded": "No hooks configured yet",
    "set.webhook": "🌐 Webhook Push",
    "set.webhook.tip": "POST a JSON to a custom URL when update/install/uninstall finishes (great for WeCom/DingTalk/Slack bots).",
    "label.webhook.url": "Webhook URL", "label.webhook.secret": "Secret header (X-Hermes-Secret, optional)",
    "chk.wh.ok": "Push update success", "chk.wh.fail": "Push update failure", "chk.wh.ins": "Push install/uninstall done",
    "btn.wh.test": "📡 Send test", "wh.testing": "Sending…", "wh.ok": "Test OK (HTTP", "wh.fail": "Test failed:", "wh.saved": "Webhook settings saved (effective with settings save)",
    "ins.mirror.test": "🚀 Mirror Speed Test", "ins.mirror.title": "🚀 Install Mirror Speed Test",
    "ins.mirror.loading": "Probing direct access and candidate mirrors (git protocol, ~8s)...",
    "ins.mirror.ok": "OK", "ins.mirror.fail": "FAIL", "ins.mirror.direct": "Direct GitHub",
    "ins.mirror.okgit": "OK (git)", "ins.mirror.okhttp": "OK (HTTP)",
    "ins.mirror.cur": (m) => `Install source repo: ${m}`,
    "ins.mirror.eff": (m) => `Effective prefix: ${m || "direct"}`,
    "ins.mirror.apply": "Apply", "ins.mirror.applied": (m) => `Install mirror prefix set to: ${m || "direct"} ✔`,
    "ins.mirror.fastest": "fastest", "ins.mirror.hint": "Sorted by git-protocol reachability and latency; click \"Apply\" to set it as the install mirror prefix (clone failures retry with another mirror automatically).",
    "label.ins.mirror": "Install mirror prefix (empty = use main mirror)",
    "chk.ins.mirrorfb": "Retry clone with another mirror automatically when it fails",
    "unins.title": "🗑️ Uninstall Hermes", "unins.mode": "Uninstall mode",
    "unins.m.trash": "🗑️ Move to Recycle Bin (recommended, recoverable)", "unins.m.modules": "🧹 Delete deps/build only (keep source)",
    "unins.m.perm": "💥 Delete permanently (unrecoverable)", "unins.m.unreg": "📎 Unregister only (keep files)",
    "unins.opt.backup": "Back up config before uninstall (config.yaml / zh-patches → Documents backup area)",
    "unins.opt.stop": "Stop Hermes processes occupying the directory before uninstall",
    "unins.confirm.label": "Type the folder name to confirm permanent deletion",
    "unins.run": "🗑️ Run uninstall", "unins.checking": "Reading uninstall preflight...",
    "unins.missing": "Folder does not exist", "unins.yes": "Yes", "unins.no": "No",
    "unins.info.size": "Size", "unins.info.repo": "git repo", "unins.info.config": "config.yaml",
    "unins.info.agent": "hermes.cmd", "unins.info.procs": "Processes using it",
    "unins.permanent.confirm": (d) => `This will PERMANENTLY delete and cannot be undone!\n\n${d}\n\nContinue?`,
    "unins.strict.hint": (n) => `Type the folder name ${n} to unlock permanent deletion`,
    "unins.done": (n) => `Uninstalled: ${n}`, "unins.fail": (m) => `Uninstall failed: ${m}`,
    "chk.unins.backup": "Back up config before uninstall (can be toggled in the panel)",
    "chk.unins.stop": "Stop Hermes processes before uninstall",
    "chk.unins.unreg": "Remove the path from Known Installs after uninstall (trash/permanent)",
    "chk.unins.strict": "Require typing the folder name before permanent deletion",
    "label.unins.mode": "Default uninstall mode",
    "dash.qc.title": "⚡ Quick Actions", "dash.qc.upd": "🔄 Update & Gateway", "dash.card.score": "Health score",
    "dash.tools.title": "🛠️ Install · Uninstall · Maintain",
    "dt.refresh": "🔄 Refresh", "dt.target": "Target", "dt.preflight": "🧭 Check", "dt.uninsmode": "Uninstall mode",
    "dt.backup": "📦 Back up config", "dt.unregister": "📎 Unregister", "dt.unins": "🗑️ Quick uninstall",
    "dt.repair": "🚀 Repair reinstall", "dt.goinstall": "📦 Open install page", "dt.hist": "🕘 Recent installs / uninstalls",
    "dt.current": "managed", "dt.valid": "valid install", "dt.invalid": "invalid / not installed",
    "dt.status": "Status", "dt.disk": "Disk free", "dt.git": "git repo", "dt.cmd": "hermes.cmd", "dt.agent": "agent source",
    "dt.none": "No records", "dt.needtarget": "Select a target first",
    "dt.confirm.unins": (d, m) => `Run "${m}" on this folder?\n\n${d}`,
    "dt.confirm.repair": (d) => `Repair-reinstall this folder (fetch existing repo + npm install)?\n\n${d}`,
    "dt.repair.started": "Repair reinstall started — see the Install page for progress...",
    "dt.backup.done": (dst) => `Config backed up: ${dst}`,
    "chk.dashtools": "Show the Install · Uninstall · Maintain quick center on the dashboard",
    "chk.dashconfirm": "Require confirmation before dashboard quick uninstall",
    "chk.dashhist": "Show recent install/uninstall summary on the dashboard",
    "label.dashhistrows": "Install summary rows (1-10)",
  },
};
function tr(key, ...args) {
  const v = (STR[LANG] && STR[LANG][key] !== undefined) ? STR[LANG][key] : STR.zh[key];
  if (v === undefined) return key;
  return typeof v === "function" ? v(...args) : v;
}
const t = tr;
// 只替换元素"最后一个非空直接文本节点", 保住按钮里的 emoji <span>
function applyText(el, key) {
  const v = tr(key);
  if (v === undefined) return;
  let tn = null;
  for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) tn = n;
  if (tn) tn.textContent = v; else el.textContent = v;
}
function applyI18n() {
  document.documentElement.lang = LANG === "en" ? "en" : "zh-CN";
  $$("[data-i18n]").forEach((el) => applyText(el, el.dataset.i18n));
  $$("[data-i18n-ph]").forEach((el) => { el.placeholder = tr(el.dataset.i18nPh); });
  $$("[data-i18n-title]").forEach((el) => { el.title = tr(el.dataset.i18nTitle); });
  if (CURRENT_PAGE) showPage(CURRENT_PAGE); // 刷新页标题/副标题
}

// ---------------- Toast: 每次点击都有可见反馈 ----------------
function toast(msg, type = "info", dur = 2600) {
  const box = $("#toast-box");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => { el.classList.add("fade"); setTimeout(() => el.remove(), 350); }, dur);
}

// ---------------- 页面切换 ----------------
let CURRENT_PAGE = "dash";
function showPage(key) {
  // 未保存守卫: 离开设置页且有未保存修改时提醒 (可关)
  if (CURRENT_PAGE === "settings" && key !== "settings" && settingsDirty()) {
    if (BOOT_SETTINGS?.unsaved_guard !== false && !confirm(t("set.unsaved.confirm"))) return;
  }
  CURRENT_PAGE = key;
  $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.page === key));
  $$(".page").forEach((p) => p.classList.toggle("active", p.id === `page-${key}`));
  $("#page-title").textContent = t(`page.${key}.t`);
  $("#page-sub").textContent = t(`page.${key}.s`);
  if (key === "log") refreshLogs();
  if (key === "diag") renderConnTests();
  if (key === "install") refreshInsHist();
  if (key === "dash") loadDashTools();
  if (key === "update") { refreshTargetCurrent(); }
  if (key === "settings") loadHooks();
}
// 诊断页: 最近连通性测试历史 (label 为用户可输入内容, 插入前转义)
async function renderConnTests() {
  const el = $("#conn-list");
  if (!el) return;
  const list = rpc ? await rpc.getConnTests() : [];
  if (!list.length) { el.innerHTML = `<div class="tr-empty">${t("conn.none")}</div>`; return; }
  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  el.innerHTML = list.map((c) => {
    const res = c.ok ? "✅" : "❌";
    return `<div class="path-cand"><span>${res}</span><span class="mono" style="font-size:11px;color:var(--muted)">${esc(c.time)}</span><span style="font-size:12px">${esc(c.label)}</span><span class="meta">${c.ms}ms${c.code ? " · HTTP " + c.code : ""}</span></div>`;
  }).join("");
}
$$(".nav-item").forEach((b) => b.addEventListener("click", () => { showPage(b.dataset.page); }));

// ---------------- 状态 ----------------
function setStatus(text, cls) { $("#status-text").textContent = text; $("#status-dot").className = `dot ${cls || ""}`; }

// 按钮加载态: 禁用 + ··· 脉冲动画
function busy(btn, on) { if (btn) { btn.disabled = !!on; btn.classList.toggle("loading", !!on); } }

// 快速首屏填充: 不等网络探测/git fetch, 1~2 秒先显示版本/Gateway/网络方式 (可更新提交仍需全量检查)
async function refreshQuick() {
  if (!rpc) { document.body.classList.remove("booting"); return; }
  try {
    const q = await rpc.getQuickStatus();
    if (q.version) $("#d-version").textContent = q.version;
    if (q.gateway) $("#d-gateway").textContent = q.gateway;
    $("#d-method").textContent = q.method || "—";
    $("#d-behind").textContent = t("side.checking");
  } catch {} finally { document.body.classList.remove("booting"); }
}

async function refreshStatus(manual = false) {
  if (manual) toast(t("st.refreshing"), "info", 1500);
  document.body.classList.add("checking");
  setStatus(t("side.checking"), "warn");
  if (!rpc) { document.body.classList.remove("checking"); mockStatus(); return; }
  try {
    const st = await rpc.getStatus();
    $("#d-version").textContent = st.version || "—";
    if (st.behind < 0) { $("#d-behind").textContent = t("st.checkfail"); }
    else if (st.behind === 0 && st.ahead === 0) { $("#d-behind").textContent = t("st.uptodate"); }
    else { $("#d-behind").textContent = t("st.behind", st.behind, st.ahead, st.rhead); }
    $("#d-gateway").textContent = st.gateway || "—";
    $("#d-method").textContent = st.method || "—";
    updateDashPills(st);
    updateSnoozeUI(st.behind);
    checkInstallCard();
    setStatus(st.behind > 0 ? t("st.found", st.behind) : t("st.refreshed"), st.behind > 0 ? "warn" : "ok");
    if (manual) toast(t("st.refreshed"), "ok");
  } catch (e) {
    setStatus(t("st.failed"), "err");
    if (manual) toast(t("st.failed") + ": " + e, "err");
  } finally {
    document.body.classList.remove("checking");
  }
}
function mockStatus() {
  $("#d-version").textContent = "v0.21.5+4533.g39faafb (preview)";
  $("#d-behind").textContent = t("st.uptodate");
  $("#d-gateway").textContent = "gateway running (pid 3440)";
  $("#d-method").textContent = t("opt.direct");
  updateDashPills({ version: "v0.21.5 (preview)", behind: 0, ahead: 0, gateway: "gateway running", method: t("opt.direct") });
  setStatus(t("st.preview"), "warn");
}
// v2.22.0 仪表盘胶囊状态条
function updateDashPills(st) {
  const set = (id, txt, cls) => { const el = $(id); if (!el) return; el.textContent = txt; el.className = "pill" + (cls ? " " + cls : ""); };
  set("#pill-ver", `🏷️ ${st.version || "—"}`, "");
  set("#pill-behind", st.behind > 0 ? `⬆️ ${t("st.behind", st.behind, st.ahead, st.rhead)}` : st.behind === 0 ? `✅ ${t("st.uptodate")}` : `⚠️ ${t("st.checkfail")}`, st.behind > 0 ? "pill-warn" : st.behind === 0 ? "pill-ok" : "");
  set("#pill-gw", `🔌 ${String(st.gateway || "—").slice(0, 42)}`, /running/i.test(st.gateway || "") ? "pill-ok" : "pill-warn");
  set("#pill-net", `🌐 ${st.method || "—"}`, "");
}

// ---------------- 更新历史 ----------------
async function refreshHistory() {
  let hist = [];
  if (rpc) hist = await rpc.getHistory();
  else hist = [{ time: "09-29 11:46", rc: 1, label: "系统代理", dur: "308s", result: "fail", old: "g39fa1", new: "g39faaf", note: "原因:Node编译" }];
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0"); // 只统计本月; 兼容 "MM-DD HH:MM" 与 "YYYY-MM-DD HH:MM:SS"
  const monthOf = (s) => { const m = String(s || "").match(/^(?:\d{4}-)?(\d{2})[-/]/); return m ? m[1] : ""; };
  let ok = 0, fail = 0;
  for (const h of hist) {
    if (monthOf(h.time) !== mm) continue;
    if (h.result === "ok") ok++;
    if (h.result === "fail") fail++;
  }
  $("#d-stats").textContent = t("stats.month", ok, fail);
  // 近 20 次更新趋势迷你图 (新→旧 从右到左)
  const trend = $("#d-trend");
  trend.innerHTML = "";
  const recent = hist.slice(0, 20).reverse();
  if (recent.length) {
    for (const h of recent) {
      const b = document.createElement("div");
      const cls = h.result === "ok" ? "ok" : h.result === "partial" ? "partial" : "fail";
      b.className = `bar ${cls}`;
      b.title = `${h.time}  ${t("res." + (h.result === "ok" ? "ok" : h.result === "partial" ? "partial" : "fail"))}${h.note ? " · " + h.note : ""}`;
      trend.appendChild(b);
    }
    const lg = document.createElement("span");
    lg.className = "legend";
    lg.textContent = t("trend.legend");
    trend.appendChild(lg);
  }
  $("#d-history").textContent = hist.length
    ? hist.map((h) => `${h.time}  ${h.result === "ok" ? "✅" : h.result === "partial" ? "⚠️" : "❌"} ${h.label} ${h.dur}${h.note ? " · " + h.note : ""}`).join("\n")
    : t("hist.empty");
  renderWeekly(hist);
  renderHeatmap(hist);
}

// GitHub 风格更新热力图: 近 12 周 × 7 天, 颜色深浅 = 当天更新次数
function renderHeatmap(hist) {
  const box = $("#d-heatmap");
  if (!box) return;
  box.innerHTML = "";
  const now = new Date();
  const end = new Date(now); end.setHours(0, 0, 0, 0);
  const counts = {};
  for (const h of hist) {
    const m = String(h.time || "").match(/^(?:(\d{4})-)?(\d{2})[-/](\d{2})/); // 兼容新旧两种时间格式
    if (!m) continue;
    let y = m[1] ? +m[1] : now.getFullYear();
    let d = new Date(y, +m[2] - 1, +m[3]);
    if (d > now) d = new Date(y - 1, +m[2] - 1, +m[3]); // 无年份且在未来 → 去年
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  const weeks = 12;
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - start.getDay()); // 对齐到周日开头
  const frag = document.createDocumentFragment();
  for (let w = 0; w <= weeks; w++) {
    const col = document.createElement("div");
    col.className = "hm-col";
    for (let dd = 0; dd < 7; dd++) {
      const day = new Date(start); day.setDate(start.getDate() + w * 7 + dd);
      if (day > end) { const pad0 = document.createElement("i"); pad0.className = "hm-cell hm-pad"; col.appendChild(pad0); continue; }
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      const c = counts[key] || 0;
      const cell = document.createElement("i");
      cell.className = "hm-cell " + (c === 0 ? "hm-0" : c === 1 ? "hm-1" : c === 2 ? "hm-2" : "hm-3");
      cell.title = `${key} · ${c}`;
      col.appendChild(cell);
    }
    frag.appendChild(col);
  }
  box.appendChild(frag);
  const lg = document.createElement("div");
  lg.className = "hm-legend";
  lg.innerHTML = `<span>${t("heat.legend")}</span>` + ["hm-0", "hm-1", "hm-2", "hm-3"].map((c) => `<i class="hm-cell ${c}"></i>`).join("") + `<span>${t("dash.heatmap")}</span>`;
  box.appendChild(lg);
}

// 近 7 天更新周报 (诊断页)
function renderWeekly(hist) {
  const el = $("#d-weekly");
  if (!el) return;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 864e5);
  const recent = hist.filter((h) => {
    const m = String(h.time || "").match(/^(?:(\d{4})-)?(\d{2})[-/](\d{2}) (\d{2}):(\d{2})/); // 兼容新旧两种时间格式
    if (!m) return false;
    let d = new Date(m[1] ? +m[1] : now.getFullYear(), +m[2] - 1, +m[3], +m[4], +m[5]);
    if (d > now) d = new Date(now.getFullYear() - 1, +m[2] - 1, +m[3], +m[4], +m[5]); // 跨年
    return d >= weekAgo;
  });
  if (!recent.length) { el.textContent = t("weekly.empty"); return; }
  const cnt = (k) => recent.filter((h) => h.result === k).length;
  const ok = cnt("ok"), partial = cnt("partial"), fail = cnt("fail");
  const rate = Math.round(((ok + partial * 0.5) / recent.length) * 100);
  const durs = recent.map((h) => { const m = String(h.dur || "").match(/^(?:(\d+)m)?(\d+)s$/); return m ? (+m[1] || 0) * 60 + +m[2] : null; }).filter((v) => v != null);
  const avg = durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : null;
  const last = recent[0];
  el.textContent =
    (LANG === "en"
      ? `${recent.length} update(s) · success rate ${rate}%\n`
      : `更新 ${recent.length} 次 · 成功率 ${rate}%\n`) +
    `✅ ${ok} · ⚠️ ${partial} · ❌ ${fail}\n` +
    (avg != null ? (LANG === "en" ? `avg ${avg}s · ` : `平均耗时 ${avg}s · `) : "") +
    `${last.time} (${last.result === "ok" ? "✅" : last.result === "partial" ? "⚠️" : "❌"}${last.note ? " " + last.note.replace(STR.zh["note.strip"], "") : ""})`;
}

// ---------------- 更新流程 ----------------
let updating = false;
async function startUpdate() {
  if (updating) return toast(t("upd.busy"), "err");
  const behindTxt = $("#d-behind").textContent;
  if (BOOT_SETTINGS?.confirm_update !== false && !confirm(t("upd.confirm", behindTxt))) { toast(t("upd.cancelled"), "info"); return; }
  // 更新前预检: 路径失效先尝试自动识别修复; 磁盘/仓库问题确认后继续
  if (rpc && BOOT_SETTINGS?.preflight_check !== false) {
    let pre = await rpc.preflightCheck();
    if (!pre.ok && pre.issues.some((k) => k === "path" || k === "pathpartial")) {
      toast(t("pre.detecting"), "info", 2500);
      const found = ((await rpc.detectInstallPaths(!!BOOT_SETTINGS?.path_deep_scan)) || []).filter((x) => x.valid);
      if (found[0] && confirm(t("preflight.switch", found[0].path))) {
        await rpc.saveSettings({ install_path: found[0].path });
        BOOT_SETTINGS = { ...BOOT_SETTINGS, install_path: found[0].path };
        $("#s-install").value = found[0].path;
        SAVED_SNAPSHOT = JSON.stringify(collectSettings());
        updateDirtyUI();
        toast(t("preflight.fixed"), "ok", 2200);
        pre = await rpc.preflightCheck();
      } else { toast(t("preflight.aborted"), "err", 3000); return; }
    }
    if (!pre.ok && !confirm(t("preflight.confirm", pre.issues.map((k) => t("pre." + k)).join("；")))) { toast(t("upd.cancelled"), "info"); return; }
  }
  toast(t("upd.started"), "info");
  if (!rpc) { mockUpdate(); return; }
  await rpc.startUpdate(); // UI 准备统一由主进程 update-started 事件驱动 (手动/自动一致)
}
// 主进程通知: 更新真正开始 (手动或自动), 统一准备 UI
if (rpc) rpc.onUpdateStarted(() => {
  updating = true;
  document.body.classList.add("updating");
  const cb = $("#btn-cancel-update"); if (cb) cb.hidden = false;
  syncProgress(5, t("upd.preparing"), true);
  showPage("update");
  $("#update-out").textContent = "";
  UPDATE_LINES = [];
});
// 取消更新: 终止主进程当前更新子进程树
$("#btn-cancel-update").addEventListener("click", async () => {
  if (!updating) return;
  if (!confirm(t("cancel.confirm"))) return;
  try {
    const r = await rpc.cancelUpdate();
    if (r && r.ok) toast(t("cancel.req"), "info");
    else toast(r?.msg || t("cancel.err"), "err");
  } catch { toast(t("cancel.err"), "err"); }
});
// 更新输出: 行缓存 + 过滤重绘
let UPDATE_LINES = [];
function appendUpdateLine(line) {
  const kw = ($("#update-filter").value || "").trim().toLowerCase();
  if (kw && !line.toLowerCase().includes(kw)) return;
  const out = $("#update-out");
  out.textContent += line + "\n";
  out.scrollTop = out.scrollHeight;
}
function renderUpdateOut() {
  const kw = ($("#update-filter").value || "").trim().toLowerCase();
  const lines = kw ? UPDATE_LINES.filter((l) => l.toLowerCase().includes(kw)) : UPDATE_LINES;
  const out = $("#update-out");
  out.textContent = lines.join("\n") + (lines.length ? "\n" : "");
  out.scrollTop = out.scrollHeight;
}
$("#update-filter").addEventListener("input", renderUpdateOut);
function progressFromLine(line) {
  const low = (line || "").toLowerCase();
  const rules = [
    [["fetch", "remote:", "对象", "receiving"], 45],
    [["delta"], 60], [["checkout", "检出", "updating"], 78],
    [["npm", "install", "构建", "安装", "building"], 88],
    [["packaging", "builder", "打包"], 90],
    [["done", "完成", "更新结束"], 96],
  ];
  let max = 0;
  for (const [keys, pct] of rules) if (keys.some((k) => low.includes(k))) max = Math.max(max, pct);
  return max;
}
// 进度同步: 更新页 / 仪表盘 / 日志页 三处进度条统一驱动
function syncProgress(pct, label, visible) {
  const spots = [
    ["#progress-wrap", "#progress-bar", "#progress-label"],
    ["#dash-progress-wrap", "#dash-progress-bar", "#dash-progress-label"],
    ["#log-progress-wrap", "#log-progress-bar", "#log-progress-label"],
  ];
  for (const [w, b, l] of spots) {
    const we = $(w), be = $(b), le = $(l);
    if (!we) continue;
    we.hidden = !visible;
    if (le) le.hidden = !visible || !label;
    if (le && label) le.textContent = label;
    if (be) be.style.width = pct + "%";
  }
}
if (rpc) {
  rpc.onUpdateLine((line) => {
    const showTs = !BOOT_SETTINGS || BOOT_SETTINGS.show_line_time !== false;
    const ts = new Date().toTimeString().slice(0, 8);
    const disp = showTs ? `[${ts}] ${line}` : line;
    UPDATE_LINES.push(disp);
    appendUpdateLine(disp);
    transEnqueue(line);
    const pct = progressFromLine(line);
    if (pct) { syncProgress(pct, `${pct}%`, true); }
  });
  rpc.onUpdateDone((d) => {
    updating = false;
    document.body.classList.remove("updating");
    const cb = $("#btn-cancel-update"); if (cb) cb.hidden = true;
    const doneLabel = d.rc === 0 ? t("upd.done") : t("upd.fail");
    syncProgress(100, doneLabel, true);
    toast(d.result || (d.rc === 0 ? t("upd.done") : t("upd.fail")), d.rc === 0 ? "ok" : "err", 5000);
    setStatus(d.rc === 0 ? t("st.upd.ok") : t("st.upd.fail"), d.rc === 0 ? "ok" : "err");
    refreshStatus(); refreshHistory();
    setTimeout(() => { syncProgress(100, "", false); }, 4000);
  });
}
function mockUpdate() {
  const lines = ["→ Fetching updates...", "→ Found 12 new commit(s)", "→ Pulling updates...", "✓ Dependencies installed", "✓ Update complete"];
  let i = 0;
  const t2 = setInterval(() => {
    if (i >= lines.length) { clearInterval(t2); updating = false; document.body.classList.remove("updating"); $("#progress-bar").style.width = "100%"; toast("✅ " + t("st.upd.ok") + " (preview)", "ok"); return; }
    $("#update-out").textContent += lines[i++] + "\n";
    $("#progress-bar").style.width = (20 + i * 16) + "%";
  }, 500);
}

// ---------------- 设置 ----------------
async function loadSettingsUI() {
  const s = rpc ? await rpc.getSettings() : { dark_mode: false, auto_switch: "auto", language: "zh" };
  LANG = s.language === "en" ? "en" : "zh";
  $("#s-switch").value = s.auto_switch || "auto";
  $("#s-manual").value = s.manual_proxy || "";
  $("#s-mirror").value = s.mirror_url || "";
  $("#s-install").value = s.install_path || "";
  $("#s-pathauto").checked = s.path_auto_detect !== false;
  $("#s-pathapply").checked = s.path_auto_apply !== false;
  $("#s-pathdeep").checked = !!s.path_deep_scan;
  // 路径历史 -> datalist 快速切换
  const dl = $("#path-history-list");
  dl.innerHTML = "";
  [...new Set([(s.install_path || ""), ...(s.path_history || [])])].filter(Boolean).forEach((p) => {
    const o = document.createElement("option"); o.value = p; dl.appendChild(o);
  });
  $("#s-preflight").checked = s.preflight_check !== false;
  $("#s-minfree").value = parseInt(s.min_free_gb) || 1;
  $("#s-pathwatch").checked = s.path_watch !== false;
  renderKnownInstalls();
  checkPathStatus(s.install_path || "");
  $("#s-branch").value = s.branch || "main";
  $("#s-gateway").checked = !!s.flag_gateway;
  $("#s-ks").checked = !!s.flag_keep_stash;
  $("#s-kill").checked = !!s.kill_before_update;
  $("#s-rzp").checked = !!s.restore_zh_patches;
  $("#s-notify").checked = !!s.notify_updates;
  $("#s-autoupd").checked = !!s.auto_update;
  $("#s-interval").value = s.auto_update_interval_min ?? 60;
  $("#s-zsrc").value = s.zh_patches_source || "";
  $("#s-bkp").value = s.keep_backups ?? 3;
  $("#s-tray").checked = !!s.minimize_to_tray;
  $("#s-boot").checked = !!s.start_with_windows;
  $("#s-ontop").checked = s.always_on_top === true;
  $("#s-dark").checked = !!s.dark_mode;
  $("#s-themesys").checked = !!s.theme_system;
  $("#s-checkstart").checked = s.check_on_start !== false;
  $("#s-logauto").checked = s.log_auto_refresh !== false;
  $("#s-quiet-start").value = s.quiet_start || "";
  $("#s-quiet-end").value = s.quiet_end || "";
  $("#s-backupauto").checked = !!s.backup_auto;
  $("#s-backupkeep").value = parseInt(s.backup_keep) || 5;
  $("#s-traybadge").checked = s.tray_badge !== false;
  $("#s-autosave").checked = !!s.auto_save_settings;
  $("#s-unsavedguard").checked = s.unsaved_guard !== false;
  $("#s-startpage").value = s.start_page || "dash";
  $("#s-lang").value = LANG;
  $("#s-zoom").value = String(parseInt(s.ui_zoom) || 100);
  $("#s-termfont").value = parseInt(s.term_font) || 12;
  $("#s-trmscheme").value = s.term_scheme || "theme";
  $("#s-termbg").value = s.term_bg || "#0F172A";
  $("#s-termfg").value = s.term_fg || "#E2E8F0";
  $("#s-refresh").value = s.refresh_interval_sec ?? 30;
  $("#s-confirm").checked = s.confirm_update !== false;
  $("#s-cleanup").checked = s.cleanup_after !== false;
  $("#s-keepgw").checked = s.keep_gateway !== false;
  $("#s-notifydone").checked = s.notify_done !== false;
  $("#s-gwwatch").checked = s.gateway_watch !== false;
  $("#s-logdays").value = s.log_retention_days ?? 14;
  $("#s-histmax").value = s.history_max ?? 50;
  $("#s-gittimeout").value = s.git_timeout ?? 120;
  $("#s-fallback").checked = s.auto_fallback_mirror !== false;
  $("#s-autoretry").checked = s.auto_retry !== false;
  $("#s-maxretry").value = s.max_retries ?? 2;
  $("#s-countdown").value = s.auto_countdown_sec ?? 60;
  $("#s-netwatch").value = s.net_watch === false ? 0 : (s.net_watch_min ?? 10);
  $("#s-ins-timeout").value = s.ins_timeout_min ?? 30;
  $("#s-ins-histkeep").value = s.ins_hist_keep ?? 10;
  $("#s-ins-npmmirror").value = s.ins_npm_mirror || "default";
  $("#s-ins-npmcustom").value = s.ins_npm_custom || "";
  $("#s-sched-days").value = s.sched_days || "";
  $("#s-sched-time").value = s.sched_time || "09:00";
  $("#s-ins-gitaccel").checked = s.ins_git_accel !== false;
  $("#s-ins-autovalidate").checked = s.ins_auto_validate !== false;
  $("#s-ins-autoapply").checked = s.ins_auto_apply !== false;
  $("#s-ins-shortcut").checked = !!s.ins_shortcut;
  $("#s-ins-mirror").value = s.ins_mirror_url || "";
  $("#s-ins-mirrorfb").checked = s.ins_mirror_fallback !== false;
  $("#s-unins-backup").checked = s.unins_backup !== false;
  $("#s-unins-stop").checked = s.unins_stop_procs !== false;
  $("#s-unins-unreg").checked = s.unins_unregister !== false;
  $("#s-unins-strict").checked = !!s.unins_strict_confirm;
  $("#s-unins-mode").value = ["trash", "modules", "permanent", "unregister"].includes(s.unins_default_mode) ? s.unins_default_mode : "trash";
  $("#s-dashtools").checked = s.dash_tools !== false;
  $("#s-dashconfirm").checked = s.dash_unins_confirm !== false;
  $("#s-dashhist").checked = s.dash_install_hist !== false;
  $("#s-dashhistrows").value = Math.min(Math.max(parseInt(s.dash_hist_rows) || 3, 1), 10);
  $("#s-wnmax").value = Math.min(Math.max(parseInt(s.whatsnew_max) || 30, 10), 100);
  $("#s-postsmoke").checked = s.post_smoke !== false;
  $("#s-watchdog").checked = !!s.watchdog_enabled;
  $("#s-watchdog-min").value = Math.max(2, parseInt(s.watchdog_min) || 5);
  $("#s-chgmax").value = Math.min(Math.max(parseInt(s.chg_max) || 200, 50), 1000);
  $("#s-chg-group").checked = s.chg_group !== false;
  $("#s-upd-lock").checked = !!s.upd_target_lock;
  $("#s-webhook-url").value = s.webhook_url || "";
  $("#s-webhook-secret").value = s.webhook_secret || "";
  $("#s-wh-ok").checked = s.webhook_upd_ok !== false;
  $("#s-wh-fail").checked = s.webhook_upd_fail !== false;
  $("#s-wh-ins").checked = s.webhook_ins !== false;
  $("#ins-repo").value = s.ins_repo || "";
  $("#ins-dir").value = s.ins_dir || s.install_path || "";
  $("#s-diskcheck").checked = s.disk_check !== false;
  $("#s-notifcenter").checked = s.notifications_enabled !== false;
  $("#s-desktopnot").checked = s.notify_desktop !== false;
  $("#s-autoexec").checked = !!s.auto_execute;
  $("#s-injectmirror").checked = s.inject_electron_mirror !== false;
  $("#s-autorepair").checked = s.auto_repair_env !== false;
  $("#s-lintime").checked = s.show_line_time !== false;
  $("#s-transauto").checked = s.translate_auto !== false;
  $("#s-trans-target").value = s.translate_target || "zh-CN";
  $("#s-trans-provider").value = s.translate_provider || "auto";
  $("#s-trans-order").value = s.translate_engines_order || "";
  $("#s-trans-dict").value = (s.translate_custom_dict || []).join("\n");
  $("#s-accent").value = s.accent || "blue";
  applyAccent(s.accent || "blue");
  renderProfileList(s.profiles || []);
  // 主题: 跟随系统优先 (Electron 渲染层的 prefers-color-scheme 会随 nativeTheme.themeSource 变化)
  let dark = !!s.dark_mode;
  if (s.theme_system) dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(dark);
  applyAppearance(s);
  applyTermTheme(s);
  applyI18n();
  refreshHistory(); // 语言可能变化 -> 重绘统计/周报/历史
  // 启动行为
  BOOT_SETTINGS = s;
  checkInstallCard(); // 安装健康卡片: 本地 fs 检查, 不必等 refreshStatus 的网络探测
  // 脏检测基线快照 (必须在 showPage 之前刷新, 否则恢复默认后离开守卫会误报)
  SAVED_SNAPSHOT = JSON.stringify(collectSettings());
  updateDirtyUI();
  showPage(s.start_page || "dash");
  // 恢复翻译面板宽度 (拖拽持久化的值)
  const tw = parseInt(s.translate_panel_width);
  if (tw) $("#trans-panel").style.width = Math.min(Math.max(tw, 240), 640) + "px";
  return s;
}
let BOOT_SETTINGS = null;
function applyAppearance(s) {
  document.body.style.zoom = (parseInt(s.ui_zoom) || 100) + "%";
  document.documentElement.style.setProperty("--term-font", (parseInt(s.term_font) || 12) + "px");
}
function collectSettings() {
  return {
    auto_switch: $("#s-switch").value, manual_proxy: $("#s-manual").value.trim(),
    mirror_url: $("#s-mirror").value.trim(), install_path: $("#s-install").value.trim(),
    path_auto_detect: $("#s-pathauto").checked, path_auto_apply: $("#s-pathapply").checked, path_deep_scan: $("#s-pathdeep").checked,
    preflight_check: $("#s-preflight").checked, min_free_gb: parseInt($("#s-minfree").value) || 1,
    path_watch: $("#s-pathwatch").checked,
    branch: $("#s-branch").value.trim() || "main",
    flag_gateway: $("#s-gateway").checked, flag_keep_stash: $("#s-ks").checked,
    kill_before_update: $("#s-kill").checked, restore_zh_patches: $("#s-rzp").checked,
    notify_updates: $("#s-notify").checked,
    auto_update: $("#s-autoupd").checked,
    auto_update_interval_min: parseInt($("#s-interval").value) || 60,
    zh_patches_source: $("#s-zsrc").value.trim(),
    keep_backups: parseInt($("#s-bkp").value) || 3, minimize_to_tray: $("#s-tray").checked,
    start_with_windows: $("#s-boot").checked, always_on_top: $("#s-ontop").checked, dark_mode: $("#s-dark").checked,
    log_retention_days: parseInt($("#s-logdays").value) || 14,
    theme_system: $("#s-themesys").checked, ui_zoom: parseInt($("#s-zoom").value) || 100,
    term_font: parseInt($("#s-termfont").value) || 12, start_page: $("#s-startpage").value,
    term_scheme: $("#s-trmscheme").value, term_bg: $("#s-termbg").value, term_fg: $("#s-termfg").value,
    refresh_interval_sec: parseInt($("#s-refresh").value) || 30,
    confirm_update: $("#s-confirm").checked, cleanup_after: $("#s-cleanup").checked,
    keep_gateway: $("#s-keepgw").checked, notify_done: $("#s-notifydone").checked,
    gateway_watch: $("#s-gwwatch").checked,
    check_on_start: $("#s-checkstart").checked,
    log_auto_refresh: $("#s-logauto").checked,
    quiet_start: $("#s-quiet-start").value.trim(), quiet_end: $("#s-quiet-end").value.trim(),
    backup_auto: $("#s-backupauto").checked, backup_keep: parseInt($("#s-backupkeep").value) || 5,
    tray_badge: $("#s-traybadge").checked,
    auto_save_settings: $("#s-autosave").checked,
    unsaved_guard: $("#s-unsavedguard").checked,
    history_max: parseInt($("#s-histmax").value) || 50,
    git_timeout: parseInt($("#s-gittimeout").value) || 120,
    auto_fallback_mirror: $("#s-fallback").checked,
    auto_retry: $("#s-autoretry").checked,
    max_retries: (() => { const v = parseInt($("#s-maxretry").value); return isNaN(v) ? 2 : Math.min(Math.max(v, 0), 5); })(),
    auto_countdown_sec: (() => { const v = parseInt($("#s-countdown").value); return isNaN(v) ? 60 : Math.min(Math.max(v, 0), 600); })(),
    net_watch_min: (() => { const v = parseInt($("#s-netwatch").value); return isNaN(v) ? 10 : Math.min(Math.max(v, 0), 120); })(),
    ins_timeout_min: (() => { const v = parseInt($("#s-ins-timeout").value); return isNaN(v) ? 30 : Math.min(Math.max(v, 5), 240); })(),
    ins_hist_keep: (() => { const v = parseInt($("#s-ins-histkeep").value); return isNaN(v) ? 10 : Math.min(Math.max(v, 1), 50); })(),
    ins_npm_mirror: $("#s-ins-npmmirror").value,
    ins_npm_custom: $("#s-ins-npmcustom").value.trim(),
    sched_days: (() => {
      const days = $("#s-sched-days").value.split(",").map((x) => parseInt(x.trim())).filter((x) => x >= 0 && x <= 6);
      return [...new Set(days)].sort().join(",");
    })(),
    sched_time: /^\d{2}:\d{2}$/.test($("#s-sched-time").value) ? $("#s-sched-time").value : "09:00",
    ins_git_accel: $("#s-ins-gitaccel").checked,
    ins_auto_validate: $("#s-ins-autovalidate").checked,
    ins_auto_apply: $("#s-ins-autoapply").checked,
    ins_shortcut: $("#s-ins-shortcut").checked,
    ins_mirror_url: $("#s-ins-mirror").value.trim(),
    ins_mirror_fallback: $("#s-ins-mirrorfb").checked,
    unins_backup: $("#s-unins-backup").checked,
    unins_stop_procs: $("#s-unins-stop").checked,
    unins_unregister: $("#s-unins-unreg").checked,
    unins_strict_confirm: $("#s-unins-strict").checked,
    unins_default_mode: $("#s-unins-mode").value,
    dash_tools: $("#s-dashtools").checked,
    dash_unins_confirm: $("#s-dashconfirm").checked,
    dash_install_hist: $("#s-dashhist").checked,
    dash_hist_rows: (() => { const v = parseInt($("#s-dashhistrows").value); return isNaN(v) ? 3 : Math.min(Math.max(v, 1), 10); })(),
    whatsnew_max: (() => { const v = parseInt($("#s-wnmax").value); return isNaN(v) ? 30 : Math.min(Math.max(v, 10), 100); })(),
    post_smoke: $("#s-postsmoke").checked,
    watchdog_enabled: $("#s-watchdog").checked,
    watchdog_min: (() => { const v = parseInt($("#s-watchdog-min").value); return isNaN(v) ? 5 : Math.min(Math.max(v, 2), 60); })(),
    chg_max: (() => { const v = parseInt($("#s-chgmax").value); return isNaN(v) ? 200 : Math.min(Math.max(v, 50), 1000); })(),
    chg_group: $("#s-chg-group").checked,
    upd_target_lock: $("#s-upd-lock").checked,
    webhook_url: $("#s-webhook-url").value.trim(),
    webhook_secret: $("#s-webhook-secret").value,
    webhook_upd_ok: $("#s-wh-ok").checked,
    webhook_upd_fail: $("#s-wh-fail").checked,
    webhook_ins: $("#s-wh-ins").checked,
    disk_check: $("#s-diskcheck").checked,
    notifications_enabled: $("#s-notifcenter").checked,
    notify_desktop: $("#s-desktopnot").checked,
    auto_execute: $("#s-autoexec").checked,
    inject_electron_mirror: $("#s-injectmirror").checked,
    auto_repair_env: $("#s-autorepair").checked,
    show_line_time: $("#s-lintime").checked,
    translate_auto: $("#s-transauto").checked,
    translate_target: $("#s-trans-target").value,
    translate_provider: $("#s-trans-provider").value,
    translate_engines_order: $("#s-trans-order").value.trim(),
    translate_custom_dict: $("#s-trans-dict").value.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.includes("=")).slice(0, 200),
    accent: $("#s-accent").value,
    language: LANG,
  };
}
function applyTheme(dark) { document.body.classList.toggle("light", !dark); $("#btn-theme").textContent = dark ? "🌙" : "☀️"; }
// 终端配色: theme=跟随主题(CSS变量) / black=强制经典黑 / custom=用户自定义颜色 (更新输出与翻译面板共用)
// 注意: 变量必须设在 body 上 —— body.light 在 body 上定义了同名变量, 设在 html 会被遮蔽
function applyTermTheme(s) {
  const bs = document.body.style;
  ["--term-bg", "--term-fg", "--term-border", "--term-muted"].forEach((v) => bs.removeProperty(v));
  const scheme = (s && s.term_scheme) || "theme";
  if (scheme === "black") {
    bs.setProperty("--term-bg", "#0F172A"); bs.setProperty("--term-fg", "#E2E8F0");
    bs.setProperty("--term-border", "#334155"); bs.setProperty("--term-muted", "#94A3B8");
  } else if (scheme === "custom" && s && s.term_bg) {
    bs.setProperty("--term-bg", s.term_bg); bs.setProperty("--term-fg", s.term_fg || "#E2E8F0");
  }
}
$("#s-trmscheme").addEventListener("change", () => {
  const custom = $("#s-trmscheme").value === "custom";
  $("#s-termbg").disabled = !custom; $("#s-termfg").disabled = !custom;
});

// ---------------- 设置保存 / 脏检测 / 自动保存 ----------------
let SAVED_SNAPSHOT = "{}";
let AUTOSAVE_T = 0;
async function doSaveSettings(silent) {
  if (!rpc) { toast(t("set.savedPreview"), "ok"); return; }
  const patch = collectSettings();
  const r = await rpc.saveSettings(patch);
  if (r.ok) {
    toast(silent ? t("set.autosaved") : t("set.saved"), "ok", silent ? 1200 : 2200);
    await rpc.setLoginItem(patch.start_with_windows);
    BOOT_SETTINGS = patch;
    armNextCheck();
    let dark = patch.dark_mode;
    if (patch.theme_system) dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(dark);
    applyAppearance(patch);
    applyTermTheme(patch);
    SAVED_SNAPSHOT = JSON.stringify(collectSettings());
    updateDirtyUI();
  } else toast(t("set.savefail"), "err");
}
$("#btn-save-top").addEventListener("click", () => doSaveSettings(false));
// 连通性测试: 与真实更新同一条网络链路实测
$("#btn-test-conn").addEventListener("click", async () => {
  toast(t("test.conn.doing"), "info", 1500);
  try {
    const r = await rpc.testConnection();
    if (r.ok) toast(t("test.conn.ok", r.label, r.ms), "ok", 5000);
    else toast(t("test.conn.fail", r.msg || `HTTP ${r.code}`), "err", 5000);
  } catch (e) { toast(t("test.conn.fail", e), "err", 5000); }
  renderConnTests(); // 刷新诊断页历史 (若在诊断页可见)
});
// 脏检测: 与上次保存的快照比对, 差异项数量显示在吸附保存栏
function settingsDirty() { try { return JSON.stringify(collectSettings()) !== SAVED_SNAPSHOT; } catch { return false; } }
function diffCount() {
  try {
    const a = JSON.parse(SAVED_SNAPSHOT || "{}"), b = collectSettings();
    return Object.keys(b).filter((k) => JSON.stringify(b[k]) !== JSON.stringify(a[k])).length;
  } catch { return 0; }
}
function updateDirtyUI() {
  const dirty = settingsDirty();
  $("#dirty-dot").hidden = !dirty;
  const dt = $("#dirty-text");
  dt.textContent = dirty ? t("set.dirty", diffCount()) : t("set.savednone");
  dt.classList.toggle("dirty", dirty);
  $("#btn-revert-settings").disabled = !dirty;
}
function onSettingsEdited() {
  updateDirtyUI();
  if (rpc && BOOT_SETTINGS?.auto_save_settings) {
    clearTimeout(AUTOSAVE_T);
    AUTOSAVE_T = setTimeout(() => doSaveSettings(true), 1500);
  }
}
$("#page-settings").addEventListener("input", onSettingsEdited);
$("#page-settings").addEventListener("change", onSettingsEdited);
// 撤销修改: 重新从磁盘加载
$("#btn-revert-settings").addEventListener("click", async () => {
  await loadSettingsUI();
  toast(t("set.reverted"), "info", 1500);
});
// 恢复默认设置
$("#btn-reset-settings").addEventListener("click", async () => {
  if (!rpc) return toast(t("st.preview"), "info");
  if (!confirm(t("set.reset.confirm"))) return;
  const r = await rpc.resetSettings();
  if (r && r.ok) { await loadSettingsUI(); toast(t("set.reset.done"), "ok"); }
  else toast(t("set.savefail"), "err");
});
// 设置项搜索过滤
$("#settings-filter").addEventListener("input", () => {
  const kw = ($("#settings-filter").value || "").trim().toLowerCase();
  let any = false;
  $$("#page-settings .panel").forEach((p) => {
    const hit = !kw || p.textContent.toLowerCase().includes(kw);
    p.style.display = hit ? "" : "none";
    if (hit) any = true;
  });
  $("#settings-nomatch").hidden = any;
});
$("#btn-theme").addEventListener("click", () => {
  // 当前是浅色 -> 切到深色; 当前是深色 -> 切到浅色 (此前逻辑写反, 点击永远维持原样)
  const dark = document.body.classList.contains("light");
  applyTheme(dark);
  $("#s-dark").checked = dark;
  if (rpc) {
    // 手动切换 = 用户明确指定主题, 自动退出「跟随系统」避免被系统偏好覆盖
    rpc.saveSettings({ dark_mode: dark, theme_system: false });
    $("#s-themesys").checked = false;
  }
  toast(dark ? t("theme.dark") : t("theme.light"), "info", 1500);
});
// 界面语言: 切换即时生效 + 立即持久化 (主进程同步重建托盘菜单)
$("#s-lang").addEventListener("change", async () => {
  LANG = $("#s-lang").value;
  applyI18n();
  refreshHistory();
  if (rpc) { await rpc.saveSettings({ language: LANG }); toast(t("lang.saved"), "ok"); }
  else toast(t("lang.saved"), "ok");
  SAVED_SNAPSHOT = JSON.stringify(collectSettings()); // 语言即时保存, 刷新快照防误报脏状态
  updateDirtyUI();
});

// ---------------- 绑定按钮 (全部带 toast 反馈) ----------------
$("#btn-check").addEventListener("click", () => { toast(t("st.refreshing"), "info"); refreshStatus(true); showPage("update"); });
$("#btn-check2").addEventListener("click", () => { toast(t("st.refreshing"), "info"); refreshStatus(true); });
$("#btn-update").addEventListener("click", startUpdate);
$("#btn-update2").addEventListener("click", startUpdate);
$("#btn-refresh").addEventListener("click", () => refreshStatus(true));
$("#btn-installdir").addEventListener("click", async () => { toast(t("open.install"), "info", 1500); const r = await rpc.openPath("install"); if (!r.ok) toast(t("open.fail", r.msg), "err"); });

// ---------------- 安装路径: 实时体检 / 自动识别 / 浏览 ----------------
let PATH_CHECK_T = 0;
function schedulePathCheck() { clearTimeout(PATH_CHECK_T); PATH_CHECK_T = setTimeout(() => checkPathStatus($("#s-install").value), 400); }
$("#s-install").addEventListener("input", schedulePathCheck);
async function checkPathStatus(p) {
  const el = $("#path-status");
  p = (p || "").trim();
  if (!p) { el.hidden = true; return; }
  el.hidden = false; el.className = "path-status"; el.textContent = t("path.checking");
  const r = rpc ? await rpc.checkInstallPath(p) : { exists: true, valid: true, hasCmd: true, hasAgent: true, hasGit: true, freeGB: null };
  renderPathStatus(el, r);
}
function renderPathStatus(el, r) {
  el.className = "path-status " + (r.valid ? "ok" : r.exists ? "warn" : "bad");
  let txt = r.valid ? t("path.ok") : r.exists ? t("path.partial") : t("path.nodir");
  if (r.valid && r.hasGit === false) txt += " · ⚠ git";
  if (r.exists && !r.valid) {
    const miss = [];
    if (!r.hasCmd) miss.push("bin\\hermes.cmd");
    if (!r.hasAgent) miss.push("hermes-agent");
    if (miss.length) txt += ` (${t("path.missing")}: ${miss.join(", ")})`;
    if (r.writable === false) txt += ` · ${t("path.nowrite")}`;
  }
  if (r.freeGB != null) txt += ` · ${t("path.free", r.freeGB)}`;
  el.textContent = txt;
}
// 仪表盘「安装健康」卡片: 路径有效/不完整/失效, 失效时点击直达设置并触发识别
async function checkInstallCard() {
  if (!rpc) return;
  const el = $("#d-install");
  if (!el) return;
  const c = await rpc.checkInstallPath(BOOT_SETTINGS?.install_path || "");
  el.classList.remove("clickable"); el.onclick = null;
  // 健康评分: 路径/命令/Agent/Git 各 20 分 + 磁盘剩余 20 分 (与主进程 healthScore 同口径)
  const score = (c.exists ? 20 : 0) + (c.hasCmd ? 20 : 0) + (c.hasAgent ? 20 : 0) + (c.hasGit ? 20 : 0) + (c.freeGB != null ? (c.freeGB >= 5 ? 20 : c.freeGB >= 1 ? 10 : 0) : 0);
  const grade = !c.exists ? ["bad", t("install.grade.bad"), "var(--danger)"]
    : score >= 90 ? ["excellent", t("install.grade.excellent"), "var(--success)"]
    : score >= 70 ? ["ok", t("install.grade.ok"), "var(--warning)"]
    : ["warn", t("install.grade.warn"), "var(--warning)"];
  el.innerHTML = t("install.score", score, grade[1]);
  el.style.color = c.exists ? grade[2] : "var(--danger)";
  const scoreEl = $("#d-score");
  if (scoreEl) { scoreEl.innerHTML = `${score} / 100`; scoreEl.style.color = c.exists ? grade[2] : "var(--danger)"; scoreEl.title = grade[1]; }
  el.title = [
    `${t("install.chk.path")}: ${c.exists ? "✔" : "✘"}`,
    `${t("install.chk.cmd")}: ${c.hasCmd === undefined ? "—" : c.hasCmd ? "✔" : "✘"}`,
    `${t("install.chk.agent")}: ${c.hasAgent === undefined ? "—" : c.hasAgent ? "✔" : "✘"}`,
    `${t("install.chk.git")}: ${c.hasGit === undefined ? "—" : c.hasGit ? "✔" : "✘"}`,
    `${t("install.chk.disk")}: ${c.freeGB != null ? c.freeGB + " GB" : "—"}`,
  ].join("\n");
  if (!c.valid) {
    el.classList.add("clickable");
    el.onclick = () => { showPage("settings"); setTimeout(() => $("#btn-detect-path").click(), 250); };
  }
}
$("#btn-detect-path").addEventListener("click", async () => {
  if (!rpc) return;
  const btn = $("#btn-detect-path"), el = $("#path-cands");
  btn.disabled = true;
  el.hidden = false;
  el.innerHTML = `<div class="path-cand-tip">${t("path.detecting")}</div>`;
  const list = await rpc.detectInstallPaths(!!$("#s-pathdeep").checked);
  btn.disabled = false;
  if (!list || !list.length) { el.innerHTML = `<div class="path-cand-tip">${t("path.none.found")}</div>`; return; }
  el.innerHTML = `<div class="path-cand-tip">${t("path.detected.n", list.length)}</div>`;
  list.forEach((c) => {
    const row = document.createElement("div");
    row.className = "path-cand" + (c.valid ? " valid" : "");
    row.innerHTML = `<span class="badge">${c.valid ? "✔" : "△"}</span><span class="p"></span><span class="meta"></span>`;
    row.querySelector(".p").textContent = c.path;
    const meta = [c.valid ? t("path.ok") : t("path.partial")];
    if (c.freeGB != null) meta.push(t("path.free", c.freeGB));
    row.querySelector(".meta").textContent = meta.join(" · ");
    row.addEventListener("click", () => applyCandidatePath(c.path));
    el.appendChild(row);
  });
});
function applyCandidatePath(p) {
  $("#s-install").value = p;
  $("#s-install").dispatchEvent(new Event("input", { bubbles: true })); // 触发脏检测/自动保存
  checkPathStatus(p);
  toast(t("path.applied.toast", p), "ok", 2600);
}
$("#btn-browse-path").addEventListener("click", async () => {
  if (!rpc) return;
  const r = await rpc.browseInstallPath();
  if (r.ok) applyCandidatePath(r.path);
});
// 主进程启动时自动切换了路径 -> 静默刷新设置 UI + 提示
if (rpc && rpc.onSettingsUpdated) rpc.onSettingsUpdated(async (s) => {
  if (!s || !s.install_path) return;
  BOOT_SETTINGS = s;
  await loadSettingsUI();
  SAVED_SNAPSHOT = JSON.stringify(collectSettings());
  updateDirtyUI();
  toast(t("path.autoswitch"), "info", 4000);
});
// ---------------- 已知安装管理 ----------------
async function renderKnownInstalls() {
  if (!rpc) return;
  const box = $("#installs-box"), list = $("#installs-list");
  box.hidden = false;
  const s = await rpc.getSettings();
  const paths = [...new Set([(s.install_path || "").trim(), ...(s.path_history || [])])].filter(Boolean);
  list.innerHTML = "";
  if (!paths.length) { list.innerHTML = `<div class="known-empty">${t("known.empty")}</div>`; return; }
  for (const p of paths) {
    const c = await rpc.checkInstallPath(p);
    const row = document.createElement("div");
    row.className = "known-row" + (c.valid ? " valid" : "");
    row.innerHTML = `<span class="badge">${c.valid ? "✔" : c.exists ? "△" : "✘"}</span><span class="p"></span><span class="meta"></span>` +
      `<button class="btn act-apply"></button><button class="btn ghost act-del"></button>`;
    row.querySelector(".p").textContent = p;
    row.querySelector(".p").title = p;
    row.querySelector(".meta").textContent = (c.valid ? t("path.ok") : c.exists ? t("path.partial") : t("path.nodir")) + (c.freeGB != null ? ` · ${t("path.free", c.freeGB)}` : "");
    const bApply = row.querySelector(".act-apply"), bDel = row.querySelector(".act-del");
    bApply.textContent = t("btn.known.apply");
    bDel.textContent = "✕";
    bDel.title = t("btn.known.del");
    bApply.addEventListener("click", () => applyCandidatePath(p));
    bDel.addEventListener("click", async () => {
      await rpc.removeKnownInstall(p);
      if (BOOT_SETTINGS) BOOT_SETTINGS.path_history = (BOOT_SETTINGS.path_history || []).filter((x) => x !== p);
      toast(t("known.removed"), "ok", 1600);
      renderKnownInstalls();
    });
    list.appendChild(row);
  }
}
$("#btn-install-save").addEventListener("click", async () => {
  if (!rpc) return;
  const p = $("#s-install").value.trim();
  const r = await rpc.addKnownInstall(p);
  if (r.ok) { toast(t("known.saved"), "ok", 1800); renderKnownInstalls(); }
  else toast(t("known.save.invalid"), "err", 2600);
});
$("#btn-export-report").addEventListener("click", async () => {
  if (!rpc) return toast(t("st.preview"), "info");
  const r = await rpc.exportDiagReport();
  if (r.ok) toast(t("exported", r.filePath), "ok", 4000);
  else if (r.msg) toast(t("open.fail", r.msg), "err");
});
$("#btn-logdir").addEventListener("click", async () => { toast(t("open.logdir"), "info", 1500); const r = await rpc.openPath("logdir"); if (!r.ok) toast(t("open.fail", r.msg), "err"); });
$("#btn-copyinfo").addEventListener("click", async () => {
  const info = `${t("dash.card.version")}: ${$("#d-version").textContent}\n${t("dash.card.behind")}: ${$("#d-behind").textContent}\n${t("dash.card.gateway")}: ${$("#d-gateway").textContent}\n${t("dash.card.method")}: ${$("#d-method").textContent}`;
  await rpc.copyText(info); toast(t("info.copied"), "ok");
});
const gwName = () => ({ restart: t("gw.restart"), stop: t("gw.stop") });
async function gwAction(a) {
  const n = gwName()[a] || a;
  toast(t("gw.sent", n), "info");
  const r = await rpc.gatewayAction(a);
  toast(r.ok ? t("gw.ok", n) : t("gw.fail", n), r.ok ? "ok" : "err");
  refreshStatus();
}
$("#btn-gw-restart").addEventListener("click", () => gwAction("restart"));
$("#btn-gw-stop").addEventListener("click", () => gwAction("stop"));
async function runDoctor() {
  busy($("#btn-doctor"), true); busy($("#btn-doctor2"), true);
  toast(t("doctor.running"), "info");
  showPage("diag");
  $("#diag-out").textContent = "doctor...\n";
  const out = rpc ? await rpc.doctor() : "(preview) doctor: all checks passed";
  $("#diag-out").textContent = out;
  busy($("#btn-doctor"), false); busy($("#btn-doctor2"), false);
  toast(t("doctor.done"), "ok");
}
$("#btn-doctor").addEventListener("click", runDoctor);
$("#btn-doctor2").addEventListener("click", runDoctor);
$("#btn-netprobe").addEventListener("click", async () => {
  busy($("#btn-netprobe"), true);
  toast(t("probe.running"), "info", 1800);
  const panel = $("#probe-panel"), list = $("#probe-list");
  panel.hidden = false;
  list.innerHTML = '<div class="rb-item">...</div>';
  try {
  const results = rpc ? await rpc.netProbe() : [
    { name: "Direct GitHub", ok: false }, { name: "System proxy http://127.0.0.1:7890", ok: true },
  ];
  PROBE_LAST = results;
  list.innerHTML = "";
  for (const r of results) {
    const div = document.createElement("div");
    div.className = "rb-item";
    div.innerHTML = `<span>${r.ok ? "✅" : "❌"}</span><span>${r.name}</span><span style="margin-left:auto;color:${r.ok ? "var(--success)" : "var(--danger)"}">${r.ok ? t("probe.reachable") : t("probe.unreachable")}</span>`;
    list.appendChild(div);
  }
  const okCount = results.filter((r) => r.ok).length;
  toast(t("probe.done", okCount, results.length), okCount ? "ok" : "err");
  } finally { busy($("#btn-netprobe"), false); }
});
// 测速对比: 直连/系统代理/手动代理/全部镜像 并发实测, 可一键应用最快方案
$("#btn-speedtest").addEventListener("click", async () => {
  busy($("#btn-speedtest"), true);
  const panel = $("#speed-panel"), list = $("#speed-list");
  panel.hidden = false;
  list.innerHTML = `<div class="rb-item">${t("spd.testing")}</div>`;
  try {
    const rows = rpc ? await rpc.speedTest() : [];
    const sorted = [...rows].sort((a, b) => (b.ok - a.ok) || ((a.ok ? a.ms : 9e9) - (b.ok ? b.ms : 9e9)));
    const best = sorted.find((r) => r.ok);
    list.innerHTML = "";
    for (const r of sorted) {
      const div = document.createElement("div");
      div.className = "path-cand";
      const badge = best && r.key === best.key ? `<span class="meta" style="color:var(--success)">${t("spd.fastest")}</span>` : "";
      div.innerHTML = `<span>${r.ok ? "✅" : "❌"}</span><span style="font-size:12px">${r.label}</span>${badge}<span class="meta">${r.ok ? r.ms + "ms · HTTP " + r.code : t("probe.unreachable")}</span><button class="btn sm">${t("spd.apply")}</button>`;
      div.querySelector("button").addEventListener("click", async () => {
        const res = rpc ? await rpc.applyNetMethod(r.key) : { ok: false };
        if (res && res.ok) { toast(t("spd.applied", r.label), "ok", 4000); refreshStatus(); }
        else toast((res && res.msg) || "failed", "err");
      });
      list.appendChild(div);
    }
    if (!rows.length) list.innerHTML = `<div class="rb-item">${t("spd.empty")}</div>`;
  } catch (e) { list.innerHTML = `<div class="rb-item">${String(e).slice(0, 120)}</div>`; }
  finally { busy($("#btn-speedtest"), false); }
});
// 导出 HTML 健康报告 (主进程生成, 含安装检查/评分/统计/历史)
$("#btn-health-report").addEventListener("click", async () => {
  if (!rpc) return;
  busy($("#btn-health-report"), true);
  try {
    const r = await rpc.exportHealthReport();
    if (r && r.ok) toast(t("rpt.done", r.filePath), "ok", 6000);
    else if (r && r.canceled) { /* 用户取消保存对话框, 不提示 */ }
    else toast(t("rpt.fail") + (r && r.msg ? ": " + r.msg : ""), "err", 5000);
  } finally { busy($("#btn-health-report"), false); }
});
// 安装目录体积分析: Top 子目录大小排行, 结果写入诊断输出区
$("#btn-dirsize").addEventListener("click", async () => {
  if (!rpc) return;
  busy($("#btn-dirsize"), true);
  const out = $("#diag-out");
  out.textContent = t("size.scanning") + "\n";
  try {
    const r = await rpc.dirSize();
    if (!r || !r.ok) { out.textContent = t("size.fail", (r && r.msg) || "?"); return; }
    const fmt = (n) => n >= 1073741824 ? (n / 1073741824).toFixed(2) + " GB" : n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : n >= 1024 ? (n / 1024).toFixed(1) + " KB" : n + " B";
    const bar = (max, v) => { const n = Math.max(1, Math.round((v / (max || 1)) * 24)); return "█".repeat(n) + "░".repeat(24 - n); };
    const lines = [
      `📂 ${t("size.title")} · ${r.base}`,
      t("size.total", fmt(r.total)) + (r.items.length ? ` · Top ${Math.min(r.items.length, 25)}` : ""),
    ];
    const max = r.items[0] ? r.items[0].size : 0;
    for (const it of r.items) {
      lines.push(`${it.dir ? "📁" : "📄"} ${it.name.padEnd(28).slice(0, 28)} ${bar(max, it.size)} ${fmt(it.size).padStart(9)}  ${it.dir ? t("size.files", it.files) : ""}`);
    }
    if (r.truncated) lines.push(t("size.truncated"));
    out.textContent = lines.join("\n");
  } catch (e) { out.textContent = t("size.fail", String(e).slice(0, 100)); }
  finally { busy($("#btn-dirsize"), false); }
});
// 探测结果一键应用为网络设置: 优先 系统代理 > 手动代理 > 镜像
let PROBE_LAST = null;
$("#btn-apply-proxy").addEventListener("click", async () => {
  if (!PROBE_LAST) return toast(t("probe.running"), "info");
  const okRows = PROBE_LAST.filter((r) => r.ok);
  if (!okRows.length) return toast(t("proxy.noneok"), "err");
  const pick = (prefix) => okRows.find((r) => r.name.startsWith(prefix));
  let patch = null, label = "";
  const sys = pick(t("probe.system")), manual = pick(t("probe.manual")), mirror = pick(t("probe.mirror"));
  if (sys) { patch = { auto_switch: "system" }; label = t("opt.system"); }
  else if (manual) { patch = { auto_switch: "manual", manual_proxy: manual.name.replace(t("probe.manual") + " ", "").trim() }; label = t("opt.manual"); }
  else if (mirror) { patch = { auto_switch: "mirror" }; label = t("opt.mirror"); }
  else if (okRows.some((r) => r.name === t("probe.direct"))) { toast(t("proxy.directonly"), "info", 2500); return; }
  if (patch && rpc) { await rpc.saveSettings(patch); await loadSettingsUI(); toast(t("proxy.applied", label), "ok"); }
});
$("#btn-copydiag").addEventListener("click", async () => { await rpc.copyText($("#diag-out").textContent); toast(t("diag.copied"), "ok"); });
$("#btn-export-diag").addEventListener("click", async () => {
  const tx = $("#diag-out").textContent.trim();
  if (!tx) return toast(t("diag.empty"), "err");
  const r = rpc ? await rpc.exportText(`hermes-diag-${new Date().toISOString().slice(0, 10)}.txt`, tx) : { ok: true, filePath: "(preview)" };
  if (r.ok) toast(t("exported", r.filePath || ""), "ok", 4000); else toast(t("export.fail", r.msg || ""), "err");
});
$("#btn-kill").addEventListener("click", async () => {
  busy($("#btn-kill"), true);
  toast(t("kill.running"), "info");
  try {
    const r = await rpc.killProcesses();
    toast(r.killed ? t("kill.done", r.killed) : t("kill.none"), r.killed ? "ok" : "info");
  } finally { busy($("#btn-kill"), false); }
});
// ---------------- Git 工作区检查 / 回到分支 ----------------
let REPO_CACHE = null;
$("#btn-repo").addEventListener("click", refreshRepoStatus);
async function refreshRepoStatus() {
  if (!rpc) { $("#diag-out").textContent = "(preview) branch: main · clean"; return; }
  busy($("#btn-repo"), true);
  toast(t("repo.running"), "info", 1500);
  showPage("diag");
  try {
    const r = await rpc.repoStatus();
    if (!r || !r.ok) { toast(t("repo.fail"), "err"); $("#diag-out").textContent = t("repo.fail"); return; }
    REPO_CACHE = r;
    $("#diag-out").textContent = [
      `${t("repo.branch")}: ${r.branch}${r.detached ? "" : "  ✔"}`,
      r.detached ? t("repo.detached") : t("repo.ondetached"),
      t("repo.dirty", r.dirty),
      t("repo.stash", r.stash),
    ].join("\n");
    $("#btn-back2branch").classList.toggle("hidden", !r.detached);
    toast(r.detached ? t("repo.detached") : t("repo.ondetached"), r.detached ? "err" : "ok");
  } finally { busy($("#btn-repo"), false); }
}
$("#btn-back2branch").addEventListener("click", async () => {
  if (!rpc) return toast(t("st.preview"), "info");
  busy($("#btn-back2branch"), true);
  toast(t("b2b.running"), "info");
  try {
    const r = await rpc.checkoutBranch();
    if (r.ok) {
      toast(t("b2b.done", (BOOT_SETTINGS && BOOT_SETTINGS.branch) || "main"), "ok");
      $("#btn-back2branch").classList.add("hidden");
      refreshRepoStatus(); refreshStatus();
    } else toast(t("b2b.fail", r.out), "err", 4000);
  } finally { busy($("#btn-back2branch"), false); }
});
// ---------------- 一键修复依赖 (npm ci, 流式输出到诊断页) ----------------
let repairingUI = false;
$("#btn-repair").addEventListener("click", async () => {
  if (!rpc) return toast(t("st.preview"), "info");
  if (repairingUI) return toast(t("upd.busy"), "err");
  repairingUI = true;
  busy($("#btn-repair"), true);
  toast(t("repair.running"), "info", 3500);
  showPage("diag");
  $("#diag-out").textContent = t("repair.running") + "\n";
  const r = await rpc.repairDeps();
  if (!r.ok) { repairingUI = false; busy($("#btn-repair"), false); toast(t("upd.busy"), "err"); }
});
if (rpc) {
  rpc.onRepairLine((line) => {
    const out = $("#diag-out");
    out.textContent += line + "\n";
    out.scrollTop = out.scrollHeight;
  });
  rpc.onRepairDone((d) => {
    repairingUI = false;
    busy($("#btn-repair"), false);
    toast(d.rc === 0 ? t("repair.done") : t("repair.fail", d.rc), d.rc === 0 ? "ok" : "err", 5000);
    if (d.rc === 0) refreshStatus();
  });
}
// ---------------- 一键维护 (git gc + npm cache verify, 流式输出到诊断页) ----------------
let maintainingUI = false;
$("#btn-maintain").addEventListener("click", async () => {
  if (!rpc) return toast(t("st.preview"), "info");
  if (maintainingUI) return toast(t("maintain.running"), "err");
  maintainingUI = true;
  busy($("#btn-maintain"), true);
  toast(t("maintain.running"), "info", 3000);
  showPage("diag");
  $("#diag-out").textContent += `\n> ${t("btn.maintain")}\n`;
  const out = $("#diag-out"); out.scrollTop = out.scrollHeight;
  const r = await rpc.maintain();
  if (!r.ok) { maintainingUI = false; busy($("#btn-maintain"), false); toast(r.msg || t("upd.busy"), "err"); }
});
if (rpc) {
  rpc.onMaintainLine((line) => {
    const out = $("#diag-out");
    out.textContent += line + "\n";
    out.scrollTop = out.scrollHeight;
  });
  rpc.onMaintainDone(() => {
    maintainingUI = false;
    busy($("#btn-maintain"), false);
    toast(t("maintain.done"), "ok", 4000);
  });
}
$("#btn-zhpatch").addEventListener("click", async () => {
  busy($("#btn-zhpatch"), true);
  try {
    const r = await rpc.restoreZhPatches();
    toast(r.ok ? t("zh.ok", r.msg) : t("zh.fail", r.msg), r.ok ? "ok" : "err", 4000);
  } finally { busy($("#btn-zhpatch"), false); }
});
$("#btn-hist-csv").addEventListener("click", async () => {
  const r = await rpc.exportHistoryCSV();
  if (r.ok) toast(t("exported", r.filePath), "ok", 4000);
});
$("#btn-hist-manage").addEventListener("click", openHistDialog);
let HIST_CACHE = [];
async function openHistDialog() {
  HIST_CACHE = rpc ? await rpc.getHistory() : [{ time: "09-29 11:46", result: "fail", label: "系统代理", dur: "308s", note: "原因:Node编译" }];
  renderHistList();
  $("#hist-dialog").showModal();
}
function renderHistList() {
  const kw = ($("#hist-filter").value || "").trim().toLowerCase();
  const hist = HIST_CACHE.filter((h) => !kw || [h.time, h.result, h.label, h.note, h.dur].some((v) => String(v || "").toLowerCase().includes(kw)));
  const list = $("#hist-list"); list.innerHTML = "";
  if (!hist.length) { const d = document.createElement("div"); d.className = "hist-empty"; d.textContent = kw ? t("hist.nomatch") : t("hist.empty"); list.appendChild(d); }
  hist.forEach((h) => {
    const row = document.createElement("div"); row.className = "hist-item clickable";
    const res = h.result === "ok" ? t("res.ok") : h.result === "partial" ? t("res.partial") : t("res.fail");
    row.innerHTML = `<span class="mono">${h.time || ""}</span><span class="hi-res">${res}</span><span class="hi-note">${(h.note || h.label || "").replace(STR.zh["note.strip"], "")} ${h.dur || ""}</span>`;
    const del = document.createElement("button");
    del.className = "btn sm warn"; del.textContent = LANG === "en" ? "Delete" : "删除";
    del.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (rpc) {
        const idx = HIST_CACHE.indexOf(h);
        if (idx >= 0) await rpc.deleteHistory(idx);
        HIST_CACHE.splice(HIST_CACHE.indexOf(h), 1);
        toast(t("hist.deleted"), "ok", 1200); renderHistList(); refreshHistory();
      } else toast(t("st.preview"), "info", 1000);
    });
    row.appendChild(del);
    // 点击行展开完整详情
    row.addEventListener("click", () => {
      const next = row.nextElementSibling;
      if (next && next.classList.contains("hist-detail")) { next.remove(); return; }
      list.querySelectorAll(".hist-detail").forEach((d) => d.remove());
      const d = document.createElement("div");
      d.className = "hist-detail";
      const resTxt = h.result === "ok" ? t("res.ok") : h.result === "partial" ? t("res.partial") : t("res.fail");
      d.innerHTML = [
        [t("hist.d.time"), h.time || "—"], [t("hist.d.result"), resTxt],
        [t("hist.d.method"), h.label || "—"], [t("hist.d.dur"), h.dur || "—"],
        [t("hist.d.old"), h.old || "—"], [t("hist.d.new"), h.new || "—"],
        [t("hist.d.note"), (h.note || "—").replace(STR.zh["note.strip"], "")],
      ].map(([k, v]) => `<div><span>${k}</span><b></b></div>`).join("");
      d.querySelectorAll("b").forEach((b, i) => { b.textContent = [h.time || "—", resTxt, h.label || "—", h.dur || "—", h.old || "—", h.new || "—", (h.note || "—").replace(STR.zh["note.strip"], "")][i]; });
      row.after(d);
    });
    list.appendChild(row);
  });
  const tip = document.createElement("div");
  tip.className = "prof-tip"; tip.textContent = t("hist.d.tap");
  list.appendChild(tip);
}
$("#hist-filter").addEventListener("input", renderHistList);
$("#btn-hist-close").addEventListener("click", () => $("#hist-dialog").close());
$("#btn-hist-export2").addEventListener("click", async () => {
  const r = rpc ? await rpc.exportHistoryCSV() : { ok: false };
  if (r.ok) { $("#hist-dialog").close(); toast(t("exported", r.filePath), "ok", 4000); }
});
$("#btn-hist-clearall").addEventListener("click", async () => {
  if (!confirm(t("hist.confirmclear"))) return;
  if (rpc) { await rpc.clearHistory(); $("#hist-dialog").close(); toast(t("hist.cleared"), "ok"); refreshHistory(); }
});
$("#btn-copyout").addEventListener("click", async () => {
  const tx = $("#update-out").textContent.trim();
  if (!tx) return toast(t("out.empty"), "err");
  await rpc.copyText(tx); toast(t("out.copied"), "ok");
});
$("#btn-export-out").addEventListener("click", async () => {
  const tx = $("#update-out").textContent.trim();
  if (!tx) return toast(t("out.empty"), "err");
  const r = rpc ? await rpc.exportText(`hermes-update-${new Date().toISOString().slice(0, 10)}.txt`, tx) : { ok: true, filePath: "(preview)" };
  if (r.ok) toast(t("exported", r.filePath || ""), "ok", 4000); else toast(t("export.fail", r.msg || ""), "err");
});
$("#btn-rollback").addEventListener("click", async () => {
  const panel = $("#rollback-panel");
  if (!panel.hidden) { panel.hidden = true; return; }
  toast(t("rb.fetching"), "info", 1500);
  const commits = await rpc.recentCommits();
  const list = $("#rollback-list"); list.innerHTML = "";
  for (const c of commits.slice(0, 10)) {
    const div = document.createElement("div");
    div.className = "rb-item";
    div.innerHTML = `<span class="mono">${c.hash.slice(0, 8)}</span><span>${c.msg.slice(0, 60)}</span>`;
    const btn = document.createElement("button");
    btn.className = "btn sm warn"; btn.textContent = t("rb.go");
    btn.addEventListener("click", async () => {
      if (!confirm(t("rb.confirm", c.hash.slice(0, 8), (c.date || "").slice(0, 19), c.msg.slice(0, 80)))) return;
      toast(t("rb.running"), "info", 3000);
      const r = await rpc.rollback(c.hash);
      toast(r.ok ? t("rb.done") : t("rb.fail", r.out), r.ok ? "ok" : "err", 4000);
      if (r.ok) refreshStatus();
    });
    div.appendChild(btn); list.appendChild(div);
  }
  panel.hidden = false;
});

// ---------------- 日志页 ----------------
let logCache = "";
async function refreshLogs(manual = false) {
  if (manual) toast(t("log.refreshed"), "info", 1200);
  logCache = rpc ? await rpc.getLogs() : "(preview) [12:00:00] ready";
  applyLogFilter();
}
function applyLogFilter() {
  const kw = $("#log-filter").value.trim().toLowerCase();
  const lv = $("#log-level") ? $("#log-level").value : "all";
  const levelOf = (l) => /\bERROR\b|❌|失败|failed/i.test(l) ? "err" : /\bWARN\b|⚠️|警告/i.test(l) ? "warn" : "info";
  const lines = logCache.split("\n");
  const list = lines.filter((l) => (kw ? l.toLowerCase().includes(kw) : true))
    .filter((l) => lv === "all" ? true : lv === "info" ? levelOf(l) === "info" : levelOf(l) === lv);
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // 级别着色: 错误红 / 警告黄 / 成功绿
  $("#log-out").innerHTML = list.map((l) => {
    const e = esc(l);
    if (/\bERROR\b|❌|失败|failed/i.test(l)) return `<span class="log-err">${e}</span>`;
    if (/\bWARN\b|⚠️|警告/i.test(l)) return `<span class="log-warn">${e}</span>`;
    if (/\bOK\b|✅|成功|success/i.test(l)) return `<span class="log-ok">${e}</span>`;
    return e;
  }).join("\n");
  $("#log-out").scrollTop = $("#log-out").scrollHeight;
}
// 日志自动刷新 (后台设置项, 仅日志页激活时生效)
setInterval(() => { if (BOOT_SETTINGS?.log_auto_refresh !== false && CURRENT_PAGE === "log" && rpc) refreshLogs(); }, 5000);
$("#log-filter").addEventListener("input", applyLogFilter);
if ($("#log-level")) $("#log-level").addEventListener("change", applyLogFilter);
$("#btn-log-refresh").addEventListener("click", () => refreshLogs(true));
$("#btn-log-copy").addEventListener("click", async () => { await rpc.copyText($("#log-out").textContent); toast(t("log.copied"), "ok"); });
$("#btn-log-open").addEventListener("click", async () => { const r = await rpc.openPath("logfile"); if (!r.ok) toast(t("open.fail", r.msg || ""), "err"); });
$("#btn-log-clear").addEventListener("click", async () => {
  if (!confirm(t("log.confirmclear"))) return;
  await rpc.clearLogFile(); toast(t("log.cleared"), "ok"); refreshLogs();
});

// ---------------- 导入导出设置 ----------------
$("#btn-export-settings").addEventListener("click", async () => {
  const r = rpc ? await rpc.exportSettings() : { ok: true, filePath: "(preview)" };
  if (r.ok) toast(t("exported", r.filePath), "ok", 4000);
  else toast(t("export.cancelled"), "info", 1500);
});
$("#btn-import-settings").addEventListener("click", async () => {
  const r = rpc ? await rpc.importSettings() : { ok: false };
  if (r.ok) { await loadSettingsUI(); toast(t("set.imported"), "ok"); }
  else if (r && r.msg) toast(t("set.import.fail", r.msg), "err");
  else toast(t("set.import.cancelled"), "info", 1500);
});
$("#btn-export-data").addEventListener("click", async () => {
  const r = rpc ? await rpc.exportData() : { ok: true, filePath: "(preview)" };
  if (r.ok) toast(t("exported", r.filePath || ""), "ok", 4000);
  else if (r && r.msg) toast(t("export.fail", r.msg), "err");
});
// 打开备份目录
$("#btn-open-backups").addEventListener("click", async () => { const r = await rpc.openPath("backupdir"); if (!r.ok) toast(t("open.fail", r.msg || ""), "err"); });
// 从最新自动备份恢复
$("#btn-restore-latest").addEventListener("click", async () => {
  if (!confirm(t("restore.latest.confirm"))) return;
  const r = await rpc.restoreLatestBackup();
  if (!r.ok) { toast(r.msg === "none" ? t("restore.latest.none") : t("restore.latest.fail", r.msg || ""), "err", 5000); return; }
  toast(t("restore.latest.ok", r.file || ""), "ok", 5000);
  BOOT_SETTINGS = await rpc.getSettings();
  await loadSettingsUI();
  SAVED_SNAPSHOT = JSON.stringify(collectSettings());
  updateDirtyUI();
  refreshHistory();
});
// 诊断页: 环境信息一键收集
$("#btn-envinfo").addEventListener("click", async () => {
  busy($("#btn-envinfo"), true);
  toast(t("env.running"), "info", 1500);
  showPage("diag");
  try { $("#diag-out").textContent = rpc ? await rpc.envInfo() : "(preview) env-info"; }
  catch (e) { $("#diag-out").textContent = String(e); }
  busy($("#btn-envinfo"), false);
});
$("#btn-import-data").addEventListener("click", async () => {
  if (!confirm(t("data.confirm"))) return;
  const r = rpc ? await rpc.importData() : { ok: false };
  if (r.ok) { await loadSettingsUI(); refreshHistory(); armNextCheck(); toast(t("data.restored"), "ok"); }
  else if (r && r.msg) toast(t("set.import.fail", r.msg), "err");
});
// 仪表盘: 下次自动检查倒计时
let nextCheckAt = null;
function armNextCheck() {
  const s = BOOT_SETTINGS;
  nextCheckAt = (s && s.auto_update && +s.auto_update_interval_min > 0)
    ? Date.now() + s.auto_update_interval_min * 60000 : null;
}
setInterval(() => {
  const el = $("#d-nextcheck");
  if (!el) return;
  if (!nextCheckAt) { el.textContent = ""; return; }
  const left = Math.max(0, Math.round((nextCheckAt - Date.now()) / 1000));
  if (left === 0) nextCheckAt = Date.now() + (BOOT_SETTINGS.auto_update_interval_min || 60) * 60000; // 触发后顺延
  const m = String(Math.floor(left / 60)).padStart(2, "0"), sec = String(left % 60).padStart(2, "0");
  const days = (BOOT_SETTINGS.sched_days || "").split(",").filter(Boolean);
  const schedTxt = days.length
    ? ` 　📅 ${t("sched.plan", days.map((d) => "周" + "日一二三四五六"[parseInt(d)] || d).join("/"), BOOT_SETTINGS.sched_time || "09:00")}`
    : "";
  el.textContent = t("nextcheck", m, sec) + schedTxt;
}, 1000);

// ---------------- 稍后提醒 (snooze) ----------------
function fmtTs(ts) { const d = new Date(ts), p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; }
function updateSnoozeUI(behind) {
  const row = $("#snooze-row"), status = $("#snooze-status"), off = $("#btn-snooze-off");
  if (!row) return;
  const until = (BOOT_SETTINGS && Number(BOOT_SETTINGS.snooze_until)) || 0;
  const active = until > Date.now();
  row.hidden = !(behind > 0 || active);
  off.classList.toggle("hidden", !active);
  status.textContent = active ? t("snooze.on", fmtTs(until)) : "";
}
async function doSnooze(h) {
  if (!rpc) return;
  const r = await rpc.snooze(h);
  if (r && r.ok) {
    if (BOOT_SETTINGS) BOOT_SETTINGS.snooze_until = r.until;
    toast(t("snooze.done", h), "info", 4000);
    updateSnoozeUI(1);
  }
}
$("#btn-snooze-1").addEventListener("click", () => doSnooze(1));
$("#btn-snooze-3").addEventListener("click", () => doSnooze(3));
$("#btn-snooze-6").addEventListener("click", () => doSnooze(6));
$("#btn-snooze-off").addEventListener("click", async () => {
  if (!rpc) return;
  const r = await rpc.snooze(0);
  if (r && r.ok) {
    if (BOOT_SETTINGS) BOOT_SETTINGS.snooze_until = 0;
    toast(t("snooze.off"), "ok");
    updateSnoozeUI(0);
  }
});
updateSnoozeUI(0); // 启动时若处于抑制期也显示状态行

// ---------------- 自动更新倒计时确认 ----------------
if (rpc && rpc.onAutoCountdown) rpc.onAutoCountdown((d) => {
  const bar = $("#countdown-bar");
  if (!bar) return;
  if (d.ended) { bar.classList.add("hidden"); return; }
  bar.classList.remove("hidden");
  $("#cd-text").textContent = t("cd.text", d.left, d.behind);
});
$("#btn-cd-go").addEventListener("click", () => { if (rpc) { rpc.countdownAction("go"); toast(t("cd.going"), "ok"); } });
$("#btn-cd-skip").addEventListener("click", () => { if (rpc) { rpc.countdownAction("skip"); toast(t("cd.skipped"), "info"); } });


// ---------------- 强调色 ----------------
const ACCENTS = {
  blue: ["#3B82F6", "#6366F1"], green: ["#10B981", "#14B8A6"], purple: ["#8B5CF6", "#6366F1"],
  orange: ["#F59E0B", "#F97316"], teal: ["#06B6D4", "#3B82F6"],
};
function applyAccent(name) {
  const [p, p2] = ACCENTS[name] || ACCENTS.blue;
  document.documentElement.style.setProperty("--primary", p);
  document.documentElement.style.setProperty("--primary2", p2);
}
$("#s-accent").addEventListener("change", async () => {
  const v = $("#s-accent").value;
  applyAccent(v);
  if (rpc) await rpc.saveSettings({ accent: v });
  toast(t("accent.applied", t("accent." + v)), "ok");
});

// ---------------- 通知中心 ----------------
let NOTIF_CACHE = [], unreadCount = 0;
function updateBadge() {
  const b = $("#notif-badge");
  if (unreadCount > 0) { b.hidden = false; b.textContent = unreadCount > 99 ? "99+" : String(unreadCount); }
  else b.hidden = true;
}
function renderNotifList() {
  const list = $("#notif-list"); list.innerHTML = "";
  if (!NOTIF_CACHE.length) { const d = document.createElement("div"); d.className = "hist-empty"; d.textContent = t("notif.empty"); list.appendChild(d); }
  for (const n of NOTIF_CACHE) {
    const row = document.createElement("div");
    row.className = "notif-item" + (n.read ? "" : " unread");
    const kindIcon = { newver: "⬆️", gw: "🔌", ok: "✅", fail: "❌", update: "🔄" }[n.kind] || "🔔";
    row.innerHTML = `<span>${kindIcon}</span><span class="n-time mono">${n.time || ""}</span><span class="n-text"></span>`;
    row.querySelector(".n-text").textContent = n.text || "";
    list.appendChild(row);
  }
}
async function openNotifDialog() {
  NOTIF_CACHE = rpc ? await rpc.getNotifications() : [];
  unreadCount = 0; updateBadge();
  renderNotifList();
  $("#notif-dialog").showModal();
  // 打开即标记全部已读 (持久化)
  NOTIF_CACHE.forEach((n) => { n.read = true; });
  if (rpc) rpc.markNotificationsRead();
}
$("#btn-notif").addEventListener("click", openNotifDialog);
$("#btn-notif-close").addEventListener("click", () => $("#notif-dialog").close());
$("#btn-notif-clear").addEventListener("click", async () => {
  if (rpc) await rpc.clearNotifications();
  NOTIF_CACHE = []; unreadCount = 0; updateBadge(); renderNotifList();
  toast(t("hist.cleared"), "ok", 1200);
});
if (rpc) rpc.onNotification((n) => { unreadCount++; updateBadge(); toast(`🔔 ${n.text}`, "info", 4000); });
// 启动时统计未读数
(async () => { if (rpc) { NOTIF_CACHE = await rpc.getNotifications(); unreadCount = NOTIF_CACHE.filter((n) => !n.read).length; updateBadge(); } })();

// ---------------- 配置方案 ----------------
function renderProfileList(profiles) {
  const sel = $("#s-prof-list");
  sel.innerHTML = "";
  for (const p of profiles) {
    const o = document.createElement("option");
    o.value = p.name; o.textContent = `${p.name} (${p.branch || "main"})`;
    sel.appendChild(o);
  }
}
$("#btn-prof-save").addEventListener("click", async () => {
  if (!rpc) return toast(t("st.preview"), "info");
  const name = $("#s-prof-name").value.trim();
  if (!name) return toast(t("prof.askname"), "err");
  const r = await rpc.saveProfile(name);
  if (r.ok) { renderProfileList(r.profiles || []); $("#s-prof-name").value = ""; toast(t("prof.saved", name), "ok"); }
});
$("#btn-prof-apply").addEventListener("click", async () => {
  if (!rpc) return toast(t("st.preview"), "info");
  const name = $("#s-prof-list").value;
  if (!name) return toast(t("prof.none"), "err");
  const r = await rpc.applyProfile(name);
  if (r.ok) { await loadSettingsUI(); toast(t("prof.applied", name), "ok"); refreshStatus(); }
});
$("#btn-prof-delete").addEventListener("click", async () => {
  if (!rpc) return toast(t("st.preview"), "info");
  const name = $("#s-prof-list").value;
  if (!name) return toast(t("prof.none"), "err");
  const r = await rpc.deleteProfile(name);
  if (r.ok) { renderProfileList(r.profiles || []); toast(t("prof.deleted", name), "ok"); }
});

// ---------------- 关于 / GitHub Releases ----------------
$("#btn-about").addEventListener("click", async () => {
  const info = rpc ? await rpc.getAppInfo() : { version: "(preview)", electron: "-", node: "-", dataDir: "-" };
  $("#about-ver").textContent = `v${info.version}`;
  $("#about-electron").textContent = info.electron || "-";
  $("#about-node").textContent = info.node || "-";
  $("#about-datadir").textContent = info.dataDir || "-";
  $("#about-dialog").showModal();
});
$("#btn-about-close").addEventListener("click", () => $("#about-dialog").close());
$("#btn-about-open").addEventListener("click", async () => { const r = await rpc.openPath("logdir"); if (!r.ok) toast(t("open.fail", r.msg || ""), "err"); });
$("#btn-releases").addEventListener("click", async () => {
  if (!rpc) return toast("(preview)", "info");
  toast(t("rb.fetching"), "info", 1500);
  const r = await rpc.openReleases();
  if (!r.ok) toast(t("open.fail", r.msg || ""), "err", 4000);
});

// ---------------- 翻译面板 (右侧栏: 实时翻译 + 手动翻译 + 拖拽调宽) ----------------
const TRANS_STATE = { q: [], timer: 0, busy: false };
const TRANS_LIST = () => $("#trans-list");
const stripTs = (l) => l.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, "");
function transOpen() { return document.body.classList.contains("trans-open"); }
function toggleTrans(force) {
  const open = force !== undefined ? force : !transOpen();
  document.body.classList.toggle("trans-open", open);
  $("#btn-trans").classList.toggle("active", open);
  toast(open ? t("trans.opened") : t("trans.closed"), "info", 1200);
  if (open) TRANS_LIST().scrollTop = TRANS_LIST().scrollHeight;
}
function transEnqueue(line) {
  if (!transOpen() || !rpc) return;
  if (BOOT_SETTINGS && BOOT_SETTINGS.translate_auto === false) return;
  const tgt = (BOOT_SETTINGS && BOOT_SETTINGS.translate_target) || "zh-CN";
  const raw = stripTs(line).trim();
  if (!raw || raw.length < 2) return;
  if (tgt.startsWith("zh") && !/[a-zA-Z]/.test(raw)) return; // 纯中文/符号行无需翻译
  TRANS_STATE.q.push(raw);
  clearTimeout(TRANS_STATE.timer);
  TRANS_STATE.timer = setTimeout(flushTrans, 900);
}
function addPair(src, pending) {
  const empty = TRANS_LIST().querySelector(".tr-empty");
  if (empty) empty.remove();
  const div = document.createElement("div");
  div.className = "tr-pair" + (pending ? " pending" : "");
  div.innerHTML = `<div class="tr-src"></div><div class="tr-dst"></div>`;
  div.querySelector(".tr-src").textContent = src;
  if (pending) div.querySelector(".tr-dst").textContent = "...";
  const nearBottom = TRANS_LIST().scrollTop + TRANS_LIST().clientHeight >= TRANS_LIST().scrollHeight - 60;
  TRANS_LIST().appendChild(div);
  if (nearBottom) TRANS_LIST().scrollTop = TRANS_LIST().scrollHeight;
  return div;
}
function fillPair(div, r) {
  div.classList.remove("pending");
  const dst = div.querySelector(".tr-dst");
  if (r && r.dst) {
    dst.textContent = r.dst;
    const via = t("via." + (r.via || "none"));
    if (via) { const tag = document.createElement("span"); tag.className = "tr-via"; tag.textContent = via; dst.appendChild(tag); }
  } else dst.textContent = t("trans.none");
}
async function flushTrans() {
  if (TRANS_STATE.busy) { TRANS_STATE.timer = setTimeout(flushTrans, 600); return; }
  const lines = [...new Set(TRANS_STATE.q.splice(0, 20))];
  if (!lines.length) return;
  TRANS_STATE.busy = true;
  const holders = lines.map((l) => addPair(l, true));
  let res = [];
  if (rpc) res = await rpc.translateLines(lines);
  holders.forEach((h, i) => fillPair(h, res[i]));
  TRANS_STATE.busy = false;
  if (TRANS_STATE.q.length) flushTrans();
}
$("#btn-trans").addEventListener("click", () => toggleTrans());
$("#btn-tclose").addEventListener("click", () => toggleTrans(false));
$("#btn-tclear").addEventListener("click", () => { TRANS_STATE.q.length = 0; TRANS_LIST().innerHTML = `<div class="tr-empty"></div>`; TRANS_LIST().querySelector(".tr-empty").textContent = t("trans.hint"); });
$("#btn-tall").addEventListener("click", async () => {
  if (!rpc) return toast(t("st.preview"), "info");
  const lines = [...new Set(UPDATE_LINES.slice(-200).map(stripTs).map((l) => l.trim()).filter((l) => l.length >= 2))];
  if (!lines.length) return toast(t("diag.empty"), "info", 1500);
  TRANS_STATE.q.length = 0; clearTimeout(TRANS_STATE.timer);
  const holders = lines.map((l) => addPair(l, true));
  for (let i = 0; i < lines.length; i += 20) {
    const res = await rpc.translateLines(lines.slice(i, i + 20));
    holders.slice(i, i + 20).forEach((h, j) => fillPair(h, res[j]));
  }
  toast(t("trans.done", lines.length), "ok");
});
async function manualTranslate() {
  const v = $("#tr-input").value.trim();
  if (!v) return toast(t("trans.empty"), "info", 1500);
  $("#tr-input").value = "";
  const h = addPair(v, true);
  const res = rpc ? await rpc.translateLines([v]) : [{ src: v, dst: "(preview)", via: "none" }];
  fillPair(h, res[0]);
}
$("#tr-go").addEventListener("click", manualTranslate);
$("#tr-input").addEventListener("keydown", (e) => { if (e.key === "Enter") manualTranslate(); });
// 拖拽调宽: 拖动分隔条改变面板宽度, 松开持久化; 双击恢复默认
(() => {
  const panel = $("#trans-panel"), rz = $("#trans-resize");
  let drag = null;
  rz.addEventListener("mousedown", (e) => { drag = { x: e.clientX, w: panel.getBoundingClientRect().width }; e.preventDefault(); });
  window.addEventListener("mousemove", (e) => {
    if (!drag) return;
    const w = Math.min(Math.max(drag.w - (e.clientX - drag.x), 240), Math.min(640, window.innerWidth - 320));
    panel.style.width = w + "px";
  });
  window.addEventListener("mouseup", () => {
    if (!drag) return;
    drag = null;
    const w = parseInt(panel.style.width) || 340;
    if (rpc) rpc.saveSettings({ translate_panel_width: w });
  });
  rz.addEventListener("dblclick", () => { panel.style.width = "340px"; if (rpc) rpc.saveSettings({ translate_panel_width: 340 }); });
})();

// ---------------- 启动 ----------------
if (rpc) {
  rpc.onNav((key) => showPage(key));
  rpc.onDoCheck(() => { refreshStatus(true); });
}
loadSettingsUI().then(() => armNextCheck());
document.body.classList.add("booting");   // 卡片骨架屏, 快速填充完成后撤下
refreshQuick();                            // 1~2 秒先填版本/Gateway/网络方式
if (BOOT_SETTINGS?.check_on_start !== false) refreshStatus(); else setStatus(t("st.readyNoCheck"), "");
refreshHistory();
setInterval(() => { if (!updating) refreshStatus(); }, Math.max(parseInt(BOOT_SETTINGS?.refresh_interval_sec) || 30, 10) * 1000);

// UI 就绪: 淡出启动加载画面 (后台继续检查版本)
const bl = $("#boot-loader");
if (bl) { bl.classList.add("done"); setTimeout(() => bl.remove(), 500); }

toast(t("app.started"), "ok", 1800);

// ---------------- 安装 Hermes 页 ----------------
let installing = false;

function insAppend(line) {
  const el = $("#ins-out");
  if (!el) return;
  if (el.getAttribute("data-i18n")) el.removeAttribute("data-i18n"), (el.textContent = "");
  el.textContent += (el.textContent ? "\n" : "") + line;
  if (el.textContent.length > 60000) el.textContent = el.textContent.slice(-40000);
  el.scrollTop = el.scrollHeight;
}
function insProgress(pct, text) {
  const bar = $("#ins-progress-bar"), wrap = $("#ins-progress");
  if (!wrap) return;
  wrap.hidden = false;
  bar.style.width = `${Math.min(Math.max(pct, 2), 100)}%`;
  wrap.title = text || "";
}
function insSetBusy(b) {
  installing = b;
  ["#btn-ins-start", "#btn-ins-fix", "#btn-ins-uninstall", "#btn-ins-vers", "#btn-ins-preflight"].forEach((s) => { const el = $(s); if (el) el.disabled = b; });
  $("#btn-ins-cancel").classList.toggle("hidden", !b);
  if (!b) setTimeout(() => { const w = $("#ins-progress"); if (w && !installing) w.hidden = true; }, 2500);
}
async function refreshInsHist() {
  if (!rpc) return;
  const list = await rpc.getInstallHistory();
  const el = $("#ins-hist");
  el.textContent = list.length ? list.map((h) => t("ins.hist.line", h)).join("\n") : t("ins.hist.empty");
}

async function runInsPreflight() {
  const btn = $("#btn-ins-preflight");
  busy(btn, true);
  const r = await rpc.installPreflight($("#ins-dir").value.trim());
  busy(btn, false);
  const cell = (ok, name, verTxt) => `<span class="ins-env-item ${ok ? "ok" : "bad"}"><b>${ok ? t("ins.env.ok") : t("ins.env.missing")}</b> ${name}${verTxt ? ` <span class="muted">${verTxt}</span>` : ""}</span>`;
  $("#ins-env").innerHTML = [
    cell(r.node.ok, t("ins.env.node"), r.node.ver),
    cell(r.npm.ok, t("ins.env.npm"), r.npm.ver),
    cell(r.git.ok, t("ins.env.git"), r.git.ver),
    `<span class="ins-env-item"><b>💾</b> ${t("ins.env.disk")}: <b>${r.freeGB ?? "?"}</b> GB</span>`,
    `<span class="ins-env-item"><b>📁</b> ${t("ins.env.dir")}: ${t("ins.env.dir." + r.dirState)}</span>`,
  ].join("");
  toast(t("ins.preflight.ran"), "ok");
}
$("#btn-ins-preflight").addEventListener("click", runInsPreflight);

$("#btn-ins-dir-browse").addEventListener("click", async () => {
  const r = await rpc.browseInstallPath();
  if (r && r.ok) $("#ins-dir").value = r.path;
});

$("#btn-ins-vers").addEventListener("click", async () => {
  const btn = $("#btn-ins-vers");
  busy(btn, true);
  const r = await rpc.getInstallVersions();
  busy(btn, false);
  if (!r || !r.ok) { toast(t("ins.vers.fail"), "err", 4000); return; }
  $("#ins-ver-list").innerHTML = [...r.branches, ...r.tags].map((v) => `<option value="${v}">`).join("");
  toast(t("ins.vers.ok", r.branches.length, r.tags.length), "ok");
});

async function doStartInstall() {
  const repo = $("#ins-repo").value.trim(), ver = ($("#ins-ver").value.trim() || "main"), dir = $("#ins-dir").value.trim();
  if (!repo || !dir) { toast(t("ins.uninst.ask"), "warn", 3500); return; }
  if (!confirm(t("ins.start.confirm", ver, dir))) return;
  const el = $("#ins-out");
  el.removeAttribute("data-i18n");
  el.textContent = "";
  insSetBusy(true);
  insProgress(2, ver);
  toast(t("ins.starting"), "ok");
  await rpc.startInstall({ repo, ver, dir });
}
$("#btn-ins-start").addEventListener("click", doStartInstall);
$("#btn-ins-fix").addEventListener("click", doStartInstall);
$("#btn-ins-cancel").addEventListener("click", () => rpc.cancelInstall());

// ---------------- 多模式卸载套件 ----------------
let UNINS_LAST = null;
const baseName = (p) => String(p || "").split(/[\\/]/).filter(Boolean).pop() || "";
async function openUninstall() {
  const panel = $("#unins-panel"), info = $("#unins-info");
  const d = $("#ins-dir").value.trim();
  panel.hidden = false;
  $("#unins-result").textContent = "";
  $("#u-mode").value = $("#s-unins-mode").value || "trash";
  $("#u-backup").checked = $("#s-unins-backup").checked;
  $("#u-stop").checked = $("#s-unins-stop").checked;
  $("#unins-confirm-row").hidden = true;
  info.innerHTML = `<span class="muted">${t("unins.checking")}</span>`;
  const r = await rpc.uninstallPreflight(d);
  UNINS_LAST = r;
  if (!r || !r.exists) {
    UNINS_LAST = null;
    info.innerHTML = `<span class="muted">⚠️ ${t("unins.missing")}: ${escHtml(d)}</span>`;
    return;
  }
  const yn = (b) => (b ? t("unins.yes") : t("unins.no"));
  info.innerHTML = `
    <div class="rb-item">📁 <b class="mono">${escHtml(r.dir)}</b></div>
    <div class="rb-item">${t("unins.info.size")}: <b>${r.sizeGB ?? "?"} GB</b> · ${t("unins.info.repo")}: ${yn(r.isRepo)} · ${t("unins.info.config")}: ${yn(r.hasConfig)} · ${t("unins.info.agent")}: ${yn(r.hasAgent)}</div>
    <div class="rb-item">${t("unins.info.procs")}: <b>${r.procs ?? 0}</b></div>`;
  $("#unins-confirm-row").hidden = !($("#u-mode").value === "permanent" && $("#s-unins-strict").checked);
}
$("#btn-ins-uninstall").addEventListener("click", openUninstall);
$("#btn-unins-close").addEventListener("click", () => { $("#unins-panel").hidden = true; });
$("#u-mode").addEventListener("change", () => {
  $("#unins-confirm-row").hidden = !($("#u-mode").value === "permanent" && $("#s-unins-strict").checked);
});
$("#btn-unins-run").addEventListener("click", async () => {
  const d = $("#ins-dir").value.trim(), mode = $("#u-mode").value;
  if (!UNINS_LAST || !UNINS_LAST.exists) { toast(t("unins.missing"), "warn", 3500); return; }
  if (mode === "permanent") {
    const name = baseName(d);
    if ($("#s-unins-strict").checked && ($("#u-confirm").value || "").trim().toLowerCase() !== name.toLowerCase()) {
      toast(t("unins.strict.hint", name), "warn", 4500);
      return;
    }
    if (!confirm(t("unins.permanent.confirm", d))) return;
  }
  busy($("#btn-unins-run"), true);
  const r = await rpc.uninstallHermes(d, mode, { backup: $("#u-backup").checked, stop_procs: $("#u-stop").checked });
  busy($("#btn-unins-run"), false);
  if (r && r.ok) {
    $("#unins-result").textContent = t("unins.done", r.note || mode);
    toast(t("unins.done", r.note || mode), "ok", 5000);
    refreshInsHist();
    loadSettingsUI();
  } else if (r && r.msg) toast(t("unins.fail", r.msg), "err", 5000);
});

rpc.onInstallLine((l) => insAppend(l));
rpc.onInstallStage((d) => insProgress(d.pct, d.text));
rpc.onInstallDone((d) => {
  insSetBusy(false);
  if (d.ok) toast(t("ins.done.ok", d.dur, d.note), "ok", 6000);
  else if (String(d.note).includes("取消")) toast(t("ins.done.cancel"), "warn", 5000);
  else toast(t("ins.done.fail", d.rc, d.note), "err", 6000);
  refreshInsHist();
});
rpc.onInstallHistoryUpdated(() => refreshInsHist());

// ---------------- 安装镜像源测速 + 一键应用 ----------------
$("#btn-ins-mirror").addEventListener("click", async () => {
  const panel = $("#ins-mirror-panel"), list = $("#ins-mirror-list"), cur = $("#ins-mirror-cur");
  panel.hidden = false;
  list.innerHTML = `<div class="rb-item muted">${t("ins.mirror.loading")}</div>`;
  const r = await rpc.installMirrorTest();
  if (!r || !r.ok) { list.innerHTML = `<div class="rb-item">${t("wn.fail", "?")}</div>`; return; }
  cur.textContent = `${t("ins.mirror.cur", r.repo)} · ${t("ins.mirror.eff", r.effective)}`;
  list.innerHTML = r.results.map((x, i) => {
    const lv = x.level === "git" ? t("ins.mirror.okgit") : x.level === "http" ? t("ins.mirror.okhttp") : t("ins.mirror.fail");
    return `<div class="rb-item">${x.ok ? "✅" : "❌"} <b>${i === 0 && x.ok ? `⭐ ${t("ins.mirror.fastest")}` : ""}</b> ${x.mirror ? escHtml(x.mirror) : t("ins.mirror.direct")} <span class="muted">${x.ms}ms · ${lv}</span><span class="tr-flex"></span><button class="btn sm" data-insmirror="${escHtml(x.mirror)}" ${x.ok ? "" : "disabled"}>${t("ins.mirror.apply")}</button></div>`;
  }).join("");
  list.querySelectorAll("[data-insmirror]").forEach((btn) => btn.addEventListener("click", async () => {
    const m = btn.dataset.insmirror; // "" = 直连
    const ar = await rpc.saveSettings({ ins_mirror_url: m });
    if (ar && ar.ok) {
      $("#s-ins-mirror").value = m;
      SAVED_SNAPSHOT = JSON.stringify(collectSettings());
      updateDirtyUI();
      toast(t("ins.mirror.applied", m), "ok", 4000);
      cur.textContent = `${t("ins.mirror.cur", r.repo)} · ${t("ins.mirror.eff", m)}`;
    }
  }));
});

// ---------------- 空间清理向导 ----------------
function diagAppend(l) {
  const el = $("#diag-out");
  if (!el) return;
  el.textContent += (el.textContent ? "\n" : "") + l;
  el.scrollTop = el.scrollHeight;
}
$("#btn-cleanup").addEventListener("click", async () => {
  const btn = $("#btn-cleanup"), panel = $("#cleanup-panel"), list = $("#cleanup-list");
  busy(btn, true);
  diagAppend(`$ ${t("cln.scanning")}`);
  const r = await rpc.cleanupScan();
  busy(btn, false);
  panel.hidden = false;
  if (!r.ok) { diagAppend(`[清理] ${r.msg}`); return; }
  if (!r.items.length) {
    list.innerHTML = `<span class="muted">${t("cln.none")}</span>`;
    $("#cln-summary").textContent = "";
    diagAppend(`[清理] ${t("cln.none")}`);
    return;
  }
  const labels = { npmcache: t("cln.npmcache"), oldbackups: t("cln.oldbackups"), applog: t("cln.applog") };
  list.innerHTML = r.items.map((it) => {
    const size = it.key === "oldbackups" ? (it.note || "") : `${(it.sizeMB || 0).toFixed(1)} MB`;
    return `<label class="check"><input type="checkbox" checked data-cln="${it.key}"><span>${labels[it.key] || it.key} <span class="muted">(${size})</span></span></label>`;
  }).join("");
  const total = r.items.reduce((a, b) => a + (b.sizeMB || 0), 0);
  $("#cln-summary").textContent = t("cln.total", Math.round(total));
  diagAppend(`[清理] ${t("cln.total", Math.round(total))} — ${r.items.map((i) => labels[i.key]).join(", ")}`);
});
$("#btn-cleanup-run").addEventListener("click", async () => {
  const keys = [...document.querySelectorAll("[data-cln]")].filter((c) => c.checked).map((c) => c.dataset.cln);
  if (!keys.length) return;
  busy($("#btn-cleanup-run"), true);
  diagAppend(`$ ${t("cln.cleaning")}`);
  const r = await rpc.cleanupRun(keys);
  busy($("#btn-cleanup-run"), false);
  if (r && r.ok) { diagAppend(`[清理] ${t("cln.done", r.freedMB)}`); toast(t("cln.done", r.freedMB), "ok", 5000); }
  else { diagAppend(`[清理] ${t("cln.fail")}: ${(r && r.msg) || ""}`); toast(t("cln.fail"), "err", 5000); }
  $("#cleanup-panel").hidden = true;
});
rpc.onCleanupLine((l) => diagAppend(l));

// ---------------- 一键网络自愈 ----------------
$("#btn-netheal").addEventListener("click", async () => {
  const btn = $("#btn-netheal");
  busy(btn, true);
  diagAppend(`$ ${t("heal.start")}`);
  const r = await rpc.speedTest();
  if (Array.isArray(r)) {
    const best = r.find((x) => x.ok);
    if (best) {
      const ar = await rpc.applyNetMethod(best.key);
      diagAppend(`[自愈] ${t("heal.apply", best.label)} (${best.ms}ms)${ar && ar.ok ? "" : " [切换失败]"}`);
      toast(t("heal.apply", best.label), ar && ar.ok ? "ok" : "err", 5000);
      if (ar && ar.ok) refreshStatus();
    } else {
      diagAppend(`[自愈] ${t("heal.none")}`);
      toast(t("heal.none"), "err", 6000);
    }
  } else diagAppend(`[自愈] speedtest IPC 异常`);
  busy(btn, false);
});

// ---------------- What's New 更新内容预览 ----------------
let WN_LAST = null;
function escHtml(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
async function loadWhatsNew() {
  const panel = $("#whatsnew-panel"), list = $("#whatsnew-list");
  panel.hidden = false;
  list.innerHTML = `<div class="rb-item muted">${t("wn.loading")}</div>`;
  const r = await rpc.whatsNew();
  if (!r || !r.ok) { list.innerHTML = `<div class="rb-item">${t("wn.fail", (r && r.msg) || "?")}</div>`; return; }
  WN_LAST = r;
  if (!r.commits.length) { list.innerHTML = `<div class="rb-item muted">${t("wn.empty")}</div>`; return; }
  list.innerHTML = `<div class="rb-item muted">${t("wn.total", r.total, r.branch)}</div>` + r.commits.map((c) =>
    `<div class="rb-item"><b class="mono">${escHtml(c.hash)}</b> <span class="muted" style="font-size:11px">${escHtml((c.date || "").slice(0, 10))} ${escHtml(c.author)}</span><span class="tr-flex"></span><span style="max-width:52%">${escHtml(c.msg)}</span></div>`
  ).join("");
}
$("#btn-whatsnew").addEventListener("click", loadWhatsNew);
$("#btn-wn-refresh").addEventListener("click", loadWhatsNew);
$("#btn-wn-export").addEventListener("click", async () => {
  if (!WN_LAST || !WN_LAST.commits || !WN_LAST.commits.length) { toast(t("wn.empty"), "warn", 3000); return; }
  const body = [`What's New (origin/${WN_LAST.branch}) — ${new Date().toLocaleString()}`, `${WN_LAST.total} commit(s) behind`, ""]
    .concat(WN_LAST.commits.map((c) => `${c.hash}  ${(c.date || "").slice(0, 10)}  ${c.author}  ${c.msg}`)).join("\n");
  const r = await rpc.exportText(`whats-new-${new Date().toISOString().slice(0, 10)}.txt`, body);
  if (r && r.ok) toast(t("wn.exported"), "ok", 4000);
});

// ---------------- Hermes 进程管理器 ----------------
async function loadProcs() {
  const panel = $("#proc-panel"), list = $("#proc-list");
  panel.hidden = false;
  list.innerHTML = `<div class="rb-item muted">${t("proc.loading")}</div>`;
  const r = await rpc.procList();
  if (!r || !r.ok) { list.innerHTML = `<div class="rb-item">${t("wn.fail", (r && r.msg) || "?")}</div>`; return; }
  if (!r.list.length) { list.innerHTML = `<div class="rb-item muted">${t("proc.empty")}</div>`; return; }
  list.innerHTML = r.list.map((p) =>
    `<div class="rb-item">⚙️ <b>${p.pid}</b> <span class="mono" style="font-size:11px">${escHtml(p.name)}</span> <span class="muted">${p.memMB} MB</span>${p.gateway ? ` <span class="muted">🏷️ ${t("proc.gateway")}</span>` : ""}<span class="tr-flex"></span><button class="btn sm warn" data-pkill="${p.pid}">${t("proc.kill")}</button></div>`
  ).join("");
  list.querySelectorAll("[data-pkill]").forEach((btn) => btn.addEventListener("click", async () => {
    const pid = parseInt(btn.dataset.pkill);
    if (!confirm(t("proc.confirm", pid))) return;
    busy(btn, true);
    const kr = await rpc.procKill(pid);
    busy(btn, false);
    if (kr && kr.ok) { toast(t("proc.killed", pid), "ok", 3000); diagAppend(`[进程] ${t("proc.killed", pid)}`); loadProcs(); }
    else toast(t("proc.killedfail", pid), "err", 4000);
  }));
}
$("#btn-proclist").addEventListener("click", loadProcs);
$("#btn-proc-refresh").addEventListener("click", loadProcs);

// ---------------- 更新统计 ----------------
$("#btn-upstats").addEventListener("click", async () => {
  const panel = $("#stats-panel"), el = $("#d-upstats");
  panel.hidden = false;
  const s = await rpc.updateStats();
  if (!s || !s.total) { el.innerHTML = `<div class="rb-item muted">${t("stats.nodata")}</div>`; return; }
  const seg = (v, mx, color) => v > 0 ? `<span style="width:${(v / Math.max(mx, 1) * 100).toFixed(1)}%;background:${color}"></span>` : "";
  const maxMonth = Math.max(...s.months.map((m) => m.ok + m.fail + m.cancel), 1);
  const strip = (x) => String(x || "").replace(/^原因[:：]\s*/, "").replace(/^reason:\s*/i, "");
  el.innerHTML = `
    <div class="stat-cards">
      <div class="stat-card"><label>${t("stats.total")}</label><b>${s.total}</b></div>
      <div class="stat-card"><label>${t("stats.rate")}</label><b>${s.rate}%</b></div>
      <div class="stat-card"><label>${t("stats.avgdur")}</label><b>${s.avgDur}s</b></div>
      <div class="stat-card"><label>${t("stats.thismonth")}</label><b style="font-size:14px">${s.thisMonth.ok}/${s.thisMonth.fail}/${s.thisMonth.cancel}</b></div>
    </div>
    <div class="stat-line"><b>${t("stats.monthly")}</b></div>
    ${s.months.map((m) => `<div class="stat-bar-row"><span class="mono" style="width:64px">${m.month}</span><span class="stat-bar-track">${seg(m.ok, maxMonth, "#22C55E")}${seg(m.cancel, maxMonth, "#94A3B8")}${seg(m.fail, maxMonth, "#EF4444")}</span><span class="muted" style="width:88px;text-align:right">${m.ok}/${m.fail}/${m.cancel}</span></div>`).join("")}
    ${s.labels.length ? `<div class="stat-line"><b>${t("stats.bylabel")}</b></div>` + s.labels.map((l) => `<div class="stat-bar-row"><span style="width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(l.label)}</span><span class="muted">${t("stats.ok")} ${l.ok} · ${t("stats.fail")} ${l.fail} · ${t("stats.cancel")} ${l.cancel}</span></div>`).join("") : ""}
    ${s.reasons.length ? `<div class="stat-line"><b>${t("stats.byreason")}</b></div>` + s.reasons.map((r) => `<div class="stat-bar-row"><span style="width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(strip(r.reason))}</span><span class="muted">× ${r.n}</span></div>`).join("") : ""}
  `;
});

// ---------------- 备份列表 + 任意恢复 ----------------
$("#btn-backup-list").addEventListener("click", async () => {
  const panel = $("#backup-list-panel"), list = $("#backup-list");
  const items = await rpc.listBackups();
  panel.hidden = false;
  if (!items.length) { list.innerHTML = `<div class="rb-item">${t("bkp.empty")}</div>`; return; }
  list.innerHTML = `<div class="rb-item muted">${t("bkp.list.title")}</div>` + items.map((b) =>
    `<div class="rb-item">📦 <b>${b.time}</b> <span class="muted">(${b.sizeKB} KB)</span> <span class="tr-flex"></span><button class="btn sm" data-restore="${b.file}">${t("bkp.restore")}</button></div>`
  ).join("");
  list.querySelectorAll("[data-restore]").forEach((btn) => btn.addEventListener("click", async () => {
    const f = btn.dataset.restore;
    if (!confirm(t("bkp.restore.confirm", f))) return;
    busy(btn, true);
    const r = await rpc.restoreBackup(f);
    busy(btn, false);
    if (r && r.ok) { toast(t("bkp.restored", f), "ok", 5000); loadSettingsUI(); }
    else toast((r && r.msg) || "fail", "err", 5000);
  }));
});

// ---------------- 仪表盘快捷中心: 安装 · 卸载 · 维护 (v2.22.0) ----------------
const DT_MODE_KEY = { trash: "unins.m.trash", modules: "unins.m.modules", permanent: "unins.m.perm", unregister: "unins.m.unreg" };
function dtTargets() {
  const s = BOOT_SETTINGS || {};
  return [...new Set([(s.install_path || ""), ...(s.path_history || [])])].filter(Boolean);
}
async function loadDashTools() {
  const qc = $("#qc-tools"), histPanel = $("#dash-hist-panel");
  const s = BOOT_SETTINGS;
  if (!s || s.dash_tools === false) { qc.hidden = true; histPanel.hidden = true; return; }
  qc.hidden = false;
  const sel = $("#dt-target");
  const cur = sel.value;
  sel.innerHTML = dtTargets().map((p) => `<option value="${escHtml(p)}">${escHtml(p)}${p === s.install_path ? ` (${t("dt.current")})` : ""}</option>`).join("") || `<option value="">—</option>`;
  if (cur && [...sel.options].some((o) => o.value === cur)) sel.value = cur;
  $("#dt-mode").value = ["trash", "modules", "permanent", "unregister"].includes(s.unins_default_mode) ? s.unins_default_mode : "trash";
  await dtRenderStatus();
  dtRenderHist();
}
async function dtRenderStatus() {
  const el = $("#dash-tool-status");
  const target = $("#dt-target").value;
  if (!target || !rpc) { el.innerHTML = `<div class="rb-item muted">${t("dt.needtarget")}</div>`; return; }
  el.innerHTML = `<div class="rb-item muted">${t("unins.checking")}</div>`;
  const c = await rpc.checkInstallPath(target);
  const s = BOOT_SETTINGS || {};
  const yn = (b) => (b ? "✅" : "❌");
  el.innerHTML = `<div class="rb-item">📁 <b class="mono">${escHtml(target)}</b>${target === s.install_path ? ` <span class="muted">(${t("dt.current")})</span>` : ""}</div>
    <div class="rb-item">${t("dt.status")}: <b>${c && c.valid ? t("dt.valid") : t("dt.invalid")}</b> · ${t("dt.disk")}: ${c && c.freeGB != null ? c.freeGB + " GB" : "?"} · ${t("dt.git")}: ${yn(c && c.hasGit)} · ${t("dt.cmd")}: ${yn(c && c.hasCmd)} · ${t("dt.agent")}: ${yn(c && c.hasAgent)}</div>`;
}
function dtRenderHist() {
  const s = BOOT_SETTINGS || {};
  const panel = $("#dash-hist-panel");
  if (s.dash_install_hist === false) { panel.hidden = true; return; }
  panel.hidden = false;
  const n = Math.min(Math.max(parseInt(s.dash_hist_rows) || 3, 1), 10);
  rpc.getInstallHistory().then((list) => {
    const rows = (list || []).slice(0, n);
    $("#dash-hist-list").innerHTML = rows.length ? rows.map((x) =>
      `<div class="rb-item">${x.result === "ok" ? "✅" : x.result === "uninstall" ? "🗑️" : x.result === "cancel" ? "⛔" : "❌"} <b class="mono" style="font-size:11px">${escHtml(x.dir || "")}</b> <span class="muted">${escHtml(x.time || "")} · ${escHtml(x.note || x.result || "")}</span></div>`
    ).join("") : `<div class="rb-item muted">${t("dt.none")}</div>`;
  });
}
$("#btn-dash-refresh").addEventListener("click", loadDashTools);
$("#dt-target").addEventListener("change", dtRenderStatus);
$("#btn-dt-preflight").addEventListener("click", dtRenderStatus);
$("#btn-dt-backup").addEventListener("click", async () => {
  const d = $("#dt-target").value;
  if (!d) { toast(t("dt.needtarget"), "warn", 3000); return; }
  busy($("#btn-dt-backup"), true);
  const r = await rpc.backupInstallConfig(d);
  busy($("#btn-dt-backup"), false);
  if (r && r.ok) { $("#dt-result").textContent = t("dt.backup.done", r.dst); toast(t("dt.backup.done", r.dst), "ok", 5000); }
  else toast(t("unins.fail", (r && r.msg) || "?"), "err", 4000);
});
$("#btn-dt-unregister").addEventListener("click", async () => {
  const d = $("#dt-target").value;
  if (!d) { toast(t("dt.needtarget"), "warn", 3000); return; }
  if ((BOOT_SETTINGS || {}).dash_unins_confirm !== false && !confirm(t("dt.confirm.unins", d, t("unins.m.unreg")))) return;
  const r = await rpc.uninstallHermes(d, "unregister", {});
  if (r && r.ok) { $("#dt-result").textContent = t("unins.done", r.note || ""); toast(t("unins.done", r.note || ""), "ok", 4000); loadDashTools(); }
  else toast(t("unins.fail", (r && r.msg) || "?"), "err", 4000);
});
$("#btn-dt-unins").addEventListener("click", async () => {
  const d = $("#dt-target").value, mode = $("#dt-mode").value;
  if (!d) { toast(t("dt.needtarget"), "warn", 3000); return; }
  if (mode === "permanent") {
    if (!confirm(t("unins.permanent.confirm", d))) return;
  } else if ((BOOT_SETTINGS || {}).dash_unins_confirm !== false && !confirm(t("dt.confirm.unins", d, t(DT_MODE_KEY[mode] || "unins.m.trash")))) return;
  busy($("#btn-dt-unins"), true);
  const r = await rpc.uninstallHermes(d, mode, { backup: (BOOT_SETTINGS || {}).unins_backup !== false, stop_procs: (BOOT_SETTINGS || {}).unins_stop_procs !== false });
  busy($("#btn-dt-unins"), false);
  if (r && r.ok) { $("#dt-result").textContent = t("unins.done", r.note || mode); toast(t("unins.done", r.note || mode), "ok", 5000); loadDashTools(); refreshStatus(); }
  else if (r && r.msg) toast(t("unins.fail", r.msg), "err", 5000);
});
$("#btn-dt-repair").addEventListener("click", async () => {
  const s = BOOT_SETTINGS || {};
  const d = $("#dt-target").value || s.install_path;
  if (!d) { toast(t("dt.needtarget"), "warn", 3000); return; }
  if (!confirm(t("dt.confirm.repair", d))) return;
  $("#ins-repo").value = s.ins_repo || "";
  $("#ins-ver").value = s.ins_branch || "main";
  $("#ins-dir").value = d;
  showPage("install");
  toast(t("dt.repair.started"), "ok", 4000);
  doStartInstall();
});
$("#btn-dt-goinstall").addEventListener("click", () => showPage("install"));

// ---------------- v2.23.0: 更新目标选择器 ----------------
let __changelogData = null;
function targetLabel(s) {
  if (!s) return t("upd.target.none");
  const i = s.indexOf(":");
  const kind = i > 0 ? s.slice(0, i) : "", name = i > 0 ? s.slice(i + 1) : s;
  return kind === "tag" ? `🏷️ ${name}` : kind === "branch" ? `🌿 ${name}` : s;
}
function refreshTargetCurrent() {
  rpc.getSettings().then((s) => { $("#target-cur").textContent = t("upd.target.cur") + targetLabel(s.upd_target || ""); }).catch(() => {});
}
function fillTargetSelect(sel, targets) {
  const groups = [
    [t("upd.target.group.branch"), targets.branches.map((b) => [`branch:${b}`, `🌿 ${b}`])],
    [t("upd.target.group.tag"), targets.tags.map((g) => [`tag:${g}`, `🏷️ ${g}`])],
  ];
  sel.innerHTML = groups.map(([label, items]) =>
    items.length ? `<optgroup label="${escHtml(label)}">${items.map(([v, txt]) => `<option value="${escHtml(v)}">${escHtml(txt)}</option>`).join("")}</optgroup>` : ""
  ).join("");
}
$("#btn-target-refresh").addEventListener("click", async () => {
  const sel = $("#upd-target-sel");
  sel.innerHTML = `<option>${escHtml(t("upd.target.fetching"))}</option>`;
  const r = await rpc.updateTargets();
  if (!r.ok) { toast(t("upd.target.fail", r.msg || ""), "err", 4000); sel.innerHTML = ""; return; }
  fillTargetSelect(sel, r);
  const cur = String((await rpc.getSettings()).upd_target || "");
  if (cur) sel.value = cur;
  $("#target-cur").textContent = `${t("upd.target.cur")}${targetLabel(cur)} · HEAD: ${escHtml(r.current || "?")}`;
});
$("#btn-target-apply").addEventListener("click", async () => {
  const v = $("#upd-target-sel").value;
  if (!v) return;
  const r = await rpc.setUpdateTarget(v);
  if (r.ok) { toast(t("upd.target.applied"), "ok"); refreshTargetCurrent(); }
  else toast(`${t("upd.target.fail", "")} ${escHtml(r.msg || "")}`, "err", 5000);
});
$("#btn-target-clear").addEventListener("click", async () => {
  await rpc.saveSettings({ upd_target: "" });
  toast(t("upd.target.cleared"), "ok");
  refreshTargetCurrent();
});

// ---------------- v2.23.0: 更新日志中心 ----------------
function renderChangelog() {
  const q = ($("#changelog-search").value || "").toLowerCase().trim();
  const list = $("#changelog-list");
  if (!__changelogData || !__changelogData.ok) { list.innerHTML = `<div class="muted">${escHtml(t("upd.cl.idle"))}</div>`; return; }
  let html = "";
  let shown = 0;
  for (const g of __changelogData.groups) {
    const cs = g.commits.filter((c) => !q || (c.msg + " " + c.author + " " + c.hash).toLowerCase().includes(q));
    if (!cs.length) continue;
    shown += cs.length;
    html += `<div class="cl-group"><b class="cl-tag">${g.tag ? `🏷️ ${escHtml(g.tag)}` : `⭐ ${escHtml(t("upd.cl.ungrouped"))}`}</b> <span class="muted">${escHtml(g.hash)} · ${escHtml(g.date)} · ${cs.length} ${escHtml(t("upd.cl.commits"))}</span>`;
    html += cs.map((c) => `<div class="rb-item"><code>${escHtml(c.hash)}</code> ${escHtml(c.msg)} <span class="muted">${escHtml(c.author)} · ${escHtml(c.date)}</span></div>`).join("");
    html += `</div>`;
  }
  list.innerHTML = html || `<div class="muted">${escHtml(t("upd.cl.empty"))}</div>`;
  $("#changelog-meta").textContent = `${__changelogData.total} ${escHtml(t("upd.cl.commits"))}${q ? ` · ${shown} ✓` : ""}`;
  $("#btn-changelog-export").disabled = !__changelogData.groups.length;
}
$("#btn-changelog-fetch").addEventListener("click", async () => {
  const list = $("#changelog-list");
  list.innerHTML = `<div class="muted">${escHtml(t("upd.cl.loading"))}</div>`;
  const r = await rpc.changelogFetch();
  __changelogData = r;
  if (!r.ok) { list.innerHTML = `<div class="muted">⚠️ ${escHtml(t("upd.cl.notgit"))}</div>`; $("#btn-changelog-export").disabled = true; return; }
  renderChangelog();
});
$("#changelog-search").addEventListener("input", renderChangelog);
$("#btn-changelog-export").addEventListener("click", async () => {
  if (!__changelogData || !__changelogData.ok) return;
  const lines = [`# Hermes 更新日志`, ``];
  for (const g of __changelogData.groups) {
    lines.push(`## ${g.tag || t("upd.cl.ungrouped")} (${g.date || "-"})`);
    for (const c of g.commits) lines.push(`- \`${c.hash}\` ${c.msg} _${c.author}_`);
    lines.push("");
  }
  const r = await rpc.exportText(`hermes-changelog-${new Date().toISOString().slice(0, 10)}.md`, lines.join("\n"));
  if (r && r.ok) toast(`${t("upd.cl.exported")} ✔ ${r.filePath || ""}`, "ok", 4000);
});

// ---------------- v2.23.0: 更新钩子管理 ----------------
let __hooks = [];
function renderHooks() {
  const box = $("#hooks-list");
  if (!__hooks.length) { box.innerHTML = `<div class="muted">${escHtml(t("hook.none.loaded"))}</div>`; return; }
  box.innerHTML = __hooks.map((h, i) => `
    <div class="hook-row" data-i="${i}">
      <div class="hook-line1">
        <input class="hk-name" value="${escHtml(h.name)}" placeholder="${escHtml(t("hook.f.name"))}" style="width:110px">
        <select class="hk-phase">${["pre", "post", "fail"].map((p) => `<option value="${p}" ${h.phase === p ? "selected" : ""}>${escHtml(t("hook.ph." + p))}</option>`).join("")}</select>
        <input class="hk-to" type="number" min="5" max="600" value="${parseInt(h.timeout) || 60}" title="${escHtml(t("hook.f.to"))}" style="width:70px">
        <label class="check" style="margin:0"><input type="checkbox" class="hk-abort" ${h.abort !== false ? "checked" : ""}><span>${escHtml(t("hook.f.abort"))}</span></label>
        <label class="check" style="margin:0"><input type="checkbox" class="hk-en" ${h.enabled !== false ? "checked" : ""}><span>${escHtml(t("hook.f.enabled"))}</span></label>
        <button class="btn sm danger hk-del">${escHtml(t("hook.f.del"))}</button>
      </div>
      <input class="hk-cmd" value="${escHtml(h.cmd)}" placeholder="${escHtml(t("hook.f.cmd"))}" style="width:100%;margin-top:4px;font-family:Consolas,monospace">
    </div>`).join("");
  box.querySelectorAll(".hk-del").forEach((b) => b.addEventListener("click", (ev) => {
    const i = +ev.target.closest(".hook-row").dataset.i;
    __hooks.splice(i, 1);
    renderHooks();
  }));
}
async function loadHooks() {
  const r = await rpc.hooksGet();
  __hooks = (r && r.ok ? r.hooks : []).map((h) => ({ ...h }));
  renderHooks();
}
$("#btn-hook-add").addEventListener("click", () => { __hooks.push({ name: `hook${__hooks.length + 1}`, cmd: "", phase: "post", enabled: true, timeout: 60, abort: false }); renderHooks(); });
$("#btn-hook-save").addEventListener("click", async () => {
  const rows = document.querySelectorAll("#hooks-list .hook-row");
  const hooks = [...rows].map((row, i) => ({
    name: row.querySelector(".hk-name").value.trim() || `hook${i + 1}`,
    phase: row.querySelector(".hk-phase").value,
    timeout: parseInt(row.querySelector(".hk-to").value) || 60,
    abort: row.querySelector(".hk-abort").checked,
    enabled: row.querySelector(".hk-en").checked,
    cmd: row.querySelector(".hk-cmd").value.trim(),
  })).filter((h) => h.cmd);
  const r = await rpc.hooksSave(hooks);
  if (r && r.ok) { __hooks = r.hooks.map((h) => ({ ...h })); renderHooks(); toast(t("btn.hook.save") + " ✔", "ok"); }
  else toast((r && r.msg) || "save failed", "err", 4000);
});

// ---------------- v2.23.0: Webhook 测试 ----------------
$("#btn-webhook-test").addEventListener("click", async () => {
  const out = $("#webhook-test-result");
  out.textContent = t("wh.testing");
  // 先把当前 URL/secret 存入设置再测试, 保证与实际推送一致
  await rpc.saveSettings({ webhook_url: $("#s-webhook-url").value.trim(), webhook_secret: $("#s-webhook-secret").value });
  const r = await rpc.webhookTest();
  out.textContent = r && r.ok ? `${t("wh.ok")} ${r.status}) ✔` : `${t("wh.fail")} ${escHtml(r.msg || "HTTP " + (r.status || "?"))}`;
});

// ---------------- 防御: 未捕获错误立即弹可见提示 (杜绝静默失效) ----------------
window.__jsErrors = window.__jsErrors || [];
window.addEventListener("error", (e) => { try { window.__jsErrors.push(String(e.message || e)); toast(t("err.script", e.message), "err", 6000); } catch {} });
window.addEventListener("unhandledrejection", (e) => { try { toast(t("err.async", (e.reason && e.reason.message) || e.reason), "err", 6000); } catch {} });
