const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Serve the main HTML file
    if (req.url === '/' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        });
    }
    // Placeholder for manuscript analysis endpoint
    else if (req.url === '/analyze' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const manuscriptData = JSON.parse(body);
                // Placeholder AI analysis
                const suggestions = {
                    grammar: ['Consider revising this sentence...'],
                    style: ['This paragraph could be more engaging...'],
                    engagement: ['This section might benefit from more detail...'],
                };

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(suggestions));
            } catch (error) {
                res.writeHead(400);
                res.end('Invalid JSON');
            }
        });
    }
    else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});