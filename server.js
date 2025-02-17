require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;

app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;
  const codeContext = req.body.context;

  console.log("Received message:", userMessage); // Debugging log
  console.log("Received context:", codeContext); // Debugging log

  try {
    const response = await axios.post("https://api.puter.com/llm-endpoint", {
      message: userMessage,
      context: codeContext,
    });

    console.log("API response:", response.data); // Debugging log
    res.json({ reply: response.data.reply });
  } catch (error) {
    console.error("Error calling Puter API:", error);
    res.status(500).json({ error: "Failed to get response from Puter API" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
