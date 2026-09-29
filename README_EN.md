# HermesUpdater

> English | [简体中文](README.md)

A polished Windows desktop GUI (Electron) for updating, installing, and maintaining the **Hermes Agent** — with mirror acceleration for mainland-China networks, one-click network self-healing, update hooks, and a full dashboard.

> **Latest release: v2.24.0** — portable & installer binaries at [Releases](https://github.com/LzxkJ04/hermes-updater/releases).

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

Grab the latest binaries from [Releases](https://github.com/LzxkJ04/hermes-updater/releases):

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
