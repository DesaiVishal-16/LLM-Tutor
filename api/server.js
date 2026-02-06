
const express = require('express');
const cors = require('cors');
const path = require('path');
const litellm = require('litellm');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, '..', 'public')));

function getModeInstruction(mode) {
    const instructions = {
        explain: "Explain the concept clearly with examples using your general knowledge. Be thorough but concise.",
        quiz: "Conduct a multiple-choice quiz based on your general knowledge of the topic. \n1. Ask ONE question at a time with 4 options (A, B, C, D).\n2. When the student answers, start with 'Correct!' or 'Incorrect!' followed by a brief explanation.\n3. ONLY AFTER the explanation, ask the NEXT question.\n4. Number your questions (e.g., Question 1, Question 2).\n5. Continue asking questions indefinitely until the student explicitly says 'stop'.\n6. If the student asks for a 'new quiz', 'restart', or 'start over', start a fresh quiz from Question 1.\n7. If the student says 'end quiz', 'stop', or 'quit', conclude the quiz.",
        simplify: "Explain the concept in very simple words like teaching a beginner or child using your general knowledge. Use analogies and everyday examples."
    };
    
    return instructions[mode];
}

function buildPrompt(userMessage, mode, language = 'English', history = [], topic = '') {
    const modeInstruction = getModeInstruction(mode);
    
    const languageInstruction = language !== 'English' 
        ? `IMPORTANT: You MUST provide your entire response in ${language}. Translate the explanation/questions/feedback into ${language}.`
        : "";
    
    let historyText = "";
    if (history.length > 0) {
        historyText = "\nCONVERSATION HISTORY:\n" + history.map(msg => {
            const role = msg.role === 'user' ? 'Student' : 'Tutor';
            return `${role}: ${msg.content}`;
        }).join("\n") + "\n";
    }
    
    const notesContext = `TOPIC: ${topic}\n\nINSTRUCTION: Use your general knowledge to teach the student about ${topic}.`;

    const prompt = `You are a helpful AI tutor. Your role is to teach students about ${topic}.
${languageInstruction}

${notesContext}

INSTRUCTIONS:
${modeInstruction}

${historyText}
Student's message: ${userMessage}`;

    return prompt;
}

async function callLiteLLM(prompt) {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey || apiKey === 'your_huggingface_token_here') {
        throw new Error('HUGGINGFACE_API_KEY is not set in .env file');
    }
    
    const model = process.env.LITELLM_MODEL || 'moonshotai/Kimi-K2-Thinking';
    
    try {
        const response = await litellm.completion({
            model: model,
            api_key: apiKey,
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
            max_tokens: 2000
        });

        if (response.choices && response.choices.length > 0) {
            return response.choices[0].message.content;
        } else {
            throw new Error('Unexpected response format from LiteLLM');
        }
        
    } catch (error) {
        console.error('Error calling LiteLLM:', error.message);
        throw error;
    }
}

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'LLM Tutor API is running',
        model: process.env.LITELLM_MODEL || 'moonshotai/Kimi-K2-Thinking',
        provider: 'LiteLLM + Hugging Face'
    });
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, mode, language, history, topic } = req.body;
        
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
        
        console.log(`[${new Date().toISOString()}] Chat request - Mode: ${mode}, Model: ${process.env.LITELLM_MODEL}`);
        
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        if (!apiKey || apiKey === 'your_huggingface_token_here') {
            return res.status(500).json({ 
                error: 'HUGGINGFACE_API_KEY is not configured in .env file',
                message: 'Please set your Hugging Face token in the .env file'
            });
        }
        
        const fullPrompt = buildPrompt(message, mode, language, history, topic);
        const aiReply = await callLiteLLM(fullPrompt);
        
        res.json({ reply: aiReply });
        
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ 
            error: 'Failed to generate response',
            details: error.message 
        });
    }
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

module.exports = app;
