import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 8080;
const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (clientSocket) => {
  console.log("🔌 Client connected");

  const openaiSocket = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
    }
  );

  let isOpenAIReady = false;
  const queue = [];

  openaiSocket.on("open", () => {
    console.log("✅ Connected to OpenAI");
    isOpenAIReady = true;

    // Kuyruğa alınan mesajları gönder
    for (const msg of queue) {
      openaiSocket.send(msg);
    }
  });

  openaiSocket.on("message", (data) => {
    clientSocket.send(data);
  });

  clientSocket.on("message", (data) => {
    console.log("📥 From frontend:", data.toString());

    if (isOpenAIReady) {
      openaiSocket.send(data);
    } else {
      console.log("⏳ OpenAI not ready, queuing message");
      queue.push(data);
    }
  });

  clientSocket.on("close", () => {
    openaiSocket.close();
  });

  openaiSocket.on("close", (code, reason) => {
    console.log(`❌ OpenAI WebSocket closed: Code=${code} Reason=${reason}`);
    clientSocket.close();
  });

  openaiSocket.on("error", (err) => {
    console.error("❌ OpenAI WebSocket error:", err);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 WebSocket Proxy server running on port ${PORT}`);
});
