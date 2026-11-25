# lijiabao.dev (`lijiabao-official`)

李家宝的个人科技网站源码（[https://lijiabao.dev](https://lijiabao.dev)），基于 **Astro 7 + TypeScript + WebGL2 + Cloudflare Workers** 构建，支持中英双语内容发布与自动化构建校验。

## 技术栈

- **框架**：Astro 7 (`^7.3.5`) + TypeScript 6
- **动效与交互**：GSAP (`^3.15.0`)、Lenis (`^1.3.26`)、WebGL2
- **部署与测试**：Cloudflare Workers (`wrangler`)、Vitest (`^5.0.3`)、Sharp

## 环境要求

- Node.js `>= 22.18.0`

## 本地开发与校验

```bash
npm install
npm run dev          # 启动本地开发服务器
npm run build:prod   # 类型检查 + 完整生产构建与校验
npm test             # 运行单元测试
npm run preview      # 预览生产构建
npm run deploy:dry   # Cloudflare Workers 部署预演
```

## 目录概览

- `src/` — 页面、双语内容、组件与样式
- `scripts/` — 构建前后处理脚本（字形子集、提交记录打包、OG 图、字典与文案校验、dist 检查）
- `tests/` — Vitest 自动化测试
- `public/` — 静态资源

## 协作规则

AI 写作与代码协作规则见根目录 [`AGENTS.md`](AGENTS.md)（`CLAUDE.md` 引用同一规范）。
