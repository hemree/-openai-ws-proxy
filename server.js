const WebSocket = require("ws");
const http = require("http");
require("dotenv").config();

const PORT = process.env.PORT || 8080;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on("connection", (clientSocket) => {
  console.log("🔌 Client connected");

  // OpenAI WebSocket bağlantısı
  const openaiSocket = new WebSocket("wss://api.openai.com/v1/realtime", {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "openai-beta": "realtime=v1", // ✅ GEREKLİ HEADER!
    },
  });

  let openaiReady = false;
  const queue = [];

  openaiSocket.on("open", () => {
    console.log("✅ Connected to OpenAI");
    openaiReady = true;

    // Kuyruğa alınan mesajları gönder
    queue.forEach((msg) => openaiSocket.send(msg));
  });

  openaiSocket.on("message", (data) => {
    console.log("📥 From OpenAI:", data.toString());
    clientSocket.send(data.toString());
  });

  openaiSocket.on("close", (code, reason) => {
    console.log(`❌ OpenAI WebSocket closed: Code=${code}, Reason=${reason || "No reason"}`);
    clientSocket.close();
  });

  openaiSocket.on("error", (err) => {
    console.error("❌ OpenAI WebSocket error:", err);
    clientSocket.close();
  });

  clientSocket.on("message", (data) => {
    console.log("📥 From frontend:", data.toString());

    if (openaiReady) {
      openaiSocket.send(data.toString());
    } else {
      console.log("⏳ OpenAI not ready, queuing message");
      queue.push(data.toString());
    }
  });

  clientSocket.on("close", () => {
    console.log("🔌 Client disconnected");
    openaiSocket.close();
  });

  clientSocket.on("error", (err) => {
    console.error("❌ Client WebSocket error:", err);
    openaiSocket.close();
  });
});

server.listen(PORT, () => {
  console.log(`🚀 WebSocket Proxy server running on port ${PORT}`);
});
