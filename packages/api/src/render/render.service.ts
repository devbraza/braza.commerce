import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Page, PageImage } from '@prisma/client';

interface ContentData {
  name?: string;
  brand?: string;
  description?: string;
  features?: string[];
  reviews?: { stars: number; text: string; author: string; verified?: boolean }[];
  faq?: { question: string; answer: string }[];
  miniReview?: { initials: string; stars: number; text: string; author: string };
}

@Injectable()
export class RenderService {
  private readonly logger = new Logger(RenderService.name);
  private readonly template: string;

  constructor() {
    const templatePath = join(__dirname, 'template.html');
    try {
      this.template = readFileSync(templatePath, 'utf-8');
      this.logger.log('Template v3.0 loaded successfully');
    } catch {
      throw new Error(`CRITICAL: Template not found at ${templatePath}. Run 'nest build' to copy assets.`);
    }
  }

  render(page: Page & { images: PageImage[] }): string {
    const ai = (page.aiGeneratedContent || {}) as unknown as ContentData;
    const user = (page.userEditedContent || {}) as unknown as ContentData;
    const content: ContentData = { ...ai, ...user };

    const price = Number(page.price) || 0;
    const originalPrice = Number(page.originalPrice) || 0;
    const discount = originalPrice > 0 ? Math.round((1 - price / originalPrice) * 100) : 0;
    const installments = (price / 3).toFixed(2).replace('.', ',');
    const soldCount = 150 + (parseInt(page.id.slice(-4), 16) % 250);

    let html = this.template;

    // Simple replacements
    html = html.replace(/\{\{product_name\}\}/g, this.escape(content.name || 'Produto'));
    html = html.replace(/\{\{product_brand\}\}/g, this.escape(content.brand || ''));
    html = html.replace(/\{\{product_description\}\}/g, this.escape(content.description || ''));
    html = html.replace(/\{\{price\}\}/g, this.formatBRL(price));
    html = html.replace(/\{\{original_price\}\}/g, this.formatBRL(originalPrice));
    html = html.replace(/\{\{discount_pct\}\}/g, String(discount));
    html = html.replace(/\{\{installments\}\}/g, installments);
    html = html.replace(/\{\{checkout_url\}\}/g, page.checkoutUrl || '#');
    html = html.replace(/\{\{sold_count\}\}/g, String(soldCount));

    // Features
    const features = content.features || [];
    for (let i = 0; i < 4; i++) {
      html = html.replace(`{{feature_${i}}}`, this.escape(features[i] || ''));
    }

    // Reviews
    const reviews = content.reviews || [];
    for (let i = 0; i < 4; i++) {
      const r = reviews[i] || { stars: 5, text: '', author: '', verified: true };
      html = html.replace(`{{review_${i}_stars}}`, this.renderStars(r.stars));
      html = html.replace(`{{review_${i}_text}}`, this.escape(r.text));
      html = html.replace(`{{review_${i}_author}}`, this.escape(r.author));
    }

    // FAQ
    const faq = content.faq || [];
    for (let i = 0; i < 3; i++) {
      const f = faq[i] || { question: '', answer: '' };
      html = html.replace(`{{faq_${i}_question}}`, this.escape(f.question));
      html = html.replace(`{{faq_${i}_answer}}`, this.escape(f.answer));
    }

    // Mini review
    const mini = content.miniReview || { initials: '', stars: 5, text: '', author: '' };
    html = html.replace('{{mini_review_initials}}', this.escape(mini.initials));
    html = html.replace('{{mini_review_stars}}', this.renderStars(mini.stars));
    html = html.replace('{{mini_review_text}}', this.escape(mini.text));
    html = html.replace('{{mini_review_author}}', this.escape(mini.author));

    // Carousel images
    const images = page.images.sort((a, b) => a.position - b.position);
    html = this.renderCarousel(html, images);

    return html;
  }

  private renderCarousel(html: string, images: PageImage[]): string {
    const slides = images
      .map((img) => `<div class="carousel-slide"><img src="${img.url}" alt="Product image ${img.position}" fetchpriority="${img.position === 1 ? 'high' : 'auto'}"></div>`)
      .join('\n      ');

    const dots = images
      .map((_, i) => `<div class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}"></div>`)
      .join('\n      ');

    html = html.replace('{{carousel_slides}}', slides);
    html = html.replace('{{carousel_dots}}', dots);
    return html;
  }

  private renderStars(count: number): string {
    const full = '★'.repeat(Math.min(count, 5));
    const empty = count < 5 ? `<span style="color:#ddd;">${'★'.repeat(5 - count)}</span>` : '';
    return full + empty;
  }

  private formatBRL(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  private escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
