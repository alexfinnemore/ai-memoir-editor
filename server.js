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
        console.log('Using API key:', process.env.OPENAI_API_KEY ? 'Key present' : 'No key found');

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are an expert memoir editor. Analyze the provided text and provide feedback in the following format:

GRAMMAR AND SPELLING:
[List any grammar or spelling issues]

STYLE SUGGESTIONS:
[Provide style improvement suggestions]

ENGAGEMENT:
[Assess how engaging the content is and suggest improvements]

CONTENT STRUCTURE:
[Suggest any parts that could be removed, expanded, or restructured]`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.7,
        });

        console.log('OpenAI API Response received');
        return {
            success: true,
            analysis: response.choices[0].message.content
        };
    } catch (error) {
        console.error('OpenAI API Error:', error.message);
        console.error('Error details:', error);
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
                console.log('Text to analyze:', text.substring(0, 100) + '...');
                
                const analysis = await analyzeText(text);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(analysis));
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
    console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
});