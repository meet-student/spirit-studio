# 全栈落地方案

## 1. 产品形态

这是一个可独立启动的 Web + API + Worker 全栈项目：

```text
Web Console :3000
Platform API :4000
Worker       background
PostgreSQL  :5432
Redis       :6379
MinIO       :9000
```

第一版无鉴权，默认只绑定本机或受控内网。Web 通过 API 访问所有数据，Worker 负责长任务，数据库保存事实。

## 2. Monorepo 脚本

```text
pnpm dev                 # 同时启动 web/api/worker
pnpm dev:web
pnpm dev:api
pnpm dev:worker
pnpm db:migrate
pnpm db:seed
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm docker:up
```

## 3. 端到端运行链路

```text
Web 创建 Experiment
  → API 校验并冻结 Dataset/Target/Scorer Snapshot
  → API 创建 ExperimentRun
  → API 投递 Case Jobs 到 Redis
  → Worker 读取 Job
  → Adapter 调用外部 Agent
  → Worker 记录 Turn/Events/Trace
  → Deterministic Scorer
  → LLM Judge Job
  → Aggregate Job
  → API SSE 通知 Web
  → Web 展示结果和报告
```

## 4. 最小 API 响应规范

```json
{
  "data": {},
  "meta": { "requestId": "req_x", "page": 1, "pageSize": 50 },
  "error": null
}
```

错误统一包含 `code`、`message`、`requestId`；不得把目标服务 Token、完整上游响应或内部堆栈返回给 Web。

## 5. 本地 Docker 服务

```text
postgres       业务数据、Dataset、Run、Score
redis          BullMQ、事件游标、分布式锁
minio          Fixture、报告、导入文件
clickhouse     第二阶段 Trace 明细，可选
```

本地开发默认不启动 ClickHouse，先用 PostgreSQL 验证完整链路。

## 6. 交付顺序

### 里程碑 1：可运行全栈骨架

Web Layout、API Health、PostgreSQL Migration、Target CRUD、Docker Compose。

### 里程碑 2：数据集闭环

导入、预览、校验、Dataset Version、Case 编辑、Fixture 上传和发布。

### 里程碑 3：实验闭环

Experiment 创建、Worker 队列、HTTP/SSE Adapter、Run 页面、SSE 进度和报告。

### 里程碑 4：评测闭环

Deterministic Scorer、LLM Judge、人工复核、Trace Timeline、基线对比。

### 里程碑 5：生产化

ClickHouse、OTLP、留存清理、告警、备份、Kubernetes、部署文档。

## 7. 全栈验收场景

1. 用户打开 Dashboard，看到目标健康和历史 Run。
2. 用户上传一个包含多轮 Case 的 Excel，修复校验错误并发布 Dataset Version。
3. 用户选择目标、Workflow、Scorer，启动 Experiment。
4. Web 实时显示队列和 Case 进度，刷新页面后仍能恢复。
5. 目标返回 SSE 后，平台保存事件、Trace、TTFT、总耗时和输出。
6. 自动评分完成后，用户查看失败原因和证据。
7. 用户执行 LLM Judge 和人工复核，结果写入报告。
8. 用户把失败 Case 加入新 Dataset Version，重新执行并对比。

## 8. 不做的事情

- 不把控制台嵌入被测项目；
- 不修改被测项目；
- 不直接读被测项目数据库；
- 不在第一版实现登录和权限系统；
- 不把前端做成 Workflow 编排器；
- 不把 Trace 平台误当作 Dataset/Experiment 业务系统。
