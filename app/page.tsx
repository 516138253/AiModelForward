import { GPT55_MODELS } from "@/lib/constants";

export default function HomePage() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 720,
        margin: "48px auto",
        padding: "0 24px",
        lineHeight: 1.6,
      }}
    >
      <h1>GPT-5.5 API Proxy</h1>
      <p>
        OpenAI GPT-5.5 中转服务。将客户端的 <code>baseURL</code>{" "}
        指向本服务即可使用。
      </p>

      <h2>支持的模型</h2>
      <ul>
        {GPT55_MODELS.map((m) => (
          <li key={m}>
            <code>{m}</code>
          </li>
        ))}
      </ul>

      <h2>接口地址</h2>
      <ul>
        <li>
          Chat Completions: <code>POST /v1/chat/completions</code>
        </li>
        <li>
          Responses API: <code>POST /v1/responses</code>
        </li>
        <li>
          模型列表: <code>GET /v1/models</code>
        </li>
        <li>
          健康检查: <code>GET /api/health</code>
        </li>
      </ul>

      <h2>客户端配置示例</h2>
      <pre
        style={{
          background: "#f4f4f5",
          padding: 16,
          borderRadius: 8,
          overflow: "auto",
        }}
      >
        {`// OpenAI Node SDK
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://your-domain.com/v1",
});

const res = await client.chat.completions.create({
  model: "gpt-5.5",
  messages: [{ role: "user", content: "Hello" }],
});

// Responses API (GPT-5.5 推荐)
const response = await client.responses.create({
  model: "gpt-5.5",
  input: "Explain quantum computing briefly.",
  reasoning: { effort: "medium" },
});`}
      </pre>

      <h2>环境变量</h2>
      <p>
        复制 <code>.env.example</code> 为 <code>.env.local</code>{" "}
        并配置 <code>OPENAI_API_KEY</code>。
      </p>
    </main>
  );
}
