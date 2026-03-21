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

  render(page: Page & { images: PageImage[] }, campaignId?: string, campaignCheckoutUrl?: string): string {
    const ai = (page.aiGeneratedContent || {}) as unknown as ContentData;
    const user = (page.userEditedContent || {}) as unknown as ContentData;
    const content: ContentData = { ...ai, ...user };

    const price = Number(page.price) || 0;
    const originalPrice = Number(page.originalPrice) || 0;
    const discount = originalPrice > 0 ? Math.round((1 - price / originalPrice) * 100) : 0;
    const installments = (price / 3).toFixed(2).replace('.', ',');
    let hash = 0;
    for (const ch of page.id) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
    const soldCount = 150 + (Math.abs(hash) % 250);
    const reviewCount = 120 + (Math.abs((hash * 7) | 0) % 200);

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
    html = html.replace(/\{\{review_count\}\}/g, String(reviewCount));

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

    // Override checkout URL if campaign has one
    if (campaignCheckoutUrl) {
      html = html.replace(/\{\{checkout_url\}\}/g, campaignCheckoutUrl);
    }

    // Carousel images
    const images = page.images.sort((a, b) => a.position - b.position);
    html = this.renderCarousel(html, images);

    // Preload LCP image (first carousel image)
    if (images.length > 0) {
      const preloadTag = `<link rel="preload" as="image" href="${images[0].url}" fetchpriority="high">`;
      html = html.replace('</head>', preloadTag + '\n</head>');
    }

    // Inject tracking script if campaign is active
    if (campaignId) {
      html = this.injectTrackingScript(html, campaignId);
    }

    return html;
  }

  private injectTrackingScript(html: string, campaignId: string): string {
    const apiBaseUrl = process.env.API_BASE_URL || 'https://api.brazachat.shop';
    const trackingScript = `
<script>
(typeof requestIdleCallback==='function'?requestIdleCallback:setTimeout)(function(){
  var API = ${JSON.stringify(apiBaseUrl)};
  var params = new URLSearchParams(window.location.search);
  var fbclid = params.get('fbclid');
  var utms = {
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
    utmContent: params.get('utm_content'),
    utmTerm: params.get('utm_term')
  };
  fetch(API + '/tracking/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ campaignId: ${JSON.stringify(campaignId)}, fbclid: fbclid }, utms))
  }).then(function(r){ return r.json(); }).then(function(data){
    window.__clickId = data.clickId;
    window.__fbclid = fbclid;
  }).catch(function(){});

  document.addEventListener('click', function(e){
    var btn = e.target.closest('a[href], button');
    if (!btn) return;
    var href = btn.getAttribute('href') || '';
    if (href && href !== '#' && !href.startsWith('javascript') && !href.startsWith('#')) {
      try {
        var url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) {
          e.preventDefault();
          if (window.__clickId) url.searchParams.set('metadata[click_id]', window.__clickId);
          if (window.__fbclid) url.searchParams.set('metadata[fbclid]', window.__fbclid);
          window.location.href = url.toString();
        }
      } catch(ex){}
    }
  });
})();
</script>`;
    return html.replace('</body>', trackingScript + '\n</body>');
  }

  private renderCarousel(html: string, images: PageImage[]): string {
    const slides = images
      .map((img) => `<div class="carousel-slide"><img src="${img.url}" alt="Produto - foto ${img.position} de ${images.length}" width="480" height="480" fetchpriority="${img.position === 1 ? 'high' : 'auto'}"${img.position > 1 ? ' loading="lazy" decoding="async"' : ''}></div>`)
      .join('\n      ');

    const dots = images
      .map((_, i) => `<button type="button" class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Ir para foto ${i + 1}"></button>`)
      .join('\n      ');

    html = html.replace('{{carousel_slides}}', slides);
    html = html.replace('{{carousel_dots}}', dots);
    return html;
  }

  private renderStars(count: number): string {
    const full = '★'.repeat(Math.min(count, 5));
    const empty = count < 5 ? `<span style="color:#767676;" aria-hidden="true">${'★'.repeat(5 - count)}</span>` : '';
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
