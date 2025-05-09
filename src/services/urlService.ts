import Url from '../models/url';
import { generateShortCode } from '../utils/shortId';

export class UrlService {
  async shortenUrl(originalUrl: string, baseUrl: string): Promise<string> {
    const shortCode = generateShortCode();
    await Url.create({ originalUrl, shortCode });
    return `${baseUrl}/${shortCode}`;
  }

  async getOriginalUrl(shortCode: string): Promise<string | null> {
    const url = await Url.findOne({ where: { shortCode } });
    return url ? url.originalUrl : null;
  }
}