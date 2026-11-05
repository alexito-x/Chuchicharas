export const FALLBACK_IMAGE = '/images/product-placeholder.svg';

const DATA_IMAGE_PATTERN = /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,([A-Za-z0-9+/]+={0,2})$/i;

export const isValidImageSrc = (value) => {
  if (typeof value !== 'string') return false;
  const source = value.trim();
  if (!source) return false;

  if (source.startsWith('data:')) {
    const match = DATA_IMAGE_PATTERN.exec(source);
    if (!match) return false;
    const payload = match[1];
    return payload.length >= 64 && payload.length % 4 !== 1;
  }

  if (source.startsWith('/')) {
    return !source.startsWith('//') && !/\s/.test(source);
  }

  try {
    const url = new URL(source);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const resolveImageSrc = (value, fallback = FALLBACK_IMAGE) =>
  isValidImageSrc(value) ? value.trim() : fallback;
