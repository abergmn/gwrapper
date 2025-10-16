const { app, BrowserWindow } = require("electron");
// const Store = require("electron-store");

const path = require("path");
const fs = require("fs");

class GWrapper {
    // NOTE (IDEA): electron-store to save config containing user preferences and things like
    //              - last location
    //              - or custom preferreed location for window on start
    constructor(t_wrapper_arguments,
        t_default_main_window_opts = { frame: false, show: false, center: true },
                t_default_splash_window_opts = {
                    frame: false, resizable: false,
                    moveable: false, center: true,
                    show: false, webPreferences: {
                        contextIsolation: false
                        // NOTE:
                        // preload in future; additional logic
                        // will need to be implemented for when
                        // custom preload is provided
                    }
                }) {
        this.wrapper_args = t_wrapper_arguments;
        this.splash_window = null;
        this.main_window = null;
    }

    #__combineBrowserWindowOptions(t_default_opts, t_custom_opts) {
        return {
            // add options user can not override
            ...t_default_opts,
            ...t_custom_opts,
            webPreferences: {
                // or add options here for the same thing...
                ...t_default_opts.webPreferences,
                ...(t_custom_opts.webPreferences || {})
            }
        };
    }

    #__handleLoadScheme(t_browser_window, t_load_scheme) {
        // does passed object contain 'type' and 'value' keys?
        // if not, throw error

        // else, handle load scheme based on type

        if (!t_browser_window || !t_load_scheme || !t_load_scheme.type || !t_load_scheme.value) {
            throw new Error("ERRPR: Invalid arguments passed to '__handleLoadScheme'");
        }

        switch (t_load_scheme.type) {
            case "url":
                t_browser_window.loadURL(t_load_scheme.value).catch((err) => console.error("ERROR: Failed to load URL -- ", err));
                break;

            case "file":
                const file_path = path.isAbsolute(t_load_scheme.value) ? t_load_scheme.value : path.resolve(__dirname, t_load_scheme.value);
                const file_url = url.format({ pathname: file_path, protocol: "file:", slashes: true });

                t_browser_window.loadURL(file_url).catch((err) => console.error("ERROR: Failed to load file -- ", err));
                break;

            default:
                throw new Error(`ERROR: Unsupported load scheme type: ${t_load_scheme.type}`);
        }
    }

    #__initSplashWindow(t_load_scheme, t_custom_opts) {

        // create window object & apply custom options
        this.splash_window = new BrowserWindow(this.#__combineBrowserWindowOptions(t_default_splash_window_opts, t_custom_opts || {}));
        this.splash_window.removeMenu();

        // load content based on scheme type (url/file)
        this.#__handleLoadScheme(this.splash_window, t_load_scheme);

        // NOTE:
        // once splash window is ready to show, show it, then init main window
        // and perform same check: is main window ready to show, show it --
        // then destroy splash window after main window is shown
        this.splash_window.webContents.once("did-finish-load", () => {
            // NOTE (TEST): timeout is for testing purposes only
            setTimeout(() => {
                this.main_window.show();
                this.splash_window.destroy();
            }, 2000); // 2 seconds
        });
    }

    #__initMainWindow(t_load_scheme, t_custom_opts) {

        // create window object & apply custom options
        this.main_window = new BrowserWindow(this.#__combineBrowserWindowOptions(t_default_main_window_opts, t_custom_opts || {}));
        this.main_window.removeMenu();

        // load content based on scheme type (url/file)
        this.#__handleLoadScheme(this.main_window, t_load_scheme);        
    }

    #__initAllWindows() {
        // initialize main window with aplicable logic & options (logic good? more applicable?)
        this.#__initMainWindow(t_wrapper_arguments.main_window.toLoad, t_wrapper_arguments.main_window.options);

        // initialize splash window with applicable logic & options (logic good? more applicable?)
        this.#__initSplashWindow(t_wrapper_arguments.splash_window.toLoad, t_wrapper_arguments.splash_window.options);
    }

    run() {
        // Electron app is ready
        app.whenReady().then(() => {
            this.#__initAllWindows();
        });

        // MacOS specific close process (keep?/keep&move?)
        app.on("window-all-closed", () => {
            if (process.platform !== "darwin") {
                app.quit();
            }
        });
    }

    die() {
        // check windows exist before closing
        if (this.main_window) this.main_window.close();
        if (this.splash_window) this.splash_window.close();

        // quit the app
        app.quit();
    }
};

module.exports = GWrapper;
