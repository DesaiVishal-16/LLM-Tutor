const app = require('./api/server');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('========================================');
    console.log('🎓 LLM Tutor Server Started');
    console.log('========================================');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🤖 Model: ${process.env.LITELLM_MODEL || 'moonshotai/Kimi-K2-Thinking'}`);
    console.log(`🔑 Hugging Face Key: ${process.env.HUGGINGFACE_API_KEY ? 'Set ✓' : 'Not Set ✗'}`);
    console.log('========================================');
    
    if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY === 'your_huggingface_token_here') {
        console.warn('⚠️  WARNING: HUGGINGFACE_API_KEY is not set or is default!');
        console.warn('   Please set your Hugging Face token in the .env file');
        console.warn('   Get your token from: https://huggingface.co/settings/tokens');
    }
});
