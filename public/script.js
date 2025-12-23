
// STATE MANAGEMENT
let currentMode = null; 
let currentLanguage = 'English'; 
let currentTopic = ''; 
let isProcessing = false; // Prevent multiple simultaneous requests
let chatHistory = []; 

// ACCESSIBILITY STATE
let isRecording = false;
let isSpeaking = false;
let autoRead = false;
let currentFontSize = 'normal';
const fontSizes = ['small', 'normal', 'large', 'xlarge'];
const recognition = 'webkitSpeechRecognition' in window ? new webkitSpeechRecognition() : null;

// Initialize Speech Synthesis
const synth = window.speechSynthesis;
let speechHeartbeat = null;
let voices = [];

// Function to load voices and handle async loading
function loadVoices() {
    voices = synth.getVoices();
    if (voices.length > 0) {
        console.log(`TTS: ${voices.length} voices loaded`);
    }
}

if (synth) {
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }
}

// Function to keep speech synthesis alive in Chrome
function keepSpeechAlive() {
    if (synth && synth.speaking) {
        synth.pause();
        synth.resume();
        speechHeartbeat = setTimeout(keepSpeechAlive, 10000);
    }
}

// DOM ELEMENTS
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const currentModeDisplay = document.getElementById('currentMode');
const languageSelect = document.getElementById('languageSelect');
const topicInput = document.getElementById('topicInput');
const setTopicBtn = document.getElementById('setTopicBtn');

// Accessibility elements
const accessibilityBtn = document.getElementById('accessibilityBtn');
const accessibilityModal = document.getElementById('accessibilityModal');
const closeModal = document.querySelector('.close-modal');
const voiceBtn = document.getElementById('voiceBtn');
const highContrastToggle = document.getElementById('highContrastToggle');
const autoReadToggle = document.getElementById('autoReadToggle');
const increaseFontBtn = document.getElementById('increaseFont');
const decreaseFontBtn = document.getElementById('decreaseFont');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');

// Mode buttons
const explainBtn = document.getElementById('explainBtn');
const quizBtn = document.getElementById('quizBtn');
const simplifyBtn = document.getElementById('simplifyBtn');

// MODE SELECTION HANDLERS
// Set the current learning mode
function setMode(mode) {
    if (!currentTopic) {
        alert('Please enter a topic first');
        topicInput.focus();
        return;
    }
    currentMode = mode;
    chatHistory = []; // Reset history when mode changes
    
    // Update UI to show selected mode
    updateModeDisplay(mode);
    
    // Update button states
    updateButtonStates(mode);
    
    // Auto-send an initial request based on the mode
    handleModeSelection(mode);
}

// Set the current topic
function setTopic() {
    const newTopic = topicInput.value.trim();
    if (!newTopic) return;
    
    currentTopic = newTopic;
    chatHistory = []; // Reset history when topic changes
    currentMode = null; // Reset mode
    
    // Clear chat container
    chatContainer.innerHTML = '';
    
    // Update UI
    updateModeDisplay(null);
    updateButtonStates(null);
    
    // Display welcome message for new topic
    const welcomeMsg = getWelcomeMessage();
    displayMessage(welcomeMsg, 'ai');
    
    console.log('Topic changed to:', currentTopic);
}

function getWelcomeMessage() {
    const t = translations[currentLanguage] || translations['English'];
    return t.welcomeMessage.replace(/{{topic}}/g, currentTopic);
}

