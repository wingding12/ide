"use strict";
import theme from "./theme.js";
import { sourceEditor } from "./ide.js";

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

      userInput.value = "";
      userInput.disabled = true;

      const aiMessage = document.createElement("div");
      aiMessage.className = "judge0-ai-message loading";
      messages.appendChild(aiMessage);
      messages.scrollTop = messages.scrollHeight;

      try {
        // Get the code context
        const codeContext = sourceEditor?.getValue() || "";
        const selectedModel = document.getElementById(
          "judge0-chat-model-select"
        ).value;

        // Format the prompt with code context
        const prompt = `If there's code context, analyze it and help the user. Here's the context:

${codeContext}

User question: ${message}`;

        // Use Puter's simple chat method
        const response = await puter.ai.chat(prompt);

        if (response && response.text) {
          // Use Puter's print method to format the response
          const formattedResponse = puter.print(response.text);
          aiMessage.innerHTML = DOMPurify.sanitize(
            marked.parse(formattedResponse || "No response received.")
          );
        } else {
          aiMessage.innerHTML = "No response received.";
        }

        renderMathInElement(aiMessage, {
          delimiters: [
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
          ],
        });
        aiMessage.classList.remove("loading");
        messages.scrollTop = messages.scrollHeight;
      } catch (error) {
        console.error("Chat error:", error);
        aiMessage.innerHTML =
          "Sorry, there was an error processing your request.";
        aiMessage.classList.remove("loading");
      } finally {
        userInput.disabled = false;
        userInput.focus();
      }
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
