import { useEffect, useState } from 'react';
import { FALLBACK_IMAGE, isValidImageSrc } from '../../utils/images';

const SafeImage = ({ src, alt = '', fallback = FALLBACK_IMAGE, onError, ...props }) => {
  const [currentSrc, setCurrentSrc] = useState(() => (isValidImageSrc(src) ? src.trim() : fallback));

  useEffect(() => {
    setCurrentSrc(isValidImageSrc(src) ? src.trim() : fallback);
  }, [src, fallback]);

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      onError={(event) => {
        if (currentSrc !== fallback) setCurrentSrc(fallback);
        onError?.(event);
      }}
    />
  );
};

export default SafeImage;
