import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import urlRoutes from './routes/url.routes';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', urlRoutes);

// Home route - Página HTML simples
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Encurtador de URL</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
        }
        h1 {
          color: #333;
          text-align: center;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input[type="url"] {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        button {
          background-color: #4CAF50;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: #45a049;
        }
        #result {
          margin-top: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          display: none;
        }
        #urlList {
          margin-top: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
    </head>
    <body>
      <h1>Encurtador de URL</h1>
      
      <div class="form-group">
        <label for="longUrl">URL para encurtar:</label>
        <input type="url" id="longUrl" placeholder="https://exemplo.com/pagina-muito-longa" required>
      </div>
      
      <button onclick="encurtarUrl()">Encurtar URL</button>
      
      <div id="result">
        <h3>URL Encurtada:</h3>
        <p id="shortUrl"></p>
        <button onclick="copiarUrl()">Copiar</button>
      </div>
      
      <div id="urlList">
        <h2>URLs Recentes</h2>
        <table>
          <thead>
            <tr>
              <th>URL Original</th>
              <th>URL Curta</th>
              <th>Cliques</th>
              <th>Data de Criação</th>
            </tr>
          </thead>
          <tbody id="urlTableBody">
            <!-- URLs serão adicionadas aqui via JavaScript -->
          </tbody>
        </table>
      </div>
      
      <script>
        // Carregar URLs ao iniciar a página
        document.addEventListener('DOMContentLoaded', carregarUrls);
        
        function encurtarUrl() {
          const longUrl = document.getElementById('longUrl').value;
          
          if (!longUrl) {
            alert('Por favor, insira uma URL válida');
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
            document.getElementById('shortUrl').textContent = data.shortUrl;
            document.getElementById('result').style.display = 'block';
            document.getElementById('longUrl').value = '';
            
            // Recarregar a lista de URLs
            carregarUrls();
          })
          .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao encurtar URL. Verifique se a URL é válida.');
          });
        }
        
        function copiarUrl() {
          const shortUrl = document.getElementById('shortUrl').textContent;
          navigator.clipboard.writeText(shortUrl)
            .then(() => {
              alert('URL copiada para a área de transferência!');
            })
            .catch(err => {
              console.error('Erro ao copiar:', err);
            });
        }
        
        function carregarUrls() {
          fetch('/api/list')
            .then(response => response.json())
            .then(urls => {
              const tableBody = document.getElementById('urlTableBody');
              tableBody.innerHTML = '';
              
              urls.forEach(url => {
                const row = document.createElement('tr');
                
                // URL Original (truncada se for muito longa)
                const originalCell = document.createElement('td');
                const originalText = url.longUrl.length > 50 
                  ? url.longUrl.substring(0, 50) + '...' 
                  : url.longUrl;
                originalCell.textContent = originalText;
                originalCell.title = url.longUrl; // Mostra URL completa ao passar o mouse
                
                // URL Curta (com link)
                const shortCell = document.createElement('td');
                const link = document.createElement('a');
                link.href = url.shortUrl;
                link.textContent = url.shortUrl;
                link.target = '_blank';
                shortCell.appendChild(link);
                
                // Cliques
                const clicksCell = document.createElement('td');
                clicksCell.textContent = url.clicks;
                
                // Data de criação
                const dateCell = document.createElement('td');
                const date = new Date(url.createdAt);
                dateCell.textContent = date.toLocaleString();
                
                row.appendChild(originalCell);
                row.appendChild(shortCell);
                row.appendChild(clicksCell);
                row.appendChild(dateCell);
                
                tableBody.appendChild(row);
              });
            })
            .catch(error => {
              console.error('Erro ao carregar URLs:', error);
            });
        }
      </script>
    </body>
    </html>
  `);
});

// Redirect route
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  
  try {
    const urlService = await import('./services/url.service');
    const url = await urlService.findUrlByShortCode(shortCode);
    
    if (url) {
      await urlService.incrementClicks(shortCode);
      return res.redirect(url.longUrl);
    }
    
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>URL não encontrada</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
          }
          h1 {
            color: #d9534f;
          }
          a {
            color: #0275d8;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <h1>URL não encontrada</h1>
        <p>A URL encurtada que você está tentando acessar não existe ou foi removida.</p>
        <p><a href="/">Voltar para a página inicial</a></p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Erro ao redirecionar:', error);
    return res.status(500).send('Erro interno do servidor');
  }
});

export default app;
