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
                    content: `You are an expert memoir editor. Your task is to improve the provided text while marking specific changes.

Rules for marking changes:
1. For each edit, wrap deletions in [-deleted text-] and additions in [+added text+]
2. Make changes at the word and phrase level, not entire sentences
3. Preserve line breaks and paragraphing from the original text
4. Keep all original paragraph breaks

For each change, provide a specific explanation of:
1. What exact text was changed
2. Why it was changed
3. How it improves the text

Respond in this JSON format:
{
    "editedText": "text with [-deleted-] and [+added+] markers",
    "changes": [
        {
            "type": "grammar|style|clarity|flow",
            "location": "exact text before change",
            "change": "what was changed",
            "reason": "specific reason for this change"
        }
    ]
}

Be very specific in change descriptions. Instead of "Improved clarity", say exactly what was unclear and how you fixed it.`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.7,
        });

        // Parse the response as JSON
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
    // Set CORS headers
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
                console.log('Received analysis request');
                const { text } = JSON.parse(body);
                console.log('Text to analyze:', text.substring(0, 100) + '...');
                
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
});}