import { Request, Response, RequestHandler } from 'express';
import { UrlService } from '../services/urlService';

const urlService = new UrlService();

export const shortenUrl: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { originalUrl } = req.body;
    if (!originalUrl) {
      res.status(400).json({ error: 'Original URL is required' });
      return;
    }
    const shortUrl = await urlService.shortenUrl(originalUrl, process.env.BASE_URL!);
    res.status(201).json({ shortUrl });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const redirectUrl: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;
    const originalUrl = await urlService.getOriginalUrl(shortCode);
    if (!originalUrl) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }
    res.redirect(originalUrl);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};