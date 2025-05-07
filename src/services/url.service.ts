import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export const createShortUrl = async (longUrl: string): Promise<any> => {
  try {
    const shortCode = nanoid(8); // Gera um código curto de 8 caracteres
    
    const newUrl = await prisma.url.create({
      data: {
        longUrl,
        shortCode,
      },
    });
    
    return {
      shortCode: newUrl.shortCode,
      longUrl: newUrl.longUrl,
      shortUrl: `${process.env.BASE_URL}/${newUrl.shortCode}`,
    };
  } catch (error) {
    console.error('Erro ao criar URL curta:', error);
    throw error;
  }
};

export const findUrlByShortCode = async (shortCode: string) => {
  try {
    return await prisma.url.findUnique({
      where: {
        shortCode,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar URL:', error);
    throw error;
  }
};

export const incrementClicks = async (shortCode: string) => {
  try {
    return await prisma.url.update({
      where: {
        shortCode,
      },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao incrementar cliques:', error);
    throw error;
  }
};

export const getUrlStats = async (shortCode: string) => {
  try {
    return await prisma.url.findUnique({
      where: {
        shortCode,
      },
      select: {
        shortCode: true,
        longUrl: true,
        clicks: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    throw error;
  }
};

export const getAllUrls = async () => {
  try {
    return await prisma.url.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        shortCode: true,
        longUrl: true,
        clicks: true,
        createdAt: true,
      }
    });
  } catch (error) {
    console.error('Erro ao listar URLs:', error);
    throw error;
  }
};
