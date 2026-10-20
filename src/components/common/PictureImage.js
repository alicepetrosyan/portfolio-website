/*
 * Renders an image with a WebP source and an original-format fallback via a
 * <picture> element, so browsers that support WebP get the smaller file while
 * others fall back to the original. When no `webp` is supplied, it degrades to
 * a plain <img>.
 *
 * Feature: chrome-3d-folders (Requirement 6.3)
 */
function PictureImage({ src, webp, alt = '', loading = 'lazy', decoding = 'async', className, ...rest }) {
  const img = (
    <img src={src} alt={alt} loading={loading} decoding={decoding} className={className} {...rest} />
  );

  if (!webp) return img;

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      {img}
    </picture>
  );
}

export default PictureImage;
