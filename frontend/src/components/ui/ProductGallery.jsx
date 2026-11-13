import { useEffect, useMemo, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import SafeImage from './SafeImage';
import { FALLBACK_IMAGE, isValidImageSrc } from '../../utils/images';

const ZOOM_FACTOR = 2.5;
const LENS_SIZE = 0.38;
const INITIAL_ZOOM = { active: false, x: 0.5, y: 0.5 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const cssUrl = (value) =>
  `url("${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\n\r]/g, '')}")`;

const ProductGallery = ({ images, productName }) => {
  const galleryImages = useMemo(() => {
    const list = Array.isArray(images) ? images.filter(Boolean) : [];
    if (list.length > 0) return list;
    return [{ id: 'fallback', url: FALLBACK_IMAGE, altText: productName, isFallback: true }];
  }, [images, productName]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(() => new Set());
  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  useEffect(() => {
    setSelectedIndex(0);
    setFailedImages(new Set());
    setZoom(INITIAL_ZOOM);
  }, [galleryImages]);

  const activeIndex = Math.min(selectedIndex, galleryImages.length - 1);
  const currentImage = galleryImages[activeIndex];
  const showThumbnails = galleryImages.length > 1;
  const currentFailed = failedImages.has(activeIndex);
  const canZoom = !currentImage.isFallback && isValidImageSrc(currentImage.url) && !currentFailed;

  useEffect(() => {
    if (!canZoom) setZoom(INITIAL_ZOOM);
  }, [canZoom]);

  const selectImage = (index) => {
    setSelectedIndex(index);
    setZoom(INITIAL_ZOOM);
  };

  const markImageFailed = (index) => {
    setFailedImages((previous) => {
      if (previous.has(index)) return previous;
      const next = new Set(previous);
      next.add(index);
      return next;
    });
    if (index === activeIndex) setZoom(INITIAL_ZOOM);
  };

  const updateZoom = (event) => {
    if (!canZoom) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    setZoom({
      active: true,
      x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
    });
  };

  const lensX = clamp(zoom.x, LENS_SIZE / 2, 1 - LENS_SIZE / 2);
  const lensY = clamp(zoom.y, LENS_SIZE / 2, 1 - LENS_SIZE / 2);
  const backgroundX = ((lensX * ZOOM_FACTOR - LENS_SIZE / 2) / (ZOOM_FACTOR - LENS_SIZE)) * 100;
  const backgroundY = ((lensY * ZOOM_FACTOR - LENS_SIZE / 2) / (ZOOM_FACTOR - LENS_SIZE)) * 100;

  return (
    <div className="detail-gallery">
      <div className={`detail-gallery-inner ${showThumbnails ? 'has-thumbnails' : ''}`}>
        <div
          className={`detail-main-image ${canZoom ? 'is-zoomable' : ''}`}
          onMouseEnter={updateZoom}
          onMouseMove={updateZoom}
          onMouseLeave={() => setZoom(INITIAL_ZOOM)}
        >
          <SafeImage
            key={currentImage.url}
            src={currentImage.url}
            alt={currentImage.altText || productName}
            loading="eager"
            decoding="async"
            draggable={false}
            onError={() => markImageFailed(activeIndex)}
          />
          {canZoom && (
            <span className="detail-zoom-hint">
              <ZoomIn size={14} /> Zoom
            </span>
          )}
          {canZoom && zoom.active && (
            <span
              className="detail-zoom-lens"
              aria-hidden="true"
              style={{
                left: `${lensX * 100}%`,
                top: `${lensY * 100}%`,
                backgroundImage: cssUrl(currentImage.url),
                backgroundPosition: `${backgroundX}% ${backgroundY}%`,
                backgroundSize: `${ZOOM_FACTOR * 100}% ${ZOOM_FACTOR * 100}%`,
              }}
            />
          )}
        </div>

        {showThumbnails && (
          <div className="detail-thumbs" role="group" aria-label="Miniaturas del producto">
            {galleryImages.map((image, index) => (
              <button
                key={image.id || `${image.url}-${index}`}
                type="button"
                className={`detail-thumb ${activeIndex === index ? 'active' : ''}`}
                onClick={() => selectImage(index)}
                onMouseEnter={() => selectImage(index)}
                onFocus={() => selectImage(index)}
                aria-label={`Ver imagen ${index + 1} de ${galleryImages.length}`}
                aria-pressed={activeIndex === index}
              >
                <SafeImage
                  src={image.url}
                  alt={image.altText || `${productName} - imagen ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onError={() => markImageFailed(index)}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGallery;
