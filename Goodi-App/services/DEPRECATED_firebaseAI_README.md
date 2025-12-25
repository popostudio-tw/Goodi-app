/**
 * ⚠️ DEPRECATED FILE - DO NOT USE
 * 
 * This file has been deprecated and replaced by:
 * → src/services/apiClient.ts
 * 
 * Migration Guide:
 * ----------------
 * Old: import { FirebaseGenAI } from '../services/firebaseAI';
 *      const ai = new FirebaseGenAI();
 * 
 * New: import { generateGeminiContent } from '../src/services/apiClient';
 *      const result = await generateGeminiContent({ model, prompt, ... });
 * 
 * Key Differences:
 * - New apiClient returns ApiResponse<T> with success/error
 * - Better error handling with specific error types
 * - No need to instantiate a class
 * - Direct function calls with proper TypeScript types
 * 
 * @deprecated Since 2024-12-25
 * @see src/services/apiClient.ts
 */

// This file is kept for reference only
// All calls should be migrated to apiClient.ts
