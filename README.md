# gwrapper

A minimal Electron.js wrapper with splash and main window support.

## Usage Example

```js
const GWrapper = require('./src/index.js');

const config = {
  mainWindow: { width: 800, height: 600 },
  splashWindow: { width: 640, height: 320 }
};

const app = new GWrapper(config);
app.init();
```

## Run

Install dependencies and run the test entry point:

```bash
npm install
npm test
```

## TODO
- Improve error handling
- Add configuration validation
- Support for custom main window content (local HTML)
- Add tests for edge cases
- Make splash screen content dynamic: display different messages or UI depending on whether a URL or local HTML file is being loaded.
- Use IPC to update the splash screen with real-time loading status (e.g., “loading {path or URL}…”).
- Allow users to choose between the default splash screen (with dynamic content) or a fully custom splash screen.
- Use IPC to display the name of the file or URL being loaded on the splash screen (pass the argument from main process to splash window).
  - (Note: This is for displaying the main file or URL being loaded, not for tracking individual asset loads.)

## Known Issues
- Minimal validation of config options
- No graceful shutdown/cleanup
- Only basic splash/main window logic implemented

## License

MIT. See the [LICENSE](LICENSE) file for details.
