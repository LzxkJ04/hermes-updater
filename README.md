# HermesUpdater

English | [简体中文](#简体中文)

A polished Windows desktop GUI (Electron) for updating, installing, and maintaining the **Hermes Agent** — with mirror acceleration for mainland-China networks, one-click network self-healing, update hooks, and a full dashboard.

> **Latest release: v2.23.0** — see [Releases](../../releases) for portable & installer binaries.

---

## ✨ Features

### Update
- **One-click update** with auto network-method detection (direct / system proxy / manual proxy / mirror), auto-retry, and auto mirror fallback
- **What's New preview** before updating (pending commits with hash / date / author)
- **🎯 Update target selector** — pin to a remote branch or tag; optional lock that checks out the target before every update
- **📜 Changelog Center** — generate a tag-grouped changelog from the local repo, search, export Markdown
- **🪝 Update hooks** — custom commands before / after / on failure, with per-hook timeout and abort policy
- **🌐 Webhook push** — POST JSON notifications on update/install/uninstall (WeCom / DingTalk / Slack friendly)
- Auto countdown confirmation, snooze reminders, scheduled update plans, do-not-disturb window
- Post-update smoke verification (`hermes --version`), rollback to any past commit, update backups with restore
- Network probe & **one-click network self-heal**, per-attempt network stats and failure classification

### Install & Uninstall
- **Install Hermes page**: environment preflight (node/npm/git/disk), one-click install, fix-reinstall, install history
- **Mirror speed test** with two-level probing (git smart protocol > HTTP), one-click apply, auto failover to candidate mirrors
- **Multi-mode uninstall**: recycle bin / delete dependencies only / permanent delete / unlink only — with preflight, config backup, process stop, and type-to-confirm protection

### Dashboard & Diagnostics
- Rebuilt dashboard: status pills, health score card, quick-action center (update / Gateway / install · uninstall · maintain)
- Gateway watchdog (auto-restart when offline), process manager, health scoring + HTML health report
- Update statistics (success rate, monthly trend, top failure reasons), update heatmap, disk cleanup wizard
- App-internal notification center + Windows toast notifications

### Settings
- 70+ persisted settings across update / network / install / uninstall / appearance / automation
- Bilingual UI (简体中文 / English), dark mode + follow-system, UI zoom, single-instance lock

## 📦 Download

Grab the latest binaries from [Releases](../../releases):

| File | Description |
|---|---|
| `HermesUpdater-Portable.exe` | Single-file portable, no install needed |
| `HermesUpdater-Setup-x.y.z.exe` | NSIS installer |

## 🛠️ Build from source

```bash
npm install
npm start            # dev run
npm run dist         # build portable + NSIS (electron-builder)
node check.js        # static consistency checks (i18n / IPC / DOM ids)
```

Requires Node 18+ and Windows (uses PowerShell/CIM integration for process & disk features).

## 📄 License

[MIT](LICENSE)

---

# 简体中文

一款为 **Hermes Agent** 打造的 Windows 桌面更新工具（Electron），针对中国大陆网络做了镜像加速、自动换源、一键网络自愈等深度优化。

## ✨ 功能一览

- **更新**：一键更新（自动探测直连/系统代理/手动代理/镜像 + 自动重试 + 镜像回退）、What's New 提交预览、🎯 更新目标选择器（分支/标签锁定）、📜 更新日志中心（按 tag 分组/搜索/导出 Markdown）、🪝 更新钩子（前/后/失败，支持超时与失败中止）、🌐 Webhook 推送（企业微信/钉钉/Slack）、倒计时确认、稍后提醒、定时计划、免打扰、更新后冒烟验证、任意提交回滚、备份恢复
- **安装/卸载**：环境预检 + 一键安装 + 修复重装 + 安装历史；镜像测速（git 协议/HTTP 两级探测）+ 自动换源；四模式卸载（回收站/仅删依赖/彻底删除/解除关联）+ 卸载预检/备份/停进程/输目录名防误删
- **仪表盘/诊断**：状态胶囊 + 健康评分 + 快捷操作中心；Gateway 守护、进程管理器、健康报告、更新统计、热力图、磁盘清理向导、网络自愈、通知中心
- **设置**：70+ 项持久化设置；中英双语、深色模式、UI 缩放、单实例锁

## 📦 下载

见 [Releases](../../releases)：`HermesUpdater-Portable.exe`（绿色便携）与 `HermesUpdater-Setup-x.y.z.exe`（安装版）。

## 🛠️ 本地构建

```bash
npm install
npm start            # 开发运行
npm run dist         # 打包 portable + NSIS
node check.js        # 静态一致性校验（i18n / IPC / DOM id）
```

需要 Node 18+ 与 Windows 系统。

## 📄 许可证

[MIT](LICENSE)
