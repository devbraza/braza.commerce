import { Injectable, Logger } from '@nestjs/common';
import { readdir, readFile, writeFile, copyFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface DeployResult {
  url: string;
}

@Injectable()
export class CloudflarePagesService {
  private readonly logger = new Logger(CloudflarePagesService.name);

  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly projectName: string;
  private readonly enabled: boolean;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN || '';
    this.projectName = process.env.CLOUDFLARE_PAGES_PROJECT || '';
    this.enabled = !!(this.accountId && this.apiToken && this.projectName);

    if (this.enabled) {
      this.logger.log(`Cloudflare Pages enabled: project=${this.projectName}`);
    } else {
      this.logger.warn('Cloudflare Pages disabled — missing env vars');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Deploy ALL published pages to Cloudflare Pages at once.
   *
   * CF Pages uses atomic deploys — each deploy replaces ALL content.
   * This method copies the entire staticDir (all slugs) into a temp dir
   * and deploys everything together via Wrangler.
   *
   * @param staticDir - Root directory containing all slug subdirs (e.g. /var/www/static-pages)
   */
  async deployAll(staticDir: string): Promise<DeployResult> {
    if (!this.enabled) {
      throw new Error('Cloudflare Pages not configured');
    }

    // Create temp directory and copy all slug dirs into it
    const tempId = randomBytes(6).toString('hex');
    const tempDir = join(tmpdir(), `cf-deploy-${tempId}`);
    await mkdir(tempDir, { recursive: true });

    try {
      // List all slug directories in staticDir
      if (!existsSync(staticDir)) {
        throw new Error(`Static dir not found: ${staticDir}`);
      }

      const entries = await readdir(staticDir, { withFileTypes: true });
      const slugDirs = entries.filter((e) => e.isDirectory());

      if (slugDirs.length === 0) {
        this.logger.warn('No pages to deploy — skipping CF deploy');
        return { url: `https://${this.projectName}.pages.dev` };
      }

      // Copy each slug dir into temp (with CF-relative image paths)
      for (const slugEntry of slugDirs) {
        const slug = slugEntry.name;
        const srcSlugDir = join(staticDir, slug);
        const destSlugDir = join(tempDir, slug);
        await this.copyDirRecursive(srcSlugDir, destSlugDir);

        // Rewrite image paths in HTML for CF (relative instead of /p/slug/img/)
        const htmlPath = join(destSlugDir, 'index.html');
        if (existsSync(htmlPath)) {
          let html = await readFile(htmlPath, 'utf-8');
          html = html.split(`/p/${slug}/img/`).join('img/');
          await writeFile(htmlPath, html, 'utf-8');
        }
      }

      // Copy legal pages (privacy, terms, refund, contact) to deploy root
      const legalDir = join(__dirname, '..', 'render', 'legal');
      if (existsSync(legalDir)) {
        const legalPages = ['privacy', 'terms', 'refund', 'contact'];
        for (const page of legalPages) {
          const srcHtml = join(legalDir, `${page}.html`);
          if (existsSync(srcHtml)) {
            const destDir = join(tempDir, page);
            await mkdir(destDir, { recursive: true });
            await copyFile(srcHtml, join(destDir, 'index.html'));
          }
        }
      }

      // Deploy via Wrangler (execFile with args array — safe from injection)
      const { stdout, stderr } = await execFileAsync('npx', [
        'wrangler', 'pages', 'deploy', tempDir,
        `--project-name=${this.projectName}`,
        '--branch=main',
        '--commit-dirty=true',
      ], {
        env: {
          ...process.env,
          CLOUDFLARE_ACCOUNT_ID: this.accountId,
          CLOUDFLARE_API_TOKEN: this.apiToken,
        },
        timeout: 120_000,
        shell: true,
      });

      // Validate deploy succeeded
      if (!stdout.includes('Success')) {
        throw new Error(`Wrangler deploy may have failed: ${stdout}`);
      }

      const url = `https://${this.projectName}.pages.dev`;
      this.logger.log(`Deployed ${slugDirs.length} pages to Cloudflare Pages: ${url}`);

      if (stderr && !stderr.includes('uncommitted')) {
        this.logger.warn(`Wrangler stderr: ${stderr}`);
      }

      return { url };
    } finally {
      // Cleanup temp directory
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Recursively copy a directory.
   */
  private async copyDirRecursive(src: string, dest: string): Promise<void> {
    await mkdir(dest, { recursive: true });
    const entries = await readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);
      if (entry.isDirectory()) {
        await this.copyDirRecursive(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  }
}
