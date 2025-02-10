"use strict";
import theme from "./theme.js";
import { sourceEditor } from "./ide.js";

const THREAD = [
  {
    role: "system",
    content: `
You are an AI assistant integrated into an online code editor.
Your main job is to help users with their code, but you should also be able to engage in casual conversation.

The following are your guidelines:
1. **If the user asks for coding help**:
   - Always consider the user's provided code.
   - Analyze the code and provide relevant help (debugging, optimization, explanation, etc.).
   - Make sure to be specific and clear when explaining things about their code.

2. **If the user asks a casual question or makes a casual statement**:
   - Engage in friendly, natural conversation.
   - Do not reference the user's code unless they bring it up or ask for help.
   - Be conversational and polite.

3. **If the user's message is ambiguous or unclear**:
   - Politely ask for clarification or more details to better understand the user's needs.
   - If the user seems confused about something, help guide them toward what they need.

4. **General Behavior**:
   - Always respond in a helpful, friendly, and professional tone.
   - Never assume the user's intent. If unsure, ask clarifying questions.
   - Keep the conversation flowing naturally, even if the user hasn't directly asked about their code.

You will always have access to the user's latest code.
Use this context only when relevant to the user's message.
If their message is unrelated to the code, focus solely on their conversational intent.
        `.trim(),
  },
];

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("judge0-chat-form")
    .addEventListener("submit", async function (event) {
      event.preventDefault();
      const userInput = document.getElementById("judge0-chat-user-input");
      const message = userInput.value.trim();
      if (!message) return;

      const messages = document.getElementById("judge0-chat-messages");
      const userMessage = document.createElement("div");
      userMessage.className = "judge0-user-message";
      userMessage.textContent = message;
      messages.appendChild(userMessage);

      THREAD.push({
        role: "user",
        content: message,
      });

      userInput.value = "";
      userInput.disabled = true;

      const aiMessage = document.createElement("div");
      aiMessage.className = "judge0-ai-message loading";
      messages.appendChild(aiMessage);
      messages.scrollTop = messages.scrollHeight;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer YOUR_API_KEY`,
          },
          body: JSON.stringify({
            model: document.getElementById("judge0-chat-model-select").value,
            messages: THREAD,
          }),
        }
      );

      const aiResponse = await response.json();
      let aiResponseValue = aiResponse.choices[0].message.content;

      if (Array.isArray(aiResponseValue)) {
        aiResponseValue = aiResponseValue.map((v) => v.text).join("\n");
      }

      THREAD.push({
        role: "assistant",
        content: aiResponseValue,
      });

      aiMessage.innerHTML = DOMPurify.sanitize(aiResponseValue);
      renderMathInElement(aiMessage, {
        delimiters: [
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
      });
      aiMessage.innerHTML = marked.parse(aiMessage.innerHTML);

      aiMessage.classList.remove("loading");
      messages.scrollTop = messages.scrollHeight;

      userInput.disabled = false;
      userInput.focus();
    });

  document
    .getElementById("judge0-chat-model-select")
    .addEventListener("change", function () {
      const userInput = document.getElementById("judge0-chat-user-input");
      userInput.placeholder = `Message ${this.value}`;
    });
});

document.addEventListener("keydown", function (e) {
  if (e.metaKey || e.ctrlKey) {
    switch (e.key) {
      case "p":
        e.preventDefault();
        document.getElementById("judge0-chat-user-input").focus();
        break;
    }
  }
});
