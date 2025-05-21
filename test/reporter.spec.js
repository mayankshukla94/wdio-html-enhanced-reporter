import { expect } from "chai";
import { existsSync, rmSync } from "fs";
import { join } from "path";

import CustomHtmlReporter from "../src/custom_reporter.js";

describe("Custom HtmlReporter", function () {
  let reporter;
  const options = {
    outputDir: "./test-reports",
    filename: "test-report.html",
    showInBrowser: false,
    saveScreenshots: false,
  };

  before(function () {
    reporter = new CustomHtmlReporter(options);
  });

  // after(function () {
  //   // Clean up report directory
  //   const filePath = join(options.outputDir, options.filename);
  //   if (existsSync(filePath)) {
  //     rmSync(filePath);
  //   }
  // });

  it("should initialize with default options", function () {
    expect(reporter.options.outputDir).to.equal("./test-reports");
    expect(reporter.options.filename).to.equal("test-report.html");
    expect(reporter.suites).to.be.an("array").that.is.empty;
  });

  it("should add a suite onSuiteStart and find by uid", function () {
    const suite = { uid: "s1", title: "Suite 1", parentUid: null };
    reporter.onSuiteStart(suite);

    const found = reporter.suites.find((s) => s.uid === "s1");
    expect(found).to.not.be.undefined;
    expect(found.title).to.equal("Suite 1");
  });

  it("should nest child suites under parent using uid", function () {
    const parentSuite = {
      uid: "parent",
      title: "Parent Suite",
      parentUid: null,
    };
    const childSuite = {
      uid: "child",
      title: "Child Suite",
      parentUid: "parent",
    };

    reporter.onSuiteStart(parentSuite);
    reporter.onSuiteStart(childSuite);

    const parent = reporter.suites.find((s) => s.uid === "parent");
    expect(parent.suites).to.have.lengthOf(1);
    expect(parent.suites[0].uid).to.equal("child");
  });

  it("should add a test to the correct suite by uid", function () {
    const suite = { uid: "s2", title: "Suite 2", parentUid: null };
    const test = { uid: "t1", title: "Test 1", parentUid: "s2" };

    reporter.onSuiteStart(suite);
    reporter.onTestStart(test);

    const s = reporter.suites.find((s) => s.uid === "s2");
    expect(s.tests).to.have.lengthOf(1);
    expect(s.tests[0].uid).to.equal("t1");
  });

  it("should update test status and record failure", function () {
    const suite = { uid: "s3", title: "Suite 3", parentUid: null };
    const test = {
      uid: "t2",
      title: "Test 2",
      parentUid: "s3",
      duration: 123,
      error: { message: "Oops", stack: "stacktrace" },
    };

    reporter.onSuiteStart(suite);
    reporter.onTestStart(test);
    reporter.onTestFail(test);

    const s = reporter.suites.find((s) => s.uid === "s3");
    const t = s.tests.find((t) => t.uid === "t2");

    expect(t.state).to.equal("failed");
    expect(t.duration).to.equal(123);
    expect(t.error.message).to.equal("Oops");
  });

  it("should generate report file onRunnerEnd", function () {
    const suite = { uid: "s4", title: "Suite 4", parentUid: null };
    const test = {
      uid: "t3",
      title: "Test 3",
      parentUid: "s4",
      duration: 100,
    };

    reporter.onRunnerStart({
      specs: ["test/specs/example1.spec.js", "test/specs/example2.spec.js"],
    });
    reporter.onSuiteStart(suite);
    reporter.onTestStart(test);

    process.emit("test:log", "spec message is logged");

    reporter.onTestPass(test);
    reporter.onSuiteEnd(suite);
    reporter.onRunnerEnd({});

    const reportPath = join(options.outputDir, options.filename);
    expect(existsSync(reportPath)).to.be.true;
    expect(reporter.specs).to.include("test/specs/example1.spec.js");
  });

  it("should capture screenshots for a test", function () {
    const suite = { uid: "s5", title: "Suite 5", parentUid: null };
    const test = {
      uid: "t5",
      title: "Test with Screenshot",
      parentUid: "s5",
      duration: 120,
    };

    reporter.onRunnerStart({ specs: ["dummy.spec.js"] });
    reporter.onSuiteStart(suite);
    reporter.onTestStart(test);

    // Simulate screenshot event
    process.emit("test:screenshot", "test-reports/screenshots/test-snap-1.png");
    process.emit("test:screenshot", "test-reports/screenshots/test-snap-2.png");

    reporter.onTestPass(test);
    reporter.onSuiteEnd(suite);
    reporter.onRunnerEnd({});

    // Locate the suite and test to verify screenshots
    const foundSuite = reporter.suites.find((s) => s.uid === "s5");
    const foundTest = foundSuite.tests.find((t) => t.uid === "t5");

    expect(foundTest.screenshots).to.have.lengthOf(2);
    expect(foundTest.screenshots[0].path).to.equal(
      "test-reports/screenshots/test-snap-1.png"
    );
    expect(foundTest.screenshots[1].path).to.equal(
      "test-reports/screenshots/test-snap-2.png"
    );
  });
});
