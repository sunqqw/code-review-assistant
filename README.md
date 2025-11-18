# GitHub MR Review Service

用于监听GitHub合并请求Webhook，调用AI进行代码评审，并将评论发布回MR的后端服务。

## 功能特性

- 🎯 监听GitHub Pull Request Webhook事件
- 🤖 调用AI服务进行代码评审
- 💬 自动将评审结果发布为MR评论
- 🔒 Webhook签名验证
- 📊 支持多种评审模式

## 技术栈

- **框架**: NestJS
- **语言**: TypeScript
- **HTTP客户端**: Axios
- **GitHub API**: Octokit
- **配置管理**: dotenv

## 快速开始

### 安装依赖

```bash
npm install
```

### 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# 服务端口
PORT=3000

# GitHub配置
GITHUB_WEBHOOK_SECRET=your-webhook-secret
GITHUB_TOKEN=your-github-token

# AI服务配置
AI_API_KEY=your-ai-api-key
AI_API_URL=your-ai-service-url

# 日志级别
LOG_LEVEL=info
```

### 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

## API端点

### Webhook接收

```
POST /api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
X-Hub-Signature-256: sha256=<signature>
```

### 健康检查

```
GET /api/health
```

## 部署说明

### Docker部署

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### 环境要求

- Node.js 22+
- npm 10+

## 配置GitHub Webhook

1. 进入GitHub仓库设置
2. 选择 "Webhooks" → "Add webhook"
3. 配置Payload URL: `https://your-domain/api/webhook/github`
4. 选择Content type: `application/json`
5. 设置Secret: 与 `GITHUB_WEBHOOK_SECRET` 环境变量一致
6. 选择事件: `Pull requests`

## 许可证

UNLICENSED