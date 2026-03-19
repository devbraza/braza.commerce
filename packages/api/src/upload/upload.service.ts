import { Injectable, Logger } from '@nestjs/common';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadsDir = join(process.cwd(), 'uploads', 'pages');

  getPageDir(pageId: string): string {
    return join(this.uploadsDir, pageId);
  }

  async saveBuffer(pageId: string, filename: string, buffer: Buffer): Promise<string> {
    const dir = this.getPageDir(pageId);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buffer);

    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const url = `${baseUrl}/uploads/pages/${pageId}/${filename}`;
    this.logger.log(`File saved: ${url} (${buffer.length} bytes)`);
    return url;
  }

  async deletePageFiles(pageId: string): Promise<void> {
    try {
      await rm(this.getPageDir(pageId), { recursive: true, force: true });
      this.logger.log(`Deleted files for page ${pageId}`);
    } catch {
      this.logger.warn(`No files to delete for page ${pageId}`);
    }
  }
}
