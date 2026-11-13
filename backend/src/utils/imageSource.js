const DATA_IMAGE_PATTERN = /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,([A-Za-z0-9+/]+={0,2})$/i;
const MAX_DATA_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_URL_LENGTH = 2048;

export const isValidImageSource = (value) => {
  if (typeof value !== 'string') return false;
  const source = value.trim();
  if (!source) return false;

  if (source.startsWith('data:')) {
    const match = DATA_IMAGE_PATTERN.exec(source);
    if (!match) return false;
    const payload = match[1];
    if (payload.length < 64 || payload.length % 4 === 1) return false;
    const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
    const decodedBytes = Math.floor((payload.length * 3) / 4) - padding;
    return decodedBytes > 0 && decodedBytes <= MAX_DATA_IMAGE_BYTES;
  }

  if (source.startsWith('/')) {
    return source.length <= MAX_IMAGE_URL_LENGTH && !source.startsWith('//') && !/\s/.test(source);
  }

  if (source.length > MAX_IMAGE_URL_LENGTH) return false;
  try {
    const url = new URL(source);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password;
  } catch {
    return false;
  }
};

export default isValidImageSource;
