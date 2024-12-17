require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function analyzeText(text) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: "system",
                    content: `You are an expert memoir editor. Edit the provided text following these STRICT rules:

1. Preserve ALL line breaks exactly as in the original
2. ONLY mark spelling, grammar, and punctuation errors using:
   <ERR>error</ERR><FIX>correction</FIX>
3. Make other improvements directly without marking them
4. For EACH change provide detailed explanation

Respouse must be valid JSON in this exact format:
{
    "editedText": "text with preserved line breaks and marked errors",
    "changes": [
        {
            "type": "technical",
            "before": "exact error text",
            "after": "exact correction",
            "explanation": "specific rule or reason"
        },
        {
            "type": "style",
            "before": "original phrase",
            "after": "improved phrase",
            "explanation": "specific improvement made"
        }
    ]
}`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.7,
        });

        console.log('Raw response:', response.choices[0].message.content);
        const result = JSON.parse(response.choices[0].message.content);
        return {
            success: true,
            editedText: result.editedText,
            changes: result.changes,
            originalText: text
        };
    } catch (error) {
        console.error('OpenAI API Error:', error.message);
        console.error('Full error:', error);
        return {
            success: false,
            error: `Analysis failed: ${error.message}`
        };
    }
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

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
    else if (req.url === '/analyze' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const { text } = JSON.parse(body);
                const result = await analyzeText(text);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                console.error('Server error:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ 
                    success: false, 
                    error: 'Server error: ' + error.message 
                }));
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