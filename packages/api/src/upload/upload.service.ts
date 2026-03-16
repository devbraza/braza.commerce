import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadsDir = join(process.cwd(), 'uploads', 'media');

  async saveFile(userId: string, file: { buffer: Buffer; originalname: string; mimetype: string; size: number }): Promise<{ url: string; type: string; fileName: string }> {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const ext = extname(file.originalname) || this.getExtFromMime(file.mimetype);
    const filename = `${randomUUID()}${ext}`;
    const dir = join(this.uploadsDir, userId, date);

    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), file.buffer);

    const baseUrl = process.env.API_BASE_URL || 'https://api.brazachat.shop';
    const url = `${baseUrl}/upload/media/${userId}/${date}/${filename}`;

    this.logger.log(`File uploaded: ${url} (${file.size} bytes)`);

    return {
      url,
      type: this.getMediaType(file.mimetype),
      fileName: file.originalname,
    };
  }

  getFilePath(userId: string, date: string, filename: string): string {
    return join(this.uploadsDir, userId, date, filename);
  }

  private getMediaType(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'document';
  }

  private getExtFromMime(mimetype: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'audio/ogg': '.ogg',
      'audio/mpeg': '.mp3',
      'audio/mp4': '.m4a',
      'audio/amr': '.amr',
      'application/pdf': '.pdf',
    };
    return map[mimetype] || '.bin';
  }
}
