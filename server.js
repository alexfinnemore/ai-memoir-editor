require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const Diff = require('diff');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

function findActualChanges(oldText, newText) {
    try {
        const changes = [];
        const diff = Diff.diffWords(oldText, newText);

        diff.forEach((part, index) => {
            if (part.added) {
                changes.push({
                    type: 'Addition',
                    text: part.value,
                    context: `...${diff[index - 1]?.value.slice(-20) || ''} → ${part.value} → ${diff[index + 1]?.value.slice(0, 20) || ''}`
                });
            }
            if (part.removed) {
                changes.push({
                    type: 'Deletion',
                    text: part.value,
                    context: `...${diff[index - 1]?.value.slice(-20) || ''} → ${part.value} → ${diff[index + 1]?.value.slice(0, 20) || ''}`
                });
            }
        });

        return changes;
    } catch (error) {
        console.error('Diff error:', error);
        return [];
    }
}

async function analyzeText(text) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: "system",
                    content: `You are an expert memoir editor. Analyze and edit the provided text. Return your response in this exact JSON format:
{
    "editedText": "the complete edited text",
    "changes": [
        {
            "type": "Grammar",
            "description": "describe what was changed and why",
            "before": "the exact original text",
            "after": "the exact edited text"
        }
    ]
}

Important rules:
1. Preserve ALL line breaks exactly
2. List EVERY change you make
3. Do NOT summarize or explain outside the JSON
4. Make changes for grammar, style, clarity and emotional impact
5. Keep all original content and meaning intact`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.7
        });

        console.log('Raw GPT Response:', response.choices[0].message.content);

        const result = JSON.parse(response.choices[0].message.content);
        const actualChanges = findActualChanges(text, result.editedText);

        console.log('Parsed changes:', result.changes);
        console.log('Actual changes:', actualChanges);

        return {
            success: true,
            editedText: result.editedText,
            aiChanges: result.changes || [],
            diffChanges: actualChanges,
            stats: {
                aiChangeCount: (result.changes || []).length,
                diffChangeCount: actualChanges.length
            }
        };
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return {
            success: false,
            error: `Analysis failed: ${error.message}`,
            aiChanges: [],
            diffChanges: [],
            stats: { aiChangeCount: 0, diffChangeCount: 0 }
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
                console.log('Final result:', result);
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