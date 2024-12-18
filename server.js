require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

function serveStaticFile(res, filename) {
    const filePath = path.join(__dirname, filename);
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end(`Error loading ${filename}`);
            return;
        }

        const ext = path.extname(filename);
        const contentType = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css'
        }[ext] || 'text/plain';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}

function isActualChange(before, after) {
    return before.trim() !== after.trim();
}

function sanitizeJsonString(str) {
    // Remove control characters
    return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}

async function analyzeText(text) {
    try {
        console.log('Analyzing text:', text.substring(0, 100) + '...');

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: "system",
                    content: `You are an expert memoir editor. Analyze and improve the provided text with these specific goals:

1. Fix any grammar, spelling, or punctuation errors
2. Improve style and clarity
3. Enhance emotional impact and readability

Rules:
1. Make CONCRETE changes that improve the text
2. Only include changes where the 'after' text is different from the 'before' text
3. Maintain the author's voice and key details
4. Make substantial edits to improve the text
5. For each change, the 'before' text must be an exact match of text in the original
6. Return clean JSON without any control characters

Respond in JSON format:
{
    "editedText": "the complete edited text",
    "changes": [
        {
            "type": "style",
            "before": "exact original text that was changed",
            "after": "exact new text that replaced it",
            "explanation": "specific reason for this change"
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
            max_tokens: 2000
        });

        console.log('Raw GPT response received');
        // Sanitize the JSON string before parsing
        const sanitizedResponse = sanitizeJsonString(response.choices[0].message.content);
        console.log('Sanitized response');
        
        const result = JSON.parse(sanitizedResponse);
        console.log('Successfully parsed JSON');
        
        // Filter out non-changes
        const realChanges = result.changes.filter(change => 
            isActualChange(change.before, change.after)
        );
        
        console.log(`Found ${realChanges.length} real changes`);

        return {
            success: true,
            editedText: result.editedText,
            aiChanges: realChanges,
            originalText: text,
            stats: {
                aiChangeCount: realChanges.length
            }
        };
    } catch (error) {
        console.error('OpenAI API Error:', error);
        console.error('Full error:', error);
        return {
            success: false,
            error: `Analysis failed: ${error.message}`,
            aiChanges: [],
            stats: { aiChangeCount: 0 }
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

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname === '/' && req.method === 'GET') {
        serveStaticFile(res, 'index.html');
    }
    else if (pathname === '/script.js' && req.method === 'GET') {
        serveStaticFile(res, 'script.js');
    }
    else if (pathname === '/analyze' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                console.log('Received POST request to /analyze');
                const { text } = JSON.parse(body);
                console.log('Received text:', text.substring(0, 100) + '...');
                
                const result = await analyzeText(text);
                console.log('Analysis complete');
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                console.error('Server error:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ 
                    success: false, 
                    error: 'Server error: ' + error.message,
                    aiChanges: [],
                    stats: { aiChangeCount: 0 }
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