import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { setupVisualTesting, teardownVisualTesting, visualTest } from '../../visual';

const TEST_DIR = path.resolve(__dirname, '../../temp/visual-test');
const BASELINE_DIR = path.join(TEST_DIR, 'baselines');
const OUTPUT_DIR = path.join(TEST_DIR, 'output');

// Skip visual tests in CI environments where Chrome isn't installed
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

describe.skipIf(isCI)('Visual Testing Framework', () => {
  beforeAll(async () => {
    // Clean up previous run
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    await setupVisualTesting(OUTPUT_DIR);
  });

  afterAll(async () => {
    await teardownVisualTesting(OUTPUT_DIR);
  });

  it('generates baseline for new test', async () => {
    const html = `
      <html>
        <body style="margin:0; background: white;">
          <div style="width: 100px; height: 100px; background: red;"></div>
          <script>window.HOLO_RENDERED = true;</script>
        </body>
      </html>
    `;

    await visualTest({
      name: 'red-box',
      htmlContent: html,
      baselineDir: BASELINE_DIR,
      outputDir: OUTPUT_DIR,
    });

    // Verify baseline created
    expect(fs.existsSync(path.join(BASELINE_DIR, 'red-box.png'))).toBe(true);
  });

  it('passes when visual matches baseline', async () => {
    const html = `
      <html>
        <body style="margin:0; background: white;">
          <div style="width: 100px; height: 100px; background: red;"></div>
          <script>window.HOLO_RENDERED = true;</script>
        </body>
      </html>
    `;

    // Should not throw
    await visualTest({
      name: 'red-box',
      htmlContent: html,
      baselineDir: BASELINE_DIR,
      outputDir: OUTPUT_DIR,
    });
  });

  it('fails when visual differs from baseline', async () => {
    const html = `
      <html>
        <body style="margin:0; background: white;">
          <div style="width: 100px; height: 100px; background: blue;"></div>
          <script>window.HOLO_RENDERED = true;</script>
        </body>
      </html>
    `;

    try {
      await visualTest({
        name: 'red-box', // Reusing red-box baseline
        htmlContent: html,
        baselineDir: BASELINE_DIR,
        outputDir: OUTPUT_DIR,
      });
      // Should fail
      expect(true).toBe(false);
    } catch (e) {
      expect((e as Error).message).toContain('failed with');
    }

    // Check if diff was generated
    expect(fs.existsSync(path.join(OUTPUT_DIR, 'red-box_diff.png'))).toBe(true);
  });
});
