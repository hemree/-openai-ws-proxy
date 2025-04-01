const WebSocket = require("ws");
const http = require("http");
require("dotenv").config();

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on("connection", (clientSocket) => {
  console.log("🔌 Client connected");

  const openaiSocket = new WebSocket("wss://api.openai.com/v1/realtime", {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  });

  openaiSocket.on("open", () => {
    console.log("✅ Connected to OpenAI");
  });

  openaiSocket.on("message", (data) => {
    clientSocket.send(data);
  });

  clientSocket.on("message", (data) => {
    openaiSocket.send(data);
  });

  clientSocket.on("close", () => {
    openaiSocket.close();
  });

  openaiSocket.on("close", () => {
    clientSocket.close();
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("🚀 WebSocket Proxy server running");
});
