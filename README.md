# Eval Studio

这是一个独立的评测平台前端项目，直接包含官方 Mastra Studio 源码，便于继续二次开发。

```text
浏览器 :7337
  ↓ 官方 Studio 源码（eval/frontend）
eval 代理 :4111/internal/mastra
  ↓ 服务端注入 x-mastra-internal-key
drama-agent :7818/internal/mastra
```

## 启动

先在同级业务项目启动 `drama-agent`，确认 `http://127.0.0.1:7818/health` 可访问，然后在本目录运行：

```bash
pnpm install
pnpm dev
```

打开 [http://127.0.0.1:7337/](http://127.0.0.1:7337/)。

也可以分开启动：

```bash
pnpm dev:api  # eval 的 Mastra 代理 :4111
pnpm dev:web  # 官方 Studio 前端 :7337
```

## 目录

- `frontend/`：从官方 `mastra-ai/mastra` 的 `packages/playground` 拉入的 Studio 应用源码。
- `packages/studio-ui/`：官方 Studio 组件和设计系统源码。
- `server.mjs`：eval 自己的 Mastra 代理；私钥只在服务端读取和注入。
- `scripts/dev.mjs`：同时启动代理和官方 Studio 前端。

官方源码版本和上游 commit 记录在 `frontend/UPSTREAM_COMMIT`，许可证见 `MASTRA-LICENSE.md`。

## 配置

复制 `.env.example` 到本地环境后按需调整：

```dotenv
PORT=7337
MASTRA_PROXY_PORT=4111
DRAMA_AGENT_ROOT=../drama-agent
DRAMA_AGENT_API_URL=http://127.0.0.1:7818
APP_ENV=local
```

`MASTRA_INTERNAL_API_KEY` 默认从 `DRAMA_AGENT_ROOT/.env.local` 读取，也可以通过进程环境变量覆盖。该值不会进入前端构建产物或浏览器请求。

当前 `eval` 只负责官方 Studio 前端和安全代理。数据集、实验结果、Stored Scorer 以及对应版本由 `drama-agent` 的 Mastra Runtime 写入 `mastra_runtime` 独立运行时表；代理只转发请求并在服务端注入内部密钥，不在本地维护第二份评测存储。
