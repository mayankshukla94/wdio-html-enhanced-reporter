# 🧾 wdio-html-enhanced-reporter

A **clean**, **lightweight**, and **customizable HTML reporter** for WebdriverIO, built on top of `@wdio/reporter`. This reporter provides a structured, interactive test report with support for nested suites, logs, screenshots, and test status indicators — all rendered with plain HTML, CSS, and vanilla JavaScript.

---

## 📦 Features

- ✅ Nested `describe` / `it` block support
- 🧪 Test status indicators (pass, fail, skip)
- 📸 Screenshot integration
- 🪵 Per-test log output
- 📂 Multi-suite hierarchy handling
- 💡 Simple HTML+CSS+JS (no React/Bootstrap)
- 💼 Works seamlessly with WebdriverIO v9+
- 🧩 Extendable for your custom logic

---

## 🛠️ Installation

```bash
npm install wdio-html-enhanced-reporter --save-dev

```

---

## Update your wdio.conf.js:

```js
const SCREENSHOT_DIR = 'test-reports/screenshots';

exports.config = {
  reporters: [
    'spec',
    [
      'html-enhanced',
      {
        outputDir: './test-reports',
        filename: 'my-report.html',
        reportTitle: 'Custom Report',
        showInBrowser: false,
        screenshotDir: SCREENSHOT_DIR,
      },
    ],
  ],

  onPrepare: function () {
    // Create screenshots directory if it doesn't exist
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  },

  afterTest: async function (test) {
    // Generate a filename based on test info and timestamp
    const timestamp = DateTime.now().toFormat('yyyyMMdd-HHmmss.u');
    const filepath = path.join(SCREENSHOT_DIR, `${timestamp}.png`);
    const relativeFilePath = `./screenshots/${path.basename(filepath)}`;

    // Save the screenshot
    await browser.saveScreenshot(filepath);

    process.emit('test:screenshot', relativeFilePath);
  },
};
```

📦 Available on [NPM](https://www.npmjs.com/package/wdio-html-enhanced-reporter)

💻 Source code and documentation on [GitHub](https://github.com/mayankshukla94/wdio-html-enhanced-reporter)

