import * as fs from 'fs';
import * as path from 'path';

export interface VisualTestResult {
  name: string;
  passed: boolean;
  diffPixels: number;
  baselinePath: string;
  actualPath: string;
  diffPath?: string;
}

export class VisualReportGenerator {
  private results: VisualTestResult[] = [];

  addResult(result: VisualTestResult) {
    this.results.push(result);
  }

  generate(outputPath: string) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Visual Regression Report</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .test-case { margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
          .pass { color: green; }
          .fail { color: red; }
          .images { display: flex; gap: 10px; }
          .image-col { display: flex; flex-direction: column; align-items: center; }
          img { max-width: 300px; border: 1px solid #eee; }
        </style>
      </head>
      <body>
        <h1>Visual Regression Report</h1>
        <p>Total Tests: ${this.results.length}</p>
        <p>Passed: <span class="pass">${this.results.filter((r) => r.passed).length}</span></p>
        <p>Failed: <span class="fail">${this.results.filter((r) => !r.passed).length}</span></p>

        ${this.results
          .map(
            (r) => `
          <div class="test-case">
            <h2 class="${r.passed ? 'pass' : 'fail'}">${r.name}</h2>
            <p>Diff Pixels: ${r.diffPixels}</p>
            <div class="images">
              <div class="image-col">
                <strong>Baseline</strong>
                <img src="${this.getRelativePath(outputPath, r.baselinePath)}" />
              </div>
              <div class="image-col">
                <strong>Actual</strong>
                <img src="${this.getRelativePath(outputPath, r.actualPath)}" />
              </div>
              ${
                r.diffPath
                  ? `
              <div class="image-col">
                <strong>Diff</strong>
                <img src="${this.getRelativePath(outputPath, r.diffPath)}" />
              </div>
              `
                  : ''
              }
            </div>
          </div>
        `
          )
          .join('')}
      </body>
      </html>
    `;

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`Visual report generated at ${outputPath}`);
  }

  private getRelativePath(from: string, to: string): string {
    return path.relative(path.dirname(from), to).replace(/\\/g, '/');
  }
}
