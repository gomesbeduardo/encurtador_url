import { Router } from 'express';
import * as urlController from '../controllers/url.controller';

const router = Router();

// Rota para criar uma URL curta
router.post('/encurtar', urlController.createShortUrl);

// Rota para obter estatísticas de uma URL
router.get('/stats/:shortCode', urlController.getUrlStats);

// Rota para listar todas as URLs
router.get('/list', urlController.getAllUrls);

export default router;
