/**
 * Ad slot manager.
 * In development: renders styled placeholders.
 * In production: swap initAds() body to inject AdSense <ins> tags.
 */
export function initAds() {
  document.querySelectorAll('.ad-slot').forEach(slot => {
    const size = slot.dataset.size || '300x250'
    // Placeholder is handled via CSS ::before pseudo-element
    // Enforce dimensions to prevent CLS
    const [w, h] = size.split('x').map(Number)
    if (w && h) {
      slot.style.minHeight = h + 'px'
      slot.style.maxWidth  = w + 'px'
    }
  })
}
