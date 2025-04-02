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

  // ✅ OpenAI bağlantısı açıldığında sıradakileri gönder
  openaiSocket.on("open", () => {
    console.log("✅ Connected to OpenAI")
    isOpenAIConnected = true
    messageQueue.forEach((msg) => {
      openaiSocket.send(msg)
    })
  })

  // ✅ Client'tan gelen mesajlar
  clientSocket.on("message", (data) => {
    console.log("📥 From frontend:", data.toString())

    if (isOpenAIConnected && openaiSocket.readyState === WebSocket.OPEN) {
      openaiSocket.send(data)
    } else {
      console.log("⏳ OpenAI not ready, queuing message")
      messageQueue.push(data)
    }
  })

  // ✅ OpenAI'den gelen yanıtı client'a gönder
  openaiSocket.on("message", (data) => {
    try {
      const message = data.toString()
      console.log("📥 From OpenAI:", message)
      clientSocket.send(message)
    } catch (err) {
      console.error("❌ Failed to send message to client:", err)
    }
  })

  clientSocket.on("close", () => {
    openaiSocket.close()
  })

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
