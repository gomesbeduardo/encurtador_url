import { Server } from 'socket.io';

let io: Server;

// Inicializar o Socket.io
export const initialize = (socketIo: Server) => {
  io = socketIo;
  
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });
  
  console.log('Socket.io inicializado');
};

// Emitir evento quando uma URL é criada
export const emitUrlCreated = (url: any) => {
  if (io) {
    io.emit('url:created', url);
    console.log('Evento url:created emitido');
  } else {
    console.error('Socket.io não inicializado');
  }
};

// Emitir evento quando uma URL é excluída
export const emitUrlDeleted = (shortCode: string) => {
  if (io) {
    io.emit('url:deleted', { shortCode });
    console.log('Evento url:deleted emitido');
  } else {
    console.error('Socket.io não inicializado');
  }
};

// Emitir evento quando uma URL é clicada
export const emitUrlClicked = (url: any) => {
  if (io) {
    io.emit('url:clicked', url);
    console.log('Evento url:clicked emitido');
  } else {
    console.error('Socket.io não inicializado');
  }
};