// Update the current mode display text
function updateModeDisplay(mode) {
    const modeNames = {
        'English': {
            'explain': '<i class="ri-book-open-line"></i> Explain Mode',
            'quiz': '<i class="ri-questionnaire-line"></i> Quiz Mode',
            'simplify': '<i class="ri-lightbulb-flash-line"></i> Simplify Mode'
        },
        'Hindi': {
            'explain': '<i class="ri-book-open-line"></i> व्याख्या मोड',
            'quiz': '<i class="ri-questionnaire-line"></i> क्विज़ मोड',
            'simplify': '<i class="ri-lightbulb-flash-line"></i> सरलीकरण मोड'
        },
        'Marathi': {
            'explain': '<i class="ri-book-open-line"></i> स्पष्टीकरण मोड',
            'quiz': '<i class="ri-questionnaire-line"></i> क्विझ मोड',
            'simplify': '<i class="ri-lightbulb-flash-line"></i> सुलभ मोड'
        },
        'Bengali': {
            'explain': '<i class="ri-book-open-line"></i> ব্যাখ্যা মোড',
            'quiz': '<i class="ri-questionnaire-line"></i> কুইজ মোড',
            'simplify': '<i class="ri-lightbulb-flash-line"></i> সরলীকরণ মোড'
        },
        'Tamil': {
            'explain': '<i class="ri-book-open-line"></i> விளக்க முறை',
            'quiz': '<i class="ri-questionnaire-line"></i> வினாடி வினா முறை',
            'simplify': '<i class="ri-lightbulb-flash-line"></i> எளிமைப்படுத்தல் முறை'
        },
        'Telugu': {
            'explain': '<i class="ri-book-open-line"></i> వివరణ మోడ్',
            'quiz': '<i class="ri-questionnaire-line"></i> క్విజ్ మోడ్',
            'simplify': '<i class="ri-lightbulb-flash-line"></i> సరళీకరణ మోడ్'
        },
        'Kannada': {
            'explain': '<i class="ri-book-open-line"></i> ವಿವರಣೆ ಮೋಡ್',
            'quiz': '<i class="ri-questionnaire-line"></i> ರಸಪ್ರಶ್ನೆ ಮೋಡ್',
            'simplify': '<i class="ri-lightbulb-flash-line"></i> ಸರಳೀಕರಣ ಮೋಡ್'
        },
        'Gujarati': {
            'explain': '<i class="ri-book-open-line"></i> સમજૂતી મોડ',
            'quiz': '<i class="ri-questionnaire-line"></i> ક્વિઝ મોડ',
            'simplify': '<i class="ri-lightbulb-flash-line"></i> સરળીકરણ મોડ'
        }
    };
    
    const langModes = modeNames[currentLanguage] || modeNames['English'];
    currentModeDisplay.innerHTML = langModes[mode] || (translations[currentLanguage]?.noneSelected || 'None selected');
}

// Update button active states
function updateButtonStates(mode) {
    // Remove active class from all buttons
    [explainBtn, quizBtn, simplifyBtn].forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to selected button
    if (mode === 'explain') explainBtn.classList.add('active');
    if (mode === 'quiz') quizBtn.classList.add('active');
    if (mode === 'simplify') simplifyBtn.classList.add('active');
}

