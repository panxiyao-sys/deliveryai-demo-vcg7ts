# 剧创平台（juchuang-studio-demo）

面向影视/短剧团队的剧本/短剧创作协同工作台概念演示（纯前端、单用户、免登录），交付「创建剧本项目 → 结构化场次编辑 → 显式保存与刷新回看」的最小创作闭环。

> 本项目为概念演示，不代表正式产品；所有业务数据仅保存在浏览器本地，不依赖任何后端 API。

## 功能介绍

- 新建/浏览剧本项目，无项目时展示空态引导
- 项目内新增多个场次，按创建顺序稳定组织、可切换编辑
- 场次结构化字段：场次标题（必填）、场景描述、地点、时间、出场人物、对白/正文
- 显式保存：标题必填校验、保存成功反馈、未保存标记
- 未保存离开拦截：应用内导航二次确认（留下/放弃），页签关闭走 `beforeunload` 渐进增强
- 本地持久化：`localStorage` 版本化存储，异常（禁用/隐私模式/配额）时 try/catch 降级内存态并常驻提示
- hash 路由：`#/projects` 工作台与 `#/project/:id` 项目详情，支持深链接/前进后退，非法与旧地址自动纠正
- 中/英文切换（i18next，中文首发）

## 技术栈

React 18 · TypeScript ~5.6 · Vite 6 · Tailwind CSS 3.4 · Radix UI（Dialog）· lucide-react · class-variance-authority · i18next（中/英）· Playwright（E2E）。状态用 `useReducer` 管理；ESM；路径别名 `@` → `src/`。

## 环境要求

- Node.js 18 或更高版本
- npm 9 或更高版本（npm 源默认走 npmmirror）

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

服务默认运行在 `http://localhost:5173`。如果该端口已被占用，Vite 会自动选择其他可用端口。

## 常用命令

```bash
npm run dev              # 启动开发服务
npm run lint             # ESLint，零警告通过
npx tsc -b --noEmit      # 仅类型检查
npm run build            # tsc -b && vite build，产物到 dist/
npx playwright test      # E2E（webServer 自动拉起 npm run dev）
```

生产构建产物会生成在 `dist/` 目录，以相对路径（`base './'`）+ hash 路由静态托管，可直接部署到 GitHub Pages。

## 项目结构

```text
.
├── e2e/                    # Playwright 端到端测试
├── server/                 # 可选健康检查服务（/ping），不参与业务链路、保持独立
├── src/
│   ├── components/         # 视图（*View.tsx）与子组件；通用件在 components/ui/
│   ├── hooks/              # useViewRoute 路由、usePersistence 持久化、useUnsavedGuard 守卫
│   ├── state/              # studioReducer（纯函数 reducer）
│   ├── storage/            # projectStorage：localStorage 封装与降级容错
│   ├── lib/utils.ts        # cn（类名合并）、uid（唯一 id）
│   ├── App.tsx             # 应用入口组件：reducer + 路由 + 持久化 + 守卫接线
│   ├── types.ts            # Project/Scene/路由/状态/存储信封领域类型
│   ├── i18n.ts             # 中英文文案
│   └── index.css           # 全局样式与 Tailwind utilities
├── index.html
├── tailwind.config.js
└── vite.config.ts
```

## 数据与持久化

- 领域模型为 `Project → Scene[]` 两级；场次归一化存储，按 `projectId` 归属、`order` 稳定排序。
- 单一业务存储 key：`juchuang.studio.v1`，信封带 `version` 字段；损坏 JSON / 结构非法 / 版本不匹配时容错回退空态，不白屏。
- 草稿（未保存内容）仅存在于编辑器内存，不写入存储；「放弃更改」即丢弃本次未保存差异。
- 不发起任何后端业务网络请求；语言偏好仍写入 `i18nextLng`。
