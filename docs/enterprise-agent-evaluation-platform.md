# 企业级 Agent / Workflow 评测平台方案

本方案是独立项目。外部 Agent 只是被测系统（SUT，System Under Test），通过外部协议接入；不修改其代码、不读取其数据库、不向其仓库写文件。平台用于评测 Agent 的 LLM 能力，协议层可扩展到 Mastra、LangGraph、HTTP Agent 和其他 Workflow 服务。

## 1. 产品目标

平台参考 Mastra Studio 的运行和 Trace 体验，但产品边界更完整：

- Agent、Workflow、Skill 的注册、版本、发布和执行快照；
- Dataset、Dataset Version、Case、Turn、Fixture、标签和导入校验；
- Experiment、变体、批量 Run、回归、A/B 和版本对比；
- 确定性 Scorer、LLM Judge、人工复核和综合报告；
- Agent、Workflow、Step、LLM、Tool、Skill、Retrieval 全链路 Trace；
- 项目、目标、审计和数据留存。

平台保存评测输入、脱敏输出、结构化事件、评分证据和运行元数据，不接管被测系统的业务事实、账务、生产用户身份和业务数据库。

## 2. 总体架构

```text
Browser
  │
  ▼
Next.js Web Console ── HTTPS/SSE ── Platform API
                                      │
                       ┌──────────────┼──────────────┐
                       ▼              ▼              ▼
                 PostgreSQL       Redis/BullMQ      ClickHouse
              项目/数据集/评分      实验队列/锁       Trace/Span
                       │              │              │
                       └───────┬──────┴──────┬───────┘
                               ▼             ▼
                         Worker/Scorer   Object Storage
                               │          Fixture/报告
                               ▼
              Target Adapter: HTTP Agent / Mastra / Workflow
                               │
                               ▼
                     External Agent / Workflow
```

### 技术栈

| 层 | 推荐 | 职责 |
|---|---|---|
| Web | Next.js、React、Tailwind/shadcn | 控制台、数据集、实验、Trace、复核 |
| API | NestJS 或 Fastify、Zod | REST、SSE、编排 |
| Worker | Node.js、BullMQ | 批量调用、评分、报告 |
| 业务库 | PostgreSQL、Prisma | 项目、Dataset、Experiment、Scores |
| Trace | ClickHouse | Span、事件、耗时、Token 聚合 |
| 文件 | S3/MinIO | Excel/JSONL、Fixture、报告 |
| 观测 | OpenTelemetry Collector | 平台自身链路与目标 OTLP |
| 部署 | Docker Compose → Kubernetes | 本地到生产 |

第一版不 fork Mastra Studio，不做拖拽式 Workflow IDE；Mastra 只作为运行时/Trace 的一种适配器。

## 3. 独立项目结构

```text
agent-eval-platform/
├── apps/
│   ├── web/                         # Next.js 控制台
│   ├── api/                         # 平台 API
│   └── worker/                      # 实验、评分、报告任务
├── packages/
│   ├── contracts/                   # API、SSE、事件、Schema
│   ├── db/                          # Prisma、Migration、Repository
│   ├── target-sdk/                  # 目标统一接口
│   ├── adapter-http-agent/          # 通用 HTTP/SSE Agent Adapter
│   ├── adapter-mastra/              # Mastra Adapter
│   ├── dataset/                     # 导入、版本、校验
│   ├── experiment/                  # 队列和执行快照
│   ├── trace/                       # 脱敏、标准化、查询
│   ├── scorer/                      # 规则、Judge、人工评分
│   └── report/                      # 聚合和导出
├── infra/
│   ├── docker-compose.yml
│   ├── postgres/
│   ├── clickhouse/
│   └── otel/
└── docs/
    ├── enterprise-agent-evaluation-platform.md
    ├── api.md
    └── evaluation-rubric.md
```

## 4. 领域模型与数据存储

### 4.1 项目

