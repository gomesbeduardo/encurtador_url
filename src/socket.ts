import { Server } from 'socket.io';
import http from 'http';

// Função para inicializar o Socket.io
export const initializeSocketIO = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Eventos do Socket.io
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  return io;
};

// Singleton para armazenar a instância do Socket.io
let ioInstance: Server | null = null;

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io não foi inicializado');
  }
  return ioInstance;
};

export const setIO = (io: Server) => {
  ioInstance = io;
};