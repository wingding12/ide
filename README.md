# Judge0 IDE

[![Judge0 IDE Screenshot](./.github/screenshot.png)](https://ide.judge0.com)

[![License](https://img.shields.io/github/license/judge0/ide?color=2185d0&style=flat-square)](https://github.com/judge0/ide/blob/master/LICENSE)
[![Release](https://img.shields.io/github/v/release/judge0/ide?color=2185d0&style=flat-square)](https://github.com/judge0/ide/releases)
[![Stars](https://img.shields.io/github/stars/judge0/ide?color=2185d0&style=flat-square)](https://github.com/judge0/ide/stargazers)

<a href="https://www.producthunt.com/posts/judge0-ide" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=179885&theme=light" alt="" height="43px" /></a>

## About

[**Judge0 IDE**](https://ide.judge0.com) is a free and open-source online code editor that allows you to write and execute code from a rich set of languages. It's perfect for anybody who just wants to quickly write and run some code without opening a full-featured IDE on their computer. Moreover, it is also useful for teaching and learning or just trying out a new language.

Judge0 IDE is using [**Judge0**](https://ce.judge0.com) for executing the user's source code.

Visit https://ide.judge0.com, and enjoy happy coding. :)

## Community

Do you have a question, feature request, or something else on your mind? Or do you want to follow Judge0 news?

- [Subscribe to Judge0 newsletter](https://subscribe.judge0.com)
- [Join our Discord server](https://discord.gg/GRc3v6n)
- [Watch asciicasts](https://asciinema.org/~hermanzdosilovic)
- [Report an issue](https://github.com/judge0/judge0/issues/new)
- [Contact us](mailto:contact@judge0.com)
- [Schedule an online meeting with us](https://meet.judge0.com)

## Author and Contributors

Judge0 IDE was created by [Herman Zvonimir Došilović](https://github.com/hermanzdosilovic).

Thanks a lot to all [contributors](https://github.com/judge0/ide/graphs/contributors) for their contributions to this project.

## License

Judge0 IDE is licensed under the [MIT License](https://github.com/judge0/ide/blob/master/LICENSE).

<div id="chat-container" class="ui segment">
    <div id="chat-messages" class="ui comments"></div>
    <form id="chat-form" class="ui reply form">
        <div class="field">
            <input id="chat-input" type="text" placeholder="Ask a question...">
        </div>
        <button type="submit" class="ui primary button">Send</button>
    </form>
</div>

<script>
document.getElementById("chat-form").addEventListener("submit", function(event) {
    event.preventDefault();
    const userInput = document.getElementById("chat-input").value;
    if (userInput.trim() === "") return;

    // Display user message
    const userMessage = document.createElement("div");
    userMessage.className = "comment";
    userMessage.innerHTML = `<div class="content"><div class="text">${userInput}</div></div>`;
    document.getElementById("chat-messages").appendChild(userMessage);

    // Clear input
    document.getElementById("chat-input").value = "";

    // Send to AI assistant
    sendToAI(userInput);
});

function sendToAI(message) {
    // Simulate AI processing
    const aiResponse = processAIMessage(message);

    // Display AI response
    const aiMessage = document.createElement("div");
    aiMessage.className = "comment";
    aiMessage.innerHTML = `<div class="content"><div class="text">${aiResponse}</div></div>`;
    document.getElementById("chat-messages").appendChild(aiMessage);
}

function processAIMessage(message) {
    // Placeholder for AI logic
    return `You asked: ${message}`;
}
</script>

#chat-container {
max-width: 600px;
margin: 20px auto;
}

#chat-messages {
max-height: 400px;
overflow-y: auto;
margin-bottom: 10px;
}

.comment {
margin-bottom: 10px;
}
