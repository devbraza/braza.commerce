import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import { GENERATE_COPY_PROMPT } from './prompts/generate-content';

export interface GeneratedCopy {
  name: string;
  brand: string;
  description: string;
  features: string[];
  reviews: { stars: number; text: string; author: string; verified: boolean }[];
  faq: { question: string; answer: string }[];
  miniReview: { initials: string; stars: number; text: string; author: string };
}

@Injectable()
export class AiCopyService {
  private readonly logger = new Logger(AiCopyService.name);
  private readonly client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) this.logger.warn('ANTHROPIC_API_KEY not set — copy generation will fail');
    this.client = new Anthropic({ apiKey: apiKey || '' });
  }

  async generatePageContent(referenceImagePath: string): Promise<GeneratedCopy> {
    const imageBuffer = await readFile(referenceImagePath);
    const base64 = imageBuffer.toString('base64');

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/webp', data: base64 },
              },
              { type: 'text', text: GENERATE_COPY_PROMPT },
            ],
          }],
        });

        const text = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('');

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');

        const parsed: GeneratedCopy = JSON.parse(jsonMatch[0]);
        this.logger.log(`Copy generated: ${parsed.name}`);
        return parsed;
      } catch (error: unknown) {
        const err = error as Error & { status?: number };
        this.logger.warn(`Copy generation attempt ${attempt + 1} failed: ${err.message}`);
        if (err.status === 401 || err.status === 403) {
          throw new BadRequestException('AI API authentication failed — check ANTHROPIC_API_KEY');
        }
        if (attempt === 1) throw new BadRequestException('Failed to generate copy after 2 attempts');
      }
    }

    throw new BadRequestException('Failed to generate copy');
  }
}
