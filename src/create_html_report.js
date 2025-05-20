import { getHtmlTemplete } from "./utils/html_template.js";

class CreateHTMLReport {
  createHtmlReport(suites, results, startTime, endTime, specs, options) {
    // Calculate summary statistics
    const totalDuration = Math.round((endTime - startTime) / 1000);
    const total = results.passed + results.failed + results.skipped;
    const passRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
    const htmlContent = getHtmlTemplete(
      suites,
      specs,
      options,
      passRate,
      totalDuration,
      results,
      total
    );

    return htmlContent;
  }
}

export default CreateHTMLReport;
