# GPT-5.5 API Proxy

OpenAI GPT-5.5 专用 API 中转转发服务，基于 [vip-gpt-master](../vip-gpt-master) 的代理思路重构，采用**透明转发**（不修改 SSE 流），完整支持 GPT-5.5 的 Responses API 与 Chat Completions API。

## 功能

- 透明代理 `/v1/*` 到 OpenAI 上游（兼容官方 SDK 的 `baseURL` 配置）
- 兼容旧路径 `/api/openai/v1/*`
- 流式响应原样透传，适配 GPT-5.5 reasoning tokens
- 可选访问码鉴权（`ak-<code>`）或服务端统一 API Key
- 可选模型白名单与默认模型 `gpt-5.5`
- Docker / Vercel 部署

## 快速开始

```bash
cd gpt55-proxy
cp .env.example .env.local
# 编辑 .env.local，填入 OPENAI_API_KEY

npm install
npm run dev
```

服务默认运行在 http://localhost:3000

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | 服务端 OpenAI Key | 必填（若客户端不传 Key） |
| `ACCESS_CODE` | 访问码，多个用逗号分隔 | 空（不启用） |
| `BASE_URL` | 上游 API 地址 | `api.openai.com` |
| `PROTOCOL` | 协议 | `https` |
| `OPENAI_ORG_ID` | 组织 ID | 空 |
| `DEFAULT_MODEL` | 请求未指定 model 时的默认值 | `gpt-5.5` |
| `ALLOWED_MODELS` | 允许的模型列表 | 空（不限制） |

## 客户端用法

### OpenAI Node SDK

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-xxx", // 或留空，由服务端 OPENAI_API_KEY 注入
  baseURL: "http://localhost:3000/v1",
});

// Chat Completions
const chat = await client.chat.completions.create({
  model: "gpt-5.5",
  messages: [{ role: "user", content: "Hello" }],
  stream: true,
});

// Responses API（GPT-5.5 推荐）
const response = await client.responses.create({
  model: "gpt-5.5",
  input: "Write a Python quicksort.",
  reasoning: { effort: "medium" },
});
```

### curl

```bash
# Chat Completions
curl http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "Hi"}],
    "stream": true
  }'

# Responses API
curl http://localhost:3000/v1/responses \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "input": "Explain transformers in one paragraph.",
    "reasoning": {"effort": "medium"}
  }'
```

### 访问码模式

设置 `ACCESS_CODE=mysecret` 后，客户端使用：

```
Authorization: Bearer ak-mysecret
```

服务端会自动注入 `OPENAI_API_KEY` 转发到 OpenAI。

## 支持的模型

- `gpt-5.5`
- `gpt-5.5-pro`
- `gpt-5.5-2026-04-23`

## 部署

### Docker

```bash
docker build -t gpt55-proxy .
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=sk-xxx \
  gpt55-proxy
```

### Vercel

1. 导入项目到 Vercel
2. 设置环境变量 `OPENAI_API_KEY`
3. 部署

## Nginx 反向代理（流式输出）

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding on;
}
```

## 与原项目的区别

| 项目 | vip-gpt-master | gpt55-proxy |
|------|----------------|-------------|
| 定位 | 完整 ChatGPT Web UI | 纯 API 中转 |
| 流式处理 | 解析 SSE 提取 content | 透明透传 |
| API | Chat Completions | + Responses API |
| 模型 | GPT-3.5/4 | GPT-5.5 系列 |

## License

MIT
