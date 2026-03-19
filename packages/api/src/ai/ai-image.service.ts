import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFile } from 'fs/promises';
import { IMAGE_STYLE_PROMPTS } from './prompts/generate-content';

@Injectable()
export class AiImageService {
  private readonly logger = new Logger(AiImageService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) this.logger.warn('GOOGLE_AI_API_KEY not set — image generation will fail');
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  async generateProductImages(referenceImagePath: string): Promise<Buffer[]> {
    const imageBuffer = await readFile(referenceImagePath);
    const base64 = imageBuffer.toString('base64');

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const results = await Promise.allSettled(
      IMAGE_STYLE_PROMPTS.map(async (prompt, index) => {
        try {
          const result = await model.generateContent([
            {
              inlineData: { mimeType: 'image/webp', data: base64 },
            },
            `Based on this product reference photo, generate a new professional e-commerce product image with this style: ${prompt}. Generate the image only, no text response.`,
          ]);

          const response = result.response;
          const parts = response.candidates?.[0]?.content?.parts || [];

          for (const part of parts) {
            if (part.inlineData?.data) {
              return Buffer.from(part.inlineData.data, 'base64');
            }
          }

          throw new Error(`No image data in response for position ${index + 1}`);
        } catch (error) {
          this.logger.warn(`Image generation failed for position ${index + 1}: ${(error as Error).message}`);
          throw error;
        }
      }),
    );

    const images: Buffer[] = [];
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'fulfilled') {
        images.push((results[i] as PromiseFulfilledResult<Buffer>).value);
      } else {
        this.logger.warn(`Image ${i + 1} failed, using placeholder`);
        images.push(Buffer.alloc(0));
      }
    }

    const successCount = images.filter((b) => b.length > 0).length;
    this.logger.log(`Generated ${successCount}/6 product images`);

    if (successCount === 0) {
      throw new BadRequestException('Failed to generate any product images');
    }

    return images;
  }
}
