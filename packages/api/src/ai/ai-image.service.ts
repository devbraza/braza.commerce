import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import * as sharp from 'sharp';
import { readFile } from 'fs/promises';

const IMAGE_PROMPTS = [
  // 1. Hero shot - clean studio
  'Ultra-clean e-commerce hero shot of this exact product. Pure white seamless background, professional 3-point studio lighting with softbox, product perfectly centered with subtle shadow underneath. Shot with 85mm lens, f/8, even exposure. Amazon/Shopify listing quality. Product must be identical to reference.',

  // 2. Angle shot - 3/4 view
  'Professional 3/4 angle product photography of this exact product. White background, angled to show depth and dimension. Soft gradient shadow, crisp focus throughout. Studio strobe lighting with fill light. Commercial catalog quality. Product must be identical to reference.',

  // 3. Lifestyle - wooden surface
  'High-end lifestyle product photography of this exact product placed on a beautiful natural wood surface. Warm golden hour side lighting, shallow depth of field with creamy bokeh background. Styled with minimal props. Magazine editorial quality. Product must be identical to reference.',

  // 4. Context - modern interior
  'Premium interior lifestyle shot of this exact product on a clean marble surface in a modern bright room. Natural window light, airy and aspirational mood. Soft shadows, neutral color palette. Pinterest-worthy aesthetic. Product must be identical to reference.',

  // 5. Scale reference
  'Product scale photography showing this exact product being held or next to a common object for size reference. Clean neutral background, professional studio lighting. The viewer should immediately understand the real-world size. Product must be identical to reference.',

  // 6. Detail/texture
  'Macro detail photography of this exact product. Extreme close-up showing material texture, finish quality, and craftsmanship details. Shallow depth of field, professional focus stacking. Premium quality that builds trust. Product must be identical to reference.',
];

@Injectable()
export class AiImageService {
  private readonly logger = new Logger(AiImageService.name);
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) this.logger.warn('OPENAI_API_KEY not set — image generation will fail');
    this.client = new OpenAI({ apiKey: apiKey || '' });
  }

  async generateProductImages(referenceImagePath: string): Promise<Buffer[]> {
    const imageBuffer = await readFile(referenceImagePath);

    const pngBuffer = await sharp(imageBuffer)
      .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .ensureAlpha()
      .png()
      .toBuffer();

    // Generate 2 at a time to avoid rate limits
    const images: Buffer[] = [];
    for (let batch = 0; batch < IMAGE_PROMPTS.length; batch += 2) {
      const batchPrompts = IMAGE_PROMPTS.slice(batch, batch + 2);
      const batchResults = await Promise.allSettled(
        batchPrompts.map((prompt, i) => this.generateSingleImage(pngBuffer, prompt, batch + i)),
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
          images.push(result.value);
        } else {
          images.push(Buffer.alloc(0));
        }
      }
    }

    const successCount = images.filter((b) => b.length > 0).length;
    this.logger.log(`gpt-image-1 generated ${successCount}/6 images`);

    if (successCount === 0) {
      this.logger.warn('Image generation failed — using reference as fallback');
      return [imageBuffer];
    }

    return images;
  }

  private async generateSingleImage(pngBuffer: Buffer, prompt: string, index: number): Promise<Buffer | null> {
    try {
      const file = new File([pngBuffer as unknown as BlobPart], 'reference.png', { type: 'image/png' });

      const result = await this.client.images.edit({
        model: 'gpt-image-1',
        image: [file],
        prompt,
        size: '1024x1024',
        quality: 'high',
      });

      if (result.data?.[0]?.b64_json) {
        const buf = Buffer.from(result.data[0].b64_json, 'base64');
        this.logger.log(`Image ${index + 1} generated (${buf.length} bytes)`);
        return buf;
      }

      if (result.data?.[0]?.url) {
        const response = await fetch(result.data[0].url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }

      return null;
    } catch (error) {
      this.logger.warn(`Image ${index + 1} failed: ${(error as Error).message}`);
      return null;
    }
  }
}
