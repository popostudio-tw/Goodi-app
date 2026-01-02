/**
 * Admin 权限管理 Cloud Function
 * 
 * 用于设置和管理 Firebase Custom Claims (admin 权限)
 * 只有超级管理员可以调用
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

/**
 * 超级管理员 Email 白名单
 * 只有这些 Email 可以设置其他用户为 Admin
 */
const SUPER_ADMIN_EMAILS = [
    'popo.studio@msa.hinet.net',  // 主要管理员
    // 可以在此处添加更多超级管理员 email
];

/**
 * setAdminClaim - 设置用户的 Admin 权限
 * 
 * @param data.targetUserId - 要设置为 Admin 的用户 ID
 * @param data.isAdmin - true 设置为 Admin，false 移除 Admin
 * @returns { success: boolean, message: string }
 */
export const setAdminClaim = onCall(async (request) => {
    const { data, auth } = request;

    // 1. 验证调用者是否已登录
    if (!auth) {
        throw new HttpsError(
            "unauthenticated",
            "必须登录才能执行此操作"
        );
    }

    // 2. 验证调用者是否为超级管理员
    const callerEmail = auth.token.email || '';

    if (!SUPER_ADMIN_EMAILS.includes(callerEmail)) {
        console.warn(`[setAdminClaim] Unauthorized attempt by ${callerEmail}`);
        throw new HttpsError(
            "permission-denied",
            "只有超级管理员可以设置 Admin 权限"
        );
    }

    // 3. 验证输入参数
    const { targetUserId, isAdmin } = data;

    if (!targetUserId || typeof targetUserId !== 'string') {
        throw new HttpsError(
            "invalid-argument",
            "缺少或无效的 targetUserId 参数"
        );
    }

    if (typeof isAdmin !== 'boolean') {
        throw new HttpsError(
            "invalid-argument",
            "isAdmin 必须是 boolean 类型"
        );
    }

    try {
        // 4. 设置或移除 Custom Claims
        const authInstance = getAuth();

        if (isAdmin) {
            // 设置为 Admin
            await authInstance.setCustomUserClaims(targetUserId, { admin: true });
            console.log(`[setAdminClaim] ✅ User ${targetUserId} is now an admin (set by ${callerEmail})`);

            return {
                success: true,
                message: `用户 ${targetUserId} 已设置为管理员`
            };
        } else {
            // 移除 Admin 权限
            await authInstance.setCustomUserClaims(targetUserId, { admin: false });
            console.log(`[setAdminClaim] ✅ User ${targetUserId} admin removed (by ${callerEmail})`);

            return {
                success: true,
                message: `用户 ${targetUserId} 的管理员权限已移除`
            };
        }

    } catch (error: any) {
        console.error(`[setAdminClaim] Error:`, error);
        throw new HttpsError(
            "internal",
            `设置失败: ${error.message}`
        );
    }
});

/**
 * checkAdminStatus - 检查当前用户是否为 Admin
 * 
 * @returns { isAdmin: boolean, email: string }
 */
export const checkAdminStatus = onCall(async (request) => {
    const { auth } = request;

    if (!auth) {
        throw new HttpsError("unauthenticated", "请先登录");
    }

    const isAdmin = auth.token.admin === true;
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(auth.token.email || '');

    return {
        isAdmin,
        isSuperAdmin,
        email: auth.token.email || '',
        uid: auth.uid
    };
});

/**
 * listAdmins - 列出所有 Admin 用户（仅超级管理员可用）
 * 
 * @returns { admins: Array<{ uid, email }> }
 */
export const listAdmins = onCall(async (request) => {
    const { auth } = request;

    if (!auth) {
        throw new HttpsError("unauthenticated", "请先登录");
    }

    // 只有超级管理员可以查看
    if (!SUPER_ADMIN_EMAILS.includes(auth.token.email || '')) {
        throw new HttpsError("permission-denied", "只有超级管理员可以查看 Admin 列表");
    }

    try {
        const authInstance = getAuth();
        const admins: Array<{ uid: string; email: string | undefined }> = [];

        // 列出所有用户（分批处理）
        let pageToken: string | undefined;

        do {
            const listResult = await authInstance.listUsers(1000, pageToken);

            for (const user of listResult.users) {
                const claims = user.customClaims;
                if (claims && claims.admin === true) {
                    admins.push({
                        uid: user.uid,
                        email: user.email
                    });
                }
            }

            pageToken = listResult.pageToken;
        } while (pageToken);

        return { admins };

    } catch (error: any) {
        console.error(`[listAdmins] Error:`, error);
        throw new HttpsError("internal", `查询失败: ${error.message}`);
    }
});
