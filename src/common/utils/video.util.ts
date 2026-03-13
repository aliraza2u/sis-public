/**
 * Validates if a given string is a valid video URL from supported platforms.
 * Supported platforms: YouTube, Vimeo, Dailymotion, Wistia, Amazon S3, CloudFront.
 */
export function isValidVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const allowedDomains = [
      'youtube.com',
      'youtu.be',
      'vimeo.com',
      'dailymotion.com',
      'wistia.com',
      's3.amazonaws.com',
      'cloudfront.net',
    ];

    const hostname = urlObj.hostname.toLowerCase();
    return (
      allowedDomains.some((domain) => hostname.includes(domain)) || urlObj.protocol === 'https:'
    );
  } catch {
    return false;
  }
}

/**
 * Parses the video duration from a buffer using music-metadata.
 * Works without requiring FFmpeg binaries.
 */
export async function parseVideoDuration(
  buffer: Buffer,
  mimeType: string,
): Promise<number | undefined> {
  try {
    const mm = require('music-metadata');
    const metadata = await mm.parseBuffer(buffer, mimeType);
    if (metadata.format && metadata.format.duration) {
      return Math.round(metadata.format.duration); // Return duration in whole seconds
    }
  } catch (error) {
    console.warn('Failed to parse video duration from buffer:', error);
  }
  return undefined;
}