// Handle mode selection and send initial request
function handleModeSelection(mode) {
    // Different initial prompts for each mode and language
    const initialPrompts = {
        'English': {
            'explain': `Please explain the concept of ${currentTopic}.`,
            'quiz': `I'm ready to be quizzed on ${currentTopic}. Please start with a random question.`,
            'simplify': `Please explain ${currentTopic} in simple terms.`
        },
        'Hindi': {
            'explain': `कृपया ${currentTopic} की अवधारणा को समझाएं।`,
            'quiz': `मैं ${currentTopic} पर क्विज़ के लिए तैयार हूँ। कृपया एक यादृच्छिक प्रश्न के साथ शुरू करें।`,
            'simplify': `कृपया ${currentTopic} को सरल शब्दों में समझाएं।`
        },
        'Marathi': {
            'explain': `कृपया ${currentTopic} ही संकल्पना स्पष्ट करा.`,
            'quiz': `मी ${currentTopic} वर क्विझसाठी तयार आहे. कृपया एका यादृच्छिक प्रश्नाने सुरुवात करा.`,
            'simplify': `कृपया ${currentTopic} सोप्या शब्दात स्पष्ट करा.`
        },
        'Bengali': {
            'explain': `দয়া করে ${currentTopic}-এর ধারণাটি ব্যাখ্যা করুন।`,
            'quiz': `আমি ${currentTopic}-এর উপর কুইজের জন্য প্রস্তুত। দয়া করে একটি এলোমেলো প্রশ্ন দিয়ে শুরু করুন।`,
            'simplify': `দয়া করে ${currentTopic} সহজ ভাষায় ব্যাখ্যা করুন।`
        },
        'Tamil': {
            'explain': `${currentTopic} பற்றிய கருத்தை விளக்கவும்.`,
            'quiz': `${currentTopic} பற்றிய வினாடி வினாவிற்கு நான் தயார். தயவுசெய்து ஒரு சீரற்ற கேள்வியுடன் தொடங்கவும்.`,
            'simplify': `${currentTopic}-ஐ எளிய சொற்களில் விளக்கவும்.`
        },
        'Telugu': {
            'explain': `దయచేసి ${currentTopic} భావనను వివరించండి.`,
            'quiz': `నేను ${currentTopic}పై క్విజ్ కోసం సిద్ధంగా ఉన్నాను. దయచేసి యాదృచ్ఛిక ప్రశ్నతో ప్రారంభించండి.`,
            'simplify': `దయచేసి ${currentTopic}ను సరళమైన పదాలలో వివరించండి.`
        },
        'Kannada': {
            'explain': `ದಯವಿಟ್ಟು ${currentTopic} ಪರಿಕಲ್ಪನೆಯನ್ನು ವಿವರಿಸಿ.`,
            'quiz': `${currentTopic} ಕುರಿತು ರಸಪ್ರಶ್ನೆಗೆ ನಾನು ಸಿದ್ಧನಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ಯಾದೃಚ್ಛಿಕ ಪ್ರಶ್ನೆಯೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸಿ.`,
            'simplify': `ದಯವಿಟ್ಟು ${currentTopic} ಅನ್ನು ಸರಳ ಪದಗಳಲ್ಲಿ ವಿವರಿಸಿ.`
        },
        'Gujarati': {
            'explain': `કૃપા કરીને ${currentTopic} ની વિભાવના સમજાવો.`,
            'quiz': `હું ${currentTopic} પર ક્વિઝ માટે તૈયાર છું. કૃપા કરીને રેન્ડમ પ્રશ્નથી પ્રારંભ કરો.`,
            'simplify': `કૃપા કરીને ${currentTopic} ને સરળ શબ્દોમાં સમજાવો.`
        }
    };
    
    const langPrompts = initialPrompts[currentLanguage] || initialPrompts['English'];
    const userMessage = langPrompts[mode];
    
    // Display user's automatic message
    displayMessage(userMessage, 'user');
    
    // Add to history
    chatHistory.push({ role: 'user', content: userMessage });
    
    // Send to backend
    sendToBackend(userMessage, mode);
}

