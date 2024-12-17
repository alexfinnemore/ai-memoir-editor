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
                    content: `You are an expert memoir editor. Your task is to improve the text while clearly marking technical corrections.

Editing Instructions:
1. Improve style, emotional impact, and overall writing quality
2. Fix all technical errors (spelling, grammar, punctuation)
3. Maintain the exact same line breaks and paragraph structure
4. For technical corrections ONLY (spelling/grammar/punctuation), mark them with:
   - <ERR>incorrect text</ERR>
   - <FIX>corrected text</FIX>
5. Make other style improvements directly in the text WITHOUT marking them

For EACH change, provide detailed information in this format:
{
    "editedText": "improved text with marked technical corrections",
    "changes": [
        {
            "type": "technical",
            "originalText": "exact original text",
            "newText": "exact new text",
            "reason": "Detailed explanation of why this needed fixing and how it improves the text",
            "rule": "The specific grammar/spelling/punctuation rule that applies"
        },
        {
            "type": "style",
            "originalText": "exact original phrase or sentence",
            "newText": "exact new phrase or sentence",
            "improvement": "Specific explanation of how this change enhances the writing",
            "impact": "How this change affects the reader's experience"
        }
    ]
}

Example of a good change description:
Technical: "Original 'I seen him' was grammatically incorrect. Changed to 'I saw him' to use correct past tense form. Rule: 'See' is irregular - past tense is 'saw' not 'seen'."

Style: "Original 'He walked into the room' was bland. Changed to 'He strode purposefully into the room' to better convey character's confidence and intention. Impact: Helps reader visualize the character's presence and personality."`
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