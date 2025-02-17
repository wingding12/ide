document.addEventListener("DOMContentLoaded", function () {
  // Initialize Puter
  const puter = new Puter();

  // Initialize the chat window
  const chatWindow = document.getElementById("inline-chat-window");
  if (chatWindow) {
    console.log("Chat window found");
    // Ensure it's hidden initially
    chatWindow.style.display = "none";
  } else {
    console.error("Chat window not found");
  }

  // Example: Set up event listeners or other initialization code
  document
    .querySelector("#your-form")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      const message = document.querySelector("#message-input").value;
      const context = editor.getValue(); // Assuming you have a code editor

      callLLM(message, context);
    });

  // Initialize autocomplete
  setupAutocomplete();
});

// Add a cache for storing responses
const responseCache = new Map();

// Add debounce utility
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Modify the callLLM function to use streaming and caching
function callLLM(message, context) {
  // Check cache first
  const cacheKey = `${message}-${context}`;
  if (responseCache.has(cacheKey)) {
    const cachedResponse = responseCache.get(cacheKey);
    addMessageToChat("AI", cachedResponse);
    return;
  }

  // Create a placeholder for streaming response
  const messageId = Date.now();
  addInlineChatMessage("AI", "...", "ai", messageId);

  puter.callLLM({
    model: "gpt-4o",
    input: message,
    context: getRelevantContext(context), // Only send relevant context
    stream: true, // Enable streaming
    onToken: function (token) {
      // Update the message as tokens arrive
      appendToMessage(messageId, token);
    },
    onSuccess: function (response) {
      // Cache the complete response
      responseCache.set(cacheKey, response.reply);

      // Limit cache size
      if (responseCache.size > 100) {
        const firstKey = responseCache.keys().next().value;
        responseCache.delete(firstKey);
      }
    },
    onError: function (error) {
      console.error("Error calling LLM:", error);
      updateMessage(
        messageId,
        "Sorry, there was an error processing your request."
      );
    },
  });
}

// Function to get relevant context
function getRelevantContext(context) {
  // If context is too large, extract only the relevant portion
  const MAX_CONTEXT_LENGTH = 1000;
  if (context.length > MAX_CONTEXT_LENGTH) {
    // Extract the function or block containing the cursor
    const relevantPortion = extractRelevantCode(context);
    return relevantPortion || context.substring(0, MAX_CONTEXT_LENGTH);
  }
  return context;
}

function suggestFixWithAI(code, errorMessage) {
  puter.callLLM({
    model: "gpt-4o", // Specify the model you want to use
    input: `The following code failed to compile:\n\n${code}\n\nError: ${errorMessage}\n\nPlease suggest a fix.`,
    onSuccess: function (response) {
      console.log("AI suggestion:", response);
      displayAISuggestion(response.reply);
    },
    onError: function (error) {
      console.error("Error calling LLM for suggestion:", error);
      addMessageToChat(
        "AI",
        "Sorry, there was an error processing your request for a suggestion."
      );
    },
  });
}

function getSelectedCode() {
  const selection = editor.getSelection();
  const selectedCode = editor.getModel().getValueInRange(selection);
  return {
    code: selectedCode,
    position: editor.getScrolledVisiblePosition(selection.getStartPosition()),
  };
}

function initiateChatWithSelectedCode() {
  console.log("Initiating chat with selected code");
  const { code, position } = getSelectedCode();
  console.log("Selected code:", code);
  console.log("Position:", position);
  if (code.trim() !== "") {
    // Position the chat window near the selected code
    const editorElement = document.querySelector(".monaco-editor");
    const editorRect = editorElement.getBoundingClientRect();
    const chatWindow = document.getElementById("inline-chat-window");

    chatWindow.style.display = "block";
    // Position relative to viewport
    const viewportOffset = 20; // pixels from the right edge
    chatWindow.style.right = `${viewportOffset}px`;
    chatWindow.style.top = `${Math.max(100, position.top)}px`;

    // Clear previous chat messages
    document.getElementById("inline-chat-messages").innerHTML = "";

    // Add the code snippet as the first message
    addInlineChatMessage("Selected code:", code, "system");

    // Ensure the chat window is visible
    chatWindow.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    alert("Please select a segment of code to chat about.");
  }
}

