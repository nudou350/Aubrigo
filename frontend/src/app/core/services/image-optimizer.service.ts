import { Injectable } from '@angular/core';

export interface ImageSizes {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface ResponsiveImageConfig {
  src: string;
  sizes?: ImageSizes;
  format?: 'webp' | 'jpg' | 'png';
}

@Injectable({
  providedIn: 'root'
})
export class ImageOptimizerService {

  private readonly defaultSizes: ImageSizes = {
    mobile: 640,
    tablet: 1024,
    desktop: 1920
  };

  /**
   * Generate srcset for responsive images
   * @param baseUrl - The base URL of the image
   * @param widths - Array of widths for different breakpoints
   * @returns srcset string
   */
  generateSrcSet(baseUrl: string, widths: number[] = [640, 1024, 1920]): string {
    if (!baseUrl) return '';

    return widths
      .map(width => `${this.getOptimizedUrl(baseUrl, width)} ${width}w`)
      .join(', ');
  }

  /**
   * Get optimized URL with transformations
   * Supports Cloudinary and local images
   * @param url - Original image URL
   * @param width - Desired width
   * @param format - Image format (webp, jpg, png)
   * @returns Optimized URL
   */
  getOptimizedUrl(url: string, width?: number, format: 'webp' | 'jpg' | 'png' = 'webp'): string {
    if (!url) return '';

    // Handle Cloudinary URLs
    if (url.includes('cloudinary.com')) {
      return this.getCloudinaryUrl(url, width, format);
    }

    // Handle AWS S3 URLs
    if (url.includes('amazonaws.com') || url.includes('s3.')) {
      // For S3, we might need to use a transformation service or CDN
      return url;
    }

    // Handle local assets
    if (url.startsWith('assets/')) {
      return this.getLocalAssetUrl(url, format);
    }

    return url;
  }

  /**
   * Generate Cloudinary URL with transformations
   * @param url - Cloudinary URL
   * @param width - Desired width
   * @param format - Image format
   * @returns Transformed Cloudinary URL
   */
  private getCloudinaryUrl(url: string, width?: number, format: 'webp' | 'jpg' | 'png' = 'webp'): string {
    const transformations = [
      width ? `w_${width}` : 'w_auto',
      'q_auto:good', // Auto quality optimization
      'f_auto', // Auto format selection
      'dpr_auto', // Auto DPR (Device Pixel Ratio)
      'c_limit', // Don't upscale
    ].filter(Boolean).join(',');

    // Insert transformations after /upload/
    return url.replace('/upload/', `/upload/${transformations}/`);
  }

  /**
   * Get local asset URL with format preference
   * @param url - Local asset URL
   * @param format - Preferred format
   * @returns URL with format preference
   */
  private getLocalAssetUrl(url: string, format: 'webp' | 'jpg' | 'png' = 'webp'): string {
    // Try to use optimized WebP version if available
    if (format === 'webp' && !url.endsWith('.webp')) {
      const webpUrl = url.replace(/\.(jpg|jpeg|png)$/i, '-optimized.webp');
      return webpUrl;
    }

    return url;
  }

  /**
   * Generate sizes attribute for responsive images
   * @param breakpoints - Object with breakpoint values
   * @returns sizes attribute string
   *
   * @example
   * getSizes({ '768px': '100vw', '1024px': '50vw' })
   * // Returns: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
   */
  getSizes(breakpoints: Record<string, string>): string {
    const entries = Object.entries(breakpoints);
    const sizesArray = entries.map(([bp, size]) => `(max-width: ${bp}) ${size}`);
    sizesArray.push('33vw'); // Default size for larger screens

    return sizesArray.join(', ');
  }

  /**
   * Get standard sizes for common use cases
   */
  getStandardSizes(): {
    fullWidth: string;
    halfWidth: string;
    thirdWidth: string;
    petCard: string;
  } {
    return {
      fullWidth: '(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 1200px',
      halfWidth: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px',
      thirdWidth: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
      petCard: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px',
    };
  }

  /**
   * Generate blur placeholder data URL
   * This would typically be generated server-side and stored
   * @param width - Placeholder width
   * @param height - Placeholder height
   * @param color - Placeholder color
   * @returns Base64 data URL for blur placeholder
   */
  getBlurPlaceholder(width = 20, height = 20, color = '#f0f0f0'): string {
    // Simple placeholder - in production, this should come from the backend
    // as a low-quality image placeholder (LQIP)
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="${color}"/>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Preload critical images
   * @param images - Array of image URLs to preload
   */
  preloadImages(images: string[]): void {
    images.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  /**
   * Check if browser supports WebP
   * @returns Promise that resolves to true if WebP is supported
   */
  async supportsWebP(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Check if already cached
    const cached = sessionStorage.getItem('webp-support');
    if (cached !== null) {
      return cached === 'true';
    }

    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        const supported = webP.height === 2;
        sessionStorage.setItem('webp-support', String(supported));
        resolve(supported);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Get appropriate image format based on browser support
   * @param preferredFormat - Preferred format
   * @returns Format to use
   */
  async getOptimalFormat(preferredFormat: 'webp' | 'jpg' | 'png' = 'webp'): Promise<'webp' | 'jpg' | 'png'> {
    if (preferredFormat !== 'webp') return preferredFormat;

    const supportsWebP = await this.supportsWebP();
    return supportsWebP ? 'webp' : 'jpg';
  }

  /**
   * Calculate image dimensions maintaining aspect ratio
   * @param originalWidth - Original width
   * @param originalHeight - Original height
   * @param maxWidth - Maximum width
   * @param maxHeight - Maximum height (optional)
   * @returns Calculated dimensions
   */
  calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight?: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let width = Math.min(originalWidth, maxWidth);
    let height = width / aspectRatio;

    if (maxHeight && height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }
}
