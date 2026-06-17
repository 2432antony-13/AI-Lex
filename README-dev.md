# 星链 AI Lex - 开发环境指南

## 技术栈
- 前端：Next.js 15 (React 19)
- 后端：Node.js 20 + Express
- 数据库：PostgreSQL (Supabase)
- ORM：Prisma
- 部署：Vercel (前端) + Supabase (后端/数据库)
- 代码质量：ESLint, Prettier, TypeScript

## 开发环境设置

### 1. 克隆仓库
```bash
git clone <repository-url>
cd ai-lex
```

### 2. 安装依赖
```bash
npm install
# 或
yarn install
```

### 3. 数据库设置
本地开发使用 Supabase 或 Docker PostgreSQL：

**使用 Docker Compose (推荐本地开发)**
```bash
docker-compose up -d
```

**使用 Supabase (生产环境)**
1. 创建 Supabase 项目
2. 复制 `.env.example` 到 `.env` 并填写 SUPABASE_URL 和 SUPABASE_KEY

### 4. 数据库迁移
```bash
npx prisma migrate dev
npx prisma generate
```

### 5. 运行开发服务器
```bash
npm run dev
# 前端：http://localhost:3000
# 后端API：http://localhost:3001 (如果单独启动)
```

## 代码规范

### Git 提交约定
遵循 Conventional Commits：
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式（不影响功能）
- `refactor:` 重构（非功能修改）
- `test:` 测试相关
- `chore:` 构建过程或辅助工具变动

示例：
```
feat: 添加三层记忆架构数据库表
fix: 修复风险评估规则引擎逻辑
docs: 更新PRD文档行业场景描述
```

### 分支策略
- `main`：生产就绪代码
- `develop`：开发集成分支
- `feature/*`：新功能分支（如 `feature/icp-accelerator`）
- `bugfix/*`：bug修复分支
- `release/*`：发布分支

流程：
1. 从 `develop` 创建功能分支
2. 开发完成后提交 PR 到 `develop`
3. 经过代码审查和 CI 测试后合并
4. 定期从 `develop` 合并到 `main` 并打标签

### 代码风格
- 使用 ESLint 和 Prettier 进行代码格式化
- 提交前运行 `npm run lint` 和 `npm run format`
- TypeScript 严格模式启用

## CI/CD 流程

### GitHub Actions 工作流
- `build-test.yml`：推送时运行构建和测试
- `deploy-vercel.yml`：合并到 main 时自动部署到 Vercel
- `database-migration.yml`：数据库迁移自动化

### 环境变量
参考 `.env.example` 创建 `.env` 文件：
```
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 测试策略

### 单元测试
- 使用 Jest + React Testing Library
- 覆盖核心工具函数、API 路由、组件逻辑

### 集成测试
- 测试 API 端点与数据库交互
- 使用 Supertest 模拟 HTTP 请求

### E2E 测试
- 使用 Playwright 测试完整用户流程
- 覆盖关键路径：风险评估 → 合规评审 → 文档生成

## 部署与运维

### Vercel 部署
- 自动部署前端 Next.js 应用
- 环境变量通过 Vercel Dashboard 配置
- 预览部署用于每个 PR

### Supabase 部署
- 数据库迁移通过 Supabase 控制台或 CLI
- 实时备份和监控

### 监控与日志
- 使用 Vercel Analytics 和 Supabase Logs
- 错误追踪：Sentry 或 LogRocket

## 数据库设计

### 三层记忆架构表
```
organization (组织)
├── id, name, settings, created_at
├── workspaces (产品)
│   ├── id, name, organization_id, product_type, status
│   └── sessions (评估会话)
│       ├── id, workspace_id, risk_assessment, logs, reports
└── rules (规则库)
    ├── id, level, category, content, references
```

### 数据迁移
使用 Prisma Migrate 管理 schema 变更：
```bash
npx prisma migrate dev --name add_icp_fields
```

## 常见问题

### 1. 数据库连接失败
检查 `.env` 中的 DATABASE_URL 和 Supabase 连接设置。

### 2. Prisma 客户端生成失败
确保运行 `npx prisma generate` 并检查 `schema.prisma` 语法。

### 3. 前端构建失败
检查 TypeScript 错误和依赖版本。

### 4. API 响应慢
检查数据库索引和查询优化。

## 下一步开发任务

参考 `04-【开发周期】产品路线图.docx` 中的阶段划分：

1. **Demo 冲刺**：聚焦 AI营销/GEO 场景，实现核心风险评估和文档生成
2. **V1 MVP**：完整三层记忆架构、ICP备案加速器、合规日历
3. **V1.5**：扩展 AI内容生成、AI陪伴 场景，欧盟 GDPR 合规
4. **V2**：平台化，园区管理后台，企业级功能

---
*最后更新：2026-06-02*