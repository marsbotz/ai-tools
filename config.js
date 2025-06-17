// Configuration for API keys and endpoints
const config = {
    // API Keys - hardcoded for development (empty for simulation)
    openaiApiKey: 'ddc-a4f-4a86371bd0e0484485efef2bfa12a619',  // Remove process.env references
    dallEApiKey: 'ddc-a4f-4a86371bd0e0484485efef2bfa12a619',
    //dallEApiKey: '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',
    googleTranslateApiKey: '',
    textAnalysisApiKey: '',
    speechApiKey: '',



    
    // API Endpoints
    openaiApiUrl: 'https://api.a4f.co/v1',
    //dallEApiUrl: 'https://openrouter.ai/api/v1',
    dallEApiUrl: 'https://api.a4f.co/v1',  // Base URL, endpoint will be added in the service
    translateApiUrl: 'https://translation.googleapis.com/language/translate/v2',
    textAnalysisApiUrl: 'https://language.googleapis.com/v1/documents:analyzeSentiment',
    speechToTextApiUrl: 'https://speech.googleapis.com/v1/speech:recognize',
    textToSpeechApiUrl: 'https://texttospeech.googleapis.com/v1/text:synthesize',
    
    // Default model settings
    defaultChatModel: 'provider-2/gpt-3.5-turbo',
    defaultImageModel: 'provider-1/FLUX.1-schnell',  // Default to FLUX model
    defaultImageSize: '512x512',
    
    // Rate limiting and caching
    apiRequestTimeout: 30000, // 30 seconds
    cacheExpiration: 3600000, // 1 hour in milliseconds
};

export default config;
