import {
  Controller,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { resolve } from 'path';

@Controller('uploads')
export class UploadController {
  private readonly uploadsRoot = resolve(process.cwd(), 'uploads');

  @Get('pages/:pageId/:filename')
  async serveImage(
    @Param('pageId') pageId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    if (/[/\\]|\.\./.test(pageId + filename)) {
      return res.status(400).send('Invalid path');
    }

    const filePath = resolve(this.uploadsRoot, 'pages', pageId, filename);
    if (!filePath.startsWith(this.uploadsRoot)) {
      return res.status(403).send('Forbidden');
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).send('Not found');
    });
  }
}
