import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

/**
 * Firebase Gemini AI Wrapper
 * 模擬 GoogleGenAI 接口，但實際上是呼叫 Firebase Cloud Functions
 * 這樣可以保持前端代碼最小改動
 */

export class FirebaseGenAI {
    public models = {
        /**
         * 生成文字或 JSON 內容
         */
        generateContent: async (config: {
            model: string;
            contents: string;
            config?: {
                responseMimeType?: string;
                responseSchema?: any;
            };
        }) => {
            const generateContent = httpsCallable(functions, 'generateGeminiContent');

            try {
                const result = await generateContent({
                    prompt: config.contents,
                    model: config.model,
                    responseMimeType: config.config?.responseMimeType,
                    schema: config.config?.responseSchema,
                });

                const data = result.data as { text: string };
                return { text: data.text };
            } catch (error: any) {
                console.error('Firebase generateContent error:', error);
                throw new Error(error.message || 'AI 服務發生錯誤');
            }
        }
    };
}

// 導出單例
export const firebaseAI = new FirebaseGenAI();
