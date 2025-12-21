
import { UserData } from '../types';
import { isLifetimePlan, hasPremiumAccess } from '../utils/planUtils';

export interface GeminiApiConfig {
    apiKey: string;
    source: 'goodi' | 'user';
    isValid: boolean;
    lastValidated: Date;
}

/**
 * Validate Gemini API Key by making an actual API call
 * This ensures the key is not only properly formatted but also valid and active
 */
export const validateGeminiApiKey = async (key: string): Promise<boolean> => {
    try {
        // Basic format validation
        if (!key || key.trim().length < 20) {
            return false;
        }

        // Import Gemini SDK dynamically to avoid bundle size impact
        const { GoogleGenerativeAI } = await import('@google/generative-ai');

        // Initialize with the provided API key
        const genAI = new GoogleGenerativeAI(key.trim());
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Make a minimal test call to verify the key works
        const result = await model.generateContent("Test");
        const response = await result.response;
        const text = response.text();

        // If we got a response, the key is valid
        return !!text;
    } catch (error) {
        // Log error without exposing the API key
        console.error('API Key validation failed (safe log - key not shown)');
        return false;
    }
};

export const getGeminiApiConfig = async (userData: UserData): Promise<GeminiApiConfig | null> => {
    if (isLifetimePlan(userData.plan)) {
        if (!userData.geminiApiKey) return null;
        const isValid = await validateGeminiApiKey(userData.geminiApiKey);
        return {
            apiKey: userData.geminiApiKey,
            source: 'user',
            isValid,
            lastValidated: new Date()
        };
    } else if (hasPremiumAccess(userData.plan)) {
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
