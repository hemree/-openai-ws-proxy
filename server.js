wss.on("connection", (clientSocket) => {
  console.log("🔌 Client connected")

  const openaiSocket = new WebSocket("wss://api.openai.com/v1/realtime", {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  })

  let isOpenAIConnected = false
  const messageQueue = []

  // 1️⃣ OpenAI WS açılınca kuyruktakileri gönder
  openaiSocket.on("open", () => {
    console.log("✅ Connected to OpenAI")
    isOpenAIConnected = true

    // Kuyruktaki mesajları sırayla gönder
    messageQueue.forEach((msg) => {
      openaiSocket.send(msg)
    })
  })

  // 2️⃣ Frontend'ten gelen mesajı sıraya al
  clientSocket.on("message", (data) => {
    console.log("📥 From frontend:", data.toString())

    if (isOpenAIConnected) {
      openaiSocket.send(data)
    } else {
      console.log("⏳ OpenAI not ready, queuing message")
      messageQueue.push(data)
    }
  })

  // 3️⃣ OpenAI → Client
  openaiSocket.on("message", (data) => {
    clientSocket.send(data)
  })

  // 4️⃣ Bağlantı kapanınca temizlik
  clientSocket.on("close", () => openaiSocket.close())
  openaiSocket.on("close", () => clientSocket.close())

  openaiSocket.on("error", (err) => {
    console.error("❌ OpenAI WebSocket error:", err.message)
  })
})
