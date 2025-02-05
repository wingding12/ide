const { app, BrowserWindow } = require("electron");

app.whenReady().then(() => {
    let mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
    });

    mainWindow.loadFile("index.html");

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
