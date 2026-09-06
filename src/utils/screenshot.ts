import QRCode from 'qrcode';

/**
 * Maps each supported language code to its BCP 47 locale tag.
 */
export function getLocaleCode(lang: string = 'vi'): string {
  const LOCALES: Record<string, string> = {
    vi: 'vi-VN',
    en: 'en-US',
    th: 'th-TH',
    my: 'my-MM',
    lo: 'lo-LA',
    km: 'km-KH',
    id: 'id-ID',
    ms: 'ms-MY',
    tl: 'fil-PH',
    tet: 'tet-TL',
  };
  return LOCALES[lang] || 'en-US';
}

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
 * Relative time formatter with language support (Tiếng Việt + 10 ngôn ngữ)
 */
export function formatTimeAgo(isoString: string, lang: string = 'vi'): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    const REL: Record<string, { now: string; min: string; hour: string; day: string }> = {
      vi: { now: 'Vừa xong', min: '{n} phút trước', hour: '{n} giờ trước', day: '{n} ngày trước' },
      en: { now: 'Just now', min: '{n}m ago', hour: '{n}h ago', day: '{n}d ago' },
      th: { now: 'เมื่อสักครู่', min: '{n} นาทีที่แล้ว', hour: '{n} ชั่วโมงที่แล้ว', day: '{n} วันที่แล้ว' },
      my: { now: 'ယခုလေးတင်', min: '{n} မိနစ်အကြာ', hour: '{n} နာရီအကြာ', day: '{n} ရက်အကြာ' },
      lo: { now: 'ຫາກໍ່ເອງ', min: '{n} ນາທີກ່ອນ', hour: '{n} ຊົ່ວໂມງກ່ອນ', day: '{n} ມື້ກ່ອນ' },
      km: { now: 'ទើបតែឥឡូវ', min: '{n} នាទីមុន', hour: '{n} ម៉ោងមុន', day: '{n} ថ្ងៃមុន' },
      id: { now: 'Baru saja', min: '{n} menit yang lalu', hour: '{n} jam yang lalu', day: '{n} hari yang lalu' },
      ms: { now: 'Baru sahaja', min: '{n} minit yang lalu', hour: '{n} jam yang lalu', day: '{n} hari yang lalu' },
      tl: { now: 'Kakalipas lang', min: '{n} minuto ang nakalipas', hour: '{n} oras ang nakalipas', day: '{n} araw ang nakalipas' },
      tet: { now: 'Foin daudaun', min: '{n} minutu liubá', hour: '{n} oras liubá', day: '{n} loron liubá' },
    };

    const fmt = REL[lang] || REL.en;
    const fill = (tpl: string, n: number) => tpl.replace('{n}', String(n));

    if (diffMin < 1) return fmt.now;
    if (diffHour < 1) return fill(fmt.min, diffMin);
    if (diffDay < 1) return fill(fmt.hour, diffHour);
    if (diffDay < 30) return fill(fmt.day, diffDay);

    return date.toLocaleDateString(getLocaleCode(lang), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
