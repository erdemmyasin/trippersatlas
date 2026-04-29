/**
 * Dünya çizimi üzerinde videonun görüneceği bölgeler — SVG maske (objectBoundingBox 0–1).
 * Siyah tam dolgu = video kapalı; beyaz path = video açık.
 * Referans: kullanıcının kırmızı ile işaretlediği kara-parça içleri (yaklaşık vektör).
 *
 * Bu diziyi Inkscape/Figma’da 100×100 viewBox ile açıp path’leri ince ayar yapabilirsiniz;
 * public/how-globe-video-regions.svg ile aynı geometriyi tutmaya çalışın.
 */
export const GLOBE_VIDEO_MASK_PATHS = [
  // Sol Amerika “kıvrım” şeridi
  'M0.15,0.28 L0.26,0.30 L0.24,0.72 L0.13,0.70 Z',
  // Orta–sağ yatay bantlar (kırmızı çizgili bloklar)
  'M0.40,0.36 L0.78,0.34 L0.79,0.42 L0.41,0.44 Z',
  'M0.42,0.45 L0.77,0.43 L0.78,0.51 L0.43,0.53 Z',
  'M0.40,0.54 L0.75,0.52 L0.76,0.60 L0.41,0.62 Z',
  'M0.43,0.63 L0.73,0.61 L0.74,0.69 L0.44,0.71 Z',
  'M0.46,0.70 L0.70,0.68 L0.71,0.75 L0.47,0.77 Z',
  'M0.48,0.52 L0.68,0.51 L0.69,0.58 L0.49,0.59 Z',
  // Üst sağ kara parçası
  'M0.63,0.20 L0.83,0.27 L0.80,0.36 L0.61,0.29 Z',
  // Üst orta küçük tamamlayıcı
  'M0.52,0.22 L0.62,0.21 L0.63,0.28 L0.53,0.29 Z',
];
