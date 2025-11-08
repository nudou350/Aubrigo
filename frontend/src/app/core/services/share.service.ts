import { Injectable } from '@angular/core';

/**
 * Share Data Interface
 */
export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

/**
 * Share Service
 *
 * Handles Web Share API for sharing pets and content.
 * Also provides social media sharing links.
 */
@Injectable({
  providedIn: 'root'
})
export class ShareService {
  constructor() {
  }

  /**
   * Check if Web Share API is supported
   */
  isShareSupported(): boolean {
    return 'share' in navigator && 'canShare' in navigator;
  }

  /**
   * Check if sharing files is supported
   */
  isFileShareSupported(): boolean {
    if (!this.isShareSupported()) return false;

    try {
      // Try to check if files can be shared
      const testFile = new File([''], 'test.txt', { type: 'text/plain' });
      return navigator.canShare?.({ files: [testFile] }) ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Share content using Web Share API
   */
  async share(data: ShareData): Promise<boolean> {
    if (!this.isShareSupported()) {
      return false;
    }

    // Check if the data can be shared
    if (!navigator.canShare || !navigator.canShare(data)) {
      return false;
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error: any) {
      if (error.name === 'AbortError') {
      } else {
      }
      return false;
    }
  }

  /**
   * Share a pet
   */
  async sharePet(pet: {
    id: string;
    name: string;
    species: string;
    location?: string;
    imageUrl?: string;
  }): Promise<boolean> {
    const url = `${window.location.origin}/pets/${pet.id}`;
    const text = `Conheça ${pet.name}, um ${pet.species.toLowerCase()} adorável disponível para adoção!`;

    return await this.share({
      title: `${pet.name} - Aubrigo`,
      text,
      url
    });
  }

  /**
   * Share ONG profile
   */
  async shareOng(ong: {
    id: string;
    name: string;
    location?: string;
  }): Promise<boolean> {
    const url = `${window.location.origin}/ongs/${ong.id}`;
    const text = `Conheça ${ong.name}, uma ONG dedicada ao resgate de animais!`;

    return await this.share({
      title: `${ong.name} - Aubrigo`,
      text,
      url
    });
  }

  /**
   * Share app itself
   */
  async shareApp(): Promise<boolean> {
    const url = window.location.origin;
    const text = 'Aubrigo - Plataforma para adoção de animais em Portugal. Ajude a encontrar um lar para pets abandonados!';

    return await this.share({
      title: 'Aubrigo - Adoção de Animais',
      text,
      url
    });
  }

  /**
   * Get WhatsApp share link
   */
  getWhatsAppShareLink(text: string, url?: string): string {
    const message = url ? `${text}\n${url}` : text;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  /**
   * Get Facebook share link
   */
  getFacebookShareLink(url: string): string {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }

  /**
   * Get Twitter share link
   */
  getTwitterShareLink(text: string, url?: string): string {
    const params = new URLSearchParams();
    params.append('text', text);
    if (url) params.append('url', url);
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }

  /**
   * Get Instagram share link (opens app or web)
   */
  getInstagramShareLink(): string {
    // Instagram doesn't support direct web sharing
    // This opens the Instagram app if available
    return 'instagram://';
  }

  /**
   * Get Email share link
   */
  getEmailShareLink(subject: string, body: string): string {
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  /**
   * Copy link to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    if (!navigator.clipboard) {
      return this.fallbackCopyToClipboard(text);
    }

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      return this.fallbackCopyToClipboard(text);
    }
  }

  /**
   * Fallback copy to clipboard (for older browsers)
   */
  private fallbackCopyToClipboard(text: string): boolean {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (error) {
      document.body.removeChild(textArea);
      return false;
    }
  }

  /**
   * Share via specific platform
   */
  async shareVia(
    platform: 'whatsapp' | 'facebook' | 'twitter' | 'email' | 'copy',
    data: { text: string; url?: string; subject?: string }
  ): Promise<boolean> {
    let link: string;

    switch (platform) {
      case 'whatsapp':
        link = this.getWhatsAppShareLink(data.text, data.url);
        break;

      case 'facebook':
        if (!data.url) return false;
        link = this.getFacebookShareLink(data.url);
        break;

      case 'twitter':
        link = this.getTwitterShareLink(data.text, data.url);
        break;

      case 'email':
        link = this.getEmailShareLink(
          data.subject || 'Aubrigo',
          `${data.text}${data.url ? '\n\n' + data.url : ''}`
        );
        break;

      case 'copy':
        const textToCopy = data.url || data.text;
        return await this.copyToClipboard(textToCopy);

      default:
        return false;
    }

    window.open(link, '_blank', 'noopener,noreferrer');
    return true;
  }
}
