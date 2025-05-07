import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

// Criar uma URL curta
export const createShortUrl = async (longUrl: string) => {
  try {
    // Gerar um código curto único
    const shortCode = nanoid(6); // 6 caracteres
    
    // Criar a URL no banco de dados
    const url = await prisma.url.create({
      data: {
        longUrl,
        shortCode,
        clicks: 0,
      },
    });
    
    // Emitir evento de URL criada via Socket.io
    try {
      const socketService = await import('./socket.service');
      socketService.emitUrlCreated(url);
    } catch (socketError) {
      console.error('Erro ao emitir evento de criação:', socketError);
    }
    
    return url;
  } catch (error) {
    console.error('Erro ao criar URL curta:', error);
    throw error;
  }
};

// Obter todas as URLs
export const getAllUrls = async () => {
  try {
    return await prisma.url.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Erro ao obter URLs:', error);
    throw error;
  }
};

// Obter URL pelo código curto
export const getUrlByShortCode = async (shortCode: string) => {
  try {
    return await prisma.url.findUnique({
      where: {
        shortCode,
      },
    });
  } catch (error) {
    console.error('Erro ao obter URL pelo código curto:', error);
    throw error;
  }
};

// Incrementar contador de cliques
export const incrementClicks = async (shortCode: string) => {
  try {
    const url = await prisma.url.update({
      where: {
        shortCode,
      },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });
    
    // Emitir evento de URL clicada via Socket.io
    try {
      const socketService = await import('./socket.service');
      socketService.emitUrlClicked(url);
    } catch (socketError) {
      console.error('Erro ao emitir evento de clique:', socketError);
    }
    
    return url;
  } catch (error) {
    console.error('Erro ao incrementar cliques:', error);
    throw error;
  }
};

// Excluir URL
export const deleteUrl = async (shortCode: string) => {
  try {
    console.log('Tentando excluir URL com código:', shortCode);
    
    const result = await prisma.url.delete({
      where: {
        shortCode,
      },
    });
    
    console.log('URL excluída com sucesso:', result);
    
    // Emitir evento de URL excluída via Socket.io
    try {
      const socketService = await import('./socket.service');
      socketService.emitUrlDeleted(shortCode);
    } catch (socketError) {
      console.error('Erro ao emitir evento de exclusão:', socketError);
    }
    
    return result;
  } catch (error) {
    console.error('Erro ao excluir URL:', error);
    throw error;
  }
};

// Obter estatísticas de uma URL
export const getUrlStats = async (shortCode: string) => {
  try {
    const url = await prisma.url.findUnique({
      where: {
        shortCode,
      },
    });
    
    if (!url) {
      return null;
    }
    
    return {
      longUrl: url.longUrl,
      shortCode: url.shortCode,
      clicks: url.clicks,
      createdAt: url.createdAt,
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas da URL:', error);
    throw error;
  }
};
