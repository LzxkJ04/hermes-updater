# HermesUpdater

> English | [简体中文](README.md)

A polished Windows desktop GUI (Electron) for updating, installing, and maintaining the **Hermes Agent** — with mirror acceleration for mainland-China networks, one-click network self-healing, update hooks, and a full dashboard. Install, update, and maintain Hermes Agent from a single app.

> **Latest release: v2.24.0** — portable & installer binaries at [Releases](https://github.com/LzxkJ04/hermes-updater/releases).

---

## 📖 Table of Contents

- [Features](#-features)
- [Download](#-download)
- [Build from source](#-build-from-source)
- [FAQ](#-faq)
- [Community](#-community)
- [License](#-license)

## ✨ Features

### Update
- **One-click update** with auto network-method detection (direct / system proxy / manual proxy / mirror), auto-retry, and auto mirror fallback
- **What's New preview** before updating (pending commits with hash / date / author)
- **🎯 Update target selector** — pin to a remote branch or tag; optional lock that checks out the target before every update (offline-safe)
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
| `HermesUpdater-Setup-x.y.z.exe` | NSIS installer (optional autostart, start-menu & desktop shortcuts) |

- Portable build for USB sticks and on-the-go use; installer for long-term setups
- Full per-version notes on each Release page and in the [CHANGELOG](CHANGELOG.md)

## 🛠️ Build from source

```bash
npm install
npm start            # dev run
npm run dist         # build portable + NSIS (electron-builder)
node check.js        # static consistency checks (i18n / IPC / DOM ids)
```

Requires Node 18+ and Windows 10+ (uses PowerShell/CIM integration for process & disk features).

## ❓ FAQ

**Q: Portable vs installer?**
Portable is a single file — double-click and run, great for USB sticks. Installer adds optional autostart, start-menu and desktop shortcuts for long-term setups.

**Q: Updates/downloads are slow or GitHub is unreachable?**
Use the **mirror speed test** on the Install page to switch to the fastest mirror. Updates automatically probe direct/proxy/mirror routes with fallback; you can also set a proxy manually in Settings. For network issues, use **one-click network self-heal** on the dashboard.

**Q: Want to roll back an update?**
Roll back to any past commit — a backup is created before every update and can be restored with one click.

**Q: Will uninstalling wipe my config?**
Uninstall runs a preflight, backs up config, and can stop running processes; the default recycle-bin mode keeps everything recoverable, with a type-to-confirm guard against accidents.

**Q: WeChat group QR code expired?**
The WeChat QR code is valid for 7 days. When it expires, please join the QQ group below.

## 💬 Community

Join our community for feedback and feature requests:

### QQ Group

**Group ID: 1127744195**

<p align="center">
  <img src="docs/qq-group.jpg" alt="QQ Group QR" width="320">
</p>

### WeChat Group

<p align="center">
  <img src="docs/wechat-group.png" alt="WeChat Group QR" width="320">
</p>

> The WeChat QR code is **valid for 7 days (until 2026-10-07)**. If expired, join the QQ group above.

## 📄 License

[MIT](LICENSE)
