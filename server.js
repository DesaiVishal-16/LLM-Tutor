const app = require('./api/server');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('========================================');
    console.log('🎓 LLM Tutor Server Started');
    console.log('========================================');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🔑 API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes ✓' : 'No ✗'}`);
    console.log('========================================');
    
    // Warn if API key is not set
    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  WARNING: OPENAI_API_KEY is not set!');
        console.warn('   Please set it in your .env file');
    }
});
