// Test script to verify OpenAI API is working
require('dotenv').config();
const OpenAI = require('openai');

async function testOpenAI() {
    console.log('========================================');
    console.log('Testing OpenAI API Connection');
    console.log('========================================');
    
    // Check if API key is set
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
        console.error('❌ ERROR: OPENAI_API_KEY is not set or is default!');
        console.log('Please set your OpenAI API key in the .env file');
        console.log('Get your API key from: https://platform.openai.com/api-keys');
        return false;
    }
    
    console.log('✓ API Key is configured');
    console.log(`✓ Model: ${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'}`);
    
    // Initialize OpenAI client
    const openai = new OpenAI({
        apiKey: apiKey,
    });
    
    console.log('✓ OpenAI client initialized');
    console.log('----------------------------------------');
    console.log('Sending test request to OpenAI...');
    console.log('----------------------------------------');
    
    try {
        // Make a simple test request
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: 'Hello! Please respond with "OpenAI is working perfectly!"'
                }
            ],
            max_tokens: 50
        });
        
        console.log('✓ Request successful!');
        console.log('----------------------------------------');
        console.log('Response:');
        console.log(response.choices[0].message.content);
        console.log('----------------------------------------');
        console.log('✅ OpenAI API is working perfectly!');
        console.log('========================================');
        return true;
        
    } catch (error) {
        console.error('❌ ERROR: OpenAI API request failed!');
        console.error('----------------------------------------');
        console.error('Error Details:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else if (error.message) {
            console.error(`Message: ${error.message}`);
        }
        console.error('----------------------------------------');
        console.log('Possible issues:');
        console.log('1. Invalid API key');
        console.log('2. API key has no credits/usage');
        console.log('3. Network connectivity issues');
        console.log('4. OpenAI service is down');
        console.log('========================================');
        return false;
    }
}

// Run the test
testOpenAI()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
