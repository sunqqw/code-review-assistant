# GitHub MR Review Service - 部署文档

## 项目概述

GitHub MR Review Service 是一个基于 NestJS 的后端服务，用于监听 GitHub Pull Request Webhook，调用 AI 服务进行代码评审，并将评审结果自动发布回 MR。

## 部署方式

### 1. 本地部署

#### 环境要求
- Node.js 22+
- npm 10+
- Git

#### 部署步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd github-mr-review
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，填入必要的配置
```

4. **启动服务**
```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

### 2. Docker 部署

#### 创建 Dockerfile

```dockerfile
FROM node:22-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "run", "start:prod"]
```

#### 构建和运行

```bash
# 构建镜像
docker build -t github-mr-review .

# 运行容器
docker run -d \
  --name github-mr-review \
  -p 3000:3000 \
  -e GITHUB_WEBHOOK_SECRET=your-secret \
  -e GITHUB_TOKEN=your-token \
  -e AI_API_KEY=your-ai-key \
  -e AI_API_URL=your-ai-url \
  github-mr-review
```

### 3. Docker Compose 部署

#### docker-compose.yml

```yaml
version: '3.8'

services:
  github-mr-review:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - GITHUB_WEBHOOK_SECRET=${GITHUB_WEBHOOK_SECRET}
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - AI_API_KEY=${AI_API_KEY}
      - AI_API_URL=${AI_API_URL}
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/webhook/github"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### 启动服务

```bash
# 创建环境变量文件
echo "GITHUB_WEBHOOK_SECRET=your-secret" > .env
echo "GITHUB_TOKEN=your-token" >> .env
echo "AI_API_KEY=your-ai-key" >> .env
echo "AI_API_URL=your-ai-url" >> .env

# 启动服务
docker-compose up -d
```

### 4. Kubernetes 部署

#### Deployment 配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: github-mr-review
spec:
  replicas: 2
  selector:
    matchLabels:
      app: github-mr-review
  template:
    metadata:
      labels:
        app: github-mr-review
    spec:
      containers:
      - name: github-mr-review
        image: github-mr-review:latest
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          value: "3000"
        - name: GITHUB_WEBHOOK_SECRET
          valueFrom:
            secretKeyRef:
              name: github-mr-review-secrets
              key: webhook-secret
        - name: GITHUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: github-mr-review-secrets
              key: github-token
        - name: AI_API_KEY
          valueFrom:
            secretKeyRef:
              name: github-mr-review-secrets
              key: ai-api-key
        - name: AI_API_URL
          valueFrom:
            configMapKeyRef:
              name: github-mr-review-config
              key: ai-api-url
        livenessProbe:
          httpGet:
            path: /api/webhook/github
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/webhook/github
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: github-mr-review-service
spec:
  selector:
    app: github-mr-review
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

#### Secret 和 ConfigMap

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: github-mr-review-secrets
type: Opaque
data:
  webhook-secret: <base64-encoded-secret>
  github-token: <base64-encoded-token>
  ai-api-key: <base64-encoded-ai-key>
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: github-mr-review-config
data:
  ai-api-url: "https://api.openai.com/v1/chat/completions"
```

### 5. 云平台部署

#### Vercel 部署

1. 安装 Vercel CLI
```bash
npm i -g vercel
```

2. 部署项目
```bash
vercel --prod
```

3. 配置环境变量在 Vercel 控制台中设置

#### Heroku 部署

1. 创建 Procfile
```
web: npm run start:prod
```

2. 部署到 Heroku
```bash
heroku create your-app-name
git push heroku main
heroku config:set GITHUB_WEBHOOK_SECRET=your-secret
heroku config:set GITHUB_TOKEN=your-token
heroku config:set AI_API_KEY=your-ai-key
```

## 环境变量配置

### 必需配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| PORT | 服务端口 | 3000 |
| GITHUB_WEBHOOK_SECRET | GitHub Webhook 密钥 | your-webhook-secret |
| GITHUB_TOKEN | GitHub 个人访问令牌 | ghp_xxxxxxxx |
| AI_API_KEY | AI 服务 API 密钥 | sk-xxxxxxxx |
| AI_API_URL | AI 服务 API 地址 | https://api.openai.com/v1/chat/completions |

### 可选配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| LOG_LEVEL | 日志级别 | info |
| NODE_ENV | 运行环境 | development |

## GitHub Webhook 配置

1. 进入 GitHub 仓库设置页面
2. 点击 "Webhooks" → "Add webhook"
3. 配置以下参数：
   - **Payload URL**: `https://your-domain/api/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: 与 `GITHUB_WEBHOOK_SECRET` 环境变量一致
   - **Events**: 选择 "Let me select individual events"
   - 勾选 "Pull requests"
4. 点击 "Add webhook"

## 监控和日志

### 健康检查

服务提供健康检查端点：
```
GET /api/webhook/github
```

### 日志查看

#### Docker 日志
```bash
docker logs -f github-mr-review
```

#### Kubernetes 日志
```bash
kubectl logs -f deployment/github-mr-review
```

### 监控指标

建议添加以下监控：
- HTTP 请求响应时间
- Webhook 处理成功率
- AI 服务调用成功率
- 错误率和异常监控

## 安全建议

1. **Webhook 签名验证**: 始终启用 GitHub Webhook 签名验证
2. **API 密钥管理**: 使用安全的密钥管理服务
3. **网络隔离**: 将服务部署在私有网络中
4. **HTTPS**: 使用 HTTPS 加密通信
5. **访问控制**: 限制对 Webhook 端点的访问
6. **日志脱敏**: 确保日志中不包含敏感信息

## 故障排查

### 常见问题

1. **Webhook 接收失败**
   - 检查网络连接
   - 验证 Webhook URL 配置
   - 查看服务日志

2. **AI 服务调用失败**
   - 验证 API 密钥
   - 检查 API 配额
   - 查看 AI 服务状态

3. **GitHub API 调用失败**
   - 验证 GitHub Token 权限
   - 检查 API 限制
   - 验证仓库访问权限

### 调试模式

启动服务时添加调试日志：
```bash
LOG_LEVEL=debug npm run start:dev
```

## 性能优化

1. **异步处理**: Webhook 处理采用异步模式
2. **连接池**: 使用 HTTP 连接池
3. **缓存**: 适当缓存 GitHub API 响应
4. **限流**: 实现请求限流机制
5. **超时设置**: 合理设置 API 调用超时

## 备份和恢复

### 配置备份

定期备份以下配置：
- 环境变量配置
- GitHub Webhook 配置
- 部署配置文件

### 灾难恢复

1. 准备备用部署环境
2. 定期测试恢复流程
3. 保持配置版本控制
4. 建立监控告警机制