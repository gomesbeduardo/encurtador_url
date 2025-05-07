import { Request, Response } from 'express';
import * as urlService from '../services/url.service';

export const createShortUrl = async (req: Request, res: Response) => {
  try {
    const { longUrl } = req.body;
    
    if (!longUrl) {
      return res.status(400).json({ error: 'URL longa é obrigatória' });
    }
    
    // Validação simples de URL
    try {
      new URL(longUrl);
    } catch (error) {
      return res.status(400).json({ error: 'URL inválida' });
    }
    
    const result = await urlService.createShortUrl(longUrl);
    return res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar URL curta:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getUrlStats = async (req: Request, res: Response) => {
  try {
    const { shortCode } = req.params;
    
    const stats = await urlService.getUrlStats(shortCode);
    
    if (!stats) {
      return res.status(404).json({ error: 'URL não encontrada' });
    }
    
    return res.json({
      ...stats,
      shortUrl: `${process.env.BASE_URL}/${shortCode}`,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getAllUrls = async (req: Request, res: Response) => {
  try {
    const urls = await urlService.getAllUrls();
    
    const urlsWithShortUrl = urls.map(url => ({
      ...url,
      shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
    }));
    
    return res.json(urlsWithShortUrl);
  } catch (error) {
    console.error('Erro ao listar URLs:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deleteUrl = async (req: Request, res: Response) => {
  try {
    const { shortCode } = req.params;
    
    if (!shortCode) {
      return res.status(400).json({ error: 'Código curto não fornecido' });
    }
    
    const result = await urlService.deleteUrl(shortCode);
    
    if (!result) {
      return res.status(404).json({ error: 'URL não encontrada' });
    }
    
    return res.status(200).json({ message: 'URL excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir URL:', error);
    return res.status(500).json({ error: 'Erro ao excluir URL' });
  }
};