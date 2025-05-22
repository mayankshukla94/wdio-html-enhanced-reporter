import WDIOReporter from "@wdio/reporter";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, relative } from "path";

import CreateHTMLReport from "./create_html_report.js";

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
        screenshotDir: null,
        saveScreenshots: true,
        thumbnailWidth: 200,
      },
      options
    );

    if (!options.logFile) {
      options.logFile = `${options.outputDir}/logfile.txt`;
    }

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

    this.options.screenshotDir =
      this.options.screenshotDir || join(this.options.outputDir, "screenshots");

    this.screenshotCounts = {};
    this.currentTestUid = null;
    this.testScreenshots = {};
    this.testLogs = {};

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
      if (this.currentTestUid) {
        if (!this.testLogs[this.currentTestUid]) {
          this.testLogs[this.currentTestUid] = [];
        }
        this.testLogs[this.currentTestUid].push({ level: "info", message });
      }
    });
  }

  onRunnerStart(runner) {
    this.startTime = new Date();

    if (runner.specs && Array.isArray(runner.specs)) {
      this.specs = runner.specs;
    }
  }

  onSuiteStart(suite) {
    const parentUid = suite.parentUid || suite.parent || null;
    const newSuite = {
      uid: suite.uid,
      title: suite.title,
      tests: [],
      suites: [],
      parentUid,
    };

    if (!parentUid) {
      this.suites.push(newSuite);
    } else {
      const parentSuite = this.findSuiteByUid(parentUid, this.suites);
      if (parentSuite) {
        parentSuite.suites.push(newSuite);
      } else {
        console.warn(`Parent suite not found for uid or title: ${parentUid}`);
        this.suites.push(newSuite);
      }
    }
  }

  onTestStart(test) {
    const parentUid = test.parentUid || test.parent || null;
    const currentSuite = this.findSuiteByUid(parentUid, this.suites);
    const testEntry = {
      uid: test.uid,
      title: test.title,
      state: "pending",
      duration: 0,
      logs: [],
      screenshots: [],
      error: null,
    };

    if (currentSuite) {
      currentSuite.tests.push(testEntry);
    } else {
      console.warn(
        `Test '${test.title}' could not find suite with uid/title: ${parentUid}`
      );
    }

    this.currentTest = testEntry;
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

  findSuiteByUid(uid, suites = this.suites) {
    for (const suite of suites) {
      if (suite.uid === uid || suite.title === uid) {
        return suite;
      }

      const nested = this.findSuiteByUid(uid, suite.suites);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  updateTestStatus(test, state) {
    const parentUid = test.parentUid || test.parent || null;
    const currentSuite = this.findSuiteByUid(parentUid, this.suites);

    if (currentSuite) {
      const currentTest = currentSuite.tests.find((t) => t.uid === test.uid);
      if (currentTest) {
        currentTest.state = state;
        currentTest.duration = test.duration || 0;
        currentTest.screenshots = this.testScreenshots[test.uid] || [];
        currentTest.logs = this.testLogs?.[test.uid] || [];

        if (state === "failed" && test.error) {
          currentTest.error = {
            message: test.error.message,
            stack: test.error.stack,
          };
        }
      } else {
        console.warn(
          `Test with uid ${test.uid} not found in suite ${parentUid}`
        );
      }
    } else {
      console.warn(
        `Suite not found for test: ${test.title}, parentUid/title: ${parentUid}`
      );
    }
  }

  onAfterCommand(command) {
    if (command.method === "saveScreenshot" && command.result) {
      const testUid = command.cid;
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
    let currentTest = null;

    for (const suite of this.suites) {
      currentTest = suite.tests.find((t) => t.uid === testUid);
      if (currentTest) break;
    }

    if (!currentTest) return;

    if (this.options.saveScreenshots) {
      if (!existsSync(this.options.screenshotDir)) {
        mkdirSync(this.options.screenshotDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/:/g, "-");
      const filename = `${timestamp}.png`;
      const filepath = join(this.options.screenshotDir, filename);

      const imageBuffer = Buffer.from(
        base64Image.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );
      writeFileSync(filepath, imageBuffer);

      const relativePath = relative(this.options.outputDir, filepath);
      currentTest.screenshots.push({
        title,
        path: relativePath,
        timestamp: new Date(),
      });
    } else {
      if (currentTest.screenshots.length < this.options.screenshotsPerTest) {
        currentTest.screenshots.push({
          title,
          data: base64Image,
          timestamp: new Date(),
        });
      }
    }
  }

  onSuiteEnd(suite) {
    const currentSuite = this.findSuiteByUid(suite.uid, this.suites);
    if (currentSuite) {
      currentSuite.end = new Date();
      if (currentSuite.start) {
        currentSuite.duration = currentSuite.end - currentSuite.start;
      }
    } else {
      console.warn(`Suite with UID ${suite.uid} not found on end`);
    }
  }

  onRunnerEnd() {
    this.endTime = new Date();
    this.generateReport();
  }

  onLogMessage(data) {
    const currentSuite = this.findSuiteByUid(data.parentUid);
    if (currentSuite) {
      const currentTest = currentSuite.tests.find((t) => t.uid === data.uid);
      if (currentTest) {
        if (currentTest.logs.length < 50) {
          currentTest.logs.push({
            level: data.level,
            message: String(data.message).substring(0, 500),
          });
        }
      }
    }
  }

  generateReport() {
    if (!existsSync(this.options.outputDir)) {
      mkdirSync(this.options.outputDir, { recursive: true });
    }

    const htmlContent = htmlReport.createHtmlReport(
      this.suites,
      this.results,
      this.startTime,
      this.endTime,
      this.specs,
      this.options
    );

    const reportPath = join(this.options.outputDir, this.options.filename);
    writeFileSync(reportPath, htmlContent);

    if (this.options.showInBrowser) {
      const open = require("open");
      open(reportPath);
    }

    console.log(`Report generated: ${reportPath}`);
  }
}

export default CustomHtmlReporter;
