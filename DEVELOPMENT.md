# GitHub MR Review Service - 开发指南

## 项目结构

```
github-mr-review/
├── src/
│   ├── ai-review/
│   │   └── ai-review.service.ts          # AI代码评审服务
│   ├── github-api/
│   │   └── github-api.service.ts         # GitHub API服务
│   ├── github-webhook/
│   │   ├── github-webhook.controller.ts  # Webhook控制器
│   │   └── github-webhook.service.ts     # Webhook业务逻辑
│   ├── app.controller.ts                 # 根控制器
│   ├── app.module.ts                     # 根模块
│   ├── app.service.ts                    # 根服务
│   ├── main.ts                           # 应用入口
│   └── types.ts                          # 类型定义
├── test/                                 # 测试文件
├── .env.example                          # 环境变量示例
├── Dockerfile                            # Docker配置
├── README.md                             # 项目说明
├── DEPLOYMENT.md                         # 部署文档
└── package.json                          # 项目依赖
```

## 核心功能

### 1. Webhook 接收和处理

- **端点**: `POST /api/webhook/github`
- **功能**: 接收 GitHub Pull Request Webhook 事件
- **验证**: 支持 GitHub Webhook 签名验证
- **过滤**: 只处理 `opened` 和 `synchronize` 事件

### 2. AI 代码评审

- **服务**: `AiReviewService`
- **功能**: 调用外部 AI 服务进行代码分析
- **输入**: PR diff 内容和文件变更信息
- **输出**: 结构化的评审报告

### 3. GitHub API 集成

- **服务**: `GithubApiService`
- **功能**: 与 GitHub API 交互
- **操作**: 获取 PR 信息、diff 内容、发布评论等

### 4. 评论发布

- **功能**: 将 AI 评审结果发布为 PR 评论
- **格式**: Markdown 格式的详细报告
- **内容**: 总体评分、问题列表、改进建议等

## 开发环境设置

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入必要的配置
```

### 3. 启动开发服务器

```bash
npm run start:dev
```

### 4. 运行测试

```bash
# 单元测试
npm run test

# 端到端测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

## 代码规范

### TypeScript 配置

- 使用严格模式
- 启用装饰器支持
- 目标 ES2023
- 模块系统 CommonJS

### 代码风格

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 NestJS 最佳实践

### 命名规范

- **类名**: PascalCase (例如: `GithubWebhookController`)
- **方法名**: camelCase (例如: `handleWebhook`)
- **常量**: UPPER_SNAKE_CASE (例如: `GITHUB_WEBHOOK_SECRET`)
- **文件名**: kebab-case (例如: `github-webhook.controller.ts`)

## API 设计

### Webhook 接收端点

```typescript
POST /api/webhook/github
Headers:
  - X-GitHub-Event: pull_request
  - X-Hub-Signature-256: sha256=<signature>
Body: PullRequestEvent
```

### 健康检查端点

```typescript
GET /api/webhook/github
Response: { status: 'ok', message: string, timestamp: string }
```

## 错误处理

### Webhook 处理错误

- 签名验证失败: 返回 400 错误
- 事件类型不支持: 记录日志并忽略
- 处理异常: 记录错误日志，不影响 Webhook 响应

### AI 服务错误

- API 调用失败: 返回默认评审报告
- 响应解析失败: 使用简化解析逻辑
- 配置缺失: 抛出配置错误异常

### GitHub API 错误

- 认证失败: 记录错误日志
- API 限制: 实现重试机制
- 网络错误: 适当的错误处理

## 日志记录

### 日志级别

- **error**: 错误信息
- **warn**: 警告信息
- **log**: 一般信息
- **debug**: 调试信息

### 日志内容

- Webhook 接收和处理状态
- AI 服务调用结果
- GitHub API 交互记录
- 错误和异常信息

## 测试策略

### 单元测试

- 服务层逻辑测试
- 工具函数测试
- 异常处理测试

### 集成测试

- Webhook 接收测试
- GitHub API 集成测试
- AI 服务集成测试

### 端到端测试

- 完整流程测试
- 错误场景测试
- 性能测试

## 性能优化

### 异步处理

- Webhook 处理采用异步模式
- 不阻塞 GitHub Webhook 响应
- 后台处理 PR 评审

### 连接池

- 使用 HTTP 连接池
- 复用 GitHub API 连接
- 优化网络性能

### 缓存策略

- 缓存 GitHub API 响应
- 减少重复 API 调用
- 提高响应速度

## 安全考虑

### Webhook 安全

- 验证 GitHub Webhook 签名
- 防止恶意请求
- 限制请求频率

### API 密钥安全

- 使用环境变量存储密钥
- 不在日志中暴露密钥
- 定期轮换密钥

### 网络安全

- 使用 HTTPS 协议
- 限制网络访问
- 实施访问控制

## 监控和告警

### 健康监控

- 服务健康检查端点
- 依赖服务状态监控
- 响应时间监控

### 业务监控

- Webhook 处理成功率
- AI 服务调用成功率
- GitHub API 调用统计

### 告警配置

- 服务不可用告警
- 错误率异常告警
- 性能指标告警

## 扩展功能

### 多语言支持

- 支持多种编程语言评审
- 语言特定的评审规则
- 可配置的评审策略

### 自定义评审规则

- 可配置的 AI 提示模板
- 自定义评分标准
- 团队特定的评审要求

### 报告增强

- 更详细的代码分析
- 图表和可视化报告
- 历史评审数据

## 故障排查

### 常见问题

1. **Webhook 接收失败**
   - 检查网络连接
   - 验证 Webhook 配置
   - 查看服务日志

2. **AI 服务调用失败**
   - 验证 API 密钥
   - 检查 API 配额
   - 确认服务地址

3. **GitHub API 调用失败**
   - 验证 Token 权限
   - 检查 API 限制
   - 确认仓库访问权限

### 调试技巧

1. **启用调试日志**
```bash
LOG_LEVEL=debug npm run start:dev
```

2. **本地测试 Webhook**
使用工具如 ngrok 暴露本地服务进行测试

3. **GitHub API 测试**
使用 curl 或 Postman 测试 API 调用

## 贡献指南

### 开发流程

1. Fork 项目仓库
2. 创建功能分支
3. 实现功能并添加测试
4. 提交 Pull Request
5. 代码审查和合并

### 代码质量

- 遵循项目代码规范
- 添加适当的测试用例
- 更新相关文档
- 通过所有质量检查

### 提交规范

- 使用清晰的提交信息
- 遵循约定式提交规范
- 关联相关 Issue
- 提供详细的变更说明