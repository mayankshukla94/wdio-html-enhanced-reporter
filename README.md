# 🧾 wdio-custom-html-reporter

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
npm install wdio-custom-html-reporter --save-dev

```

---

## Update your wdio.conf.js:

```js
exports.config = {
  const SCREENSHOT_DIR = 'test-reports/screenshots';

  reporters: [
    'spec',
    [
      'custom-html',
      {
        outputDir: './test-reports',
        filename: 'my-report.html',
        reportTitle: 'Custom Report',
        showInBrowser: false,
        screenshotDir: SCREENSHOT_DIR,
      },
    ],
  ],
};

```