function addInlineChatMessage(sender, message, type, messageId = null) {
  const messagesContainer = document.getElementById("inline-chat-messages");
  const messageElement = document.createElement("div");
  messageElement.className = `inline-chat-message ${type}`;
  if (messageId) {
    messageElement.setAttribute("data-message-id", messageId);
  }
  messageElement.innerHTML = `
    <strong>${sender}</strong>
    <pre>${message}</pre>
  `;
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function closeInlineChat() {
  document.getElementById("inline-chat-window").style.display = "none";
}

// Add event listener for the inline chat input
document
  .getElementById("inline-chat-input")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      const message = this.value.trim();
      if (message !== "") {
        addInlineChatMessage("You", message, "user");
        this.value = "";

        // Call LLM with the message
        puter.callLLM({
          model: "gpt-4o",
          input: message,
          context: getSelectedCode().code,
          onSuccess: function (response) {
            if (response && response.reply) {
              addInlineChatMessage("AI", response.reply, "ai");
            }
          },
          onError: function (error) {
            console.error("Error:", error);
            addInlineChatMessage(
              "AI",
              "Sorry, there was an error processing your request.",
              "ai"
            );
          },
        });
      }
    }
  });

// Modify the autocomplete to use debouncing
const debouncedGenerateContextualSuggestions = debounce(
  generateContextualSuggestions,
  300
);

// Update setupAutocomplete
function setupAutocomplete() {
  const searchInput = $("#inline-chat-input");
  const suggestionPrompts = [
    { title: "Explain this code" },
    { title: "What does this function do?" },
    { title: "How can I improve this code?" },
    { title: "Is there a bug in this code?" },
    { title: "Suggest optimizations" },
    { title: "Add comments to this code" },
    { title: "Explain the algorithm" },
    { title: "What are potential edge cases?" },
    { title: "How can I make this more efficient?" },
    { title: "Show me a test case" },
  ];

  $(".ui.search").search({
    source: suggestionPrompts,
    searchFields: ["title"],
    searchFullText: true,
    maxResults: 5,
    onSelect: function (result) {
      searchInput.val(result.title);
      return false;
    },
    onSearchQuery: function (query) {
      if (query.length > 0) {
        const selectedCode = getSelectedCode().code;
        debouncedGenerateContextualSuggestions(query, selectedCode);
      }
    },
  });
}

function generateContextualSuggestions(query, codeContext) {
  // Call the AI to generate contextual suggestions
  puter.callLLM({
    model: "gpt-4o",
    input: `Given the code:\n${codeContext}\n\nAnd the user's partial query: "${query}"\nSuggest 3 relevant questions to ask about this code. Return them as a JSON array of objects with 'title' property.`,
    onSuccess: function (response) {
      try {
        const suggestions = JSON.parse(response.reply);
        // Update the search component with new suggestions
        $(".ui.search").search("set values", suggestions);
      } catch (error) {
        console.error("Error parsing AI suggestions:", error);
      }
    },
    onError: function (error) {
      console.error("Error generating suggestions:", error);
    },
  });
}

// Helper function to append streaming tokens
function appendToMessage(messageId, token) {
  const messageElement = document.querySelector(
    `[data-message-id="${messageId}"]`
  );
  if (messageElement) {
    if (messageElement.textContent === "...") {
      messageElement.textContent = token;
    } else {
      messageElement.textContent += token;
    }
  }
}

// Helper function to update message content
function updateMessage(messageId, content) {
  const messageElement = document.querySelector(
    `[data-message-id="${messageId}"]`
  );
  if (messageElement) {
    messageElement.textContent = content;
  }
}

