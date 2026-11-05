# AGENTS.md

> 供 AI 编码 Agent 阅读的仓库事实与约定。通用的测试执行/Review 规范见 [docs/agent-testing.md](docs/agent-testing.md)，GitHub Pages 发布核验见 [docs/agent-release.md](docs/agent-release.md)。
> 修改本文件需同步更新相关代码描述。

## 项目概述

剧创平台（`juchuang-studio-demo`）：面向影视/短剧团队的剧本/短剧创作协同工作台概念演示。React SPA，单用户、免登录，业务数据全部保存在浏览器本地（localStorage，异常时降级内存态），不依赖后端 API。`server/` 仅为可选的健康检查 Express 应用，不参与核心链路。

视图状态机收敛为两个顶层视图：工作台/项目列表 `projects` 与项目详情 `project`。视图经 hash 路由与 URL 一一对应（`#/projects`、`#/project/:id`），支持深链接与浏览器前进/后退；选用 hash 模式（非 History 模式）以兼容 Vite `base './'` 与 GitHub Pages 子路径部署。非法 hash、失效项目 id 与任意旧地址一律纠正到 `#/projects`。

## 技术栈

React 18 · TypeScript ~5.6 · Vite 6 · Tailwind CSS 3.4 · Radix UI（Dialog）· lucide-react · class-variance-authority · i18next（中/英）· Playwright（E2E）。状态用 `useReducer` 本地态管理；ESM；路径别名 `@` → `src/`。

## 目录结构

```
src/
├── main.tsx                  # 入口，挂载 React
├── App.tsx                   # 根组件：useReducer + 路由 + 持久化 + 未保存守卫 + 全局布局
├── types.ts                  # Project/Scene/ViewName/RouteState/AppState/AppAction/SceneDraft/StorageEnvelope
├── i18n.ts                   # i18next 初始化 + zh/en 资源（common/projects/project/scene/guard/storage 分组）
├── index.css                 # 基础样式、过渡、自定义 utilities
├── state/studioReducer.ts    # 剧创 reducer（纯函数、不可变更新，不触存储/不弹框/不调 i18n）
├── storage/projectStorage.ts # localStorage 封装：load/save、版本化、try/catch、损坏容错、可用性探测
├── hooks/useViewRoute.ts     # 路由 ↔ URL hash 双向同步（参数化 #/project/:id，含深链接/非法地址纠正）
├── hooks/usePersistence.ts   # 订阅已提交状态写入存储，维护 persistent/memory 降级
├── hooks/useUnsavedGuard.ts  # beforeunload 渐进增强守卫
├── lib/utils.ts              # cn（类名合并）、uid（crypto.randomUUID + Math.random 降级）
├── components/               # 页面组件（ProjectsView/ProjectDetailView 对应两视图）及子组件；通用件在 components/ui/（button、dialog）
└── components/ui/            # Button（CVA）、Dialog（Radix 封装）
e2e/                         # Playwright E2E（剧创领域用例）
index.html                   # 入口，含初始化语言的内联脚本
tailwind.config.js           # 自定义色板；vite.config.ts 配 base './' 与 @ 别名
playwright.config.ts         # E2E 配置
```

> 页面级视图组件统一以 `*View.tsx` 命名，文件名与视图状态一一对应（`projects`→`ProjectsView`、`project`→`ProjectDetailView`）。新增视图时同步：`ViewName` 类型、`useViewRoute` 的 hash 解析、对应 `*View.tsx` 组件。

## 样式约定

颜色类名直接硬编码在 JSX（如 `bg-rice-100`、`text-charcoal-900`、`border-charcoal-900/5`），不用 CSS 变量或语义 token 层，新组件沿用此模式。

`tailwind.config.js` 的自定义色板：

| 色系 | 色阶 | 用途 |
| --- | --- | --- |
| rice | 50 `#fffdf8` / 100 `#fbf5ea` / 200 `#f3e6d0` | 背景、卡片、次级面板 |
| charcoal | 500 `#5f5b55` / 700 `#34312d` / 900 `#211f1c` | 文字、深色背景 |
| chili | 50 `#fff1ef` / 100 `#ffddd8` / 500 `#e13b2b` / 600 `#c92f21` / 700 `#a9231a` | 按钮、强调、徽章 |
| amber | 100 `#fff2c7` / 400 `#f5b83f` / 500 `#e69b18` | 徽章、降级提示 |

当前为单一浅色主题，Tailwind 未配置 `darkMode`，组件中没有 `dark:` 变体。全局颜色变化有 250ms 过渡（`src/index.css`）。

## 编码约定

- 页面组件放 `src/components/`，通用件放 `src/components/ui/`；弹窗用封装的 `Dialog`，按钮用 CVA `Button`（default/secondary/outline/ghost），图标用 lucide-react 并靠 `currentColor` 继承。
- 样式只用 Tailwind 类名，不用 CSS Modules / styled-components。
- 新增 i18n 文案在 `src/i18n.ts` 的 zh/en 两处同步添加，按功能分组（`common.`、`projects.`、`project.`、`scene.`、`guard.`、`storage.`）。
- 业务数据的 localStorage 访问必须集中在 `src/storage/projectStorage.ts` 且一律 `try/catch`，不可用时降级内存态。业务 key：`juchuang.studio.v1`（版本化信封）；偏好 key：`i18nextLng`（语言，`true`/`false` 之外的 `elderly-mode` 已随老人模式下线，不再读写）。
- reducer（`studioReducer`）保持纯函数：不读 localStorage、不弹 Dialog、不调 i18n；提示文案在组件层组装，副作用集中在存储层与 hooks。
- 标识统一用 `lib/utils.ts` 的 `uid()`（含非安全上下文降级）；时间戳只存 `new Date().toISOString()`，展示层再格式化。
- 需要在 React 挂载前设置 html 属性/class 时，扩展 `index.html` 的内联脚本。
- npm 源默认走 `https://registry.npmmirror.com`（见根目录与 `server/.npmrc`）。

## 验证命令

| 命令 | 作用 |
| --- | --- |
| `npm ci` / `npm install` | 安装依赖（缺 `node_modules` 时先装） |
| `npm run build` | `tsc -b && vite build`，产物到 `dist/` |
| `npm run lint` | ESLint，零警告通过 |
| `npx tsc -b --noEmit` | 仅类型检查 |
| `npx playwright test` | E2E，webServer 自动拉起 `npm run dev` |

E2E 的执行约束（浏览器来源、报告路径、批量修复、不重跑等）与用例编写/自审规范见 [docs/agent-testing.md](docs/agent-testing.md)。

## 不要做

- 不引入额外的 UI 库或设计系统框架。
- 不使用 CSS Modules 或 styled-components。
- 不修改 `server/`（仅健康检查，无业务逻辑）。
- 不引入后端 API 调用，所有业务数据为前端本地态。
