const { app, BrowserWindow } = require("electron");
// const Store = require("electron-store");

const path = require("path");
const fs = require("fs");

class GWrapper {
    /**
      * Creates a new GWrapper instance to manage Electron splash and main windows.
      *
      * @param {Object} t_wrapper_arguments
      *        An object defining the splash and main window configurations, including
      *        their load schemes and custom options. Example structure:
      *        {
      *          splash_window: { toLoad: { type: 'url'|'file', value: string }, options: BrowserWindowConstructorOptions },
      *          main_window:  { toLoad: { type: 'url'|'file', value: string }, options: BrowserWindowConstructorOptions }
      *        }
      *
      * @param {import('electron').BrowserWindowConstructorOptions} [t_default_main_window_opts={ frame: // NOTE (IDEA): electron-store to save config containing user preferences and things like
    //              - last location
    //              - or custom preferreed location for window on startfalse, show: false, center: true }]
      *        Default options applied to the main window unless overridden by custom options.
      *
      * @param {import('electron').BrowserWindowConstructorOptions} [t_default_splash_window_opts={
      *   frame: false,
      *   resizable: false,
      *   moveable: false,
      *   center: true,
      *   show: false,
      *   webPreferences: { contextIsolation: false }
      * }]
      *        Default options applied to the splash window unless overridden by custom options.
      */
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

    /**
      * Safely merges Electron BrowserWindow configuration objects.
      *
      * This function combines a set of default BrowserWindow options with user-
      * provided custom options, ensuring that nested `webPreferences` values are
      * deeply merged instead of overwritten. This prevents loss of internal or
      * critical default settings while allowing selective overrides.
      *
      * Typical use:
      * - Called internally when initializing the main and splash windows.
      * - Ensures base options (like enforced security flags or context isolation)
      *   are preserved even when user opts are passed.
      *
      * @private
      * @param {import('electron').BrowserWindowConstructorOptions} t_default_opts
      *        Base options defined internally by GWrapper. These options represent
      *        required or safe defaults that user code should not override entirely.
      *
      * @param {import('electron').BrowserWindowConstructorOptions} [t_custom_opts={}]
      *        Optional custom options supplied by the wrapper arguments, allowing
      *        callers to override specific properties (e.g., width, height, etc.)
      *        or add additional `webPreferences`.
      *
      * @returns {import('electron').BrowserWindowConstructorOptions}
      *          A new merged configuration object ready to be passed into
      *          the `BrowserWindow` constructor.
      *
      * @example
      * // Merges defaults and user overrides safely
      * const finalOpts = this.#__combineBrowserWindowOptions(defaultOpts, customOpts);
      * const window = new BrowserWindow(finalOpts);
    */
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

    /**
      * Handles the loading of window content based on a provided load scheme.
      *
      * This function interprets a `t_load_scheme` object to determine how to load
      * content into a given BrowserWindow instance. Supported scheme types include:
      *  - `"url"`  → Loads a remote URL into the BrowserWindow.
      *  - `"file"` → Loads a local file via a properly formatted `file://` URL.
      *
      * The method ensures basic argument validation before attempting to load
      * content and throws descriptive errors for invalid or unsupported schemes.
      * Any `loadURL()` promise rejections are logged to the console.
      *
      * @private
      * @param {import('electron').BrowserWindow} t_browser_window
      *        The BrowserWindow instance whose content should be loaded.
      *        Must be a valid, initialized Electron window object.
      *
      * @param {{ type: 'url' | 'file', value: string }} t_load_scheme
      *        An object defining the load behavior:
      *          • `type`  — Determines whether the content source is a URL or file.
      *          • `value` — The actual URL string or local file path to load.
      *
      * @throws {Error}
      *         Throws if required arguments are missing or the scheme type
      *         is not supported.
      *
      * @example
      * // Load a local HTML file
      * this.#__handleLoadScheme(mainWindow, { type: "file", value: "./index.html" });
      *
      * @example
      * // Load a remote URL
      * this.#__handleLoadScheme(mainWindow, { type: "url", value: "https://example.com" });
      */
    #__handleLoadScheme(t_browser_window, t_load_scheme) {

        // check if type and value keys exist
        if (!t_browser_window || !t_load_scheme || !t_load_scheme.type || !t_load_scheme.value) {
            throw new Error("ERRPR: Invalid arguments passed to '__handleLoadScheme'");
        }

        // if all is well, handle load scheme
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

