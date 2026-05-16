# Smart Survey 操作文档

## 1. 项目概述

Smart Survey 是一款基于 Vue 3 + TypeScript + Vite 构建的智能问卷系统，支持问卷创建、编辑、发布、数据分析完整流程。

### 技术栈
- **前端框架**: Vue 3.5 + TypeScript
- **状态管理**: Pinia
- **路由**: Vue Router 5
- **构建工具**: Vite 8
- **样式**: SCSS

---

## 2. 功能模块

### 2.1 首页 (`/`) - 问卷管理

| 操作 | 说明 |
|------|------|
| 创建问卷 | 点击右上角「创建问卷」按钮，进入编辑页 |
| 编辑问卷 | 点击问卷卡片进入编辑页面 |
| 填写问卷 | 点击已发布问卷的填写按钮 (仅发布状态可见) |
| 数据分析 | 点击分析按钮查看回收数据 (需有回答数据) |
| 复制问卷 | 复制问卷为草稿状态 |
| 删除问卷 | 删除问卷 (含确认提示) |

**问卷状态**:
- `草稿` (draft) - 可编辑，未发布
- `已发布` (published) - 公开填写
- `已关闭` (closed) - 停止填写

### 2.2 问卷编辑器 (`/create`, `/edit/:id`)

#### 支持的问题类型

| 类型 | 标识 | 说明 |
|------|------|------|
| 单选题 | radio | 只能选择一个选项 |
| 多选题 | checkbox | 可选择多个选项 |
| 填空题 | input | 单行文本输入 |
| 多行文本 | textarea | 多行文本输入 |
| 评分题 | scale | N分制评分 (如1-5分) |
| 矩阵题 | matrix | 行×列矩阵选择 |
| 排序题 | sort | 选项排序 |

#### 编辑功能
- 添加/编辑/删除问题
- 拖拽排序问题
- 设置问题为必答
- 配置选项 (选择题)
- 配置评分范围和标签 (评分题)

#### 问卷设置
- `allowSave` - 允许保存进度
- `showProgress` - 显示进度条
- `randomizeQuestions` - 随机排列题目
- `randomizeOptions` - 随机排列选项

#### 发布流程
1. 填写问卷标题 (必填)
2. 添加至少一个问题
3. 点击「发布问卷」自动发布
4. 点击「保存草稿」仅保存

### 2.3 问卷预览 (`/preview/:id`)

- 查看问卷整体结构
- 预览各问题样式
- **注意**: 预览模式回答不会被保存

### 2.4 填写问卷 (`/fill/:id`)

- 逐步填写，每题一页
- 显示完成进度百分比
- 上一题/下一题导航
- 问题导航点可直接跳转
- 必答题验证
- 自定义验证规则支持
- 条件逻辑 (显示/隐藏/跳转)
- 提交后跳转感谢页

### 2.5 数据分析 (`/analysis/:id`)

| 统计项 | 说明 |
|--------|------|
| 回收数量 | 总回答数 |
| 完成率 | 完整回答百分比 |
| 题目数量 | 问卷问题数 |

**问题类型统计**:
- **选择题**: 各选项计数和百分比柱状图
- **评分题**: 平均分展示
- **文本题**: 显示回答列表 (最多3条)

**导出功能**: 导出 JSON 格式完整数据

### 2.6 感谢页 (`/thanks`)

- 问卷提交成功后显示
- 提供返回首页入口

---

## 3. 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | HomeView | 问卷列表/管理 |
| `/create` | EditorView | 创建问卷 |
| `/edit/:id` | EditorView | 编辑问卷 |
| `/preview/:id` | PreviewView | 问卷预览 |
| `/fill/:id` | FillView | 填写问卷 |
| `/thanks` | ThanksView | 提交成功 |
| `/analysis/:id` | AnalysisView | 数据分析 |

---

## 4. 数据存储

- **存储方式**: localStorage
- **问卷数据**: `smart-survey-list`
- **回答数据**: `smart-survey-responses`

---

## 5. 开发命令

```bash
npm run dev      # 开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
```

---

## 6. 目录结构

```
src/
├── assets/          # 静态资源、SCSS变量
├── components/
│   ├── editor/      # 编辑器组件
│   │   ├── QuestionCard.vue
│   │   └── QuestionEditor.vue
│   └── form/        # 表单组件
│       ├── CheckboxQuestion.vue
│       ├── InputQuestion.vue
│       ├── RadioQuestion.vue
│       └── ScaleQuestion.vue
├── stores/          # Pinia stores
├── types/           # TypeScript 类型
├── views/           # 页面组件
├── router/          # 路由配置
└── App.vue
```