```text
Project
  ├── Target
  ├── Agent / Workflow / Skill
  ├── Dataset / DatasetVersion
  ├── Experiment
  └── Trace / Report
```

核心表：

```text
projects(id, name, slug, status, created_at)
targets(id, project_id, name, adapter_type, base_url, environment, status)
audit_logs(id, project_id, actor_label, action, resource_type, resource_id, metadata, created_at)
```

第一版为内部部署、单实例无鉴权模式。项目 ID 只用于数据归类和页面筛选，不承担安全边界。若未来开放给多团队，再增加登录、组织隔离和 RBAC，不在当前项目中预留实现。

### 4.2 Target、Agent、Workflow、Skill

```text
targets
  id, project_id, name, adapter_type, base_url, secret_ref,
  capabilities, environment, timeout_ms, status

agent_definitions
  id, project_id, target_id, name, external_id, description
agent_versions
  id, agent_id, version, config_snapshot, prompt_hash,
  skill_refs, model_ref, released_at

workflow_definitions
  id, project_id, target_id, name, external_id, graph_snapshot
workflow_versions
  id, workflow_id, version, input_schema, output_schema,
  step_snapshot, released_at

skills
  id, project_id, name, source_type, metadata
skill_versions
  id, skill_id, version, instructions_hash, tool_schema, status
```

这些是“可评测版本引用”，不是强制复制目标服务实现。黑盒目标只需外部 ID、版本和调用协议。

### 4.3 Dataset、Case、Fixture

```text
datasets
  id, project_id, name, description, kind, status
dataset_versions
  id, dataset_id, version, source_type, schema_version,
  case_count, content_hash, created_by, created_at
dataset_cases
  id, dataset_version_id, external_key, input_json,
  expected_json, tags, priority, source_ref
dataset_turns
  id, case_id, turn_index, input_json, expected_json,
  fixture_ref, context_json
fixtures
  id, project_id, storage_key, content_type, content_hash,
  redaction_status, metadata
```

Case 使用结构化期望：

```json
{
  "route": "RAG",
  "expectedTools": ["project.search", "project.read_context"],
  "expectedReferences": ["storyboard:sb-001"],
  "requiredFacts": ["answer contains scene number"],
  "forbiddenBehaviors": ["invent unavailable project facts"],
  "resultRubric": "回答解决用户问题并声明数据范围",
  "processRubric": "权限失败时不得继续读取内容",
  "performance": { "ttftMs": 3000, "totalMs": 30000 }
}
```

支持 JSON、JSONL、CSV、Excel 导入。导入生成草稿版本，必须通过 Schema、引用、Fixture 和敏感字段校验后发布。

### 4.4 Experiment、Run、Trace 关联

```text
experiments
  id, project_id, name, dataset_version_id, target_id,
  agent_version_id, workflow_version_id, scorer_set_id, config_json
experiment_variants
  id, experiment_id, name, target_snapshot, model_config,
  prompt_config, skill_config, weight
experiment_runs
  id, experiment_id, status, queued_at, started_at,
  finished_at, total_cases, completed_cases, summary_json
case_runs
  id, experiment_run_id, case_id, variant_id, status,
  session_ref, trace_id, started_at, finished_at, error_json
turn_runs
  id, case_run_id, turn_index, request_json, response_json,
  event_summary, trace_id, ttft_ms, total_ms, status
score_results
  id, case_run_id, scorer_id, dimension, score, status, evidence_json, version
human_reviews
  id, case_run_id, reviewer_id, dimension, score, notes, created_at
```

Experiment 启动时冻结 Target、Adapter、Agent/Workflow/Skill、Dataset、Scorer、模型和脱敏策略版本，运行期间不读取最新配置。

## 5. Target Adapter

```ts
interface TargetAdapter {
  discover(target: TargetRef): Promise<TargetCapabilities>;
  invokeAgent(input: AgentInvocation): AsyncIterable<TargetEvent>;
  invokeWorkflow(input: WorkflowInvocation): AsyncIterable<TargetEvent>;
  cancel?(run: TargetRunRef): Promise<void>;
  healthCheck(target: TargetRef): Promise<HealthResult>;
}
```