// Add bug finder functionality
function findBugsInCode() {
  const code = editor.getValue();
  const messageId = Date.now();

  // Show the results panel
  const resultsPanel = document.getElementById("bug-finder-results");
  resultsPanel.style.display = "block";

  // Clear previous results
  const bugList = document.getElementById("bug-list");
  bugList.innerHTML = '<div class="ui active loader"></div>';

  puter.callLLM({
    model: "gpt-4o",
    input: `Analyze this code for potential bugs, security issues, and best practice violations. Format the response as JSON with the following structure:
    {
      "bugs": [
        {
          "severity": "high|medium|low",
          "type": "bug type",
          "description": "description of the issue",
          "line": "affected line number or range",
          "suggestion": "how to fix it"
        }
      ]
    }
    
    Code to analyze:
    ${code}`,
    onSuccess: function (response) {
      try {
        const analysis = JSON.parse(response.reply);
        displayBugResults(analysis.bugs);
      } catch (error) {
        console.error("Error parsing bug analysis:", error);
        displayBugResults([
          {
            severity: "error",
            type: "Parser Error",
            description: "Failed to parse analysis results",
            line: "N/A",
            suggestion: "Please try again",
          },
        ]);
      }
    },
    onError: function (error) {
      console.error("Error in bug analysis:", error);
      displayBugResults([
        {
          severity: "error",
          type: "Analysis Error",
          description: "Failed to complete bug analysis",
          line: "N/A",
          suggestion: "Please try again",
        },
      ]);
    },
  });
}

function displayBugResults(bugs) {
  const bugList = document.getElementById("bug-list");
  bugList.innerHTML = ""; // Clear loading indicator

  if (bugs.length === 0) {
    bugList.innerHTML = `
      <div class="ui success message">
        <i class="check circle icon"></i>
        No bugs found! The code looks clean.
      </div>
    `;
    return;
  }

  bugs.forEach((bug) => {
    const severityColor =
      {
        high: "red",
        medium: "yellow",
        low: "grey",
        error: "black",
      }[bug.severity] || "grey";

    const bugElement = document.createElement("div");
    bugElement.className = "item";
    bugElement.innerHTML = `
      <div class="ui ${severityColor} label">
        ${bug.severity.toUpperCase()}
      </div>
      <div class="content">
        <div class="header">${bug.type}</div>
        <div class="description">
          <p>${bug.description}</p>
          ${
            bug.line !== "N/A"
              ? `<p><strong>Line:</strong> ${bug.line}</p>`
              : ""
          }
          <p><strong>Suggestion:</strong> ${bug.suggestion}</p>
        </div>
        ${
          bug.line !== "N/A"
            ? `
          <button class="ui tiny button" onclick="highlightBuggedCode('${bug.line}')">
            <i class="eye icon"></i>
            Show in Editor
          </button>
        `
            : ""
        }
      </div>
    `;
    bugList.appendChild(bugElement);
  });
}

function highlightBuggedCode(lineRange) {
  try {
    // Parse line range (could be single number or range like "5-10")
    let startLine, endLine;
    if (lineRange.includes("-")) {
      [startLine, endLine] = lineRange.split("-").map((num) => parseInt(num));
    } else {
      startLine = endLine = parseInt(lineRange);
    }

    // Adjust for 0-based line numbers
    startLine = Math.max(1, startLine);
    endLine = Math.min(editor.getModel().getLineCount(), endLine);

    // Create selection
    const selection = {
      startLineNumber: startLine,
      startColumn: 1,
      endLineNumber: endLine,
      endColumn: editor.getModel().getLineMaxColumn(endLine),
    };

    // Set selection and scroll to it
    editor.setSelection(selection);
    editor.revealRangeInCenter(selection);
  } catch (error) {
    console.error("Error highlighting code:", error);
  }
}

function closeBugFinder() {
  document.getElementById("bug-finder-results").style.display = "none";
}
