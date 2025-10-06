const { app, BrowserWindow } = require("electron");
const path = require("path");

class GWrapper {
    constructor(t_wrapper_arguments) {
        this.wrapperArgs = t_wrapper_arguments;
        this.mainWindow = null;
        this.splashWindow = null;
    }

    #_combineBrowserWindowOptions(t_default_options, t_custom_options) {
        return {
            ...t_default_options,
            ...t_custom_options,
            webPreferences: {
                ...t_default_options.webPreferences,
                ...(t_custom_options.webPreferences || {})
            }
        };
    }

    #_initMainWindow(t_window_options) {
        console.log("Init main window...");

        const defaultBrowserWindowOptions = {
            show: false,
            webPreferences: {
                contextIsolation: false
            }
        };
    
        this.mainWindow = new BrowserWindow(this.#_combineBrowserWindowOptions(
            defaultBrowserWindowOptions, t_window_options || {}));

        // main window customizations involving function calls
        this.mainWindow.removeMenu();
        // NOTE: come back and implement url/file logic to handle what is loaded.
        try {
            this.mainWindow.loadURL("https://example.com");
        } catch (err) {
            console.error("Failed to load main window URL:", err);
        }
    }

    #_initSplashWindow(t_window_options) {
        console.log("Init splash window...");

        const defaultBrowserWindowOptions = {
            frame: false,
            resizable: false,
            movable: false,
            center: true, show: false,
            webPreferences: {
                contextIsolation: false
            }
        }
    
        this.splashWindow = new BrowserWindow(this.#_combineBrowserWindowOptions(
            defaultBrowserWindowOptions, t_window_options || {}));

        // splash window customizations involving function calls
        this.splashWindow.removeMenu();
        try {
            this.splashWindow.loadFile(path.join(__dirname, "html/splash.html"));
        } catch (err) {
            console.error("Failed to load splash window file:", err);
        }

        // check splash window is done loading, if so, show splash window
        // then begin game window did finish load check.
        this.splashWindow.webContents.once("did-finish-load", () => {
            this.splashWindow.show();
            // NOTE: For testing purposes; in real use, remove the timeout and just show the main window when ready
            this.mainWindow.once("ready-to-show", () => {
                setTimeout(() => {
                    this.mainWindow.show();
                    this.splashWindow.destroy();
                }, 2000); // 2s
            });
        });
    }
        
    #_initWindows() {
        console.log("Init windows...");

        if (this.wrapperArgs.splashWindow) {
            this.#_initSplashWindow(this.wrapperArgs.splashWindow);
        }

        this.#_initMainWindow(this.wrapperArgs.mainWindow);
    }


    init() {
        console.log("Init...");
        app.whenReady().then(() => {
            this.#_initWindows();
        });
    }

    die() {
        if (this.mainWindow) this.mainWindow.close();
        if (this.splashWIndow) this._splashWindow.close();
    }
}

module.exports = GWrapper;
