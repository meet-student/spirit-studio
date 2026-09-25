# 前端控制台方案

## 1. 技术方案

- Next.js App Router + TypeScript；
- Tailwind CSS + shadcn/ui；
- TanStack Query：服务端数据缓存、分页、失效和轮询；
- TanStack Table：Case、Run、Trace、Score 表格；
- React Hook Form + Zod：表单和前端校验；
- Recharts：指标趋势和分布；
- 原生 `EventSource`：Experiment Run SSE；
- Monaco Editor：JSON、Prompt、Scorer 配置和事件查看；
- React Flow 只用于 Trace/Workflow 展示，第一版不提供拖拽编排。

不让前端承担业务规则。评分、状态迁移、凭据处理、数据校验和运行配置冻结均由 API/Worker 完成。

## 2. 页面结构

```text
/                         Dashboard
/targets                  Target 列表
/targets/new              新建 Target
/targets/:id              Target 详情、健康检查、运行参数
/agents                   Agent 版本
/workflows                Workflow 版本和步骤
/skills                   Skill 版本
/datasets                 Dataset 列表
/datasets/:id             Dataset 版本
/datasets/:id/cases       Case/Turn 列表和编辑
/experiments              Experiment 列表
/experiments/new          创建 Experiment
/experiments/:id          Experiment 配置和变体
/runs/:id                 Run 进度、指标、Case 结果
/runs/:id/cases/:caseId   Case 详情、证据、评分、复核
/traces                   Trace 搜索
/traces/:traceId          Trace Timeline 和事件详情
/scorers                  Scorer 配置
/reports                  报告列表和导出
/settings                 单实例运行参数、留存和审计
```

## 3. 核心交互

### Dashboard

展示最近 Run、Pass Rate、平均分、P50/P95 TTFT、P95 总耗时、失败 Case、目标健康状态。所有卡片点击后跳转到对应筛选结果。

### Target

表单只保存 Base URL、协议类型、环境、超时、并发和目标能力映射。Token 由服务端环境变量提供，Web 不显示、不编辑、不回显。

### Dataset

支持拖拽上传 JSON/JSONL/CSV/Excel；上传后展示解析预览、字段映射、Schema 错误、重复 Case、缺失 Fixture 和敏感字段警告。用户点击“发布版本”后才能进入 Experiment。

### Experiment

使用向导：

```text
选择 Dataset Version
  → 选择 Target / Agent / Workflow Version
  → 选择 Scorer Set
  → 配置并发、重试、超时和 Judge
  → 预览冻结配置
  → 启动 Run
```

启动后进入 Run 页面，实时显示队列进度、成功/失败/跳过、TTFT、总耗时和当前 Case。

### Run

页面分为：

- Summary：总体分数、通过率、性能分位数；
- Cases：Case 状态、分数、错误和标签；
- Live Events：运行事件流；
- Compare：与基线 Run 对比；
- Report：JSON/CSV/HTML 导出。

### Case Review

左右布局：左侧输入、期望和 Fixture；右侧输出、SSE、Tool、引用、Context 摘要、Trace 和 Score。底部支持按维度人工评分、备注、标记硬伤和“加入 Dataset 新版本”。

### Trace

```text
Trace Header
  ├─ run / case / target / model / duration
  └─ Timeline
       ├─ Agent Run
       ├─ Workflow Step
       ├─ Model Generation
       ├─ Tool Call
       ├─ Retrieval
       └─ Output Validation
```

默认展示脱敏摘要；完整事件必须点击展开，且仍受服务端脱敏结果限制。

## 4. 前端数据流

```text
Page
  → TanStack Query
  → Platform API
  → PostgreSQL/Worker

Run Page
  → initial run query
  → EventSource /events
  → query cache update
  → Summary / Cases / Timeline rerender
```

SSE 事件：

```text
run.status.changed
case.started
case.progress
case.finished
score.finished
run.summary.updated
run.finished
run.failed
```

断线后使用 `Last-Event-ID` 或 `fromSeq` 重放事件，不依赖浏览器内存恢复。

## 5. 前端状态边界

### URL 状态

列表页筛选、分页、排序、标签、当前 Case、Trace 查询条件写入 URL，支持刷新和分享。

### 服务端状态

Target、Dataset、Experiment、Run、Trace、Score 全部由 TanStack Query 管理，写操作成功后只失效相关 Query。

### 本地状态

弹窗、表单草稿、Drawer 展开、Trace 节点选择等短状态使用 React state；不把运行结果复制到全局状态。

## 6. 组件目录

```text
apps/web/src/
├── app/
├── components/
│   ├── layout/
│   ├── target/
│   ├── dataset/
│   ├── experiment/
│   ├── run/
│   ├── trace/
│   ├── scorer/
│   └── common/
├── lib/api-client.ts
├── lib/query-keys.ts
├── lib/sse-client.ts
├── lib/formatters.ts
└── types/
```

## 7. 前端验收

- 首屏可看到最近 Run 和目标健康；
- 导入错误能定位到文件、行、列和字段；
- Run 页面可实时更新且断线可恢复；
- Case 详情能从输入跳到 Trace、事件和评分证据；
- 大 Dataset 使用分页，不造成浏览器卡顿；
- 表格、编辑器和 Timeline 支持键盘操作、焦点状态和错误提示；
- Web 永不返回或显示目标 Token/API Key。
