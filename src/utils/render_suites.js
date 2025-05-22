export function renderSuites(suites) {
  return suites.map((suite) => renderSuite(suite)).join("");
}

function renderSuite(suite) {
  const tests = suite.tests || [];
  const passed = tests.filter((t) => t.state === "passed").length;
  const failed = tests.filter((t) => t.state === "failed").length;
  const skipped = tests.filter((t) => t.state === "skipped").length;
  const total = tests.length;

  // ✅ Recursively render child suites
  const childSuitesHtml = (suite.suites || [])
    .map((child) => renderSuite(child))
    .join("");

  return `
      <div class="suite">
        <div class="suite-header">
          <div class="suite-title">${suite.title}</div>
          <div class="suite-stats">
            Tests: ${total} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}
          </div>
        </div>
        <div class="suite-body">
          ${renderTests(suite)}
          ${childSuitesHtml}
        </div>
      </div>
    `;
}

function renderTests(suite) {
  return suite.tests
    .map(
      (test) => `
        <div class="test ${test.state}">
            <div class="test-header">
                <div class="test-title">${test.title}</div>
                <div class="test-duration">${test.duration}ms</div>
            </div>
            
            ${
              test.error
                ? `
            <div class="test-error">
                <strong>Error:</strong> ${test.error.message}
                <pre>${test.error.stack}</pre>
            </div>
            `
                : ""
            }

            ${
              test.logs.length > 0
                ? `
            <div class="logs">
                ${test.logs
                  .map(
                    (log) => `
                <div class="log-message ${
                  log.level
                }">${log.level.toUpperCase()}: ${escapeHtml(log.message)}</div>
                `
                  )
                  .join("")}
            </div>
            `
                : ""
            }
            
            ${renderScreenshotGallery(test)}
        </div>
        `
    )
    .join("");
}

function renderScreenshotGallery(test) {
  if (!test.screenshots || test.screenshots.length === 0) {
    return "";
  }

  const screenshotThumbnails = test.screenshots
    .map(
      (screenshot, index) => `
          <div class="screenshot-thumbnail" data-index="${index}">
            <img class="screenshot-image" src="${screenshot.path}" alt="${screenshot.title}" loading="lazy">
          </div>
        `
    )
    .join("");

  const screenshotDisplays = test.screenshots
    .map(
      (screenshot, index) => `
          <div class="screenshot-display" data-test-id="${test.uid}" data-index="${index}">
            <div class="screenshot-title">${screenshot.title}</div>
            <img class="screenshot-image" src="${screenshot.path}" alt="${screenshot.title}" loading="lazy">
          </div>
        `
    )
    .join("");

  return `
        <div class="screenshots">
          <div class="screenshot-gallery" data-test-id="${test.uid}">
            ${screenshotThumbnails}
          </div>
          ${screenshotDisplays}
        </div>
      `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
