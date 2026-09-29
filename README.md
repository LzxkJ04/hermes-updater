# HermesUpdater（赫尔墨斯更新器）

> 简体中文 | [English](README_EN.md)

一款为 **Hermes Agent** 打造的 Windows 桌面更新工具（Electron），针对中国大陆网络做了镜像加速、自动换源、一键网络自愈等深度优化。

> **最新版本：v2.24.0** — 便携版与安装版见 [Releases](https://github.com/LzxkJ04/hermes-updater/releases)。

---

## ✨ 功能一览

### 更新
- **一键更新**：自动探测网络模式（直连 / 系统代理 / 手动代理 / 镜像），自动重试，自动镜像回退
- **更新预览（What's New）**：更新前查看待应用的提交（含哈希 / 日期 / 作者）
- **🎯 更新目标选择器**：锁定远端分支或标签；可选锁定项，让每次更新前先检出该目标
- **📜 更新日志中心**：基于本地仓库生成按标签分组的更新日志，支持搜索与 Markdown 导出
- **🪝 更新钩子**：更新前 / 后 / 失败时执行自定义命令，支持单钩子超时与失败中止策略
- **🌐 Webhook 推送**：更新 / 安装 / 卸载时 POST JSON 通知（兼容企业微信 / 钉钉 / Slack）
- 自动倒计时确认、稍后提醒、定时更新计划、免打扰时段
- 更新后冒烟验证（`hermes --version`）、回滚至任意历史提交、更新备份与一键恢复
- 网络探测与**一键网络自愈**，逐次尝试的网络统计与失败分类

### 安装与卸载
- **安装页**：环境预检（Node / npm / Git / 磁盘空间）、一键安装、修复重装、安装历史
- **镜像测速**：git 智能协议 > HTTP 两级探测，一键应用，自动故障转移候选镜像
- **多模式卸载**：回收站 / 仅删除依赖 / 彻底删除 / 仅解除关联——含预检、配置备份、停止进程、输目录名二次确认防误删

### 仪表盘与诊断
- 重构后的仪表盘：状态胶囊、健康评分卡、快捷操作中心（更新 / Gateway / 安装·卸载·维护）
- Gateway 看门狗（掉线自动重启）、进程管理器、健康评分 + HTML 健康报告
- 更新统计（成功率 / 月度趋势 / 高频失败原因）、更新热力图、磁盘清理向导
- 应用内通知中心 + Windows 原生 Toast 通知

### 设置
- 70+ 项持久化设置，覆盖更新 / 网络 / 安装 / 卸载 / 外观 / 自动化
- 中英双语界面、深色模式 + 跟随系统、UI 缩放、单实例锁

## 📦 下载

从 [Releases](https://github.com/LzxkJ04/hermes-updater/releases) 获取最新安装包：

| 文件 | 说明 |
|---|---|
| `HermesUpdater-Portable.exe` | 单文件便携版，免安装，双击即用 |
| `HermesUpdater-Setup-x.y.z.exe` | NSIS 安装版（可选开机自启、开始菜单、桌面快捷方式） |

## 🛠️ 本地构建

```bash
npm install
npm start            # 开发运行
npm run dist         # 打包 portable + NSIS（electron-builder）
node check.js        # 静态一致性校验（i18n / IPC / DOM id）
```

要求 Node 18+ 与 Windows 系统（进程与磁盘功能依赖 PowerShell / CIM 集成）。

## 📄 许可证

[MIT](LICENSE)