// MESSAGE DISPLAY
// Display a message in the chat (type: 'user' or 'ai')
function displayMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML =
      type === "user"
        ? '<img width="100" height="100" src="https://img.icons8.com/3d-fluent/100/user-2.png" alt="user-2"/>'
        : '<img width="100" height="100" src="https://img.icons8.com/3d-fluent/100/robot-6.png" alt="robot-6"/>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const paragraph = document.createElement('p');
    
    // Escape HTML to prevent XSS
    const escapedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // Convert **text** to <strong>text</strong>
    const formattedText = escapedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Format quiz options if applicable
    let finalHtml = formattedText;
    if (type === 'ai' && currentMode === 'quiz') {
        finalHtml = formatQuizOptions(finalHtml);
    }
    
    paragraph.innerHTML = finalHtml;
    
    content.appendChild(paragraph);

    // Add Listen button for AI messages
    if (type === 'ai') {
        const listenBtn = document.createElement('button');
        listenBtn.className = 'listen-btn';
        listenBtn.innerHTML = '<i class="ri-volume-up-line"></i> Listen';
        listenBtn.onclick = () => toggleSpeech(text, listenBtn);
        content.appendChild(listenBtn);

        // Auto-read if enabled
        if (autoRead) {
            setTimeout(() => toggleSpeech(text, listenBtn), 500);
        }
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatContainer.appendChild(messageDiv);
    
    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// SPEECH SYNTHESIS (TTS)
function toggleSpeech(text, button) {
    console.log('TTS: toggleSpeech called', { textLength: text.length, currentLanguage });
    
    if (!window.speechSynthesis) {
        console.error('TTS: window.speechSynthesis not found');
        alert("Speech synthesis is not supported in your browser.");
        return;
    }

    const synth = window.speechSynthesis;

    // If this button is already playing, stop everything and return
    if (button.classList.contains('playing')) {
        console.log('TTS: Stopping current speech');
        synth.cancel();
        return;
    }

    // Stop any current speech and reset all buttons
    console.log('TTS: Cancelling any existing speech');
    synth.cancel();
    updateListenButtons(false);
    clearTimeout(speechHeartbeat);

    // Clean text for speech
    const cleanText = text
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/\*\*/g, '')           // Remove bold
        .replace(/###/g, '')            // Remove headers
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove markdown links
        .trim();

    console.log('TTS: Cleaned text', cleanText.substring(0, 50) + '...');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Language mapping
    const langMap = {
        'English': 'en-US', 'Hindi': 'hi-IN', 'Marathi': 'mr-IN',
        'Bengali': 'bn-IN', 'Tamil': 'ta-IN', 'Telugu': 'te-IN',
        'Kannada': 'kn-IN', 'Gujarati': 'gu-IN'
    };
    const targetLangCode = langMap[currentLanguage] || 'en-US';
    utterance.lang = targetLangCode;
    
    // Voice selection
    if (voices.length === 0) {
        voices = synth.getVoices();
    }

    if (voices.length > 0) {
        const targetPrefix = targetLangCode.split('-')[0];
        const voice = voices.find(v => v.lang === targetLangCode) || 
                      voices.find(v => v.lang.startsWith(targetPrefix)) || 
                      voices.find(v => v.lang.startsWith('en'));
        
        if (voice) {
            console.log('TTS: Selected voice', voice.name, voice.lang);
            utterance.voice = voice;
        }
    }

    // Set properties explicitly for better compatibility
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
        console.log('TTS: Speech started');
        button.classList.add('playing');
        button.innerHTML = '<i class="ri-stop-circle-line"></i> Stop';
        keepSpeechAlive();
    };

    utterance.onend = () => {
        console.log('TTS: Speech ended');
        button.classList.remove('playing');
        button.innerHTML = '<i class="ri-volume-up-line"></i> Listen';
        clearTimeout(speechHeartbeat);
    };

    utterance.onerror = (event) => {
        console.error('TTS: Error event', event.error, event);
        button.classList.remove('playing');
        button.innerHTML = '<i class="ri-volume-up-line"></i> Listen';
        clearTimeout(speechHeartbeat);
        
        if (event.error === 'not-allowed') {
            alert("Speech was blocked. Please click again.");
        } else if (event.error === 'synthesis-failed') {
            console.warn('TTS: Synthesis failed. This can happen on some Linux systems if speech-dispatcher is not running.');
            // Try one last time with default settings if it failed
            if (!utterance._retried) {
                console.log('TTS: Retrying with default settings...');
                const retryUtterance = new SpeechSynthesisUtterance(cleanText);
                retryUtterance._retried = true;
                synth.speak(retryUtterance);
            }
        }
    };

    // Speak with a small delay to ensure cancel is fully processed
    setTimeout(() => {
        console.log('TTS: Calling synth.speak()');
        synth.resume();
        synth.speak(utterance);
    }, 200);
}

// Test function for accessibility modal
function testSpeech() {
    const testText = "Hello! This is a test of the AI Tutor speech system. If you can hear this, your audio is working correctly.";
    const dummyBtn = document.createElement('button');
    toggleSpeech(testText, dummyBtn);
}

function updateListenButtons(speaking) {
    const buttons = document.querySelectorAll('.listen-btn');
    buttons.forEach(btn => {
        if (!speaking) {
            btn.classList.remove('playing');
            btn.innerHTML = '<i class="ri-volume-up-line"></i> Listen';
        }
    });
}

// SPEECH RECOGNITION (STT)
if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isRecording = true;
        voiceBtn.classList.add('recording');
        voiceBtn.innerHTML = '<i class="ri-mic-fill"></i>';
        userInput.placeholder = "Listening...";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        handleSend();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
    };

    recognition.onend = () => {
        stopRecording();
    };
}

function toggleRecording() {
    if (!recognition) {
        alert("Speech recognition is not supported in your browser.");
        return;
    }

    if (isRecording) {
        recognition.stop();
    } else {
        const langMap = {
            'English': 'en-US',
            'Hindi': 'hi-IN',
            'Marathi': 'mr-IN',
            'Bengali': 'bn-IN',
            'Tamil': 'ta-IN',
            'Telugu': 'te-IN',
            'Kannada': 'kn-IN',
            'Gujarati': 'gu-IN'
        };
        recognition.lang = langMap[currentLanguage] || 'en-US';
        recognition.start();
    }
}

