# 智语轩API服务

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

## 项目介绍

本项目为基于Nest.js开发的后端API服务，集成了权限验证、对象存储、WebSocket实时通信等功能。智语轩API服务提供了完整的用户管理、内容管理、AI对话等功能，支持多种云存储方案和AI模型集成。

## 技术栈

- **框架**: [Nest.js](https://nestjs.com/) - 强大的Node.js服务端框架
- **数据库**: [TypeORM](https://typeorm.io/) - 优秀的ORM框架
- **认证**: [Passport](http://www.passportjs.org/) - 灵活的身份验证中间件
- **存储**: [Ali-OSS](https://github.com/ali-sdk/ali-oss) - 阿里云对象存储服务
- **通信**: [Socket.io](https://socket.io/) - 实时双向通信库
- **文件上传**: [Multer](https://github.com/expressjs/multer) - 文件上传中间件
- **API文档**: [Swagger](https://swagger.io/) - API文档生成工具
- **缓存**: [Redis](https://redis.io/) - 高性能缓存服务

## 目录结构

```
src  # 项目目录
-- common  # 通用模块
   -- decorator # 自定义装饰器
   -- dto # 通用dto验证文件
   -- entity # 通用实体
   -- filter # 过滤器
   -- guard  # 守卫
   -- interceptor # 拦截器
   -- logger # 日志
   -- middleware # 中间件
-- config  # 配置文件
-- constant # 常量配置
-- modules # 实体、接口都写里面
   -- user # 用户模块
   -- article # 文章模块
   -- auth # 认证模块
   -- chat # 聊天模块
   -- comment # 评论模块
   -- logger # 日志模块
   -- oss # 对象存储模块
   -- session # 会话模块
   -- tags # 标签模块
   -- website # 网站模块
   -- ai # AI模块
-- utils  # 封装的工具类
-- app.controller.ts  # app控制器
-- app.module.ts  # app 模块
-- app.service.ts  # app 服务提供
-- main.ts  # 主入口
```

## 功能特性

- 🔐 **用户认证**: 基于JWT的用户认证系统
- 📝 **内容管理**: 文章、评论、标签等内容管理
- 💬 **实时聊天**: 基于Socket.io的实时通信功能
- 🤖 **AI集成**: 支持通义千问、Kimi等AI模型接入
- 📤 **文件上传**: 支持阿里云OSS和又拍云的文件上传
- 📊 **API文档**: 集成Swagger的API文档
- 🔄 **缓存系统**: 基于Redis的缓存系统

## 环境要求

- Node.js >= 14.x
- MySQL >= 5.7
- Redis >= 6.0

## 安装与配置

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/zhiyuxuan-api.git
cd zhiyuxuan-api
```

### 2. 安装依赖

```bash
# 使用pnpm (推荐)
pnpm install

# 或使用npm
npm install

# 或使用yarn
yarn install
```

### 3. 环境配置

复制环境变量示例文件并根据实际情况修改：

```bash
cp .env.example .env
```

配置示例：

```
NODE_ENV=development
# cors 配置
ALLOW_ORIGIN=http://localhost:5000,http://localhost:3000

# 数据库配置
DB_HOST=localhost
DB_USERNAME=root
DB_PASSWORD=root
DB_PORT=3306
DB_TYPE=mysql
DB_DATABASE=dbname

# JWT配置
JWT_SECRET=your_jwt_secret

# 邮箱配置
MAIL_DEFAULT_FROM="Your Name" <your-email@example.com>
MAIL_PASS=your_email_password
MAIL_USER=your-email@example.com

# redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# oss 配置
accessKeyId=your_access_key_id
accessKeySecret=your_access_key_secret
bucket=your_bucket_name
OSS_UPLOAD_IMAGE_PATH=image/
region=oss-cn-region

UPLOAD_IMAGE_PATH=/oss/image/

# 又拍云配置 (可选)
UPYUN_service=your_upyun_service
UPYUN_operator=your_upyun_operator
UPYUN_password=your_upyun_password
UPYUN_ACESS_URL=your_upyun_access_url

# 通义千问配置 (可选)
TY_API_URL=your_tongyi_api_url
TY_API_KEY=your_tongyi_api_key

# kimi-ai配置 (可选)
KIMI_API_URL=your_kimi_api_url
KIMI_API_KEY=your_kimi_api_key
```

> **注意**：环境变量值缺一不可，否则无法正常运行！

## 启动项目

### 开发环境

```bash
# 使用pnpm
pnpm run start:dev

# 或使用npm
npm run start:dev

# 或使用yarn
yarn run start:dev
```

### 生产环境

```bash
# 构建项目
pnpm run build

# 启动项目
pnpm run start:prod
```

## API文档

启动项目后，访问以下地址查看API文档：

```
http://localhost:3000/api
```

> 注：端口号可能会根据您的配置有所不同

## 测试

```bash
# 单元测试
pnpm run test

# e2e测试
pnpm run test:e2e

# 测试覆盖率
pnpm run test:cov
```

## 贡献指南

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

[MIT](LICENSE)

## 联系方式

如有任何问题或建议，请通过以下方式联系我们：

- 项目维护者: [Your Name](mailto:18056639380@qq.com)
- 项目仓库: [GitHub](https://github.com/HoIolo/wp-server)
