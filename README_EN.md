# HermesUpdater

> English | [简体中文](README.md)

A polished Windows desktop GUI (Electron) for updating, installing, and maintaining the **Hermes Agent** — with mirror acceleration for mainland-China networks, one-click network self-healing, update hooks, and a full dashboard. Install, update, and maintain Hermes Agent from a single app.

> **Latest release: v2.30.0** — portable & installer binaries at [Releases](https://github.com/LzxkJ04/hermes-updater/releases)。

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

### 🚀 Unified CN Mirror Acceleration (21 sites × 29 toolchain groups)
- Packaging downloads the electron binary plus nsis / winCodeSign toolkits from GitHub — direct connections from mainland China commonly fail with `TypeError: fetch failed`. Enable this to auto-inject CN mirrors, **probe the fastest source, and auto-switch on failure**
- **21 built-in sites, every URL curl-verified**: `mix` (recommended combo on `registry.npmmirror.com`, more reliable than the old domain), `npmmirror` (registry domain `/-/binary/`), `tbmirror` (legacy `mirrors/` path), `cdn`, `huawei`, `aliyun`, `tencent`, `tuna` (Tsinghua), `ustc`, `nju`, `bfsu`, `sjtug`, `zju`, `goproxycn`, `rsproxy`, `hfm` (HuggingFace), `ghfast` / `ghproxy` / `ghnet` (GitHub accelerators), `official`, `custom`
- **29 toolchain groups**: npm (npm/pnpm/yarn/bun/deno), Node binaries & headers (incl. nvm), Electron, electron-builder, Playwright, Puppeteer, Selenium, ChromeDriver, GeckoDriver, EdgeDriver, node-sass, sharp, sqlite3, bcrypt, canvas, esbuild, Turbo, Parcel, Rollup, Bun, Python (uv/pip/poetry), **Conda channels**, Go, Cargo, Rustup, HuggingFace, Julia, Maven (incl. Gradle), Helm
- **Real-file three-state probing**: measure each site's latency with one click. The old version probed **directory URLs**, but mirror sites commonly block directory listings (403/404), so "this site does not carry that repo" was misreported as FAIL. Now it probes **real files** (`SHASUMS256.txt` / `winCodeSign-2.6.0.7z` / `index.json` / `config.json` ...) and reports three states: `✅ usable` / `➖ not carried here` / `❌ real fault (timeout / conn error / 5xx)`
- **Cross-site fallback & missing-repo policy**: if a site lacks a repo, the next candidate is tried in latency order; if none works, the policy decides between `omit` (inject nothing) and `official` (use the official URL). Sub-paths use a **default-deny whitelist**, so a 404 URL can never be injected
- **Learned cache & site blacklist**: probe results are cached per site × group on disk (clearable with one click), so 100+ combos are not re-probed on every launch; `em_skip_sites` permanently skips chosen sites
- **Per-group auto-selection**: each toolchain probes its own best site instead of one global pick; the settings page shows a full site × group matrix where you can toggle each group or pin a site (blank follows the probe result)
- **Toolchain auto-detection**: `where.exe` detects installed toolchains and marks them 🧭; optionally inject only the variables for toolchains you actually have
- **Managed `~/.npmrc`**: write CN registries into `~/.npmrc` inside a `# >>> HermesUpdater managed` block — **your own config is untouched**; remove the block with one click or open the file location
- **📋 Injection preview**: list every environment variable (48 by default) and its value that the update will inject; append extras as `KEY=VALUE` lines
- The update page also has a "🔍 Mirror speed test" button; the mirror panel now has **34 settings** (preset / 4 manual overrides / version dir / timeout / cache / retries / missing-repo policy / probe scope / concurrency / site blacklist / toggles), and the app persists **216 settings** in total

### 🛠️ Build Toolchain Self-Check
- The most common cause of a native-module build failure (node-gyp) is **not** the network: it is a missing Visual Studio "Desktop development with C++" workload, or a failed PowerShell detection step inside node-gyp (typical error: `gyp ERR! find VS ... could not use PowerShell to find Visual Studio 2017 or newer`)
- Uses `vswhere.exe` to locate the exact VS path and version, then checks six items: VS / VC++ toolset / MSBuild / PowerShell / Python / Node
- **One-click winget install of VS 2022 BuildTools + the VCTools workload** (command can be copied only, never executed); auto-injects `npm_config_msvs_version` derived from the VS version (17 -> 2022 / 16 -> 2019 / 15 -> 2017), with `GYP_MSVS_OVERRIDE_PATH` as a manual override
- Runs a pre-update check once; you can choose "warn only" or "abort the update". **Failed updates are auto-diagnosed** (VS / node-gyp / file lock / network) with cause, steps, live environment facts, and the fix command

### 🧰 System Environment Check & One-Click Install
- Detects **19 toolchains** including Node / npm / Git / Python / PowerShell 7 / .NET SDK / Visual Studio / CMake / Ninja / 7-Zip / MSYS2 / MinGW / FFmpeg / Redis / Nginx / MySQL / rclone / cloudflared / aria2, showing installed versions and missing items
- **13 installable packages** via winget / Chocolatey / Scoop, with "copy only, do not execute" and "run in a visible console window" options
- Also checks admin rights / long path support / developer mode / free disk space / system proxy, and offers one-click fix suggestions

### 📦 Installer Package Mirror Detection
- Built-in directory probe over **17 packages x 14 mirror sites**, supporting three real listing formats (nginx autoindex / Apache autoindex / JSON children)
- **Recursive descent into version subdirectories** (depth 0-3) to locate the latest direct link, e.g. `node/ -> v22.12.0/ -> node-v22.12.0-x64.msi`
- One-click "probe all" sorts by latency and picks the fastest site automatically; per-package site pinning; results cached on disk
- Generates `curl -L --retry 3 -C -` (resumable) / PowerShell `Invoke-WebRequest` / `aria2c` download commands, one click to copy
- Also emits **8 package-manager mirror commands** (Chocolatey -> Aliyun, winget, Scoop, npm, pip), runnable as a visible `.cmd`
- Supports a **probe proxy** (empty = auto from env/system, `off` = direct, or e.g. `http://127.0.0.1:7890`)

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
- 🔍 **Integrity verify**: backups with a sha256 manifest get a "🔍 Verify" button that recomputes every hash and reports "N files match / differ"
- Tray submenu "💾 Backup & Restore": back up now (balloon) / open page / open folder / settings

### Settings
- 216 persisted settings across update / network / mirrors / build toolchain / system environment / installer mirrors / install / uninstall / backup / appearance / automation
- Bilingual UI (简体中文 / English), dark mode + follow-system, UI zoom, single-instance lock
- Light-theme palette reworked: progress track/fill, trend bars, heatmap, top loader, toasts and accent presets are all driven by semantic variables with a separate palette per theme

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
- 216 options across **network / mirrors / build toolchain / system environment / installer mirrors / update / install / uninstall / backup / appearance / automation**.
- **Appearance**: language (中文/English), dark or follow-system, UI zoom, accent color (separate sets for dark & light).
- **Automation**: scheduled updates, do-not-disturb window, single-instance lock.

### 6. CN Mirror Acceleration
1. Open **Settings** → **🚀 CN Mirror Acceleration (28 toolchains)** and tick **Enable**.
2. Click **🔍 Probe all mirrors** to measure latency per site and sort by speed; click **⚡ Probe & auto-select** to write the fastest usable source into settings.
3. For finer control, enable **per-group auto-selection**: a site × group matrix appears where you can toggle each group or pin a site (blank follows the probe). 🧭 marks toolchains detected on this machine.
4. To make your command line (not just this app) use CN registries, click **📝 Write ~/.npmrc**. The block is wrapped in `# >>> HermesUpdater managed` and can be removed cleanly with **🧹 Remove ~/.npmrc config** — your own config is never touched.
5. Click **📋 Preview injected variables** to see exactly what will be injected; add more via **Extra env vars** (`KEY=VALUE` per line).
6. If GitHub is directly reachable from your network, tick **skip mirrors when GitHub is reachable**; if the last packaging run failed, tick **auto-switch on failure** to retry with the next candidate.

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
