# <center>博客API服务</center>

## 项目介绍

本项目为Nest.js完成的博客API服务，集成权限验证，对象储存，webSocket聊天功能

### 项目使用技术

Nest.js （Node.js开发框架） + TypeORM（数据库操作） + Passport（权限验证） + Ali-Oss（对象储存） + Socket.io（实时通信）+ Multer（文件上传）

### 目录介绍

```shell
src  # 项目目录
-- common  # 通用模块
   -- decorator # 自定义装饰器
   -- dto # 通用dto验证文件
   -- entity # 通用实体
   -- filtter # 过滤器
   -- guard  # 守卫
   -- interceptor # 拦截器
   -- logger # 日志
   -- middleware # 中间件
-- config  # 配置文件
-- constant # 常量配置
-- modules # 实体、接口都写里面
   -- user
      -- dto # dto 验证配置
      -- entity # 数据实体
      -- user.controll.ts # user 控制器
      -- user.module.ts  # user 模块 （管理controller，service之类的模块）
      -- user.service.ts  # user 服务提供（数据库操作）
-- template # 模板文件
-- utils  # 封装的工具类
-- app.controller.spec.ts # app.controller.ts 测试文件
-- app.controller.ts  # app控制器
-- app.module.ts  # app 模块
-- app.service.ts  # app 服务提供
-- main.ts  # 主入口
test # 测试目录
.env.example  # 置环境示例
.eslintrc.js # eslit 配置
.gitignore   # git 提交忽略文件
.prettierrc  # pettier 配置文件
README.md    # 阅读指南
nest-cli.json # nest cli 配置
package.json # 依赖包管理
pnpm-lock.yaml  # 依赖包版本锁定文件
tsconfig.build.json  # ts打包配置
tsconfig.json  # ts 配置
```



## 项目启动

### 环境配置

```shell
NODE_ENV=development
ALLOW_ORIGIN=http://localhost:5000
# 数据库配置
DB_TYPE=mysql
DB_PORT=3306
DB_HOST=localhost
DB_USERNAME=root
DB_PASSWORD=123456
DB_DATABASE=dbname

# jwt配置
JWT_SECRET=my_secret

# 邮箱配置
MAIL_USER=xxxxx@qq.com
MAIL_PASS=xxxxxx
MAIL_DEFAULT_FROM="name" <xxxxx@qq.com>

# oss配置
accessKeyId=xxxxxxxxxx
accessKeySecret=xxxxxxxxxx
bucket=xxxxxxxx
region=oss-cn-beijing
OSS_UPLOAD_IMAGE_PATH=image/

# 图片上传
UPLOAD_IMAGE_PATH=upload/oss/image/
```

> 注意：环境变量值缺一不可，否则无法正常运行！



### 依赖安装

```sh
pnpm install
```



### 启动命令（开发环境）

```sh
# npm 
npm run start:dev

# cnpm 
cnpm run start:dev

# pnpm 
pnpm run start:dev

# yarn
yarn run start:dev
```

