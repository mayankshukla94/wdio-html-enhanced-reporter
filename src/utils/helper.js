class Helper {
  findLatestSuiteByTitle(suiteMapByTitle, title) {
    if (suiteMapByTitle?.has(title)) {
      const list = suiteMapByTitle.get(title);
      return list[list.length - 1];
    }
    return null;
  }

  findSuiteByUid(uid, suites, suiteMapByTitle) {
    for (const suite of suites) {
      if (suite.uid === uid) {
        return suite;
      }

      const nested = this.findSuiteByUid(uid, suite.suites, suiteMapByTitle);
      if (nested) return nested;
    }

    if (suiteMapByTitle?.has(uid)) {
      const candidates = suiteMapByTitle.get(uid);
      return candidates?.[candidates.length - 1] || null;
    }

    return null;
  }

  updateTestStatus(test, state, suiteMapByTitle, suites, testScreenshots, testLogs) {
    const parentUid = test.parentUid || test.parent || null;
    let currentSuite = this.findSuiteByUid(parentUid, suites, suiteMapByTitle);

    if (!currentSuite && suiteMapByTitle.has(parentUid)) {
      const candidateSuites = suiteMapByTitle.get(parentUid);
      currentSuite = candidateSuites[candidateSuites.length - 1];
    }

    if (currentSuite) {
      const currentTest = currentSuite.tests.find(t => t.uid === test.uid);
      if (currentTest) {
        currentTest.state = state;
        currentTest.duration = test.duration || 0;
        currentTest.screenshots = testScreenshots?.[test.uid] || [];
        currentTest.logs = testLogs?.[test.uid] || [];

        if (state === 'failed' && test.error) {
          currentTest.error = {
            message: test.error.message,
            stack: test.error.stack,
          };
        }
      }
    }
  }
}

export default new Helper();
