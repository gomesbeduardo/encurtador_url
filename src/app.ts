import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import urlRoutes from "./routes/url.routes";
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as urlService from './services/url.service';
import * as socketService from './services/socket.service';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Inicializar Socket.io
socketService.initialize(io);

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", urlRoutes);

// Rota para redirecionar URLs curtas
app.get("/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const url = await urlService.getUrlByShortCode(shortCode);
    
    if (!url) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>URL não encontrada</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        </head>
        <body class="bg-gray-50 min-h-screen flex items-center justify-center">
          <div class="text-center p-8 max-w-md">
            <div class="text-indigo-600 text-6xl mb-4">
              <i class="fas fa-link-slash"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">URL não encontrada</h1>
            <p class="text-gray-600 mb-6">A URL encurtada que você está procurando não existe ou foi removida.</p>
            <a href="/" class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <i class="fas fa-home mr-2"></i> Voltar para a página inicial
            </a>
          </div>
        </body>
        </html>
      `);
    }
    
    // Incrementar contador de cliques
    await urlService.incrementClicks(shortCode);
    
    // Redirecionar para a URL original
    return res.redirect(url.longUrl);
  } catch (error) {
    console.error("Erro ao redirecionar:", error);
    return res.status(500).send("Erro ao redirecionar");
  }
});

// Home route - Página HTML com Tailwind CSS e Socket.io
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Encurtador de URL</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <script src="/socket.io/socket.io.js"></script>
    </head>
    <body class="bg-gray-50 min-h-screen">
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        <header class="mb-10">
          <h1 class="text-3xl font-bold text-center text-indigo-600">
            <i class="fas fa-link mr-2"></i>Encurtador de URL
          </h1>
          <p class="text-center text-gray-600 mt-2">Crie URLs curtas e fáceis de compartilhar</p>
          <div id="connectionStatus" class="text-center mt-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <span id="statusDot" class="h-2 w-2 rounded-full bg-gray-400 mr-1.5"></span>
              <span id="statusText">Conectando...</span>
            </span>
          </div>
        </header>
        
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <div class="mb-4">
            <label for="longUrl" class="block text-sm font-medium text-gray-700 mb-2">URL para encurtar:</label>
            <div class="flex">
              <input 
                type="url" 
                id="longUrl" 
                placeholder="https://exemplo.com/pagina-muito-longa" 
                class="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                required
              >
              <button 
                onclick="encurtarUrl()" 
                class="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Encurtar
              </button>
            </div>
          </div>
          
          <div id="result" class="hidden mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 class="text-lg font-medium text-gray-900 mb-2">URL Encurtada:</h3>
            <div class="flex items-center">
              <p id="shortUrl" class="flex-1 text-indigo-600 font-medium break-all"></p>
              <button 
                onclick="copiarUrl()" 
                class="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <i class="fas fa-copy mr-1"></i> Copiar
              </button>
            </div>
          </div>
        </div>
        
        <div id="urlList" class="bg-white rounded-lg shadow-md p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-800">URLs Recentes</h2>
            <div class="text-sm text-gray-500" id="urlCount"></div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL Original</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL Curta</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliques</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Criação</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody id="urlTableBody" class="bg-white divide-y divide-gray-200">
                <!-- URLs serão adicionadas aqui via JavaScript -->
              </tbody>
            </table>
          </div>
          
          <div id="emptyState" class="hidden text-center py-8">
            <i class="fas fa-link text-gray-300 text-5xl mb-3"></i>
            <p class="text-gray-500">Nenhuma URL encurtada ainda. Crie sua primeira URL acima!</p>
          </div>
        </div>
      </div>
      
      <!-- Toast de notificação -->
      <div id="toast" class="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg transform transition-transform duration-300 translate-y-20 opacity-0 flex items-center">
        <span id="toastMessage"></span>
      </div>
      
      <script>
        // Inicializar Socket.io
        const socket = io();
        let urlsData = [];
        
        // Gerenciar status da conexão
        socket.on('connect', () => {
          updateConnectionStatus(true);
          showToast('Conectado ao servidor', 'info');
        });
        
        socket.on('disconnect', () => {
          updateConnectionStatus(false);
          showToast('Desconectado do servidor', 'error');
        });
        
        function updateConnectionStatus(connected) {
          const statusDot = document.getElementById('statusDot');
          const statusText = document.getElementById('statusText');
          
          if (connected) {
            statusDot.classList.remove('bg-gray-400', 'bg-red-500');
            statusDot.classList.add('bg-green-500');
            statusText.textContent = 'Conectado';
          } else {
            statusDot.classList.remove('bg-gray-400', 'bg-green-500');
            statusDot.classList.add('bg-red-500');
            statusText.textContent = 'Desconectado';
          }
        }
        
        // Eventos de Socket.io para atualizações em tempo real
        socket.on('url:created', (url) => {
          console.log('URL criada:', url);
          // Verificar se a URL já existe na tabela
          if (!urlsData.some(item => item.shortCode === url.shortCode)) {
            urlsData.unshift(url); // Adicionar ao início do array
            renderUrlTable(); // Renderizar a tabela novamente
            showToast('Nova URL adicionada', 'info');
          }
        });
        
        socket.on('url:deleted', (data) => {
          console.log('URL excluída:', data);
          // Remover a URL do array
          urlsData = urlsData.filter(url => url.shortCode !== data.shortCode);
          renderUrlTable(); // Renderizar a tabela novamente
          showToast('URL removida', 'info');
        });
        
        socket.on('url:clicked', (url) => {
          console.log('URL clicada:', url);
          // Atualizar os cliques da URL
          const index = urlsData.findIndex(item => item.shortCode === url.shortCode);
          if (index !== -1) {
            urlsData[index].clicks = url.clicks;
            renderUrlTable(); // Renderizar a tabela novamente
            showToast(\`URL \${url.shortCode} foi clicada\`, 'info');
          }
        });
        
        // Carregar URLs ao iniciar a página
        document.addEventListener('DOMContentLoaded', carregarUrls);
        
        function showToast(message, type = 'success') {
          const toast = document.getElementById('toast');
          const toastMessage = document.getElementById('toastMessage');
          
          // Definir a cor com base no tipo
          if (type === 'success') {
            toast.classList.add('bg-green-600');
            toast.classList.remove('bg-red-600', 'bg-gray-800', 'bg-blue-600');
          } else if (type === 'error') {
            toast.classList.add('bg-red-600');
            toast.classList.remove('bg-green-600', 'bg-gray-800', 'bg-blue-600');
          } else if (type === 'info') {
            toast.classList.add('bg-blue-600');
            toast.classList.remove('bg-green-600', 'bg-red-600', 'bg-gray-800');
          } else {
            toast.classList.add('bg-gray-800');
            toast.classList.remove('bg-green-600', 'bg-red-600', 'bg-blue-600');
          }
          
          toastMessage.textContent = message;
          
          // Mostrar o toast
          toast.classList.remove('translate-y-20', 'opacity-0');
          toast.classList.add('translate-y-0', 'opacity-100');
          
          // Esconder o toast após 3 segundos
          setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-20', 'opacity-0');
          }, 3000);
        }
        
        function encurtarUrl() {
          const longUrl = document.getElementById('longUrl').value;
          
          if (!longUrl) {
            showToast('Por favor, insira uma URL válida', 'error');
            return;
          }
          
          fetch('/api/encurtar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ longUrl }),
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('Erro ao encurtar URL');
            }
            return response.json();
          })
          .then(data => {
            console.log('URL encurtada com sucesso:', data);
            document.getElementById('shortUrl').textContent = data.shortUrl;
            document.getElementById('result').classList.remove('hidden');
            document.getElementById('longUrl').value = '';
            
            showToast('URL encurtada com sucesso!', 'success');
            
            // A atualização da tabela será feita pelo evento socket.io
          })
          .catch(error => {
            console.error('Erro:', error);
            showToast('Erro ao encurtar URL. Verifique se a URL é válida.', 'error');
          });
        }
        
        function copiarUrl() {
          const shortUrl = document.getElementById('shortUrl').textContent;
          navigator.clipboard.writeText(shortUrl)
            .then(() => {
              showToast('URL copiada para a área de transferência!', 'success');
            })
            .catch(err => {
              console.error('Erro ao copiar:', err);
              showToast('Erro ao copiar URL', 'error');
            });
        }
        
        function excluirUrl(shortCode) {
          console.log('Tentando excluir URL com código:', shortCode);
          
          if (confirm('Tem certeza que deseja excluir esta URL?')) {
            fetch(\`/api/delete/\${shortCode}\`, {
              method: 'DELETE',
            })
            .then(response => {
              if (!response.ok) {
                throw new Error('Erro ao excluir URL');
              }
              return response.json();
            })
            .then(() => {
              showToast('URL excluída com sucesso!', 'success');
              // A atualização da tabela será feita pelo evento socket.io
            })
            .catch(error => {
              console.error('Erro:', error);
              showToast('Erro ao excluir URL.', 'error');
            });
          }
        }
        
        function carregarUrls() {
          fetch('/api/list')
            .then(response => response.json())
            .then(urls => {
              urlsData = urls;
              renderUrlTable();
            })
            .catch(error => {
              console.error('Erro ao carregar URLs:', error);
              showToast('Erro ao carregar URLs', 'error');
            });
        }
        
        function renderUrlTable() {
          const tableBody = document.getElementById('urlTableBody');
          const emptyState = document.getElementById('emptyState');
          const urlCount = document.getElementById('urlCount');
          
          tableBody.innerHTML = '';
          
          if (urlsData.length === 0) {
            emptyState.classList.remove('hidden');
            urlCount.textContent = '';
          } else {
            emptyState.classList.add('hidden');
            urlCount.textContent = \`\${urlsData.length} URL\${urlsData.length === 1 ? '' : 's'}\`;
            
            urlsData.forEach(url => {
              const row = document.createElement('tr');
              row.className = 'hover:bg-gray-50';
              
              // URL Original (truncada se for muito longa)
              const originalCell = document.createElement('td');
              originalCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
              const originalText = url.longUrl.length > 40 
                ? url.longUrl.substring(0, 40) + '...' 
                : url.longUrl;
              originalCell.textContent = originalText;
              originalCell.title = url.longUrl; // Mostra URL completa ao passar o mouse
              
              // URL Curta (com link)
              const shortCell = document.createElement('td');
              shortCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
              const link = document.createElement('a');
              link.href = url.shortUrl || \`\${window.location.origin}/\${url.shortCode}\`;
              link.textContent = url.shortUrl || \`\${window.location.origin}/\${url.shortCode}\`;
              link.className = 'text-indigo-600 hover:text-indigo-900';
              link.target = '_blank';
              shortCell.appendChild(link);
              
              // Cliques
              const clicksCell = document.createElement('td');
              clicksCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
              const clicksBadge = document.createElement('span');
              clicksBadge.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800';
              clicksBadge.textContent = url.clicks;
              clicksCell.appendChild(clicksBadge);
              
              // Data de criação
              const dateCell = document.createElement('td');
              dateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
              const date = new Date(url.createdAt);
              dateCell.textContent = date.toLocaleString();
              
              // Ações
              const actionsCell = document.createElement('td');
              actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
              
              const deleteButton = document.createElement('button');
              deleteButton.innerHTML = '<i class="fas fa-trash-alt mr-1"></i> Excluir';
              deleteButton.className = 'text-red-600 hover:text-red-900 focus:outline-none';

              
              // Importante: Usar uma função anônima para capturar o shortCode correto
              const currentShortCode = url.shortCode; // Capturar o shortCode atual
              deleteButton.addEventListener('click', function() {
                excluirUrl(currentShortCode);
              });
              
              actionsCell.appendChild(deleteButton);
              
              row.appendChild(originalCell);
              row.appendChild(shortCell);
              row.appendChild(clicksCell);
              row.appendChild(dateCell);
              row.appendChild(actionsCell);
              
              tableBody.appendChild(row);
            });
          }
        }
        
        // Permitir pressionar Enter para encurtar URL
        document.getElementById('longUrl').addEventListener('keypress', function(event) {
          if (event.key === 'Enter') {
            event.preventDefault();
            encurtarUrl();
          }
        });
      </script>
    </body>
    </html>
  `);
});

export default app;
