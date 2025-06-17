// Import services and config
import ApiService from './services.js';
import config from './config.js';

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    const navLinks = document.querySelectorAll('nav ul li a');
    const sections = document.querySelectorAll('.tool-section');

    // Chat Elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    let chatHistory = [];

    // Image Generator Elements
    const imagePrompt = document.getElementById('image-prompt');
    const generateBtn = document.getElementById('generate-btn');
    const imageOutput = document.getElementById('image-output');
    const imageSize = document.getElementById('image-size');
    const imageStyle = document.getElementById('image-style');
    const disableStyle = document.getElementById('disable-style');
    const providerButtons = document.querySelectorAll('.provider-btn');
    let currentProvider = 'flux'; // Default provider

    // Provider selection
    providerButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            providerButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Update current provider
            currentProvider = this.getAttribute('data-provider');
        });
    });

    // Tool Cards
    const toolCards = document.querySelectorAll('.tool-card');
    const toolModal = document.getElementById('tool-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.querySelector('.close-modal');

    // Status indicator for API calls
    const createStatusIndicator = () => {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'status-indicator';
        return statusDiv;
    };

    // Error handling function
    const handleApiError = (error, container) => {
        console.error('API Error:', error);
        container.innerHTML = `
            <div class="error-message">
                <p><i class="fas fa-exclamation-circle"></i> Error: ${error.message || 'Failed to connect to API'}</p>
                <p class="error-help">Please check your API keys in the .env file or try again later.</p>
            </div>
        `;
    };

    // Navigation Functionality
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(link => link.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
        });
    });

    // Chat Functionality
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        // Add user message to chat
        addMessageToChat('user', message);
        userInput.value = '';

        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot typing';
        typingIndicator.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            // Update chat history for context
            chatHistory.push({ role: 'user', content: message });
            
            // Call the API service
            const response = await ApiService.getChatResponse(message, chatHistory);
            
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Add AI response to chat
            addMessageToChat('bot', response);
            
            // Update chat history with AI response
            chatHistory.push({ role: 'assistant', content: response });
            
            // Limit history length to prevent token limits
            if (chatHistory.length > 10) {
                chatHistory = chatHistory.slice(chatHistory.length - 10);
            }
        } catch (error) {
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Show error message
            addMessageToChat('bot', `Sorry, I encountered an error: ${error.message}. Please try again later.`);
        }
    }

    function addMessageToChat(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');

        const messagePara = document.createElement('p');
        messagePara.textContent = content;

        messageContent.appendChild(messagePara);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);

        // Scroll to bottom of chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Image Generator Functionality
    generateBtn.addEventListener('click', generateImage);

    async function generateImage() {
        const prompt = imagePrompt.value.trim();
        if (prompt === '') return;

        // Get selected size and style
        const size = imageSize.value;
        const style = imageStyle.value;
        const styleEnabled = disableStyle.checked; // Rename to styleEnabled for clarity
        const provider = currentProvider;
        
        // Map size values to actual dimensions
        const sizeMap = {
            'small': '256x256',
            'medium': '512x512',
            'large': '1024x1024'
        };

        // Show loading state
        imageOutput.innerHTML = '<div class="loading-spinner"><div></div><div></div><div></div><div></div></div>';

        try {
            // Call the API service with the selected provider
            // Pass styleEnabled instead of styleDisabled to match our new logic
            const imageUrl = await ApiService.generateImage(prompt, sizeMap[size], style, !styleEnabled, provider);
            
            // Display the generated image with download button below the image
            imageOutput.innerHTML = `
                <div class="image-container">
                    <img src="${imageUrl}" alt="Generated image of ${prompt}" class="generated-image">
                </div>
                
                <div class="image-controls">
                    <button class="download-btn"><i class="fas fa-download"></i> Download</button>
                    <button class="share-btn"><i class="fas fa-share-alt"></i> Share</button>
                </div>
            `;
            
            // Add download functionality
            const downloadBtn = imageOutput.querySelector('.download-btn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    const a = document.createElement('a');
                    a.href = imageUrl;
                    a.download = `ai-image-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                });
            }
        } catch (error) {
            // Show error message
            imageOutput.innerHTML = `
                <div class="error-message">
                    <p><i class="fas fa-exclamation-circle"></i> Error: ${error.message || 'Failed to generate image'}</p>
                    <p class="error-help">Please check your API keys or try a different prompt.</p>
                </div>
            `;
        }
    }

    // Tool Cards Modal Functionality
    toolCards.forEach(card => {
        card.addEventListener('click', function() {
            const toolType = this.getAttribute('data-tool');
            const toolName = this.querySelector('h3').textContent;
            
            openToolModal(toolType, toolName);
        });
    });

    function openToolModal(toolType, toolName) {
        modalTitle.textContent = toolName;
        
        // Set modal content based on tool type
        switch(toolType) {
            case 'summarizer':
                modalBody.innerHTML = `
                    <div class="modal-tool">
                        <textarea placeholder="Paste your long text here to summarize..." rows="8" class="modal-input"></textarea>
                        <button class="modal-button">Summarize Text</button>
                        <div class="modal-result">
                            <p class="placeholder-text">Your summary will appear here</p>
                        </div>
                    </div>
                `;
                break;
            case 'translator':
                modalBody.innerHTML = `
                    <div class="modal-tool">
                        <div class="translator-controls">
                            <select class="from-language">
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="it">Italian</option>
                                <option value="pt">Portuguese</option>
                                <option value="ru">Russian</option>
                                <option value="zh">Chinese</option>
                                <option value="ja">Japanese</option>
                                <option value="ko">Korean</option>
                            </select>
                            <button class="swap-languages"><i class="fas fa-exchange-alt"></i></button>
                            <select class="to-language">
                                <option value="en">English</option>
                                <option value="es" selected>Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="it">Italian</option>
                                <option value="pt">Portuguese</option>
                                <option value="ru">Russian</option>
                                <option value="zh">Chinese</option>
                                <option value="ja">Japanese</option>
                                <option value="ko">Korean</option>
                            </select>
                        </div>
                        <textarea placeholder="Enter text to translate..." rows="5" class="modal-input"></textarea>
                        <button class="modal-button">Translate</button>
                        <div class="modal-result">
                            <p class="placeholder-text">Your translation will appear here</p>
                        </div>
                    </div>
                `;
                
                // Add language swap functionality
                const swapBtn = modalBody.querySelector('.swap-languages');
                if (swapBtn) {
                    swapBtn.addEventListener('click', () => {
                        const fromLang = modalBody.querySelector('.from-language');
                        const toLang = modalBody.querySelector('.to-language');
                        const tempValue = fromLang.value;
                        fromLang.value = toLang.value;
                        toLang.value = tempValue;
                    });
                }
                break;
            case 'grammar':
                modalBody.innerHTML = `
                    <div class="modal-tool">
                        <textarea placeholder="Enter text to check grammar and spelling..." rows="8" class="modal-input"></textarea>
                        <button class="modal-button">Check Grammar</button>
                        <div class="modal-result">
                            <p class="placeholder-text">Grammar suggestions will appear here</p>
                        </div>
                    </div>
                `;
                break;
            case 'sentiment':
                modalBody.innerHTML = `
                    <div class="modal-tool">
                        <textarea placeholder="Enter text to analyze sentiment..." rows="8" class="modal-input"></textarea>
                        <button class="modal-button">Analyze Sentiment</button>
                        <div class="modal-result">
                            <p class="placeholder-text">Sentiment analysis will appear here</p>
                        </div>
                    </div>
                `;
                break;
            case 'code-generator':
                modalBody.innerHTML = `
                    <div class="modal-tool">
                        <textarea placeholder="Describe the code you want to generate..." rows="5" class="modal-input"></textarea>
                        <div class="code-options">
                            <select class="code-language">
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="csharp">C#</option>
                                <option value="cpp">C++</option>
                                <option value="php">PHP</option>
                                <option value="ruby">Ruby</option>
                                <option value="swift">Swift</option>
                                <option value="go">Go</option>
                                <option value="rust">Rust</option>
                            </select>
                        </div>
                        <button class="modal-button">Generate Code</button>
                        <div class="modal-result">
                            <p class="placeholder-text">Generated code will appear here</p>
                        </div>
                    </div>
                `;
                break;
            case 'speech-to-text':
                modalBody.innerHTML = `
                    <div class="modal-tool">
                        <div class="speech-controls">
                            <button class="record-btn"><i class="fas fa-microphone"></i> Start Recording</button>
                            <div class="recording-status">Not recording</div>
                        </div>
                        <div class="modal-result">
                            <p class="placeholder-text">Your transcribed text will appear here</p>
                        </div>
                    </div>
                `;
                
                // Add recording functionality
                const recordBtn = modalBody.querySelector('.record-btn');
                const recordingStatus = modalBody.querySelector('.recording-status');
                const result = modalBody.querySelector('.modal-result');
                let mediaRecorder;
                let audioChunks = [];
                let isRecording = false;
                
                if (recordBtn) {
                    recordBtn.addEventListener('click', async () => {
                        if (!isRecording) {
                            try {
                                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                mediaRecorder = new MediaRecorder(stream);
                                audioChunks = [];
                                
                                mediaRecorder.addEventListener('dataavailable', event => {
                                    audioChunks.push(event.data);
                                });
                                
                                mediaRecorder.addEventListener('stop', async () => {
                                    recordingStatus.textContent = 'Processing audio...';
                                    recordingStatus.className = 'recording-status processing';
                                    
                                    try {
                                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                                        const transcript = await ApiService.speechToText(audioBlob);
                                        result.innerHTML = `<p class="transcript">${transcript}</p>`;
                                    } catch (error) {
                                        handleApiError(error, result);
                                    } finally {
                                        recordingStatus.textContent = 'Not recording';
                                        recordingStatus.className = 'recording-status';
                                    }
                                });
                                
                                mediaRecorder.start();
                                isRecording = true;
                                recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
                                recordingStatus.textContent = 'Recording...';
                                recordingStatus.className = 'recording-status active';
                            } catch (error) {
                                console.error('Error accessing microphone:', error);
                                result.innerHTML = `<p class="error-message">Error accessing microphone: ${error.message}</p>`;
                            }
                        } else {
                            mediaRecorder.stop();
                            isRecording = false;
                            recordBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
                        }
                    });
                }
                break;
            case 'text-to-speech':
                modalBody.innerHTML = `
                    <div class="modal-tool">
                        <textarea placeholder="Enter text to convert to speech..." rows="5" class="modal-input"></textarea>
                        <div class="voice-options">
                            <select class="voice-select">
                                <option value="en-US-Wavenet-D">English (US) - Male</option>
                                <option value="en-US-Wavenet-F">English (US) - Female</option>
                                <option value="en-GB-Wavenet-B">English (UK) - Male</option>
                                <option value="en-GB-Wavenet-C">English (UK) - Female</option>
                                <option value="es-ES-Wavenet-B">Spanish - Male</option>
                                <option value="es-ES-Wavenet-C">Spanish - Female</option>
                                <option value="fr-FR-Wavenet-D">French - Male</option>
                                <option value="fr-FR-Wavenet-E">French - Female</option>
                            </select>
                        </div>
                        <button class="modal-button">Generate Speech</button>
                        <div class="modal-result">
                            <p class="placeholder-text">Audio player will appear here</p>
                        </div>
                    </div>
                `;
                break;
            // Add more cases for other tools
            default:
                modalBody.innerHTML = `
                    <div class="modal-tool">
                        <p>This tool is not yet implemented in this demo. In a full implementation, this would connect to an AI API to provide the requested functionality.</p>
                    </div>
                `;
        }

        // Add event listener to the modal button
        const modalButton = modalBody.querySelector('.modal-button');
        if (modalButton) {
            modalButton.addEventListener('click', async function() {
                await processToolRequest(toolType, modalBody);
            });
        }

        // Show the modal
        toolModal.style.display = 'block';
    }

    async function processToolRequest(toolType, modalBody) {
        const input = modalBody.querySelector('.modal-input');
        const result = modalBody.querySelector('.modal-result');
        
        if (!input || !result) return;
        
        const inputText = input.value.trim();
        if (inputText === '') return;
        
        // Show loading state
        result.innerHTML = '<div class="loading-spinner"><div></div><div></div><div></div><div></div></div>';
        
        try {
            switch(toolType) {
                case 'summarizer':
                    const summary = await ApiService.summarizeText(inputText);
                    result.innerHTML = `<div class="result-content">${summary}</div>`;
                    break;
                    
                case 'translator':
                    const targetLang = modalBody.querySelector('.to-language').value;
                    const translation = await ApiService.translateText(inputText, targetLang);
                    const langName = modalBody.querySelector('.to-language').options[modalBody.querySelector('.to-language').selectedIndex].text;
                    result.innerHTML = `
                        <div class="result-content">
                            <h4>Translation to ${langName}:</h4>
                            <p>${translation}</p>
                        </div>
                    `;
                    break;
                    
                case 'grammar':
                    const grammarCheck = await ApiService.checkGrammar(inputText);
                    result.innerHTML = `<div class="result-content">${grammarCheck}</div>`;
                    break;
                    
                case 'sentiment':
                    const sentiment = await ApiService.analyzeSentiment(inputText);
                    const score = sentiment.documentSentiment.score;
                    const magnitude = sentiment.documentSentiment.magnitude;
                    
                    // Determine sentiment category
                    let sentimentCategory;
                    if (score >= 0.25) sentimentCategory = 'Positive';
                    else if (score <= -0.25) sentimentCategory = 'Negative';
                    else sentimentCategory = 'Neutral';
                    
                    // Calculate percentages for visualization
                    const positivePercent = Math.round((score > 0 ? score : 0) * 100);
                    const negativePercent = Math.round((score < 0 ? -score : 0) * 100);
                    const neutralPercent = 100 - positivePercent - negativePercent;
                    
                    result.innerHTML = `
                        <div class="result-content">
                            <h4>Sentiment Analysis:</h4>
                            <div class="sentiment-result">
                                <p><strong>Overall Sentiment:</strong> ${sentimentCategory}</p>
                                <p><strong>Score:</strong> ${score.toFixed(2)} (range: -1 to 1)</p>
                                <p><strong>Magnitude:</strong> ${magnitude.toFixed(2)} (strength of emotion)</p>
                                
                                <div class="sentiment-bars">
                                    <div class="sentiment-bar">
                                        <span class="label">Positive</span>
                                        <div class="bar-container">
                                            <div class="bar positive" style="width: ${positivePercent}%"></div>
                                            <span class="percent">${positivePercent}%</span>
                                        </div>
                                    </div>
                                    <div class="sentiment-bar">
                                        <span class="label">Neutral</span>
                                        <div class="bar-container">
                                            <div class="bar neutral" style="width: ${neutralPercent}%"></div>
                                            <span class="percent">${neutralPercent}%</span>
                                        </div>
                                    </div>
                                    <div class="sentiment-bar">
                                        <span class="label">Negative</span>
                                        <div class="bar-container">
                                            <div class="bar negative" style="width: ${negativePercent}%"></div>
                                            <span class="percent">${negativePercent}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'code-generator':
                    const language = modalBody.querySelector('.code-language').value;
                    const code = await ApiService.generateCode(inputText, language);
                    result.innerHTML = `
                        <div class="result-content">
                            <h4>Generated ${language.toUpperCase()} Code:</h4>
                            <pre class="code-block"><code class="language-${language}">${escapeHtml(code)}</code></pre>
                            <button class="copy-code-btn"><i class="fas fa-copy"></i> Copy Code</button>
                        </div>
                    `;
                    
                    // Add syntax highlighting if Prism.js is available
                    if (window.Prism) {
                        Prism.highlightAll();
                    }
                    
                    // Add copy functionality
                    const copyBtn = result.querySelector('.copy-code-btn');
                    if (copyBtn) {
                        copyBtn.addEventListener('click', () => {
                            const codeText = code;
                            navigator.clipboard.writeText(codeText)
                                .then(() => {
                                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                                    setTimeout(() => {
                                        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Code';
                                    }, 2000);
                                })
                                .catch(err => {
                                    console.error('Failed to copy: ', err);
                                });
                        });
                    }
                    break;
                    
                case 'text-to-speech':
                    const voice = modalBody.querySelector('.voice-select').value;
                    const audioSrc = await ApiService.textToSpeech(inputText, voice);
                    result.innerHTML = `
                        <div class="result-content">
                            <audio controls class="audio-player">
                                <source src="${audioSrc}" type="audio/mp3">
                                Your browser does not support the audio element.
                            </audio>
                            <button class="download-audio-btn"><i class="fas fa-download"></i> Download Audio</button>
                        </div>
                    `;
                    
                    // Add download functionality
                    const downloadAudioBtn = result.querySelector('.download-audio-btn');
                    if (downloadAudioBtn) {
                        downloadAudioBtn.addEventListener('click', () => {
                            const a = document.createElement('a');
                            a.href = audioSrc;
                            a.download = `speech-${Date.now()}.mp3`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        });
                    }
                    break;
                    
                default:
                    result.innerHTML = `<p>This is a simulated response. In a real implementation, this tool would connect to an AI API to process your input and provide results.</p>`;
            }
        } catch (error) {
            handleApiError(error, result);
        }
    }

    // Helper function to escape HTML for code display
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Close modal when clicking the X
    closeModal.addEventListener('click', function() {
        toolModal.style.display = 'none';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', function(e) {
        if (e.target === toolModal) {
            toolModal.style.display = 'none';
        }
    });
});
