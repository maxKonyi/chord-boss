// Simple HTTP server to serve the built Chord Boss app
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || process.argv[2]) || 8080;
const WEB_ROOT = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
};

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.url}`);
  
  const requestPath = decodeURIComponent(req.url.split('?')[0]);
  const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const filePath = path.normalize(path.join(WEB_ROOT, relativePath));

  if (filePath !== WEB_ROOT && !filePath.startsWith(WEB_ROOT + path.sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(WEB_ROOT, 'index.html'), (indexErr, indexContent) => {
          if (indexErr) {
            res.writeHead(503, { 'Content-Type': 'text/plain' });
            res.end('Build output not found. Run npm run build before starting this server.');
            return;
          }

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexContent);
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Press Ctrl+C to stop the server`);
});
