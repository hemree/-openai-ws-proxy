const WebSocket = require("ws")
const http = require("http")
require("dotenv").config()

const server = http.createServer()
const wss = new WebSocket.Server({ server })

wss.on("connection", (clientSocket) => {
  console.log("🔌 Client connected")

  const openaiSocket = new WebSocket("wss://api.openai.com/v1/realtime", {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  })

  let isOpenAIConnected = false
  const messageQueue = []

  openaiSocket.on("open", () => {
    console.log("✅ Connected to OpenAI")
    isOpenAIConnected = true
    messageQueue.forEach((msg) => openaiSocket.send(msg))
  })

  clientSocket.on("message", (data) => {
    console.log("📥 From frontend:", data.toString())
    if (isOpenAIConnected) {
      openaiSocket.send(data)
    } else {
      console.log("⏳ OpenAI not ready, queuing message")
      messageQueue.push(data)
    }
  })

  openaiSocket.on("message", (data) => {
    clientSocket.send(data)
  })

  clientSocket.on("close", () => openaiSocket.close())
  openaiSocket.on("close", () => clientSocket.close())

  openaiSocket.on("error", (err) => {
    console.error("❌ OpenAI WebSocket error:", err.message)
  })
})

// Sunucuyu dinlemeye başla
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`🚀 WebSocket Proxy server running on port ${PORT}`)
})
