const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'LLM Tutor API is running',
        provider: 'Hugging Face (called from frontend)'
    });
});

// Endpoint to get Hugging Face API key (exposed to frontend)
app.get('/api/config', (req, res) => {
    const apiKey = process.env.HUGGINGFACE_API_KEY || '';
    const isConfigured = apiKey && apiKey !== '' && apiKey !== 'your_huggingface_api_key_here';
    res.json({
        huggingfaceApiKey: isConfigured ? apiKey : '',
        isConfigured: isConfigured,
        model: process.env.HUGGINGFACE_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct'
    });
});

// Fallback for SPA routing - serve index.html for any unmatched routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

module.exports = app;
