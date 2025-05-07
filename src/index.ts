import app from './app';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Configurar Socket.io
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

// Função para tentar portas alternativas se a porta estiver em uso
const startServer = (port: number) => {
  server.listen(port)
    .on('listening', () => {
      console.log(`Servidor rodando na porta ${port}`);
      console.log(`Acesse: http://localhost:${port}`);
    })
    .on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`Porta ${port} em uso, tentando porta ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error('Erro ao iniciar servidor:', e);
      }
    });
};

startServer(Number(PORT));

// Exportar io para uso em outros arquivos
export { io };
