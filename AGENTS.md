# AGENTS.md

本文件为在 Smart Survey 仓库中工作的编码代理提供项目约定、开发流程和注意事项。请在修改代码前先阅读本文件，再结合 `README.md`、`操作流程.md` 和 `plan.md` 理解当前项目状态。

## 项目概览

Smart Survey 是一个本地问卷系统，基于 Vue 3、TypeScript、Vite、Pinia、Vue Router、SCSS 和 ECharts 构建。当前版本没有后端服务，问卷、回答和填写进度全部保存在浏览器 `localStorage` 中。

核心功能包括：

- 问卷创建、编辑、复制、删除、发布和关闭。
- 单选、多选、填空、多行文本、评分、矩阵、排序题。
- 必答校验、自定义校验、条件显示、条件隐藏、条件跳转。
- 随机题目、随机选项、关闭时间、填写进度保存。
- 数据分析、JSON 导出、CSV 导出。

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run preview
```

验收改动时优先运行：

```bash
npm run build
```

当前没有测试脚本。如果新增测试，请同步更新 `package.json`、README 或本文件中的命令说明。

## 目录说明

```text
src/
├── assets/              # 全局样式和 SCSS 变量
├── components/
│   ├── editor/          # 问卷编辑器组件
│   └── form/            # 填写页题型组件
├── router/              # Vue Router 路由配置
├── stores/              # Pinia store，包含 localStorage 持久化逻辑
├── types/               # 问卷、题目、回答等 TypeScript 类型
├── views/               # 页面级组件
├── App.vue
└── main.ts
```

重要文件：

- `src/types/survey.ts`：业务模型的源头，新增题型、校验或逻辑时先更新这里。
- `src/stores/survey.ts`：问卷和回答的状态管理、本地持久化、提交保护。
- `src/views/EditorView.vue`：创建和编辑问卷。
- `src/views/FillView.vue`：填写问卷、校验、条件逻辑、保存进度。
- `src/views/AnalysisView.vue`：分析图表、统计和导出。
- `src/components/editor/QuestionEditor.vue`：题目配置 UI。
- `src/components/form/*Question.vue`：各题型在填写页的渲染和交互。

## Git 和产物策略

不要提交以下内容：

- `dist/`
- `*.tsbuildinfo`
- `.idea/`
- `node_modules/` 中新增的本地文件
- 日志、临时文件、环境变量文件

这些规则已写入 `.gitignore`。如果运行构建或开发服务器生成了这些文件，不要把它们加入提交。

注意：仓库历史中可能曾经跟踪过 `node_modules` 或构建产物。处理 Git 状态时以当前 `.gitignore` 和用户最新要求为准，不要主动恢复已被移除跟踪的构建产物。

## 编码约定

- 使用 Vue 3 `<script setup lang="ts">` 风格。
- 保持 TypeScript 类型显式、业务数据结构清晰。
- 优先复用现有 store、类型和组件，不要为小改动引入新的状态管理方案。
- 样式使用 SCSS，并复用 `src/assets/variables.scss` 中的颜色、间距、圆角、阴影变量。
- 避免使用 Sass 已废弃的 `darken()` 等全局函数；需要固定颜色时可使用明确色值，或统一迁移到 Sass 模块化颜色函数。
- 不要把业务逻辑散落在多个组件里；跨页面共享的问卷行为优先放到 store 或独立 helper 中。
- 对嵌套问卷数据做编辑、复制、保存时要注意深拷贝，避免共享引用污染原问卷。

## 业务规则

### 问卷状态

- `draft`：草稿，可编辑，不能填写。
- `published`：已发布，可填写；如果设置了关闭时间，则必须未过期。
- `closed`：已关闭，不能填写和提交。

填写页和 store 层都应保留状态校验，不能只依赖 UI 隐藏入口。

### 本地存储 Key

- `smart-survey-list`：问卷列表。
- `smart-survey-responses`：回答列表。
- `smart-survey-progress-{surveyId}`：指定问卷的未提交填写进度。

提交成功后应清理对应填写进度。

### 随机题目和随机选项

随机顺序应在进入填写页时生成一次，并在本次填写过程中保持稳定。不要在响应式 `computed` 中每次重新随机，否则用户答题时题目或选项会跳动。

### 条件逻辑

当前支持操作符：

- `equals`
- `not_equals`
- `contains`
- `greater_than`
- `less_than`

当前支持动作：

- `show`
- `hide`
- `jump`

修改条件逻辑时请同时检查：

- 编辑器配置 UI。
- 填写页条件计算。
- 跳转目标不存在或隐藏时的兜底行为。
- 必答校验是否只校验可见题目。

### 自定义校验

当前支持：

- `min_length`
- `max_length`
- `pattern`
- `range`

校验失败时应给出用户可理解的错误提示。正则配置错误时不要让页面崩溃，应展示配置错误提示或安全失败。

## UI 和交互注意事项

- 首页卡片整体点击进入编辑页；卡片内按钮必须阻止冒泡，避免点击填写或分析时误进编辑页。
- 编辑页的“保存草稿”和“发布问卷”必须校验标题；发布还必须校验至少有一道题。
- 填写页提交时需要校验所有可见题目，避免用户通过底部导航点跳过必答题。
- 排序题即使用户没有拖拽，也应提交默认顺序作为答案。
- 分析页在没有回答数据时应禁用导出或给出明确提示。

## 验收建议

每次功能改动后至少执行：

```bash
npm run build
```

建议手动检查的核心路径：

1. 创建问卷并保存草稿。
2. 重新编辑草稿，新增、删除、拖拽题目。
3. 发布问卷。
4. 填写问卷并提交。
5. 查看分析页。
6. 导出 JSON 和 CSV。
7. 复制问卷后修改副本，确认原问卷不受影响。
8. 设置关闭时间后确认过期问卷不能填写。

如果改动涉及填写页，请额外检查：

- 必答题校验。
- 题目导航点跳转。
- 保存进度刷新恢复。
- 随机题目和随机选项是否稳定。
- 条件显示、隐藏和跳转。

## 文档维护

当功能、命令、数据结构或使用流程变化时，请同步更新：

- `README.md`：项目说明和技术信息。
- `操作流程.md`：面向使用者的实际操作步骤。
- `plan.md`：后续计划和优先级。
- `AGENTS.md`：面向编码代理的约定和注意事项。

## 已知限制

- 当前项目是本地存储版本，不支持跨浏览器、跨设备同步。
- 没有用户系统、权限控制、后端 API 或公开问卷链接。
- 当前没有自动化测试。
- 分析页依赖 ECharts，构建时可能出现 chunk 体积提示。

