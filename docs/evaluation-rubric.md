# 评测体系与评分口径

## 1. 四层评测

### 协议层

HTTP 状态、SSE Schema、事件顺序、终态唯一性、Run/Message/Trace ID、超时、断流、取消和幂等。

### 过程层

Agent/Workflow 路由、Tool 名称/顺序/次数/参数、Scope、Session、Skill/Prompt/Model 版本、Workflow Step、重试和回调。

### 结果层

JSON 字段、枚举、数值、ID、关键事实、引用、禁止行为、格式、语言和长度。

### 质量层

LLM Judge 与人工复核判断问题解决度、上下文忠实度、编造、完整性、表达质量、多轮连续性和 Workflow 产物质量。

## 2. Scorer

```text
SchemaScorer, RouteScorer, ToolScorer, FactScorer,
ReferenceScorer, SafetyScorer, PerformanceScorer,
LLMJudgeScorer, HumanReviewScorer, RegressionScorer
```

每个 Scorer 独立保存结果：

```json
{
  "score": 0.85,
  "status": "passed",
  "dimension": "groundedness",
  "evidence": [],
  "issues": [],
  "scorerVersion": "groundedness.v1"
}
```

## 3. 硬门禁

- 协议失败：Case failed；
- 越权、泄露、凭据暴露：Case failed；
- 目标超时：Case error；
- 关键引用缺失：按 Case 配置 failed 或 warning；
- 质量分不足：failed 或 passed_with_warning。

## 4. 分数

```text
case_score = Σ(scorer_score × scorer_weight)
pass_rate = passed_cases / eligible_cases
mean_score = mean(case_score)
p95_ttft = percentile(ttft_ms, 95)
p95_total = percentile(total_ms, 95)
```

同一维度的生效顺序：人工复核 > LLM Judge > 自动规则。原始结果全部保留。

## 5. 首批被测 Agent 数据集

协议、路由、权限、pageContext、Fixture、Tool、上下文压缩、多轮 Session、RAG、Workflow、安全和性能共 10 类。
