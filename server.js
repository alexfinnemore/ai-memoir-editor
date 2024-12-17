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

function findChanges(oldText, newText) {
    // Split into lines for detailed comparison
    const changes = [];
    const diff = Diff.diffWords(oldText, newText);

    diff.forEach(part => {
        if (part.added) {
            changes.push({
                type: 'addition',
                text: part.value,
                location: 'Added text'
            });
        }
        if (part.removed) {
            changes.push({
                type: 'deletion',
                text: part.value,
                location: 'Removed text'
            });
        }
    });

    return changes;
}

async function analyzeText(text) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: "system",
                    content: `You are an expert memoir editor. Edit the provided text following these rules:

1. Improve both technical correctness and style
2. Preserve ALL line breaks and formatting exactly as in the original
3. For EACH individual change, provide these details:
   - The exact text before the change
   - The exact text after the change
   - Whether it's a technical fix (spelling/grammar/punctuation) or style improvement
   - A clear explanation of why the change improves the text

Respond in this format:
{
    "editedText": "the improved text with preserved formatting",
    "changes": [
        {
            "type": "technical|style",
            "before": "exact original text",
            "after": "exact changed text",
            "explanation": "specific explanation of what was changed and why"
        }
    ]
}

List ALL changes made, no matter how small.`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        const result = JSON.parse(response.choices[0].message.content);
        
        // Add our own diff analysis
        const actualChanges = findChanges(text, result.editedText);

        return {
            success: true,
            editedText: result.editedText,
            aiReportedChanges: result.changes,
            actualChanges: actualChanges,
            originalText: text,
            stats: {
                aiReportedChangeCount: result.changes.length,
                actualChangeCount: actualChanges.length
            }
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