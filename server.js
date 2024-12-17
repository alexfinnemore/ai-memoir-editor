require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

console.log('OpenAI API Key loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

async function analyzeText(text) {
    try {
        console.log('Analyzing text length:', text.length);
        
        const response = await openai.chat.completions.create({
            model: "gpt-4",  // Using standard GPT-4 model
            messages: [
                {
                    role: "system",
                    content: `As an expert memoir editor, analyze the following text and provide feedback in this JSON format:
                    {
                        "grammar": [list of grammar suggestions],
                        "style": [list of style improvements],
                        "engagement": [engagement improvement suggestions],
                        "structure": [structural suggestions]
                    }`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.7,
        });

        console.log('OpenAI response received');
        const analysis = response.choices[0].message.content;
        console.log('Analysis:', analysis);

        return {
            success: true,
            analysis: analysis
        };
    } catch (error) {
        console.error('Detailed OpenAI API Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to analyze text'
        };
    }
}

const server = http.createServer(async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS requests for CORS
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

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
    // Handle manuscript analysis endpoint
    else if (req.url === '/analyze' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                console.log('Received analysis request');
                const { text } = JSON.parse(body);
                console.log('Text received, length:', text.length);
                
                if (!text || text.trim().length === 0) {
                    throw new Error('No text provided');
                }

                const analysis = await analyzeText(text);
                console.log('Analysis completed:', analysis.success);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(analysis));
            } catch (error) {
                console.error('Server error:', error);
                res.writeHead(500);
                res.end(JSON.stringify({
                    success: false,
                    error: error.message || 'Server error'
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