统一事件：

```text
run_started, step_started, tool_called, tool_result,
model_started, model_finished, text_delta, context_status,
source_reference, run_finished, run_failed
```

Adapter 只做协议转换和安全摘要，不做业务评分。

### 5.1 HTTP/SSE Agent Adapter 责任

- 配置外部 Base URL、测试凭据引用和环境；
- 调用 `/v1/models`、消息 SSE、Session、Workflow 接口；
- 解析 `run_id`、`message_id`、`trace_id`、SSE、Tool、Context、Source；
- 每个 Case 使用独立或可配置 Session；
- 默认串行执行，防止目标会话锁导致评测器制造 409/429；
- 支持连接超时、首 Token 超时、总超时、取消和有限重试；
- 不读取目标业务数据库；嵌入式 Mastra 仅作为另一个可选 Adapter。

后端不提供用户鉴权。目标服务凭据只从服务端环境变量或本机配置读取，不进入浏览器、Dataset、Trace、报告和日志；该平台必须部署在受控内网或本机环境。

### 5.2 Mastra Adapter

- 远程模式：HTTP/SSE/OTLP 接入目标部署；
- 嵌入模式：Worker 在专用评测进程加载 Mastra 实例；
- 收集 Agent、Workflow Step、Model、Tool、Skill、Retrieval span；
- 传入 `experiment_id`、`case_run_id`、`variant_id` 等业务关联属性。

## 6. 企业级评测体系

评测分四层，原始证据、自动结果、Judge 结果和人工结果同时保留。

### 6.1 协议层

HTTP 状态、错误码、SSE 字段和顺序、终态唯一性、Run/Trace/Message ID、JSON Schema、超时、断流、取消和重复提交。

### 6.2 过程层

路由、Tool 名称/顺序/次数/参数、Project Scope、Session、权限失败后的停止、Skill/Prompt/Model 版本、Workflow 步骤、重试和回调。

### 6.3 结果层

结构化字段、枚举、数值、ID、关键事实覆盖率、引用存在性、禁止行为、输出格式、语言和长度。

### 6.4 质量层

LLM Judge 与人工复核判断：问题是否解决、上下文是否忠实、是否编造、表达完整性、跨轮连续性、Workflow 产物质量。

### 6.5 Scorer 清单

```text
SchemaScorer          JSON/SSE/输出结构
RouteScorer           Agent/Workflow 路由
ToolScorer            Tool 名称、顺序、参数
FactScorer            关键事实和字段
ReferenceScorer       引用存在性和覆盖率
SafetyScorer          越权、泄露、编造、禁止行为
PerformanceScorer     TTFT、总耗时、Token、成本
LLMJudgeScorer        结果/过程质量
HumanReviewScorer     人工复核
RegressionScorer      与基线版本比较
```

统一结果：

```json
{
  "score": 0.85,
  "status": "passed",
  "dimension": "groundedness",
  "evidence": [{ "type": "source_reference", "ref": "storyboard:sb-001" }],
  "issues": [],
  "scorerVersion": "groundedness.v2"
}
```

综合分：`case_score = Σ(scorer_score × scorer_weight)`。协议失败、安全/越权硬伤直接失败；目标超时记为 error；质量不足可为 warning 或 failed。人工 > Judge > 自动规则仅决定同一维度的生效值，不删除原始证据。

Experiment 指标：

```text
pass_rate       = passed_cases / eligible_cases
mean_score      = mean(case_score)
p95_ttft        = percentile(ttft_ms, 95)
p95_total       = percentile(total_ms, 95)
tool_accuracy   = correct_tool_cases / eligible_tool_cases
regression_rate = regressions / comparable_cases
```

## 7. Trace 设计

