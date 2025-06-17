// Import configuration
import config from './config.js';

// API Service class to handle all API interactions
class ApiService {
    // Chat API
    static async getChatResponse(message, history = []) {
        // If no API key, return a simulated response
        if (!config.openaiApiKey) {
            console.log('Using simulated chat response (no API key provided)');
            return `This is a simulated AI response to: "${message}". To use real AI responses, please configure your API keys.`;
        }
        
        try {
            const response = await fetch(config.openaiApiUrl + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: config.defaultChatModel,
                    messages: [
                        ...history,
                        { role: 'user', content: message }
                    ],
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error calling chat API:', error);
            throw error;
        }
    }

    // Image generation API
    static async generateImage(prompt, size = config.defaultImageSize, style = 'vivid', styleDisabled = true, provider = 'flux') {
        // If no API key, return a placeholder image
        if (!config.openaiApiKey) {
            console.log('Using simulated image generation (no API key provided)');
            // Return a placeholder image with the prompt text
            return `https://via.placeholder.com/${size.replace('x', '/')}?text=${encodeURIComponent(prompt)}`;
        }
        
        try {
            console.log(`Generating image with provider: ${provider}`);
            
            // Append the style to the prompt if style IS enabled (checkbox is checked) and not realistic/vivid
            let enhancedPrompt = prompt;
            if (styleDisabled === false && style && style !== 'realistic' && style !== 'vivid') {
                enhancedPrompt = `${prompt}, ${style} style`;
            }
            
            console.log('Enhanced prompt:', enhancedPrompt);
            console.log('Using size:', size);
            
            // Map provider to model name
            const modelMap = {
                'flux': 'provider-2/FLUX.1-schnell',
                'dall-e-3': 'provider-5/dall-e-3',
                'shuttle-3.1': 'provider-3/shuttle-3.1-aesthetic'
            };
    
            const modelName = modelMap[provider] || config.defaultImageModel;
            
            // For A4F provider, use the correct endpoint for image generation
            const response = await fetch(`${config.dallEApiUrl}/images/generations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: modelName,
                    prompt: enhancedPrompt,
                    n: 1,
                    size: size,
                    // Don't send style parameter as we've incorporated it into the prompt
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Image generation error response:', errorData);
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Image generation response:', data);
            
            // Handle different response formats
            if (data.data && data.data[0] && data.data[0].url) {
                return data.data[0].url;
            } else if (data.url) {
                return data.url;
            } else if (data.images && data.images[0]) {
                return data.images[0].url || data.images[0];
            } else {
                console.error('Unexpected response format:', data);
                throw new Error('Unexpected response format from image API');
            }
        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    }

    // Text summarization API
    static async summarizeText(text) {
        try {
            const response = await fetch(config.openaiApiUrl + '/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo-instruct',
                    prompt: `Summarize the following text:\n\n${text}`,
                    max_tokens: 300,
                    temperature: 0.5
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].text.trim();
        } catch (error) {
            console.error('Error summarizing text:', error);
            throw error;
        }
    }

    // Translation API
    static async translateText(text, targetLanguage) {
        try {
            const response = await fetch(`${config.translateApiUrl}?key=${config.googleTranslateApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    target: targetLanguage
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.data.translations[0].translatedText;
        } catch (error) {
            console.error('Error translating text:', error);
            throw error;
        }
    }

    // Grammar check API (using OpenAI)
    static async checkGrammar(text) {
        try {
            const response = await fetch(config.openaiApiUrl + '/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo-instruct',
                    prompt: `Check and correct the grammar in the following text. Return the corrected text and a list of corrections made:\n\n${text}`,
                    max_tokens: 500,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].text.trim();
        } catch (error) {
            console.error('Error checking grammar:', error);
            throw error;
        }
    }

    // Sentiment analysis API
    static async analyzeSentiment(text) {
        try {
            const response = await fetch(`${config.textAnalysisApiUrl}?key=${config.textAnalysisApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    document: {
                        type: 'PLAIN_TEXT',
                        content: text
                    },
                    encodingType: 'UTF8'
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error analyzing sentiment:', error);
            throw error;
        }
    }

    // Code generation API
    static async generateCode(description, language) {
        try {
            const response = await fetch(config.openaiApiUrl + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: config.defaultChatModel,
                    messages: [
                        { 
                            role: 'system', 
                            content: `You are a code generation assistant. Generate ${language} code based on the user's description. Only return the code without explanations.` 
                        },
                        { role: 'user', content: description }
                    ],
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error generating code:', error);
            throw error;
        }
    }

    // Speech to text API
    static async speechToText(audioBlob) {
        try {
            // Convert audio blob to base64
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            
            const base64Audio = await new Promise((resolve) => {
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
            });

            const response = await fetch(`${config.speechToTextApiUrl}?key=${config.speechApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    config: {
                        encoding: 'WEBM_OPUS',
                        sampleRateHertz: 48000,
                        languageCode: 'en-US',
                    },
                    audio: {
                        content: base64Audio
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.results[0].alternatives[0].transcript;
        } catch (error) {
            console.error('Error converting speech to text:', error);
            throw error;
        }
    }

    // Text to speech API
    static async textToSpeech(text, voice = 'en-US-Wavenet-D') {
        try {
            const response = await fetch(`${config.textToSpeechApiUrl}?key=${config.speechApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: {
                        text: text
                    },
                    voice: {
                        languageCode: voice.split('-')[0] + '-' + voice.split('-')[1],
                        name: voice
                    },
                    audioConfig: {
                        audioEncoding: 'MP3'
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return 'data:audio/mp3;base64,' + data.audioContent;
        } catch (error) {
            console.error('Error converting text to speech:', error);
            throw error;
        }
    }
}

export default ApiService;
