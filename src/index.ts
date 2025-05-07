import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Função para tentar portas alternativas se a porta estiver em uso
const startServer = (port: number) => {
  app.listen(port)
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
