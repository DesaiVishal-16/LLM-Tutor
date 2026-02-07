// Test script to verify Hugging Face API is working
require('dotenv').config();

async function testHuggingFace() {
    console.log('========================================');
    console.log('Testing Hugging Face API Connection');
    console.log('========================================');
    
    // Check if API key is set
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey || apiKey === 'your_huggingface_api_key_here') {
        console.error('❌ ERROR: HUGGINGFACE_API_KEY is not set or is default!');
        console.log('Please set your Hugging Face API key in the .env file');
        console.log('Get your API key from: https://huggingface.co/settings/tokens');
        return false;
    }
    
    console.log('✓ API Key is configured');
    console.log(`✓ Model: ${process.env.HUGGINGFACE_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct'}`);
    
    const model = process.env.HUGGINGFACE_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct';
    console.log('----------------------------------------');
    console.log('Sending test request to Hugging Face...');
    console.log('----------------------------------------');
    
    try {
        // Make a simple test request using OpenAI-compatible endpoint
        const response = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'user', content: 'Hello! Please respond with "Hugging Face is working perfectly!"' }
                ],
                max_tokens: 50,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No response body');
            console.error(`HTTP Status: ${response.status}`);
            console.error(`Response: ${errorText}`);
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
            } catch {
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
        }
        
        const data = await response.json();
        
        console.log('✓ Request successful!');
        console.log('----------------------------------------');
        console.log('Response:');
        
        let reply = '';
        if (data.choices && data.choices.length > 0) {
            reply = data.choices[0].message.content;
        } else if (Array.isArray(data) && data.length > 0) {
            reply = data[0].generated_text;
        } else if (data.generated_text) {
            reply = data.generated_text;
        }
        
        console.log(reply);
        console.log('----------------------------------------');
        console.log('✅ Hugging Face API is working perfectly!');
        console.log('========================================');
        return true;
        
    } catch (error) {
        console.error('❌ ERROR: Hugging Face API request failed!');
        console.error('----------------------------------------');
        console.error('Error Details:');
        if (error.message) {
            console.error(`Message: ${error.message}`);
        }
        console.error('----------------------------------------');
        console.log('Possible issues:');
        console.log('1. Invalid API key');
        console.log('2. Model is loading (try again in a few minutes)');
        console.log('3. Network connectivity issues');
        console.log('4. Hugging Face service is down');
        console.log('========================================');
        return false;
    }
}

// Run the test
testHuggingFace()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
