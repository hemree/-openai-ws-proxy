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

    messageQueue.forEach((msg, i) => {
      try {
        const parsed = typeof msg === "string" ? msg : msg.toString()
        console.log(`🚀 Sending queued message ${i + 1}:`, parsed)
        openaiSocket.send(parsed)
      } catch (err) {
        console.error(`❌ Failed to send queued message ${i + 1}:`, err.message)
      }
    })
  })

  clientSocket.on("message", (data) => {
    console.log("📥 From frontend:", data.toString())

    if (isOpenAIConnected && openaiSocket.readyState === WebSocket.OPEN) {
      openaiSocket.send(data)
    } else {
      console.log("⏳ OpenAI not ready, queuing message")
      messageQueue.push(data)
    }
  })

  openaiSocket.on("message", (data) => {
    try {
      const message = data.toString()
      console.log("📥 From OpenAI:", message)
      clientSocket.send(message)
    } catch (err) {
      console.error("❌ Failed to send message to client:", err.message)
    }
  })

  clientSocket.on("close", () => openaiSocket.close())
  openaiSocket.on("close", (code, reason) => {
    console.log(`❌ OpenAI WebSocket closed: Code=${code}, Reason=${reason || "No reason"}`)
    clientSocket.close()
  })

  openaiSocket.on("error", (err) => {
    console.error("❌ OpenAI WebSocket error:", err.message)
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`🚀 WebSocket Proxy server running on port ${PORT}`)
})