function stopRecording() {
    isRecording = false;
    voiceBtn.classList.remove('recording');
    voiceBtn.innerHTML = '<i class="ri-mic-line"></i>';
    userInput.placeholder = translations[currentLanguage]?.inputPlaceholder || "Type your message...";
}

// ACCESSIBILITY SETTINGS HANDLERS
function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
    localStorage.setItem('highContrast', document.body.classList.contains('high-contrast'));
}

function updateFontSize(delta) {
    const currentIndex = fontSizes.indexOf(currentFontSize);
    let newIndex = currentIndex + delta;
    
    if (newIndex >= 0 && newIndex < fontSizes.length) {
        const oldSize = currentFontSize;
        currentFontSize = fontSizes[newIndex];
        
        document.body.classList.remove(`font-${oldSize}`);
        document.body.classList.add(`font-${currentFontSize}`);
        
        fontSizeDisplay.textContent = currentFontSize.charAt(0).toUpperCase() + currentFontSize.slice(1);
        localStorage.setItem('fontSize', currentFontSize);
    }
}

// MODAL HANDLERS
function openAccessibilityModal() {
    accessibilityModal.style.display = 'block';
}

function closeAccessibilityModal() {
    accessibilityModal.style.display = 'none';
}

// Format quiz options into clickable buttons
function formatQuizOptions(text) {
    // Look for patterns like "A) Option text" or "A. Option text"
    // We look for A, B, C, D followed by ) or . at the start of a line (or after newline)
    const optionRegex = /(?:^|\n)([A-D])[\)\.]\s+(.*?)(?=\n|$)/g;
    const matches = [...text.matchAll(optionRegex)];
    
    if (matches.length >= 2) {
        let optionsHtml = '<div class="quiz-options">';
        matches.forEach(match => {
            const letter = match[1];
            const content = match[2];
            optionsHtml += `<button class="quiz-option-btn" onclick="window.sendOption('${letter}')">${letter}) ${content}</button>`;
        });
        optionsHtml += '</div>';
        

        let cleanText = text.replace(optionRegex, '');
        return cleanText.trim() + optionsHtml;
    }
    return text;
}

// Handle option click
window.sendOption = function(option) {
    const userInput = document.getElementById('userInput');
    if (userInput.disabled) return;
    
    userInput.value = option;
    handleSend();
};

// Display loading indicator while waiting for AI response
function displayLoading() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.id = 'loadingMessage';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<i class="ri-robot-2-line"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<span></span><span></span><span></span>';
    
    content.appendChild(loading);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Remove loading indicator
function removeLoading() {
    const loadingMsg = document.getElementById('loadingMessage');
    if (loadingMsg) {
        loadingMsg.remove();
    }
}

// Display error message
function displayError(errorText, details = '') {
    const message = details ? `⚠️ Error: ${errorText}\n\nDetails: ${details}` : `⚠️ Error: ${errorText}`;
    displayMessage(message, 'ai');
}

// BACKEND COMMUNICATION
// Send message to backend API
async function sendToBackend(userMessage, mode) {
    // Prevent multiple simultaneous requests
    if (isProcessing) {
        console.log('Already processing a request, please wait...');
        return;
    }
    
    isProcessing = true;
    
    // Disable input and buttons
    setUIEnabled(false);
    
    // Show loading indicator
    displayLoading();
    
    try {
        // Make API call to backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                mode: mode,
                language: currentLanguage,
                topic: currentTopic, 
                history: chatHistory 
            })
        });
        
        // Remove loading indicator
        removeLoading();
        
        if (!response.ok) {
            // Handle HTTP errors
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            const errorMessage = errorData.details ? `${errorData.error}: ${errorData.details}` : (errorData.error || `HTTP error! status: ${response.status}`);
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Display AI response
        if (data.reply) {
            displayMessage(data.reply, 'ai');
            // Add AI response to history
            chatHistory.push({ role: 'assistant', content: data.reply });
        } else {
            displayError('Received an unexpected response format from the server.');
        }
        
    } catch (error) {
        // Remove loading indicator
        removeLoading();
        
        // Display error message
        console.error('Error:', error);
        
        if (error.message.includes('fetch')) {
            displayError('Cannot connect to the server. Please make sure the backend is running.');
        } else {
            displayError(error.message);
        }
        
    } finally {
        // Re-enable input and buttons
        setUIEnabled(true);
        isProcessing = false;
    }
}

