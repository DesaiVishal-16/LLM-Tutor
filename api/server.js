
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// BASIC AUTHENTICATION
const authMiddleware = (req, res, next) => {
    
    if (req.path === '/api/health') return next();

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="LLM Tutor Area"');
        return res.status(401).send('Authentication required');
    }

    // Decode "Basic base64(user:pass)"
    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const user = auth[0];
    const pass = auth[1];

    // Check credentials (default: admin / password)
    const validUser = process.env.AUTH_USER;
    const validPass = process.env.AUTH_PASS;

    if (user === validUser && pass === validPass) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="LLM Tutor Area"');
        return res.status(401).send('Access denied');
    }
};

app.use(authMiddleware);
app.use(express.static(path.join(__dirname, '..', 'public'))); // Serve frontend files


// PROMPT GENERATION LOGIC
// Generate mode-specific instructions
function getModeInstruction(mode) {
    const instructions = {
        explain: "Explain the concept clearly with examples using your general knowledge. Be thorough but concise.",
        quiz: "Conduct a multiple-choice quiz based on your general knowledge of the topic. \n1. Ask ONE question at a time with 4 options (A, B, C, D).\n2. When the student answers, start with 'Correct!' or 'Incorrect!' followed by a brief explanation.\n3. ONLY AFTER the explanation, ask the NEXT question.\n4. Number your questions (e.g., Question 1, Question 2).\n5. Continue asking questions indefinitely until the student explicitly says 'stop'.\n6. If the student asks for a 'new quiz', 'restart', or 'start over', start a fresh quiz from Question 1.\n7. If the student says 'end quiz', 'stop', or 'quit', conclude the quiz.",
        simplify: "Explain the concept in very simple words like teaching a beginner or child using your general knowledge. Use analogies and everyday examples."
    };
    
    return instructions[mode];
}

// Build the complete prompt for the LLM
function buildPrompt(userMessage, mode, language = 'English', history = [], topic = '') {
    const modeInstruction = getModeInstruction(mode);
    
    // Language instruction
    const languageInstruction = language !== 'English' 
        ? `IMPORTANT: You MUST provide your entire response in ${language}. Translate the explanation/questions/feedback into ${language}.`
        : "";
    
    // Format history
    let historyText = "";
    if (history.length > 0) {
        historyText = "\nCONVERSATION HISTORY:\n" + history.map(msg => {
            const role = msg.role === 'user' ? 'Student' : 'Tutor';
            return `${role}: ${msg.content}`;
        }).join("\n") + "\n";
    }
    
    const notesContext = `TOPIC: ${topic}\n\nINSTRUCTION: Use your general knowledge to teach the student about ${topic}.`;

    // Structure: System context + Notes + Mode instruction + History + User message
    const prompt = `You are a helpful AI tutor. Your role is to teach students about ${topic}.
${languageInstruction}

${notesContext}

INSTRUCTIONS:
${modeInstruction}

${historyText}
Student's message: ${userMessage}`;

    return prompt;
}

// OPENAI API CALL WITH TIMEOUT
// Call OpenAI-compatible chat API with timeout
async function callOpenAI(prompt, mode) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Check if API key is set
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    const apiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased timeout to 60 seconds
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI tutor.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000 // Increased token limit
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        
        // Extract the AI's reply
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        } else {
            throw new Error('Unexpected response format from OpenAI API');
        }
        
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error calling OpenAI:', error.message);
        
        // If timeout or API error, throw to the caller
        throw error;
    }
}


// API ENDPOINTS

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'LLM Tutor API is running' });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, mode, language, history, topic } = req.body;
        
        // Validate request
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                error: 'Message is required and must be a string' 
            });
        }
        
        if (!mode || !['explain', 'quiz', 'simplify'].includes(mode)) {
            return res.status(400).json({ 
                error: 'Mode must be one of: explain, quiz, simplify' 
            });
        }

        const supportedLanguages = ['English', 'Hindi', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Gujarati'];
        if (language && !supportedLanguages.includes(language)) {
            return res.status(400).json({ 
                error: `Language must be one of: ${supportedLanguages.join(', ')}` 
            });
        }
        
        console.log(`[${new Date().toISOString()}] Chat request - Mode: ${mode}`);
        
        // Call OpenAI
        let aiReply;
        if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your-api-key')) {
            const fullPrompt = buildPrompt(message, mode, language, history, topic);
            aiReply = await callOpenAI(fullPrompt, mode);
        } else {
            throw new Error('No valid API key configured');
        }
        
        // Send response back to frontend
        res.json({ reply: aiReply });
        
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ 
            error: 'Failed to generate response',
            details: error.message 
        });
    }
});

// ERROR HANDLING
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

module.exports = app;
