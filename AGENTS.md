# AGENTS.md

本文件为在 LingoSnake 仓库中工作的编码代理提供项目约束。

## 项目概述

LingoSnake（小蛇欢乐屋）是一个原生微信小程序，使用间隔重复帮助学生学习英语词汇。项目零第三方运行依赖，学习数据保存在微信本地存储中。

## 目录

- `src/core/`：唯一业务逻辑源，使用 CommonJS，不得依赖 `wx` 或页面代码。
- `src/pages/`：微信页面与交互。
- `src/utils/`：微信存储、材料加载等平台适配。
- `data/sample/`：允许公开的原创示例词库。
- `private/vocabulary/`：本地私有词库，禁止提交。
- `src/data/generated/`：运行时生成词库，禁止提交。
- `tests/`：Node.js ESM 断言测试。

不要重新创建根目录 `.mjs` 测试镜像或 Web IIFE 模块。测试必须直接加载 `src/core/*.js`。

## 常用命令

```bash
npm run prepare
npm test
npm run check
```

`npm run prepare` 在没有 `config/local.json` 时使用公开示例数据。真实词库路径只能写入被忽略的 `config/local.json`。

## 隐私与安全

- 不得提交个人 AppID、`project.private.config.json`、私有词库或生成数据。
- 小程序客户端不应包含 API Secret；真正密钥必须由服务端持有。
- 新增公开词库前必须确认数据授权。

## 测试要求

- 修改功能或修复问题时先添加会失败的测试，再实现最小改动。
- 核心逻辑变更运行对应测试，并在结束前运行 `npm run check`。
- 页面资源路径与本地 `require()` 目标由结构测试保护。

## Git 提交规范

提交前先查看 `git diff --cached`；暂存区为空时查看 `git diff`。

提交信息格式：

```text
<emoji> <type>: <20 字以内中文动宾描述>
```

常用类型：`✨ feat`、`🐛 fix`、`📝 docs`、`💄 style`、`♻️ refactor`、`✅ test`、`📦 build`、`🔧 chore`、`🔥 remove`、`🔒 security`。
