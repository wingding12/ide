"use strict";
import theme from "./theme.js";
import { sourceEditor } from "./ide.js";

document.addEventListener("DOMContentLoaded", function () {
  const chatForm = document.getElementById("judge0-chat-form");
  const chatInput = document.getElementById("judge0-chat-user-input");
  const messagesContainer = document.getElementById("judge0-chat-messages");
  const modelSelect = document.getElementById("judge0-chat-model-select");

  if (!chatForm || !chatInput || !messagesContainer || !modelSelect) {
    console.error("Could not find required chat elements");
    return;
  }

  chatForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    const userMessage = addChatMessage("User", message);
    chatInput.value = "";

    const codeContext = sourceEditor?.getValue() || "";
    const selectedModel = modelSelect.value;

    const aiMessageElement = addChatMessage("AI", "Thinking...");

    try {
      const prompt = `You are a helpful programming assistant. When showing code examples, use markdown code blocks with appropriate language tags.

Code Context:
${codeContext}

User Question:
${message}`;

      const response = await puter.ai.chat(prompt);

      if (response && response.text) {
        aiMessageElement.innerHTML = DOMPurify.sanitize(
          marked.parse(response.text)
        );
      } else {
        aiMessageElement.innerHTML = "Unexpected response format.";
      }
    } catch (error) {
      console.error("Chat error:", error);
      aiMessageElement.innerHTML =
        "Sorry, there was an error processing your request.";
    } finally {
      aiMessageElement.classList.remove("loading");
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      chatInput.disabled = false;
      chatInput.focus();
    }
  });

  chatInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatForm.dispatchEvent(new Event("submit"));
    }
  });

  setupAutocomplete();
  console.log("Chat initialization complete");
});

function addChatMessage(sender, message) {
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
  return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
    return `<pre><code class="language-${
      language || "plaintext"
    }">${code.trim()}</code></pre>`;
  });
}

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

function getSelectedCode() {
  const selection = sourceEditor.getSelection();
  const selectedCode = sourceEditor.getModel().getValueInRange(selection);
  return {
    code: selectedCode,
    position: sourceEditor.getScrolledVisiblePosition(
      selection.getStartPosition()
    ),
  };
}

function debouncedGenerateContextualSuggestions(query, codeContext) {
  // Call the AI to generate contextual suggestions
  puter.ai
    .chat(
      `Given the code:\n${codeContext}\n\nAnd the user's partial query: "${query}"\nSuggest 3 relevant questions to ask about this code. Return them as a JSON array of objects with 'title' property.`
    )
    .then((response) => {
      try {
        const suggestions = JSON.parse(response.text);
        $(".ui.search").search("set values", suggestions);
      } catch (error) {
        console.error("Error parsing AI suggestions:", error);
      }
    })
    .catch((error) => {
      console.error("Error generating suggestions:", error);
    });
}

function findBugsInCode() {
  const code = sourceEditor.getValue();
  const resultsPanel = document.getElementById("bug-finder-results");
  resultsPanel.style.display = "block";

  const bugList = document.getElementById("bug-list");
  bugList.innerHTML = '<div class="ui active loader"></div>';

  puter.ai
    .chat(
      `Analyze this code for potential bugs, security issues, and best practice violations. Format the response as JSON with the following structure:
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
      ${code}`
    )
    .then((response) => {
      try {
        const analysis = JSON.parse(response.text);
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
    })
    .catch((error) => {
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
    });
}

function displayBugResults(bugs) {
  const bugList = document.getElementById("bug-list");
  bugList.innerHTML = "";

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
    let startLine, endLine;
    if (lineRange.includes("-")) {
      [startLine, endLine] = lineRange.split("-").map((num) => parseInt(num));
    } else {
      startLine = endLine = parseInt(lineRange);
    }

    startLine = Math.max(1, startLine);
    endLine = Math.min(sourceEditor.getModel().getLineCount(), endLine);

    const selection = {
      startLineNumber: startLine,
      startColumn: 1,
      endLineNumber: endLine,
      endColumn: sourceEditor.getModel().getLineMaxColumn(endLine),
    };

    sourceEditor.setSelection(selection);
    sourceEditor.revealRangeInCenter(selection);
  } catch (error) {
    console.error("Error highlighting code:", error);
  }
}

function closeBugFinder() {
  document.getElementById("bug-finder-results").style.display = "none";
}