```text
evaluation.request
└─ experiment.run
   └─ case.run
      └─ target.agent_run / target.workflow_run
         ├─ workflow.step
         ├─ model_generation
         ├─ tool_call
         ├─ retrieval
         ├─ skill_load
         └─ output_validation
```

Span 至少包含：`org_id`、`project_id`、`target_id`、`experiment_id`、`experiment_run_id`、`case_run_id`、`case_id`、`variant_id`、`environment`、`adapter_version`。

默认禁止保存 Authorization、Cookie、JWT、API Key、完整思维链、未脱敏项目资料、签名 URL 和外部原始响应。保存输入输出 hash、长度、事件摘要、Tool Schema 摘要、引用 ID、错误码和经截断的文本。

PostgreSQL 存 Trace 索引和关联，ClickHouse 存高量 Span，S3/MinIO 存 Fixture 和报告。按项目设置 7/30/90/365 天 retention，删除时清理索引和对象。

## 8. Web 控制台

1. **Dashboard**：Pass Rate、平均分、P95 延迟、成本、回归告警、失败 Top N、目标健康。
2. **Targets**：环境、Adapter、能力探测、凭据引用、超时、并发、限流、错误。
3. **Agents / Workflows / Skills**：外部 ID、版本、Schema、模型、Prompt、Skill 引用、发布状态。
4. **Datasets**：导入、版本、Case/Turn、标签、Fixture、校验、Diff、发布、归档。
5. **Experiments**：选择版本和 Scorer、配置并发/重试、启动/取消/重试、变体比较。
6. **Trace Explorer**：筛选、Timeline、脱敏输入输出、Tool、引用、评分证据回链。
7. **Review**：自动/Judge/人工分数并列、理由、证据、硬伤、批量复核、报告导出。
8. **Settings/Audit**：目标配置、运行参数、审计、留存和删除策略。

## 9. API

```text
GET/POST  /api/projects/:projectId/targets
POST      /api/targets/:targetId/health-check
GET/POST  /api/projects/:projectId/agents
GET/POST  /api/projects/:projectId/workflows
GET/POST  /api/projects/:projectId/skills

GET/POST  /api/projects/:projectId/datasets
POST      /api/datasets/:datasetId/import
GET       /api/dataset-versions/:versionId/cases
PATCH     /api/dataset-cases/:caseId
POST      /api/dataset-versions/:versionId/validate
POST      /api/dataset-versions/:versionId/publish

GET/POST  /api/projects/:projectId/experiments
POST      /api/experiments/:experimentId/runs
GET       /api/experiment-runs/:runId
POST      /api/experiment-runs/:runId/cancel
POST      /api/experiment-runs/:runId/retry-failed
GET       /api/experiment-runs/:runId/cases

GET       /api/traces
GET       /api/traces/:traceId
GET       /api/case-runs/:caseRunId/evidence
GET/POST  /api/projects/:projectId/scorers
POST      /api/experiment-runs/:runId/score
POST      /api/case-runs/:caseRunId/review
GET       /api/experiment-runs/:runId/report
```

## 10. 无鉴权边界、安全和可靠性

后端 API 第一版不实现登录、Session、JWT、SSO、RBAC、组织成员和 API Key。所有 API 在受控内网开放，部署层可使用 Nginx、VPN 或零信任网关限制网络访问，但不在本项目后端重复实现。

仍必须保留：审计日志、输入校验、目标凭据脱敏、Trace 脱敏、数据删除、留存策略、运行幂等和错误隔离。无鉴权不等于无输入校验，也不允许把目标服务密钥返回给前端。

可靠性要求：

- 任务幂等键：`experimentRunId + caseId + variantId`；
- Worker 租约和超时回收；
- 只对网络、429、5xx 重试，不重试权限和参数错误；
- Target 级并发/限流；
- Case 独立状态，单 Case 失败不丢失其他结果；
- Trace 故障不阻塞目标调用和评分主流程；
- 输入、配置、事件和评分均有 Schema 版本；
- API、Worker、Web 可独立扩缩容。

