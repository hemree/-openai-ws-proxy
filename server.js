const WebSocket = require("ws");
const http = require("http");
require("dotenv").config();

const PORT = process.env.PORT || 8080;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

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

  let openaiReady = false;
  const messageQueue = [];

  openaiSocket.on("open", () => {
    console.log("✅ Connected to OpenAI");
    openaiReady = true;

    // Sıra varsa, sıradaki mesajları gönder
    messageQueue.forEach((msg) => openaiSocket.send(msg));
    messageQueue.length = 0;
  });

  openaiSocket.on("message", (data) => {
    console.log("📥 From OpenAI:", data.toString());
    clientSocket.send(data);
  });

  clientSocket.on("message", (data) => {
    console.log("📥 From frontend:", data.toString());

    if (openaiReady) {
      openaiSocket.send(data);
    } else {
      console.log("⏳ OpenAI not ready, queuing message");
      messageQueue.push(data);
    }
  });

  clientSocket.on("close", () => {
    console.log("🔌 Client disconnected");
    openaiSocket.close();
  });

  openaiSocket.on("close", (code, reason) => {
    console.log(`❌ OpenAI WebSocket closed: Code=${code} Reason=${reason}`);
    clientSocket.close();
  });

  openaiSocket.on("error", (err) => {
    console.error("❌ OpenAI WebSocket error:", err);
    clientSocket.close();
  });
});

server.listen(PORT, () => {
  console.log(`🚀 WebSocket Proxy server running on port ${PORT}`);
});
