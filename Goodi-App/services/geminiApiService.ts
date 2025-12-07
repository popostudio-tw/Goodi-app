
import { UserData } from '../types';

export interface GeminiApiConfig {
    apiKey: string;
    source: 'goodi' | 'user';
    isValid: boolean;
    lastValidated: Date;
}

// This is a mock validation function. In a real application, you would make an API call to Google AI Studio to validate the key.
export const validateGeminiApiKey = async (key: string): Promise<boolean> => {
    if (key && key.length > 10) {
        return true;
    }
    return false;
};

export const getGeminiApiConfig = async (userData: UserData): Promise<GeminiApiConfig | null> => {
    if (userData.plan.includes('lifetime')) {
        if (!userData.geminiApiKey) return null;
        const isValid = await validateGeminiApiKey(userData.geminiApiKey);
        return {
            apiKey: userData.geminiApiKey,
            source: 'user',
            isValid,
            lastValidated: new Date()
        };
    } else if (userData.plan.includes('premium')) {
        // In a real app, you'd fetch this from a secure backend.
        const goodiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
        return {
            apiKey: goodiApiKey,
            source: 'goodi',
            isValid: true,
            lastValidated: new Date()
        };
    }
    return null;
};

export const setUserGeminiApiKey = async (userId: string, key: string): Promise<void> => {
    // Here you would typically update the user's data in your database (e.g., Firestore)
    console.log(`Setting Gemini API key for user ${userId}`);
    // Example: await firestore.collection('users').doc(userId).update({ geminiApiKey: key });
};

export const callGeminiApi = async (config: GeminiApiConfig, prompt: string): Promise<string> => {
    if (!config.isValid) {
        return 'Error: Invalid API Key';
    }
    // Mock API call
    console.log(`Calling Gemini API with prompt: ${prompt}`);
    return `Mock response for: ${prompt}`;
}; 
