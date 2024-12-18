require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

function sanitizeJson(str) {
    // Remove control characters and escape sequences
    return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}

async function analyzeText(text) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: "system",
                    content: `You are an expert memoir editor. Analyze and edit the provided text.

PROVIDE YOUR RESPONSE AS A VALID JSON OBJECT with this exact structure:
{
    "editedText": "the complete edited text",
    "changes": [
        {
            "type": "grammar|style|spelling",
            "before": "original text snippet",
            "after": "edited text snippet"
        }
    ]
}

Rules:
1. Keep all formatting (line breaks, paragraphs) exactly as in the original
2. Mark EACH individual change (grammar, spelling, style)
3. NO line breaks or special characters in the json values
4. Keep change snippets short and specific`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.7
        });

        // Clean the response and parse JSON
        const cleanResponse = sanitizeJson(response.choices[0].message.content);
        console.log('Cleaned response:', cleanResponse);
        
        const result = JSON.parse(cleanResponse);
        console.log('Parsed result:', result);

        return {
            success: true,
            editedText: result.editedText,
            aiChanges: result.changes,
            diffChanges: [],
            stats: {
                aiChangeCount: result.changes.length,
                diffChangeCount: 0
            }
        };
    } catch (error) {
        console.error('OpenAI API Error:', error);
        console.error('Full error:', error);
        return {
            success: false,
            error: `Analysis failed: ${error.message}`,
            aiChanges: [],
            diffChanges: [],
            stats: {
                aiChangeCount: 0,
                diffChangeCount: 0
            }
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
                    error: 'Server error: ' + error.message,
                    aiChanges: [],
                    diffChanges: [],
                    stats: { aiChangeCount: 0, diffChangeCount: 0 }
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