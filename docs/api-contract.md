# API 与事件契约

## 1. Target

```text
GET/POST /api/projects/:projectId/targets
POST     /api/targets/:targetId/health-check
PATCH    /api/targets/:targetId
DELETE   /api/targets/:targetId
```

## 2. Dataset

```text
GET/POST /api/projects/:projectId/datasets
POST     /api/datasets/:datasetId/import
GET      /api/dataset-versions/:versionId/cases
PATCH    /api/dataset-cases/:caseId
POST     /api/dataset-versions/:versionId/validate
POST     /api/dataset-versions/:versionId/publish
```

## 3. Experiment

```text
GET/POST /api/projects/:projectId/experiments
POST     /api/experiments/:experimentId/runs
GET      /api/experiment-runs/:runId
GET      /api/experiment-runs/:runId/cases
POST     /api/experiment-runs/:runId/cancel
POST     /api/experiment-runs/:runId/retry-failed
GET      /api/experiment-runs/:runId/report
```

## 4. Trace 与评分

```text
GET      /api/traces
GET      /api/traces/:traceId
GET      /api/case-runs/:caseRunId/evidence
GET/POST /api/projects/:projectId/scorers
POST     /api/experiment-runs/:runId/score
POST     /api/case-runs/:caseRunId/review
```

## 5. 标准事件

```text
run_started, step_started, tool_called, tool_result,
model_started, model_finished, text_delta, context_status,
source_reference, run_finished, run_failed
```

Adapter 将目标服务的 HTTP、SSE、Mastra Trace 或其他事件转换成以上事件。原始事件只保留脱敏摘要。

## 6. HTTP/SSE Agent Adapter

Adapter 从服务端配置读取目标 Base URL 和测试 Token，调用目标模型目录、消息 SSE、Session 和 Workflow 接口，解析 `run_id`、`message_id`、`trace_id`、Tool、Context、Source 和终态。目标名称、接口前缀和字段映射全部属于 Target 配置，不写死在平台中。

默认串行执行，避免目标服务会话锁被评测器自身打爆。网络错误、429、5xx 可以有限重试；权限、参数和协议错误不重试。
