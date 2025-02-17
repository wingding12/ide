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

        // Format the prompt with code context
        const prompt = `If there's code context, analyze it and help the user. Here's the context:

${codeContext}

User question: ${message}`;

        // Use Puter's chat method as shown in docs
        puter.ai
          .chat(prompt)
          .then((response) => {
            console.log("Puter response:", response); // Debugging log

            // Attempt to extract the response text
            let responseText = "";

            if (typeof response === "object") {
              console.log("Response is an object:", response);
              // Check for common properties that might contain the text
              if (response.text) {
                responseText = response.text;
              } else if (response.message) {
                responseText = response.message;
              } else if (response.content) {
                responseText = response.content;
              } else {
                aiMessage.innerHTML =
                  "Response object has no recognizable text property.";
                return;
              }
            } else if (typeof response === "string") {
              responseText = response;
            } else {
              aiMessage.innerHTML = "Unexpected response format.";
              return;
            }

            aiMessage.innerHTML = DOMPurify.sanitize(
              marked.parse(responseText)
            );
            aiMessage.classList.remove("loading");
            messages.scrollTop = messages.scrollHeight;
          })
          .catch((error) => {
            console.error("Chat error:", error);
            aiMessage.innerHTML =
              "Sorry, there was an error processing your request.";
            aiMessage.classList.remove("loading");
          });
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