// UI STATE MANAGEMENT
// Enable or disable UI elements
function setUIEnabled(enabled) {
    sendBtn.disabled = !enabled;
    userInput.disabled = !enabled;
    explainBtn.disabled = !enabled;
    quizBtn.disabled = !enabled;
    simplifyBtn.disabled = !enabled;
}

// USER INPUT HANDLING
// Handle send button click
function handleSend() {
    const message = userInput.value.trim();
    
    // Don't send empty messages
    if (!message) return;
    
    // Check if a mode is selected
    if (!currentMode) {
        alert('Please select a learning mode first (Explain, Quiz, or Simplify)');
        return;
    }
    
    // Check for quiz restart to ensure fresh context
    if (currentMode === 'quiz') {
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('new quiz') || lowerMsg.includes('restart') || lowerMsg.includes('start over')) {
            chatHistory = [];
        }
    }
    
    // Display user message
    displayMessage(message, 'user');
    
    // Add to history
    chatHistory.push({ role: 'user', content: message });
    
    // Clear input
    userInput.value = '';
    
    // Send to backend
    sendToBackend(message, currentMode);
}

// Handle Enter key in input field
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
    }
}

// EVENT LISTENERS
// Mode button clicks
explainBtn.addEventListener('click', () => setMode('explain'));
quizBtn.addEventListener('click', () => setMode('quiz'));
simplifyBtn.addEventListener('click', () => setMode('simplify'));

// Send button click
sendBtn.addEventListener('click', handleSend);

// Enter key press
userInput.addEventListener('keypress', handleKeyPress);

// Accessibility listeners
accessibilityBtn.addEventListener('click', openAccessibilityModal);
closeModal.addEventListener('click', closeAccessibilityModal);
window.addEventListener('click', (e) => {
    if (e.target === accessibilityModal) closeAccessibilityModal();
});

voiceBtn.addEventListener('click', toggleRecording);
highContrastToggle.addEventListener('change', toggleHighContrast);
autoReadToggle.addEventListener('change', (e) => {
    autoRead = e.target.checked;
    localStorage.setItem('autoRead', autoRead);
});

increaseFontBtn.addEventListener('click', () => updateFontSize(1));
decreaseFontBtn.addEventListener('click', () => updateFontSize(-1));

const testSpeechBtn = document.getElementById('testSpeechBtn');
if (testSpeechBtn) {
    testSpeechBtn.addEventListener('click', testSpeech);
}

// Load saved accessibility settings
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('highContrast') === 'true') {
        highContrastToggle.checked = true;
        toggleHighContrast();
    }
    
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize && savedFontSize !== 'normal') {
        currentFontSize = savedFontSize;
        document.body.classList.add(`font-${currentFontSize}`);
        fontSizeDisplay.textContent = currentFontSize.charAt(0).toUpperCase() + currentFontSize.slice(1);
    }
    
    if (localStorage.getItem('autoRead') === 'true') {
        autoRead = true;
        autoReadToggle.checked = true;
    }
});

// Topic input handlers
setTopicBtn.addEventListener('click', setTopic);
topicInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        setTopic();
    }
});

// Language selection change
languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    console.log('Language changed to:', currentLanguage);
    
    // Update UI labels
    updateUILabels(currentLanguage);
    
    // If a mode is already selected, we might want to refresh the last response in the new language
    if (currentMode) {
        setMode(currentMode);
    }
});

