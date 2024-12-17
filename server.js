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
                    type: 'addition',
                    text: part.value,
                    context: `...${diff[index - 1]?.value.slice(-20) || ''} [ADDED TEXT] ${diff[index + 1]?.value.slice(0, 20) || ''}`
                });
            }
            if (part.removed) {
                changes.push({
                    type: 'deletion',
                    text: part.value,
                    context: `...${diff[index - 1]?.value.slice(-20) || ''} [REMOVED TEXT] ${diff[index + 1]?.value.slice(0, 20) || ''}`
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
        // Get OpenAI's edits
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: "system",
                    content: `You are an expert memoir editor. Edit the provided text and list your changes in this exact JSON format:
{
    "editedText": "your edited version of the text",
    "changes": [
        {
            "type": "technical",
            "before": "original text",
            "after": "changed text",
            "explanation": "why this change was made"
        }
    ]
}`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.7
        });

        // Parse the response, with error handling
        let result;
        try {
            result = JSON.parse(response.choices[0].message.content);
            // Ensure changes array exists
            if (!Array.isArray(result.changes)) {
                result.changes = [];
            }
        } catch (parseError) {
            console.error('Parse error:', parseError);
            result = { editedText: text, changes: [] };
        }

        // Get diff-based changes
        const actualChanges = findActualChanges(text, result.editedText);

        console.log('AI Changes:', result.changes);
        console.log('Actual Changes:', actualChanges);

        return {
            success: true,
            editedText: result.editedText || text,
            aiReportedChanges: result.changes || [],
            actualChanges: actualChanges,
            stats: {
                aiReportedChangeCount: (result.changes || []).length,
                actualChangeCount: actualChanges.length
            }
        };
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return {
            success: false,
            error: `Analysis failed: ${error.message}`,
            aiReportedChanges: [],
            actualChanges: [],
            stats: {
                aiReportedChangeCount: 0,
                actualChangeCount: 0
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
                    aiReportedChanges: [],
                    actualChanges: [],
                    stats: {
                        aiReportedChangeCount: 0,
                        actualChangeCount: 0
                    }
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