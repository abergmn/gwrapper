const GWrapper = require("gwrapper");

const GWrapper = require("gwrapper");

const app = new GWrapper({
    splashWindow: {
        width: 800, height: 600,
        g_loadFile: "splash.html"
    },
    mainWindow: {
        width: 800, height: 600,
        g_loadURL: "https://example.com/"
    },
});

app.init();
