import { httpsCallable } from 'firebase/functions';
import { signOut } from 'firebase/auth';
import { functions, auth } from '../firebase';

/**
 * 刪除用戶帳號 - Apple App Store合規要求
 * 
 * 此函數會：
 * 1. 調用Cloud Function刪除所有用戶數據
 * 2. 刪除Firebase Auth帳號
 * 3. 登出用戶
 */
export const deleteUserAccount = async (): Promise<{
    success: boolean;
    message: string;
}> => {
    try {
        // 調用Cloud Function
        const deleteAccountFunction = httpsCallable(functions, 'deleteUserAccount');
        const result = await deleteAccountFunction();

        const data = result.data as { success: boolean; message: string };

        if (data.success) {
            // 成功刪除後，登出用戶
            await signOut(auth);

            return {
                success: true,
                message: '帳號已成功刪除'
            };
        } else {
            return {
                success: false,
                message: data.message || '刪除帳號時發生未知錯誤'
            };
        }
    } catch (error: any) {
        console.error('[Account Deletion] Error:', error);

        // 處理各種錯誤情況
        let errorMessage = '刪除帳號時發生錯誤';

        if (error.code === 'unauthenticated') {
            errorMessage = '請先登入才能刪除帳號';
        } else if (error.code === 'permission-denied') {
            errorMessage = '您沒有權限刪除此帳號';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return {
            success: false,
            message: errorMessage
        };
    }
};
