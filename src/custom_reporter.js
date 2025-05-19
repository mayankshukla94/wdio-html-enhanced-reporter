import WDIOReporter from "@wdio/reporter";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, relative } from "path";

import CreateHTMLReport from "./create_html_report";

const htmlReport = new CreateHTMLReport();

class CustomHtmlReporter extends WDIOReporter {
  constructor(options) {
    options = Object.assign(
      {
        outputDir: "./reports",
        filename: "wdio-custom-html-reporter.html",
        reportTitle: "Test Report",
        showInBrowser: false,
        collapseTests: true,
        // Screenshot options
        screenshotDir: null, // If null, will use outputDir/screenshots
        saveScreenshots: true, // Whether to save screenshots externally instead of embedding
        thumbnailWidth: 200, // Width of thumbnails in the gallery view
      },
      options
    );

    super(options);
    this.options = options;
    this.suites = [];
    this.specs = [];
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
    };
    this.startTime = null;
    this.endTime = null;

    // Set screenshot directory
    this.options.screenshotDir =
      this.options.screenshotDir || join(this.options.outputDir, "screenshots");

    // Create screenshot counter
    this.screenshotCounts = {};

    this.currentTestUid = null; // Track currently running test
    this.testScreenshots = {}; // Map test.uid -> array of screenshots

    // Capture emitted screenshots
    process.on("test:screenshot", (filepath) => {
      if (this.currentTestUid) {
        if (!this.testScreenshots[this.currentTestUid]) {
          this.testScreenshots[this.currentTestUid] = [];
        }
        this.testScreenshots[this.currentTestUid].push({
          path: filepath,
          title: `Screenshot ${
            this.testScreenshots[this.currentTestUid].length + 1
          }`,
        });
      }
    });

    process.on("test:log", (message) => {
      if (this.currentTest) {
        this.currentTest.logs.push({ level: "info", message });
      }
    });
  }

  onRunnerStart(runner) {
    this.startTime = new Date();
  }

  onSuiteStart(suite) {
    const newSuite = {
      uid: suite.uid,
      title: suite.title,
      tests: [],
      suites: [], // to support nested suites
      parent: suite.parent,
    };

    if (!suite.parent) {
      // Top-level suite
      this.suites.push(newSuite);
    } else {
      // Find parent suite and nest under it
      const parentSuite = this.findSuiteByTitle(suite.parent, this.suites);
      if (parentSuite) {
        parentSuite.suites.push(newSuite);
      } else {
        console.log(`Parent suite not found: ${suite.parent}`);
      }
    }
  }

  onTestStart(test) {
    const currentSuite = this.findSuiteByTitle(test.parent, this.suites);
    if (currentSuite) {
      currentSuite.tests.push({
        uid: test.uid,
        title: test.title,
        state: "pending",
        duration: 0,
        logs: [],
        screenshots: [],
        error: null,
      });
    }

    this.currentTestUid = test.uid;
    this.screenshotCounts[test.uid] = 0;
  }

  onTestPass(test) {
    this.updateTestStatus(test, "passed");
    this.results.passed++;
  }

  onTestFail(test) {
    this.updateTestStatus(test, "failed");
    this.results.failed++;
  }

  onTestSkip(test) {
    this.updateTestStatus(test, "skipped");
    this.results.skipped++;
  }

  findSuiteByTitle(title, suites = this.suites) {
    for (const suite of suites) {
      if (suite.title === title) return suite;
      if (suite.suites?.length) {
        const nested = this.findSuiteByTitle(title, suite.suites);
        if (nested) return nested;
      }
    }
    return null;
  }

  updateTestStatus(test, state) {
    const currentSuite = this.findSuiteByTitle(test.parent, this.suites);
    console.log(currentSuite);
    if (currentSuite) {
      const currentTest = currentSuite.tests.find((t) => t.uid === test.uid);
      console.log(currentTest);
      if (currentTest) {
        currentTest.state = state;
        currentTest.duration = test.duration;
        currentTest.screenshots = this.testScreenshots[test.uid] || [];

        if (state === "failed" && test.error) {
          currentTest.error = {
            message: test.error.message,
            stack: test.error.stack,
          };
        }
      }
    }
  }

  onAfterCommand(command) {
    // Handle screenshots from WebdriverIO's 'saveScreenshot' command
    if (command.method === "saveScreenshot" && command.result) {
      const testUid = command.cid; // This might need adjustment based on WebdriverIO version

      // Only process if we haven't reached the max screenshots for this test
      if (this.screenshotCounts[testUid] < this.options.screenshotsPerTest) {
        this.handleScreenshot(
          command.result,
          testUid,
          `Screenshot ${this.screenshotCounts[testUid] + 1}`
        );
        this.screenshotCounts[testUid]++;
      }
    }
  }

  handleScreenshot(base64Image, testUid, title) {
    // Find the correct test
    let currentTest = null;

    for (const suite of this.suites) {
      currentTest = suite.tests.find((t) => t.uid === testUid);
      if (currentTest) break;
    }

    if (!currentTest) return;

    if (this.options.saveScreenshots) {
      // Ensure screenshot directory exists
      if (!existsSync(this.options.screenshotDir)) {
        mkdirSync(this.options.screenshotDir, { recursive: true });
      }

      // Generate a filename based on test info
      const timestamp = new Date().toISOString().replace(/:/g, "-");
      const filename = `${timestamp}.png`;
      const filepath = join(this.options.screenshotDir, filename);

      // Save the file
      const imageBuffer = Buffer.from(
        base64Image.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );
      writeFileSync(filepath, imageBuffer);

      // Store reference in the test
      const relativePath = relative(this.options.outputDir, filepath);
      currentTest.screenshots.push({
        title,
        path: relativePath,
        timestamp: new Date(),
      });
    } else {
      // Embed the image directly (can cause the string length issue with many screenshots)
      // Limit to the first few screenshots to prevent memory issues
      if (currentTest.screenshots.length < this.options.screenshotsPerTest) {
        currentTest.screenshots.push({
          title,
          data: base64Image,
          timestamp: new Date(),
        });
      }
    }
  }

  onRunnerEnd(runner) {
    this.endTime = new Date();
    this.generateReport();
  }

  onLogMessage(data) {
    // Find the correct test to attach this log to
    const currentSuite = this.suites.find((s) => s.uid === data.parent);
    if (currentSuite) {
      const currentTest = currentSuite.tests.find((t) => t.uid === data.uid);
      if (currentTest) {
        // Only add a limited number of logs
        if (currentTest.logs.length < 50) {
          // Limit to 50 logs per test
          currentTest.logs.push({
            level: data.level,
            message: String(data.message).substring(0, 500), // Limit message length
          });
        }
      }
    }
  }

  generateReport() {
    // Create report directory if it doesn't exist
    if (!existsSync(this.options.outputDir)) {
      mkdirSync(this.options.outputDir, { recursive: true });
    }

    // Generate HTML content
    const htmlContent = htmlReport.createHtmlReport(this.suites);

    // Write the report to a file
    const reportPath = join(this.options.outputDir, this.options.filename);
    writeFileSync(reportPath, htmlContent);

    // Open in browser if configured
    if (this.options.showInBrowser) {
      const open = require("open");
      open(reportPath);
    }

    console.log(`Report generated: ${reportPath}`);
  }
}

export default CustomHtmlReporter;
