import { renderSuites } from './render_suites.js';

export function getHtmlTemplete(suites, specs, options, passRate, totalDuration, results, total) {
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${options.reportTitle}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                h1, h2, h3, h4 {
                    margin-top: 20px;
                }
                .hide{
                  display: none;
                }
                .summary {
                    background-color: #f5f5f5;
                    padding: 15px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                .progress-bar {
                    height: 20px;
                    background-color: #e9ecef;
                    border-radius: 4px;
                    margin-top: 10px;
                    overflow: hidden;
                }
                .progress-bar-fill {
                    height: 100%;
                    background-color: #28a745;
                    width: ${passRate}%;
                }
                .spec-file-name {
                    margin-top: 5px;
                    padding: 1px 12px;
                    background-color: #e6f4ea;
                    border-left: 4px solid #007bff;
                    font-weight: bold;
                }
                .spec-file-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .file-name {
                    font-size: 1em;
                    color: #333;
                }
                .test-count {
                    font-size: 0.95em;
                    color: #666;
                }
                .suite {
                    margin-bottom: 20px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .suite-header {
                    padding: 10px 15px;
                    background-color: #f8f9fa;
                    border-bottom: 1px solid #ddd;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .suite-title {
                    font-weight: bold;
                }
                .suite-stats {
                    font-size: 0.9em;
                    color: #666;
                }
                .suite-body {
                    padding: 15px;
                    display: ${options.collapseTests ? 'none' : 'block'};
                }
                .test {
                    margin-bottom: 20px;
                    padding: 15px;
                    border-radius: 4px;
                    background-color: #d4edda;
                }
                .test.passed {
                    background-color: #d4edda;
                }
                .test.failed {
                    background-color: #f8d7da;
                }
                .test.skipped {
                    background-color: #e9ecef;
                }
                .test-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .test-title {
                    font-weight: bold;
                    font-size: 1.1em;
                }
                .test-duration {
                    color: #666;
                    font-size: 0.9em;
                }
                .test-error {
                    margin-top: 5px;
                    padding: 5px;
                    background-color: #fff;
                    border-radius: 4px;
                    overflow-x: auto;
                }
                .logs {
                    margin-top: 5px;
                    max-height: 120px;
                    overflow-y: auto;
                    background-color: #f8f9fa;
                    padding: 5px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 1.0em;
                }
                .log-message {
                    margin-bottom: 5px;
                }
                .log-message.info {
                    color: #0c5460;
                }
                .log-message.error {
                    color: #721c24;
                }
                .log-message.warn {
                    color: #856404;
                }
                .screenshots {
                    margin-top: 15px;
                }
                .screenshot-gallery {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 10px;
                }
                .screenshot-thumbnail {
                    width: ${options.thumbnailWidth}px;
                    cursor: pointer;
                    border: 2px solid transparent;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .screenshot-thumbnail.expand {
                    width: 1000px;
                }
                .screenshot-image {
                    max-width: 100%;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .screenshot-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .screenshot-timestamp {
                    font-size: 0.85em;
                    color: #666;
                    margin-bottom: 10px;
                }
                .screenshot-page {
                    padding: 5px 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                    background-color: #f8f9fa;
                }
                .screenshot-page.active {
                    background-color: #007bff;
                    color: white;
                    border-color: #007bff;
                }
                .reporter-actions{
                  display: flex;
                  justify-content: space-between;
                }
                .expand-all, .collapse-all, .hide-passing-test, .hide-failing-test{
                    margin-right: 10px;
                    padding: 5px 10px;
                    background-color: #f8f9fa;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .active{
                  background-color: #e6f4ea;
                }
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 100;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.8);
                    justify-content: center;
                    align-items: center;
                }
                .modal-content {
                    max-width: 90%;
                    max-height: 90%;
                }
                .modal-content img {
                    max-width: 100%;
                    max-height: 90vh;
                    display: block;
                    margin: 0 auto;
                }
                .modal-close {
                    position: absolute;
                    top: 15px;
                    right: 25px;
                    font-size: 30px;
                    color: white;
                    cursor: pointer;
                }
                .modal-controls {
                    position: absolute;
                    bottom: 20px;
                    left: 0;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                }
                .modal-prev, .modal-next {
                    background-color: rgba(255,255,255,0.7);
                    color: #333;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 20px;
                    cursor: pointer;
                }
                .modal-counter {
                    color: white;
                    font-size: 16px;
                    background-color: rgba(0,0,0,0.5);
                    padding: 5px 10px;
                    border-radius: 15px;
                }
            </style>
        </head>
        <body>
            <h1>${options.reportTitle}</h1>

            <div class="summary">
                <div class="summary-row">
                    <div>Total Specs: ${specs.length}</div>
                    <div>Duration: ${totalDuration}s</div>
                </div>
                <div class="summary-row">
                    <div>Passed: ${results.passed}</div>
                    <div>Failed: ${results.failed}</div>
                    <div>Skipped: ${results.skipped}</div>
                    <div>Total: ${total}</div>
                    <div>Pass Rate: ${passRate}%</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-bar-fill"></div>
                </div>
            </div>

            <h2>Test Results</h2>
              <div class="reporter-actions">
             <div>
                <button class="expand-all">Expand All</button>
                <button class="collapse-all">Collapse All</button>
             </div>

             <div class="filters">
               <button onClick="hideFailingTests(this)" class="hide-failing-test">Hide Failing Tests</button>
               <button onClick="hidePassingTests(this)" class="hide-passing-test">Hide Passing Tests</button>
             </div>
            </div>
            ${renderSuites(suites)}

            <!-- Screenshot Modal -->
            <div class="modal" id="screenshotModal">
                <span class="modal-close">&times;</span>
                <div class="modal-content">
                    <img id="modalImage" src="" alt="Screenshot">
                </div>
                <div class="modal-controls">
                    <button class="modal-prev">&larr;</button>
                    <div class="modal-counter"><span id="currentIndex">1</span>/<span id="totalImages">1</span></div>
                    <button class="modal-next">&rarr;</button>
                </div>
            </div>

            <script>
                // Add click handlers to expand/collapse suites
                document.querySelectorAll('.suite-header').forEach(header => {
                    header.addEventListener('click', () => {
                        const body = header.nextElementSibling;
                        body.style.display = body.style.display === 'none' ? 'block' : 'none';
                    });
                });

                // Expand all button
                document.querySelector('.expand-all').addEventListener('click', () => {
                    document.querySelectorAll('.suite-body').forEach(body => {
                        body.style.display = 'block';
                    });
                });

                // Collapse all button
                document.querySelector('.collapse-all').addEventListener('click', () => {
                    document.querySelectorAll('.suite-body').forEach(body => {
                        body.style.display = 'none';
                    });
                });

                // Expand screenshot
                document.querySelector('body').addEventListener('click', (event) => {
                    if (event.target.tagName === 'IMG') {
                        event.target.parentNode.classList.toggle('expand');
                    }
                })

                function hideTest({selector, filterButton, filterButtonText}){
                  document.querySelectorAll(selector).forEach(test=>test.classList.add('hide'));
                  filterButton.classList.add('active');
                  filterButton.textContent=filterButtonText;
                }

                function showTest({selector, filterButton, filterButtonText}){
                  document.querySelectorAll(selector).forEach(test=>test.classList.remove('hide'));
                  filterButton.classList.remove('active');
                  filterButton.textContent=filterButtonText;
                }

                // Hide Failing Tests
                function hideFailingTests(filterButtonRef){
                 if(!filterButtonRef.classList.contains("active")){
                  hideTest({selector:"div.test.failed", filterButton:filterButtonRef, filterButtonText:"Show Failing Tests"});
                 }
                 else{
                  showTest({selector:"div.test.failed", filterButton:filterButtonRef, filterButtonText:"Hide Failing Tests"});
                 }
                }

                // Hide Passing Tests
                function hidePassingTests(filterButtonRef){
                 if(!filterButtonRef.classList.contains("active")){
                  hideTest({selector:"div.test.passed", filterButton:filterButtonRef, filterButtonText:"Show Passing Tests"});
                 }
                 else{
                  showTest({selector:"div.test.passed", filterButton:filterButtonRef, filterButtonText:"Hide Passing Tests"});
                 }
                }
            </script>
        </body>
        </html>
        `;
}
