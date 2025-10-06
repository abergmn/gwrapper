const { app, BrowserWindow } = require("electron");

class GWrapper {
    constructor() {
        this.mainWindow = this.mainWindow;
        this.splashWindow = this.splashWindow;
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
        const defaultBrowserWindowOptions = {
            show: false,
            webPreferences: {
                contextIsolation: false
            }
        };
    
        this.mainWindow = new BrowserWindow(this.#_combineBrowserWindowOptions(
            defaultBrowserWindowOptions, t_window_options));

        // main window customizations involving function calls
        this.mainWindow.removeMenu();
        // NOTE: come back and implement url/file logic to handle what is loaded.
        this.mainWindow.loadURL("https://exmple.com");
    }

    #_initSplashWindow(t_window_options) {
        const defaultBrowserWindowOptions = {
            width: 640, height: 320,
            frame: false,
            resizable: false,
            movable: false,
            center: true, show: false,
            webPreferences: {
                contextIsolation: false
            }
        }
    
        this.splashWindow = new BrowserWindow(this.#_combineBrowserWindowOptions(
            defaultBrowserWindowOptions, t_window_options
        ));

        // splash window customizations involving function calls
        this.splashWindow.removeMenu();
        this.splashWindow.loadFile(path.join(__dirname, "html/splash.html"));

        // check splash window is done loading, if so, show splash window
        // then begin game window did finish load check.
        this.splashWindow.webContents.once("did-finish-load", () => {
            this.splashWindow.show();
            this.mainWindow.once("ready-to-show", () => {
                this.splashWindow.destroy();
            });
        });
    }
        
    #_initWindows() {
        if (this.splashWindowOptions) {
            this.#_initSplashWindow({
                /// ...options
            });
        }

        this.#_initMainWindow({
            // ...options
        });
    }


    init() {
        if (app.isReady()) {
            this.#_initWindows();
        } else {
            console.error("App is NOT ready.");
        }
    }

    die() {
        if (this.mainWIndow) this.mainWindow.close();
        if (this.splashWIndow) this._splashWindow.close();
    }
}

module.exports = GWrapper;
