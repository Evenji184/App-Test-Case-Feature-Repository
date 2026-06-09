# FeaturePicker 插件集成文档

APP 特征库系统提供一个可嵌入的 iframe 插件，允许第三方系统在不跳转页面的情况下让用户选择特征、生成提示词，并通过 `postMessage` 将结果回传给宿主页面。

---

## 插件地址

```
http://<your-host>:<port>/plugin/feature-picker
```

开发环境默认：`http://localhost:5173/plugin/feature-picker`

---

## 嵌入方式

```html
<iframe
  id="feature-picker"
  src="http://localhost:5173/plugin/feature-picker"
  style="width: 100%; height: 600px; border: none;"
  allow="*"
></iframe>
```

**推荐尺寸：** 宽度 360px 以上，高度 560px 以上（移动端 H5 风格）。

---

## 认证流程

插件内部自带登录能力，无需宿主系统传入 token。

| 状态 | 行为 |
|------|------|
| 未登录 | 自动跳转到 `/login?redirect=/plugin/feature-picker` |
| 登录成功 | 自动跳回插件页，继续操作 |
| Session 失效（token 过期/无效） | 清除本地 token，跳转登录页，同时向宿主发送 `SESSION_EXPIRED` 消息 |

---

## postMessage 协议

插件通过 `window.parent.postMessage(payload, '*')` 向宿主页面发送消息。

宿主页面监听示例：

```javascript
window.addEventListener('message', function (event) {
  const { type } = event.data;

  if (type === 'PROMPT_READY') {
    // 用户选完特征、点击"发送结果"
    console.log('提示词详情：', event.data.prompt);
  }

  if (type === 'PROMPT_ERROR') {
    // 生成提示词时发生错误
    console.error('生成失败：', event.data.message);
  }

  if (type === 'SESSION_EXPIRED') {
    // 用户 session 已失效，宿主可弹出登录弹窗或引导重新登录
    console.warn('Session 已失效，请重新登录');
  }
});
```

### PROMPT_READY

生成成功且用户点击"发送结果"后触发。

```typescript
{
  type: 'PROMPT_READY',
  prompt: {
    id: string,              // 提示词唯一 ID
    name: string | null,     // 用户可选修改的名称
    content: string,         // 生成的提示词正文
    model: string | null,    // 使用的 AI 模型名称
    providerName: string,    // AI 供应商名称
    createdByName: string | null,  // 生成人用户名
    nodeIds: string | null,  // 选择的节点 ID 列表（逗号分隔）
    featureIds: string | null, // 选择的特征 ID 列表（逗号分隔）
    createdAt: string,       // 创建时间（ISO 8601）
  }
}
```

### PROMPT_ERROR

调用 AI 生成接口失败时触发（网络错误、超时、AI 服务报错等）。

```typescript
{
  type: 'PROMPT_ERROR',
  message: string  // 错误描述
}
```

### SESSION_EXPIRED

用户 token 过期或无效，GraphQL 返回 401/认证错误时触发。

```typescript
{
  type: 'SESSION_EXPIRED'
}
```

---

## 依赖的 GraphQL 接口

插件页面使用以下 4 个 GraphQL 接口，均需认证（Bearer Token）。

### 1. nodeTree

获取节点树，用于左侧节点选择。

```graphql
query NodeTree {
  nodeTree {
    id
    parentId
    name
    code
    nodeType
    isVisible
    children { ... }  # 递归，最多 4 层
  }
}
```

- **权限：** 需登录，无特殊权限要求
- **返回：** 根节点数组，含递归 `children`

### 2. featureList

按节点 ID 列表查询特征，用于展示可选特征列表。

```graphql
query FeatureList(
  $pagination: PaginationInput!
  $nodeIds: [String!]
  $includeHidden: Boolean
) {
  featureList(
    pagination: $pagination
    nodeIds: $nodeIds
    includeHidden: $includeHidden
  ) {
    items {
      id
      nodeId
      title
      code
      summary
      platform
      status
      priority
      isVisible
    }
    pageInfo { total page pageSize }
  }
}
```

- **变量：**
  - `pagination`：`{ page: 1, pageSize: 200 }`（插件一次加载所有可见特征）
  - `nodeIds`：选中节点 ID 数组
  - `includeHidden`：`false`（仅展示可见特征）
- **权限：** 需登录

### 3. generatePrompt

调用 AI 生成提示词，结果保存到数据库，返回 `id`。

```graphql
mutation GeneratePrompt($input: GeneratePromptInput!) {
  generatePrompt(input: $input) {
    success
    message
    error { code message }
    id        # 保存后的 Prompt 记录 ID
    content
    model
    usage
  }
}
```

- **变量：**
  ```json
  {
    "input": {
      "nodeIds": ["node-id-1", "node-id-2"],
      "featureIds": ["feature-id-1", "feature-id-2"]
    }
  }
  ```
- **权限：** 需登录
- **超时：** 前端 fetch 超时 300s，后端 AI 请求超时 300s

### 4. getPrompt

通过 ID 查询已保存的提示词详情。

```graphql
query GetPrompt($id: ID!) {
  getPrompt(id: $id) {
    id
    name
    content
    model
    providerId
    providerName
    createdById
    createdByName
    nodeIds
    featureIds
    createdAt
  }
}
```

- **权限：** 需登录

---

## 完整宿主集成示例

```html
<!DOCTYPE html>
<html>
<head>
  <title>宿主页面示例</title>
</head>
<body>

<button onclick="openPicker()">打开特征选择器</button>
<div id="result"></div>

<div id="picker-container" style="display:none; position:fixed; right:0; top:0; width:400px; height:100vh; z-index:9999; background:#fff; box-shadow:-2px 0 8px rgba(0,0,0,.15);">
  <iframe
    id="feature-picker"
    src="http://localhost:5173/plugin/feature-picker"
    style="width:100%; height:100%; border:none;"
  ></iframe>
</div>

<script>
  function openPicker() {
    document.getElementById('picker-container').style.display = 'block';
  }

  function closePicker() {
    document.getElementById('picker-container').style.display = 'none';
  }

  window.addEventListener('message', function (event) {
    const { type } = event.data;

    if (type === 'PROMPT_READY') {
      const prompt = event.data.prompt;
      // 将提示词内容填入输入框或其他处理
      document.getElementById('result').textContent = prompt.content;
      closePicker();
    }

    if (type === 'PROMPT_ERROR') {
      alert('生成失败：' + event.data.message);
    }

    if (type === 'SESSION_EXPIRED') {
      // 可选：关闭 iframe，提示用户在新窗口登录后重试
      closePicker();
      alert('登录已过期，请重新打开选择器并登录');
    }
  });
</script>

</body>
</html>
```

---

## 跨域注意事项

- 宿主页面与插件服务不同源时，`postMessage` 仍可正常工作（不受同源策略限制）
- 若需限制消息来源，可将 `window.parent.postMessage(payload, '*')` 改为指定 origin，并在宿主侧校验 `event.origin`
- 插件本身不读取宿主 cookie，认证状态完全隔离在 iframe 内部

---

## 配置参数（环境变量）

前端通过 `.env` 文件指定后端地址：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_SCHEME` | `http` | 后端协议 |
| `VITE_API_HOST` | `localhost` | 后端主机 |
| `VITE_API_PORT` | `8001` | 后端端口 |

后端 GraphQL endpoint：`{SCHEME}://{HOST}:{PORT}/graphql`
