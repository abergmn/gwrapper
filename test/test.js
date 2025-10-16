const GWrapper = require("t_index.js");

// Example usage
const example = new GWrapper({
    splash_window: {
        toLoad: {
            "type": "file",
            "value": "test_splash.html"
        }, options: {
            experimentalFeatures: false // example thing to pass to showcase functionality
        }        
    },
    main_window: {
        toLoad: {
            "type": "url",
            "value": "https://example.com"
        }, options: {
            experimentalFeatures: false // example thing to pass to showcase functionality
        }
    },
});

example.run();