## 11. 评测 Agent LLM 能力的首批数据集

1. 协议：SSE、终态、断流、错误、取消、幂等。
2. 路由：RAG、闲聊、项目查询、分镜查询、素材查询、Workflow。
3. 权限：无权限、对象不存在、项目切换、跨项目访问。
4. 上下文：pageContext、Fixture、草稿、项目/剧集/分镜 Scope。
5. Tool：选择、参数、顺序、次数、失败降级。
6. 多轮：指代、连续性、上下文压缩、Session 恢复。
7. RAG：召回、引用、Context Manifest、groundedness。
8. Workflow：小说拆解、素材抽取、分镜提示词、回调和超时。
9. 安全：Prompt 注入、越权、敏感数据、凭据和外部地址泄露。
10. 性能：TTFT、总耗时、并发、429、Worker 恢复。

## 12. 执行生命周期

```text
Dataset draft
  → validate
  → publish Dataset Version
  → freeze Experiment Snapshot
  → queue Case Runs
  → invoke Target Adapter
  → collect/deidentify Trace
  → deterministic scoring
  → LLM Judge
  → human review
  → aggregate report
  → optional regression Case
```

实验状态：`draft → validated → queued → running → scoring → completed`，可转 `failed`、`cancelled`、`partial`。单个 Case 独立保存请求、响应、事件、Trace、耗时、错误和评分。

## 13. 分期交付

### Phase 0：骨架

新后端 Monorepo、单项目、PostgreSQL、Target CRUD、服务端环境变量、审计、Docker Compose。

验收：启动新后端、创建项目、添加目标、健康检查、可查看审计记录；API 不包含鉴权流程。

### Phase 1：Dataset + HTTP/SSE Adapter

JSONL/Excel 导入、Dataset Version、Case/Turn/Fixture、外部 HTTP/SSE Adapter、串行 Experiment、基础 Trace、失败重试。

验收：10 个 Case 可运行，能查看请求、SSE 终态、Trace ID、错误和 JSON 报告。

### Phase 2：确定性评分

Schema、Route、Tool、Fact、Reference、Safety、Performance Scorer，证据回链，基线 diff，CSV/JSON 导出。

验收：同配置可重复；硬伤阻断通过；失败原因可定位到事件或字段。

### Phase 3：LLM Judge + 人工复核

脱敏 Judge 输入、Judge 版本、结果/过程双维度评分、人工复核、审计、Case 回写。

验收：Judge 可重试；人工覆盖有版本和审计；原始评分不丢失。

### Phase 4：Workflow / Skill / Trace 深化

Workflow Step Trace、Skill 版本、Mastra OTLP/Observability、输出 Schema 评分、ClickHouse 聚合和告警。

### Phase 5：企业化

多用户 SSO/RBAC、组织隔离、审批发布、预算/配额、高可用、备份、灾备和合规审计。

## 14. 第一版明确不做

- 不修改任何被测 Agent；
- 不 fork Mastra Studio；
- 不复制目标业务数据库；
- 不把生产 JWT 明文放平台数据库；
- 不做拖拽 Workflow IDE；
- 不做计费、插件市场和模型供应商管理；
- 不用 Langfuse 替代 Dataset、Experiment、Score 业务域。Langfuse 只可作为可选 Trace 展示后端。

## 15. MVP 完成标准

```text
新后端项目
+ 单项目/无鉴权 API
+ Target 配置
+ HTTP/SSE Agent Adapter
+ Dataset Version / Case / Turn / Fixture
+ Experiment Queue
+ HTTP/SSE 事件采集
+ Trace 详情
+ Schema/Route/Tool/Fact/Reference/Safety/Performance Scorer
+ LLM Judge
+ 人工复核
+ JSON/CSV 报告
+ 审计日志
```

平台评测的是“被冻结版本的目标执行”。每个结论都必须能够回到 Dataset Case、请求、事件、Trace 和评分证据，而不是依赖目标服务当前的内部状态。
