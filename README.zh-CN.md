<div align="center">
  <img src="src/assets/app-avatar.png" width="112" height="112" alt="LingoSnake 小程序头像">
  <h1>LingoSnake</h1>
  <p>小蛇欢乐屋：为微信小程序打造的趣味间隔重复词汇学习工具。</p>
  <p>简体中文 | <a href="README.md">English</a></p>
</div>

LingoSnake 的中文名称是 **小蛇欢乐屋**。它把每天的单词复习变成明亮、专注的学习流程，适合需要清晰计划、即时答题反馈和学习记录的学生。

## 界面预览

| 学习首页 | 答题界面 |
| --- | --- |
| ![LingoSnake 学习首页](docs/images/home.png) | ![LingoSnake 答题界面](docs/images/quiz.png) |

截图只使用公开示例词库，不包含私有教材数据或个人学习记录。

## 功能特点

- 按学习日执行间隔重复，复习间隔为 1、2、4、7、15、30 天。
- 新学数量和复习上限可以分别设置。
- 支持看中文选英文、看英文选中文、看音标选单词和混合题型。
- 支持 A 到 Z、Z 到 A、按单元和带种子的乱序学习。
- 答题后立即提供视觉、震动和区分明确的正确/错误音效反馈。
- 提供已学记录、按日期整理的错题本和词形关系。
- 支持多份词汇材料，每份材料拥有独立进度和设置。
- 进度保存在本地，并支持 JSON 备份恢复和 CSV 错题导出。
- 无运行时依赖、无账号、无统计分析、无云服务。

## 快速开始

### 环境要求

- [Node.js 22](https://nodejs.org/) 或更高版本
- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

### 运行小程序

```bash
git clone https://github.com/eoeac/lingosnake.git
cd lingosnake
npm run prepare
```

在微信开发者工具中打开仓库根目录前，先创建本地项目配置：

```powershell
Copy-Item project.example.config.json project.config.json
```

`project.example.config.json` 使用 `touristappid` 仅用于公开示例。要消除游客模式限制，请在本地 `project.config.json` 中填写你自己的真实 AppID。`project.config.json` 已被 Git 忽略，不会提交到公开仓库。

运行完整本地检查：

```bash
npm run check
```

## 词库数据

公开仓库只包含 `data/sample/` 中少量原创示例词。完整考纲或教材衍生词库不会公开分发。

准备命令会校验选中的材料，并将被 Git 忽略的 CommonJS 运行数据写入 `src/data/generated/`：

```bash
npm run prepare
```

### 使用私有词库

1. 将已获得授权的本地材料放入 `private/vocabulary/`。
2. 把 `config/local.example.json` 复制为 `config/local.json`。
3. 在 `vocabularySources` 中填写一个或多个 JSON 文件路径。
4. 再次运行 `npm run prepare`。

`private/vocabulary/`、`config/local.json` 和生成后的运行数据都会被 Git 忽略。

### 材料格式

每个数据源都是一个材料数组：

```json
[
  {
    "id": "my-starter-words",
    "name": "My Starter Words",
    "defaultOrderMode": "unit",
    "words": [
      {
        "id": "starter-0001-bright",
        "index": 1,
        "word": "bright",
        "phonetic": "/braɪt/",
        "unit": "U1",
        "page": "1",
        "meanings": [
          { "pos": "adj.", "zh": "明亮的；聪明的" }
        ],
        "wordForms": "brightly adv. 明亮地 brightness n. 明亮"
      }
    ]
  }
]
```

材料 ID 和单词 ID 必须唯一；每个单词都要有英文拼写和至少一个非空中文释义。

## 项目架构

```text
src/
├─ core/       与平台无关的学习逻辑
├─ pages/      微信页面和交互
├─ utils/      存储与材料适配
├─ assets/     图标、头像和答题音效
└─ data/       生成后的运行材料

data/sample/   可公开的原创示例词
scripts/       数据准备与语法检查
tests/         Node.js 断言测试
```

`src/core/` 是调度、出题、排序、词形关系、导入导出和会话锁定的唯一代码来源。小程序与 Node 测试会加载同一组 CommonJS 模块。

## 常用命令

```bash
npm run prepare  # 校验并生成运行词库
npm test         # 运行全部断言测试
npm run check    # 准备数据、检查 JavaScript 语法并运行测试
```

## 隐私与安全

- 学习进度默认只保存在微信本地存储中，除非用户主动导出。
- 不要提交个人 AppID、`project.config.json`、`project.private.config.json`、私有词库或生成数据。
- 客户端 `.env` 无法真正保护密钥；API Secret 必须保存在服务端，绝不能打包进小程序。
- 只分发你确认拥有公开授权的词汇数据。

### JSON 进度文件

- 在小程序的“学习设置与数据”中点击“导出 JSON”，会生成 `lingosnake-progress.json` 并调起微信文件分享。
- 建议将导出的文件发送到自己的“文件传输助手”；恢复时点击“导入 JSON”，从微信文件中选择该文件。
- 微信开发者工具不支持完整模拟文件分享，导出功能请使用真机调试；附件或本地 JSON 需要先发送到微信聊天后再选择。

## 参与贡献

1. 从 `main` 创建职责明确的分支。
2. 修改行为前先添加会失败的测试。
3. 运行 `npm run check`。
4. 提交 Pull Request，并说明用户影响和测试证据。

仓库开发规则请参阅 [AGENTS.md](AGENTS.md)。

## 后续方向

当前项目专注原生微信小程序。未来如需 Web 或多端版本，可以使用 **Taro** 重构并复用 `src/core/`，不会恢复已经删除的旧版独立 Web 实现。

## 开源许可

[MIT](LICENSE) © 2026 LingoSnake contributors。