// UI TRANSLATIONS
const translations = {
    'English': {
        'topicLabel': 'Current Topic:',
        'topicName': 'Photosynthesis',
        'modeLabel': 'Mode: ',
        'explainBtn': '<i class="ri-book-open-line"></i> Explain this concept',
        'quizBtn': '<i class="ri-questionnaire-line"></i> Quiz me',
        'simplifyBtn': '<i class="ri-lightbulb-flash-line"></i> Simplify this',
        'inputPlaceholder': 'Type your message or click a mode button to start...',
        'noneSelected': 'None selected',
        'welcomeMessage': "Hello! I'm your AI tutor. Choose a learning mode below and start asking questions about {{topic}}!"
    },
    'Hindi': {
        'topicLabel': 'वर्तमान विषय:',
        'topicName': 'प्रकाश संश्लेषण',
        'modeLabel': 'मोड: ',
        'explainBtn': '<i class="ri-book-open-line"></i> इस अवधारणा को समझाएं',
        'quizBtn': '<i class="ri-questionnaire-line"></i> मेरी परीक्षा लें',
        'simplifyBtn': '<i class="ri-lightbulb-flash-line"></i> इसे सरल करें',
        'inputPlaceholder': 'अपना संदेश टाइप करें या शुरू करने के लिए मोड बटन पर क्लिक करें...',
        'noneSelected': 'कोई चयनित नहीं',
        'welcomeMessage': "नमस्ते! मैं आपका AI ट्यूटर हूँ। नीचे एक लर्निंग मोड चुनें और {{topic}} के बारे में प्रश्न पूछना शुरू करें!"
    },
    'Marathi': {
        'topicLabel': 'सध्याचा विषय:',
        'topicName': 'प्रकाश संश्लेषण',
        'modeLabel': 'मोड: ',
        'explainBtn': '<i class="ri-book-open-line"></i> ही संकल्पना स्पष्ट करा',
        'quizBtn': '<i class="ri-questionnaire-line"></i> माझी क्विझ घ्या',
        'simplifyBtn': '<i class="ri-lightbulb-flash-line"></i> हे सोपे करा',
        'inputPlaceholder': 'तुमचा संदेश टाइप करा किंवा सुरू करण्यासाठी मोड बटणावर क्लिक करा...',
        'noneSelected': 'काहीही निवडलेले नाही',
        'welcomeMessage': "नमस्कार! मी तुमचा AI ट्यूटर आहे. खालीलपैकी एक मोड निवडा आणि {{topic}} बद्दल प्रश्न विचारायला सुरुवात करा!"
    },
    'Bengali': {
        'topicLabel': 'বর্তমান বিষয়:',
        'topicName': 'সালোকসংশ্লেষণ',
        'modeLabel': 'মোড: ',
        'explainBtn': '<i class="ri-book-open-line"></i> এই ধারণাটি ব্যাখ্যা করুন',
        'quizBtn': '<i class="ri-questionnaire-line"></i> কুইজ নিন',
        'simplifyBtn': '<i class="ri-lightbulb-flash-line"></i> এটি সহজ করুন',
        'inputPlaceholder': 'আপনার বার্তা টাইপ করুন বা শুরু করতে একটি মোড বোতামে ক্লিক করুন...',
        'noneSelected': 'কোনোটি নির্বাচিত নয়',
        'welcomeMessage': "হ্যালো! আমি আপনার AI টিউটর। নিচে একটি লার্নিং মোড চয়ন করুন এবং {{topic}} সম্পর্কে প্রশ্ন জিজ্ঞাসা করা শুরু করুন!"
    },
    'Tamil': {
        'topicLabel': 'தலைப்பு:',
        'topicName': 'ஒளிச்சேர்க்கை',
        'modeLabel': 'முறை:',
        'explainBtn': '<i class="ri-book-open-line"></i> விளக்கம்',
        'quizBtn': '<i class="ri-questionnaire-line"></i> வினாடி வினா',
        'simplifyBtn': '<i class="ri-lightbulb-flash-line"></i> எளிமையாக்கு',
        'inputPlaceholder': 'கேள்வியைக் கேட்கவும்...',
        'noneSelected': 'தேர்வு செய்யப்படவில்லை',
        'welcomeMessage': "வணக்கம்! நான் உங்கள் AI பயிற்சி உதவியாளர். ஒரு முறையைத் தேர்ந்தெடுத்து {{topic}} பற்றி கேள்விகளைக் கேட்கத் தொடங்குங்கள்!"
    },
    'Telugu': {
        'topicLabel': 'ప్రస్తుత అంశం:',
        'topicName': 'కిరణజన్య సంయోగక్రియ',
        'modeLabel': 'మోడ్: ',
        'explainBtn': '<i class="ri-book-open-line"></i> ఈ భావనను వివరించండి',
        'quizBtn': '<i class="ri-questionnaire-line"></i> క్విజ్ నిర్వహించండి',
        'simplifyBtn': '<i class="ri-lightbulb-flash-line"></i> దీన్ని సరళీకరించండి',
        'inputPlaceholder': 'మీ సందేశాన్ని టైప్ చేయండి లేదా ప్రారంభించడానికి మోడ్ బటన్‌ను క్利క్ చేయండి...',
        'noneSelected': 'ఏదీ ఎంచుకోలేదు',
        'welcomeMessage': "నమస్కారం! నేను మీ AI ట్యూటర్. కింద ఉన్న లెర్నింగ్ మోడ్‌ను ఎంచుకుని, {{topic}} గురించి ప్రశ్నలు అడగడం ప్రారంభించండి!"
    },
    'Kannada': {
        'topicLabel': 'ಪ್ರಸ್ತುತ ವಿಷಯ:',
        'topicName': 'ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ',
        'modeLabel': 'ಮೋಡ್: ',
        'explainBtn': '<i class="ri-book-open-line"></i> ಈ ಪರಿಕಲ್ಪನೆಯನ್ನು ವಿವರಿಸಿ',
        'quizBtn': '<i class="ri-questionnaire-line"></i> ರಸಪ್ರಶ್ನೆ ನಡೆಸಿ',
        'simplifyBtn': '<i class="ri-lightbulb-flash-line"></i> ಇದನ್ನು ಸರಳಗೊಳಿಸಿ',
        'inputPlaceholder': 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಪ್ರಾರಂಭಿಸಲು ಮೋಡ್ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ...',
        'noneSelected': 'ಯಾವುದನ್ನೂ ಆಯ್ಕೆ ಮಾಡಿಲ್ಲ',
        'welcomeMessage': "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಟ್ಯೂಟರ್. ಕೆಳಗಿನ ಕಲಿಕೆಯ ಮೋಡ್ ಅನ್ನು ಆರಿಸಿ ಮತ್ತು {{topic}} ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಲು ಪ್ರಾರಂಭಿಸಿ!"
    },
    'Gujarati': {
        'topicLabel': 'વર્તમાન વિષય:',
        'topicName': 'પ્રકાશસંશ્લેષણ',
        'modeLabel': 'મોડ: ',
        'explainBtn': '<i class="ri-book-open-line"></i> આ ખ્યાલ સમજાવો',
        'quizBtn': '<i class="ri-questionnaire-line"></i> મારી ક્વિઝ લો',
        'simplifyBtn': '<i class="ri-lightbulb-flash-line"></i> આને સરળ બનાવો',
        'inputPlaceholder': 'તમારો સંદેશ ટાઇપ કરો અથવા શરૂ કરવા માટે મોડ બટન પર ક્લિક કરો...',
        'noneSelected': 'કોઈ પસંદ કરેલ નથી',
        'welcomeMessage': "નમસ્તે! હું તમારો AI ટ્યુટર છું. નીચેથી લર્નિંગ મોડ પસંદ કરો અને {{topic}} વિશે પ્રશ્નો પૂછવાનું શરૂ કરો!"
    }
};

