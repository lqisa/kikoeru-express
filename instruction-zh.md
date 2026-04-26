# Kikoeru Express AI 编码指令

本文件为 AI 助手提供关于 `kikoeru-express` 项目的开发上下文和准则。

## 项目概述
`kikoeru-express` 是一个专为 DLsite 同人音声（ASMR/广播剧）设计的自托管媒体服务器。它负责索引本地音频文件并提供 Web 播放界面。

## 技术栈
- **运行时**: Node.js (>= 12.0.0)
- **框架**: Express.js
- **数据库**: SQLite3 (通过 Knex.js 管理)
- **数据库迁移**: Umzug 和 Knex-migrate
- **身份验证**: JWT (JSON Web Tokens)
- **实时通讯**: Socket.io
- **打包工具**: `pkg` (用于生成独立的可执行文件)

## 项目结构
- `app.js`: 主入口文件和 Express 服务器配置。
- `/filesystem`: 包含媒体库扫描 (`scanner.js`) 和更新 (`updater.js`) 的逻辑。
- `/database`: 
  - `migrations/`: 数据库架构演变文件。
  - `knexfile.js`: 数据库连接和配置。
  - `storage.js`: 数据库访问层。
- `/dist`: 编译后的前端或后端资源。
- `/static`: Express 托管的静态文件。
- `/config`: 配置文件目录（被 nodemon 忽略）。

## 关键脚本
- `npm start`: 使用 `app.js` 启动生产服务器。
- `npm run dev`: 使用 `nodemon` 启动开发服务器。
- `npm run scan`: 手动触发媒体库扫描。
- `npm run build`: 使用 `pkg` 将应用打包为 Windows 可执行文件。
- `npm run lint`: 运行 ESLint 并自动修复。
- `npm test`: 运行 Mocha 测试。

## 编码标准与指南

### 1. 代码风格
- 遵循 **JavaScript Standard Style**。
- 使用 **Prettier** 进行代码格式化。
- AI 应尊重 `.eslintrc` 中的配置。

### 2. 后端逻辑
- 必要时使用 `bluebird` 处理高级 Promise 逻辑。
- 确保所有 API 路由都受到 `express-jwt` 保护，除非是公开资源（如登录、静态资源）。
- 使用 `express-validator` 验证请求体和参数。

### 3. 数据库操作
- 必须使用 `knex` 构建 SQL 查询。
- 任何数据库表结构的更改必须通过 `/database/migrations/` 中的迁移文件实现。
- 使用 `umzug` 管理迁移的执行。

### 4. 错误处理
- 使用 `invariant` 进行内部一致性检查。
- 遵循标准的 Express 错误处理中间件模式。
- 确保在开发环境中追踪警告 (`--trace-warnings`)。

### 5. 文件系统
- 注意字符编码：项目使用 `jschardet` 检测文件编码。
- 在对文件列表排序时，使用 `natural-orderby` 以符合人类的排序习惯。

## AI 专用指令
- **一致性**: 添加新功能时，请匹配现有模式：使用 `lodash` 作为工具函数，使用 `bluebird` 处理异步流。
- **安全性**: 确保敏感操作（如删除文件、修改系统配置）经过身份验证和授权检查。
- **打包注意事项**: 请注意项目会被打包成单个二进制文件。避免使用 `pkg` 无法解析的动态 `require` 路径，除非在 `package.json` 的 `pkg.scripts` 或 `pkg.assets` 中显式添加。
- **文档**: 建议发布就绪的更改时，记得提醒更新 `package.json` 中的 `version`。

## 常用上下文
- **目标用户**: 想要自行托管 DLsite 资源库的用户。
- **核心元数据**: DLsite ID (RJ 号) 是识别和索引作品的核心标识符。