    /**
      * Initializes and manages the splash window lifecycle.
      *
      * This function creates the splash window using a combination of default and
      * user-provided options, then loads its content according to the specified
      * load scheme. Once the splash window finishes loading, it becomes visible.
      *
      * After the splash content has displayed (currently using a test delay), the
      * main application window is shown and the splash instance is destroyed to
      * free system resources.
      *
      * @private
      * @param {{ type: 'url' | 'file', value: string }} t_load_scheme
      *        Defines what the splash window should load. Accepts either:
      *          • `{ type: 'file', value: './splash.html' }`
      *          • `{ type: 'url',  value: 'https://example.com/splash' }`
      *
      * @param {import('electron').BrowserWindowConstructorOptions} [t_custom_opts={}]
      *        Optional BrowserWindow options applied on top of the internal
      *        `t_default_splash_window_opts`. These allow per-project customization
      *        such as size, background color, or positioning.
      *
      * @fires Electron.WebContentsEvent#did-finish-load
      *         Triggered when the splash content has fully loaded and is ready to
      *         display. Used internally to transition to the main window.
      *
      * @example
      * // Initialize a splash window loading a local HTML file
      * this.#__initSplashWindow(
      *   { type: "file", value: "./splash.html" },
      *   { width: 400, height: 300, frame: false }
      * );
      *
      * @example
      * // Initialize a splash window loading from a remote URL
      * this.#__initSplashWindow(
      *   { type: "url", value: "https://example.com/splash" }
      * );
      */
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

    /**
      * Initializes the main application window with provided options and content.
      *
      * This method creates the main BrowserWindow instance by merging default
      * window options with any custom options supplied by the caller. It then
      * loads the content according to the specified load scheme, which can be
      * a URL or a local file.
      *
      * Unlike the splash window, the main window is initially hidden and is
      * shown explicitly after loading is complete (typically handled elsewhere).
      *
      * @private
      * @param {{ type: 'url' | 'file', value: string }} t_load_scheme
      *        Object specifying what content to load in the main window. Must include:
      *          • `type`: Either `"url"` or `"file"` indicating the content source.
      *          • `value`: The URL or file path to load.
      *
      * @param {import('electron').BrowserWindowConstructorOptions} [t_custom_opts={}]
      *        Optional BrowserWindow configuration options to override or augment
      *        the default main window settings (such as size, frame, or webPreferences).
      *
      * @example
      * // Initialize main window with local HTML file and custom size
      * this.#__initMainWindow(
      *   { type: "file", value: "./app.html" },
      *   { width: 1280, height: 720 }
      * );
      *
      * @example
      * // Initialize main window loading a remote URL with devTools enabled
      * this.#__initMainWindow(
      *   { type: "url", value: "https://example.com" },
      *   { webPreferences: { devTools: true } }
      * );
      */
    #__initMainWindow(t_load_scheme, t_custom_opts) {

        // create window object & apply custom options
        this.main_window = new BrowserWindow(this.#__combineBrowserWindowOptions(t_default_main_window_opts, t_custom_opts || {}));
        this.main_window.removeMenu();

        // load content based on scheme type (url/file)
        this.#__handleLoadScheme(this.main_window, t_load_scheme);        
    }

    /**
      * Initializes both main and splash windows using the wrapper's configured arguments.
      *
      * This method acts as a coordinator that initializes the main application window
      * and the splash window in sequence, passing their respective load schemes and
      * custom options from the wrapper's configuration.
      *
      * It relies on `#__initMainWindow` and `#__initSplashWindow` internally to
      * perform the actual window creation and content loading.
      *
      * @private
      * @example
      * // Called internally to bootstrap both windows
      * this.#__initAllWindows();
      */
    #__initAllWindows() {
        // initialize main window with aplicable logic & options (logic good? more applicable?)
        this.#__initMainWindow(t_wrapper_arguments.main_window.toLoad, t_wrapper_arguments.main_window.options);

        // initialize splash window with applicable logic & options (logic good? more applicable?)
        this.#__initSplashWindow(t_wrapper_arguments.splash_window.toLoad, t_wrapper_arguments.splash_window.options);
    }

    /**
      * Starts the Electron app lifecycle by initializing windows when ready and handling platform-specific quit behavior.
      *
      * This method:
      *  - Waits for Electron's `app` module to signal readiness,
      *    then initializes all application windows.
      *  - Listens for the `window-all-closed` event to quit the app
      *    automatically on platforms other than macOS (Darwin).
      *
      * This ensures proper startup sequencing and native-like behavior
      * across different operating systems.
      *
      * @public
      * @example
      * // Start the wrapper application
      * wrapperInstance.run();
      */
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

    /**
      * Gracefully closes all open windows and quits the Electron application.
      *
      * This method checks if the main and splash windows exist and closes them
      * before calling `app.quit()` to terminate the application process.
      * Useful for programmatically shutting down the app, ensuring clean exit.
      *
      * @public
      * @example
      * // Trigger app shutdown
      * wrapperInstance.die();
      */
    die() {
        // check windows exist before closing
        if (this.main_window) this.main_window.close();
        if (this.splash_window) this.splash_window.close();

        // quit the app
        app.quit();
    }
};

module.exports = GWrapper;
