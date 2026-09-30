# HermesUpdater

> English | [简体中文](README.md)

A polished Windows desktop GUI (Electron) for updating, installing, and maintaining the **Hermes Agent** — with mirror acceleration for mainland-China networks, one-click network self-healing, update hooks, and a full dashboard. Install, update, and maintain Hermes Agent from a single app.

> **Latest release: v2.27.0** — portable & installer binaries at [Releases](https://github.com/LzxkJ04/hermes-updater/releases)。

---

## 📖 Table of Contents

- [Features](#-features)
- [Usage Guide](#-usage-guide)
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
- **Terminate all Hermes processes after a successful update**: when the update finishes (`rc=0`), all processes under the current Hermes install (incl. Gateway) are forcibly stopped, so no stale process remains and the new version takes effect immediately. On failure, the `cleanup_after` / `keep_gateway` settings still apply (Gateway kept by default)
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

### Backup & Restore
- Snapshot Hermes **user data** into one backup (optionally `.zip`) and restore it with one click; the page lists every backup with **restore / export / delete**
- **21 selectable scopes**: sessions, skills/software, plugins (+ desktop plugins), config, env vars, auth, zh-patches, memories, vault, hooks, cron, kanban, projects, state DB, shared data, pets, platforms, pairing, sandboxes, data, logs
- **25 backup settings**: scheduled backups (daily/weekly + exact time + weekdays), keep-by-count, keep-by-age, restore-only-these-scopes, compression level, stop processes first, integrity check, `manifest.sha256`, auto-backup before restore, auto-backup before update, desktop notifications, exclude rules, and more
- Safety net: optionally snapshot the current state before restoring, then verify what landed on disk
- Tray submenu "💾 Backup & Restore": back up now (balloon) / open page / open folder / settings

### Settings
- 95+ persisted settings across update / network / install / uninstall / backup / appearance / automation
- Bilingual UI (简体中文 / English), dark mode + follow-system, UI zoom, single-instance lock

## 📘 Usage Guide

### 1. Updating Hermes Agent
1. **One-click update** — open the *Update* tab and click **Check for updates**; the app auto-detects the available network path (direct / system proxy / manual proxy / mirror), then **Update now**. Updates auto-retry and fall back across network methods.
2. **What's New preview** — expand *Pending changes* to see upcoming commits with **hash / date / author** before upgrading.
3. **Update target selector** — in the *Update target* panel pick a **branch or tag** (e.g. `main`, `v2.24.0`). Enable *lock target* to `git checkout` it before every update (safe for offline / weak networks).
4. **Changelog Center** — click **Generate** to list changes grouped by **tag** from the local repo; search by keyword and **export Markdown**.
5. **Update hooks** — in *Settings → Hooks* set commands for **pre / post / on-failure**, each with a **timeout**; enable *abort on failure* to stop the update on hook errors.
6. **Webhook push** — in *Settings → Webhook* enter an incoming webhook URL (WeCom / DingTalk / Slack), choose trigger events, then **Test** to verify.
7. **Rollback & backup** — an update backup is created automatically; use **Rollback** to return to any past commit and restore.

### 2. Installing Hermes Agent
1. **Preflight** — on the *Install Hermes* page click **Preflight**; it checks Node / npm / Git and disk space with red/green status.
2. **Install / Fix-reinstall** — click **Install** when preflight passes; **Fix-reinstall** redeploys while keeping config. *Install history* logs each run.
3. **Mirror speed test** — click **Speed test** for two-level probing (git smart protocol > HTTP) of candidate mirrors; **Apply** the fastest, with automatic failover if it goes down.

### 3. Uninstalling Hermes Agent
1. On the *Uninstall* page run **Preflight** (process stop, config backup check).
2. Choose a mode: **Recycle bin** (recoverable, default) / **Dependencies only** / **Permanent** / **Unlink only**.
3. Type the Hermes directory name to confirm, then **Uninstall**; config is backed up beforehand.

### 4. Dashboard & Diagnostics
- **Status pills** show Hermes / Gateway / Network state (ok / warning / error).
- **Health score card** gives a 0–100 score; **Health report** exports an HTML report.
- **Quick-action center** jumps to update / restart Gateway / install·uninstall·maintain.
- **Gateway watchdog** auto-restarts Gateway when offline.
- **Update statistics** (success rate, monthly trend, top failures) + **heatmap**; **disk cleanup wizard** reclaims space with per-item confirmation.

### 5. Settings
- 70+ options across **update / network / install / uninstall / appearance / automation**.
- **Appearance**: language (中文/English), dark or follow-system, UI zoom.
- **Automation**: scheduled updates, do-not-disturb window, single-instance lock.

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

<div align="center">

<table>
  <tr>
    <th>QQ Group</th>
    <th>WeChat Group</th>
  </tr>
  <tr>
    <td align="center"><b>Group ID: 1127744195</b></td>
    <td align="center">Scan to join</td>
  </tr>
  <tr>
    <td align="center"><img src="docs/qq-group.jpg" alt="QQ Group QR" width="240"></td>
    <td align="center"><img src="docs/wechat-group.png" alt="WeChat Group QR" width="240"></td>
  </tr>
</table>

</div>

> The WeChat QR code is **valid for 7 days (until 2026-10-07)**. If expired, join the QQ group above.

## 📄 License

Licensed under the [MIT License](LICENSE) — free to use, modify, and distribute, including commercially, provided the copyright notice is retained.

Copyright (c) 2026 LzxkJ04