function updateUILabels(lang) {
    const t = translations[lang] || translations['English'];
    
    // Update Info
    document.querySelector('.topic-label').textContent = t.topicLabel;
    topicInput.placeholder = "Add any topic...";
    if (!topicInput.value) topicInput.value = currentTopic;
    document.querySelector('.current-mode span').textContent = t.modeLabel;
    
    // Update Buttons
    explainBtn.innerHTML = t.explainBtn;
    quizBtn.innerHTML = t.quizBtn;
    simplifyBtn.innerHTML = t.simplifyBtn;
    
    // Update Input
    userInput.placeholder = t.inputPlaceholder;
    
    // Update Welcome Message (if it's the only message in the container)
    const messages = chatContainer.querySelectorAll('.message');
    if (messages.length === 1 && messages[0].classList.contains('ai-message')) {
        const welcomeText = messages[0].querySelector('.message-content p');
        if (welcomeText) {
            welcomeText.textContent = getWelcomeMessage();
        }
    }
    
    // Update Mode Display if none selected
    if (!currentMode) {
        currentModeDisplay.textContent = t.noneSelected;
    } else {
        updateModeDisplay(currentMode);
    }
}

// INITIALIZATION
// Focus on input when page loads
window.addEventListener('load', () => {
    userInput.focus();
    
    // Initialize UI labels
    updateUILabels(currentLanguage);
    
    // Check if backend is available
    checkBackendHealth();
});

// Check backend health on load
async function checkBackendHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('✓ Backend is running:', data.message);
    } catch (error) {
        console.error('✗ Backend is not available:', error);
        displayError('Backend server is not responding. Please start the server with: npm start');
    }
}
