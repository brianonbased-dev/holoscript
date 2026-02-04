
import puppeteer, { Browser, Page } from 'puppeteer';

export interface RendererOptions {
  width: number;
  height: number;
  headless?: boolean | 'new';
}

export class HeadlessRenderer {
  private browser: Browser | null = null;
  private options: RendererOptions;

  constructor(options: Partial<RendererOptions> = {}) {
    this.options = {
      width: 1280,
      height: 720,
      headless: 'new',
      ...options
    };
  }

  async launch(): Promise<void> {
    if (this.browser) return;
    this.browser = await puppeteer.launch({
      headless: this.options.headless as any,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async setupPage(): Promise<Page> {
    if (!this.browser) await this.launch();
    const page = await this.browser!.newPage();
    await page.setViewport({ width: this.options.width, height: this.options.height });
    
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') console.error('PAGE ERROR:', msg.text());
      else if (type === 'warning') console.warn('PAGE WARN:', msg.text());
    });

    return page;
  }

  async renderHTML(htmlContent: string, waitForSignal = true): Promise<Page> {
    const page = await this.setupPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    if (waitForSignal) {
      try {
        await page.waitForFunction('window.HOLO_RENDERED === true', { timeout: 2000 });
      } catch (e) {
        console.warn('Timeout waiting for HOLO_RENDERED signal. Proceeding anyway.');
      }
    }
    
    // Wait for frame stabilization
    await new Promise(r => setTimeout(r, 200));
    return page;
  }
}
