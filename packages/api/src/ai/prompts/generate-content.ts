export const GENERATE_COPY_PROMPT = `You are an expert e-commerce copywriter for the Brazilian market.
Analyze this product photo and generate compelling sales copy in Brazilian Portuguese.

RULES:
- All text in Portuguese BR
- Persuasive but realistic tone (not exaggerated)
- No emojis
- No mention of WhatsApp
- Reviews must sound like real Brazilian customers
- 1 review must be 4 stars with honest but positive criticism (for credibility)
- FAQ answers must be relevant to this specific product type

Return ONLY valid JSON with this exact structure:
{
  "name": "product name (max 60 chars)",
  "brand": "category or collection (max 30 chars)",
  "description": "persuasive description, 2-3 sentences (max 200 chars)",
  "features": [
    "benefit 1 (max 60 chars)",
    "benefit 2 (max 60 chars)",
    "benefit 3 (max 60 chars)",
    "benefit 4 (max 60 chars)"
  ],
  "reviews": [
    { "stars": 5, "text": "review text (max 150 chars)", "author": "Brazilian Name X.", "verified": true },
    { "stars": 5, "text": "review text (max 150 chars)", "author": "Brazilian Name Y.", "verified": true },
    { "stars": 5, "text": "review text (max 150 chars)", "author": "Brazilian Name Z.", "verified": true },
    { "stars": 4, "text": "honest criticism but positive (max 150 chars)", "author": "Brazilian Name W.", "verified": true }
  ],
  "faq": [
    { "question": "What is included?", "answer": "answer (max 200 chars)" },
    { "question": "Delivery time?", "answer": "answer (max 200 chars)" },
    { "question": "Can I return?", "answer": "answer (max 200 chars)" }
  ],
  "miniReview": {
    "initials": "XX",
    "stars": 5,
    "text": "short impactful review (max 100 chars)",
    "author": "Name · Compra verificada"
  }
}`;

export const IMAGE_STYLE_PROMPTS = [
  'Professional e-commerce product photo on pure white background, studio lighting, centered, high resolution, commercial quality',
  'Product photo at 45-degree angle on white background, showing depth and dimension, professional studio lighting',
  'Close-up detail shot of the product showing texture, material quality and craftsmanship, macro photography style',
  'Lifestyle product photo in a natural real-world setting, product being used or displayed in context, warm lighting',
  'Product photo showing real scale with a human hand or common object for size reference, clean background',
  'Product in premium packaging, unboxing style, gift-ready presentation, elegant arrangement',
];
