document.addEventListener("DOMContentLoaded", function () {
  // Initialize chat functionality
  if (typeof puter !== "undefined") {
    console.log("Puter is available");
    initializeChat();
  } else {
    console.error("Puter is not available");
  }
});

function initializeChat() {
  const chatForm = document.getElementById("judge0-chat-form");
  const chatInput = document.getElementById("judge0-chat-user-input");
  const messagesContainer = document.getElementById("judge0-chat-messages");
  const modelSelect = document.getElementById("judge0-chat-model-select");

  if (!chatForm || !chatInput || !messagesContainer || !modelSelect) {
    console.error("Could not find required chat elements");
    return;
  }

  // Set default model
  modelSelect.value = modelSelect.options[0].value;

  chatForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    console.log("Chat form submitted");

    const message = chatInput.value.trim();
    if (!message) return;

    try {
      const messageElement = addChatMessage("User", message);
      chatInput.value = "";

      const codeContext = editor?.getValue() || "";
      const selectedModel = modelSelect.value;

      // Create a streaming message element
      const aiMessageElement = addChatMessage("AI", "Thinking...");

      // Call Puter's AI
      puter.ai.complete({
        model: selectedModel,
        prompt: `You are a helpful programming assistant. When showing code examples, use markdown code blocks with appropriate language tags.

Code Context:
${codeContext}

User Question:
${message}`,
        stream: true,
        onStream: (token) => {
          // Update the message as we receive tokens
          aiMessageElement.querySelector(".text").innerHTML =
            formatCodeBlocks(token);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        },
        onComplete: (fullResponse) => {
          // Final update with complete response
          aiMessageElement.querySelector(".text").innerHTML =
            formatCodeBlocks(fullResponse);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        },
        onError: (error) => {
          console.error("AI error:", error);
          aiMessageElement.querySelector(".text").textContent = `Error: ${
            error.message || "An error occurred while processing your request"
          }`;
        },
      });
    } catch (error) {
      console.error("Chat error:", error);
      addChatMessage(
        "System",
        `Error: ${error.message || "Unknown error occurred"}`
      );
    }
  });

  // Add keypress handler for Enter key
  chatInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatForm.dispatchEvent(new Event("submit"));
    }
  });

  console.log("Chat initialization complete");
}

function addChatMessage(sender, message) {
  console.log("Adding chat message from:", sender);
  const messagesContainer = document.getElementById("judge0-chat-messages");
  const messageElement = document.createElement("div");
  messageElement.className = "comment";
  messageElement.innerHTML = formatMessage(sender, message);
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return messageElement;
}

function formatMessage(sender, message) {
  return `
    <div class="content">
      <a class="author">${sender}</a>
      <div class="text">${formatCodeBlocks(message)}</div>
    </div>
  `;
}

function formatCodeBlocks(text) {
  // Replace code blocks with syntax-highlighted versions
  return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
    return `<pre><code class="language-${
      language || "plaintext"
    }">${code.trim()}</code></pre>`;
  });
}
