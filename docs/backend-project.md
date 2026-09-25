# 后端新项目方案

## 1. 项目定位

新建独立后端项目，不复用被测 Agent 的业务代码、数据库 Schema 或业务数据库。被测 Agent 只作为外部 HTTP/SSE Target。

## 2. 推荐技术栈

- Node.js 22+、TypeScript strict
- NestJS 11 + Express Adapter
- Prisma + PostgreSQL
- BullMQ + Redis
- ClickHouse：第二阶段接入高量 Trace
- MinIO/S3：Fixture 和报告文件
- Zod：所有外部输入和 Adapter 事件校验

第一版可以先只使用 PostgreSQL，Trace 量上升后再增加 ClickHouse。

## 3. 目录

```text
eval/
├── apps/api/                  # 无鉴权 API
├── apps/worker/               # 实验、评分、报告任务
├── apps/web/                 # Next.js 控制台
├── packages/contracts/       # API、SSE、事件 Schema
├── packages/database/        # Prisma、Migration、Repository
├── packages/target-sdk/      # Target 统一接口
├── packages/adapter-http-agent/
├── packages/scorer/
├── packages/trace/
├── prisma/
├── infra/docker-compose.yml
└── docs/
```

## 4. 无鉴权边界

后端不实现登录、Session、JWT、SSO、RBAC、组织成员和 API Key。API 在受控网络开放；部署层可使用 Nginx、VPN 或零信任网关限制访问，但不在本项目后端重复实现。

仍必须做输入校验、URL/超时/并发/文件限制、凭据脱敏、Trace 脱敏、审计、删除、幂等、租约、重试和错误隔离。无鉴权不等于无输入校验。

## 5. 最小数据表

```text
projects, targets, agent_definitions, agent_versions,
workflow_definitions, workflow_versions, skills, skill_versions,
datasets, dataset_versions, dataset_cases, dataset_turns, fixtures,
experiments, experiment_variants, experiment_runs, case_runs, turn_runs,
scorers, score_results, human_reviews, audit_logs
```

所有实验运行记录保存配置快照，不能在运行中读取最新 Target 或 Dataset 配置。

## 6. Worker 任务

```text
experiment.case.run
trace.normalize
case.score.deterministic
case.score.llm_judge
experiment.aggregate
report.generate
fixture.cleanup
```

任务幂等键：`experimentRunId + caseId + variantId`。

## 7. 环境变量

```text
DATABASE_URL=
REDIS_URL=
TARGET_AGENT_BASE_URL=
TARGET_AGENT_TOKEN=
EVAL_JUDGE_BASE_URL=
EVAL_JUDGE_API_KEY=
EVAL_JUDGE_MODEL=
S3_ENDPOINT=
S3_BUCKET=
```

变量只在 API/Worker 进程读取，不能通过 API 返回。

## 8. API 与 Web 的连接

- Web 只调用平台 API，不直接访问 PostgreSQL、Redis、目标服务或对象存储。
- 创建实验后 API 返回 `runId`；Web 通过 `GET /api/experiment-runs/:runId/events` 订阅 SSE 进度。
- Worker 只写数据库和事件表；API 将事件表转换成前端事件。
- 大文件使用 API 申请上传地址后上传到 MinIO/S3，Web 不接触目标服务凭据。
- 所有列表接口支持分页、排序和筛选，避免 Web 一次加载全部 Trace。

## 9. MVP 验收

从 Web 页面完成：创建 Target、导入 Dataset、启动 10 个 Case、查看实时进度、查看 Case 详情、查看 Trace、执行评分、人工复核和导出 JSON 报告。API 不包含鉴权流程。
