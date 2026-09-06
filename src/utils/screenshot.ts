import QRCode from 'qrcode';

/**
 * Returns a high-quality preview thumbnail URL for a given web URL.
 */
export function getWebsiteScreenshotUrl(rawUrl: string, customThumbnail?: string): string {
  if (customThumbnail && customThumbnail.trim() !== '') {
    return customThumbnail.trim();
  }

  if (!rawUrl) return '';

  let normalized = rawUrl.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  try {
    const encoded = encodeURIComponent(normalized);
    // WordPress mshots is free, reliable, supports any public website/Vercel URL
    return `https://s0.wp.com/mshots/v1/${encoded}?w=960`;
  } catch {
    return '';
  }
}

/**
 * Extracts a clean domain name from a URL for display
 */
export function extractDomain(rawUrl: string): string {
  try {
    let normalized = rawUrl.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    const parsed = new URL(normalized);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
}

/**
 * Generates a high-res QR code as a Data URL (PNG)
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}

/**
 * Relative time formatter with language support
 */
export function formatTimeAgo(isoString: string, lang: string = 'vi'): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) {
      if (lang === 'vi') return 'Vừa xong';
      if (lang === 'ja') return 'たった今';
      if (lang === 'fr') return 'À l\'instant';
      return 'Just now';
    }

    if (diffHour < 1) {
      if (lang === 'vi') return `${diffMin} phút trước`;
      if (lang === 'ja') return `${diffMin}分前`;
      if (lang === 'fr') return `Il y a ${diffMin} min`;
      return `${diffMin}m ago`;
    }

    if (diffDay < 1) {
      if (lang === 'vi') return `${diffHour} giờ trước`;
      if (lang === 'ja') return `${diffHour}時間前`;
      if (lang === 'fr') return `Il y a ${diffHour} h`;
      return `${diffHour}h ago`;
    }

    if (diffDay < 30) {
      if (lang === 'vi') return `${diffDay} ngày trước`;
      if (lang === 'ja') return `${diffDay}日前`;
      if (lang === 'fr') return `Il y a ${diffDay} j`;
      return `${diffDay}d ago`;
    }

    return date.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
