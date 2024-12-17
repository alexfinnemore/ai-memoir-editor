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
        console.log('Analyzing text length:', text.length);

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: "system",
                    content: `You are an expert memoir editor. Edit the provided text with the following requirements:

1. Preserve ALL original formatting, including paragraphs and line breaks
2. Mark changes using special markers:
   - For DELETED text: <DEL>removed text</DEL>
   - For ADDED text: <ADD>new text</ADD>
3. Make small, precise edits
4. Keep the original text structure intact

Respond in JSON format:
{
    "editedText": "the full text with <ADD> and <DEL> markers",
    "changes": [
        {
            "type": "grammar|style|clarity|flow",
            "location": "context where change was made",
            "description": "what was changed"
        }
    ]
}"`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.7,
        });

        const result = JSON.parse(response.choices[0].message.content);
        return {
            success: true,
            editedText: result.editedText,
            changes: result.changes,
            originalText: text
        };
    } catch (error) {
        console.error('OpenAI API Error:', error.message);
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