/**
 * useAiTask Hook
 * 
 * 封装异步 AI 内容生成，使用 Firestore onSnapshot 监听任务状态
 * 配合 Jules 的 refactor/async-ai 架构
 * 
 * 特性：
 * - 自动监听 aiTasks/{taskId} 状态变化
 * - 提供 Goodi 恐龙风格的等待语句
 * - 完整的错误处理
 * 
 * 使用方法：
 * const { isGenerating, result, error, waitingMessage } = useAiTask(taskId);
 */

import { useState, useEffect } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';

/**
 * Goodi 恐龙风格的等待语句库
 * 在 AI 生成过程中随机显示，增加趣味性
 */
const GOODI_WAITING_MESSAGES = [
    '吼吼～Goodi 正在努力思考中...🦖',
    '嘎～让 Goodi 的恐龙大脑转一转...💭',
    '吼嗚！Goodi 正在查阅恐龙百科全书...📚',
    'Goodi 的背鰭正在閃閃發光，靈感來了！✨',
    '嘎嗚～Goodi 正在用恐龍智慧幫你找答案...🔍',
    '吼吼～稍等一下下，Goodi 馬上就好了！⏳',
    'Goodi 的尾巴搖啊搖，想法冒出來了！💡',
    '嘎～Goodi 正在恐龍王國尋找最棒的答案...🏰'
];

/**
 * AI Task 状态接口
 */
interface AiTaskData {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: string;
    error?: string;
    createdAt?: any;
    completedAt?: any;
    userId?: string;
}

/**
 * Hook 返回值接口
 */
interface UseAiTaskReturn {
    isGenerating: boolean;
    result: string | null;
    error: string | null;
    waitingMessage: string;
}

/**
 * useAiTask Hook
 * 
 * @param taskId - AI 任务 ID（从 generateAiContentAsync 返回）
 * @returns { isGenerating, result, error, waitingMessage }
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const [taskId, setTaskId] = useState<string | null>(null);
 *   const { isGenerating, result, error, waitingMessage } = useAiTask(taskId);
 * 
 *   const handleGenerate = async () => {
 *     const id = await generateAiContentAsync({ prompt: "..." });
 *     setTaskId(id);
 *   };
 * 
 *   return (
 *     <div>
 *       {isGenerating && <p>{waitingMessage}</p>}
 *       {result && <p>結果：{result}</p>}
 *       {error && <p>錯誤：{error}</p>}
 *     </div>
 *   );
 * };
 * ```
 */
export const useAiTask = (taskId: string | null): UseAiTaskReturn => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [waitingMessage, setWaitingMessage] = useState('');

    useEffect(() => {
        // 没有 taskId 时重置状态
        if (!taskId) {
            setIsGenerating(false);
            setResult(null);
            setError(null);
            setWaitingMessage('');
            return;
        }

        console.log('[useAiTask] Monitoring task:', taskId);

        // 随机选择一个 Goodi 等待语句
        const randomIndex = Math.floor(Math.random() * GOODI_WAITING_MESSAGES.length);
        setWaitingMessage(GOODI_WAITING_MESSAGES[randomIndex]);
        setIsGenerating(true);
        setResult(null);
        setError(null);

        // 监听 Firestore aiTasks/{taskId}
        const taskRef = doc(db, 'aiTasks', taskId);

        const unsubscribe = onSnapshot(
            taskRef,
            (snapshot) => {
                if (!snapshot.exists()) {
                    console.warn('[useAiTask] Task document not found:', taskId);
                    setError('任務不存在，請重試');
                    setIsGenerating(false);
                    return;
                }

                const data = snapshot.data() as AiTaskData;
                console.log('[useAiTask] Task status updated:', data.status);

                switch (data.status) {
                    case 'pending':
                        // 任务已创建，等待处理
                        setIsGenerating(true);
                        break;

                    case 'processing':
                        // 任务正在处理中
                        setIsGenerating(true);
                        // 可以更换等待语句增加趣味性
                        const newIndex = Math.floor(Math.random() * GOODI_WAITING_MESSAGES.length);
                        setWaitingMessage(GOODI_WAITING_MESSAGES[newIndex]);
                        break;

                    case 'completed':
                        // 任务完成
                        setIsGenerating(false);
                        setResult(data.result || null);
                        setError(null);
                        console.log('[useAiTask] Task completed successfully');
                        break;

                    case 'failed':
                        // 任务失败
                        setIsGenerating(false);
                        setResult(null);
                        setError(data.error || 'AI 生成失敗，請稍後再試');
                        console.error('[useAiTask] Task failed:', data.error);
                        break;

                    default:
                        console.warn('[useAiTask] Unknown task status:', data.status);
                }
            },
            (err) => {
                console.error('[useAiTask] Firestore error:', err);
                setIsGenerating(false);
                setError('資料連線異常，請檢查網路');
            }
        );

        // 清理监听
        return () => {
            console.log('[useAiTask] Cleaning up listener for task:', taskId);
            unsubscribe();
        };
    }, [taskId]);

    return {
        isGenerating,
        result,
        error,
        waitingMessage
    };
};

/**
 * 辅助函数：生成异步 AI 任务
 * 
 * 注意：这个函数需要 Jules 实现 generateAiContentAsync
 * 目前只是占位符，展示预期的 API
 * 
 * @param options - AI 生成选项
 * @returns taskId - 返回任务 ID 用于监听
 * 
 * @example
 * ```tsx
 * const taskId = await generateAiContentAsync({
 *   prompt: "请生成一段鼓励的话",
 *   userId: currentUser.uid,
 *   source: "task"
 * });
 * ```
 */
export interface GenerateAiContentOptions {
    prompt: string;
    userId?: string;
    source?: string;
    model?: string;
    config?: any;
}

// 占位符函数 - Jules 需要实现真实的 API 调用
export const generateAiContentAsync = async (
    options: GenerateAiContentOptions
): Promise<string> => {
    try {
        console.log('[generateAiContentAsync] Calling createAiTask with options:', options);

        const createAiTask = httpsCallable(functions, 'createAiTask');
        const response = await createAiTask(options);

        const data = response.data as { taskId: string };

        if (!data || !data.taskId) {
            console.error('[generateAiContentAsync] Invalid response:', response);
            throw new Error('Invalid response from createAiTask: missing taskId');
        }

        console.log('[generateAiContentAsync] Task created successfully:', data.taskId);
        return data.taskId;

    } catch (error: any) {
        console.error('[generateAiContentAsync] Error creating task:', error);
        throw error;
    }
};
