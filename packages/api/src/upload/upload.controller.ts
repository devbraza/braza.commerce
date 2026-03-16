import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { resolve } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB (WhatsApp limit)
const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/amr',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('media')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`Tipo de arquivo não suportado: ${file.mimetype}`), false);
      }
    },
  }))
  async uploadMedia(
    @Req() req: Request,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const user = req.user as { id: string };
    return this.uploadService.saveFile(user.id, file);
  }

  @Get('media/:userId/:date/:filename')
  async serveMedia(
    @Param('userId') userId: string,
    @Param('date') date: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // S1 fix: Sanitize path traversal
    if (/[\/\\]|\.\./.test(userId + date + filename)) {
      return res.status(400).send('Invalid path');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).send('Invalid date format');
    }
    if (!/^[a-f0-9-]{36}\.\w{1,5}$/.test(filename)) {
      return res.status(400).send('Invalid filename');
    }

    const filePath = this.uploadService.getFilePath(userId, date, filename);
    const resolved = resolve(filePath);
    const uploadsRoot = resolve(process.cwd(), 'uploads', 'media');

    if (!resolved.startsWith(uploadsRoot)) {
      return res.status(403).send('Forbidden');
    }

    res.sendFile(resolved);
  }
}
