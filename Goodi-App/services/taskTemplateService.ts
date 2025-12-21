/**
 * Task Template Service
 * 負責查詢和管理任務範本庫
 */

import { db } from '../firebase';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    increment,
    Timestamp,
    orderBy,
    limit
} from 'firebase/firestore';

// 範本資料結構
export interface TaskTemplateTask {
    text: string;
    points: number;
    category: '生活' | '家務' | '學習';
    icon: string;
    description: string;
}

export interface TaskTemplate {
    id?: string;
    ageMin: number;           // 最小年齡
    ageMax: number;           // 最大年齡
    keyword: string;          // 目標關鍵字
    tasks: TaskTemplateTask[];
    usageCount: number;       // 使用次數
    createdAt: Timestamp;
}

const COLLECTION_NAME = 'taskTemplates';

/**
 * 根據年齡和關鍵字查找匹配的範本
 */
export async function findMatchingTemplate(
    userAge: number,
    keyword?: string
): Promise<TaskTemplate | null> {
    try {
        const templatesRef = collection(db, COLLECTION_NAME);

        // 簡化查詢：只按 ageMin 過濾，然後在記憶體中過濾 ageMax
        // 這樣可以避免需要複合索引
        const q = query(
            templatesRef,
            where('ageMin', '<=', userAge),
            limit(20)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        // 在記憶體中過濾符合年齡範圍的範本
        const matchingDocs = snapshot.docs.filter(docSnap => {
            const data = docSnap.data();
            return data.ageMax >= userAge;
        });

        if (matchingDocs.length === 0) {
            return null;
        }

        // 按 usageCount 排序
        matchingDocs.sort((a, b) => {
            const aCount = a.data().usageCount || 0;
            const bCount = b.data().usageCount || 0;
            return bCount - aCount;
        });

        // 如果有關鍵字，進行模糊匹配
        if (keyword) {
            const normalizedKeyword = keyword.toLowerCase().trim();
            for (const docSnap of matchingDocs) {
                const data = docSnap.data() as TaskTemplate;
                const templateKeyword = (data.keyword || '').toLowerCase();

                // 檢查是否包含關鍵字
                if (templateKeyword.includes(normalizedKeyword) ||
                    normalizedKeyword.includes(templateKeyword)) {
                    return { ...data, id: docSnap.id };
                }
            }
            // 有關鍵字但沒有匹配，返回 null 讓 AI 生成
            return null;
        }

        // 若無關鍵字，返回使用次數最高的範本
        const firstDoc = matchingDocs[0];
        return { ...firstDoc.data() as TaskTemplate, id: firstDoc.id };


    } catch (error) {
        console.error('Error finding template:', error);
        return null;
    }
}

/**
 * 記錄範本被使用（增加使用次數）
 */
export async function recordTemplateUsage(templateId: string): Promise<void> {
    try {
        const templateRef = doc(db, COLLECTION_NAME, templateId);
        await updateDoc(templateRef, {
            usageCount: increment(1)
        });
    } catch (error) {
        console.error('Error recording template usage:', error);
    }
}

/**
 * 新增範本到庫中（當 AI 生成新任務時使用）
 */
export async function addTemplate(
    ageMin: number,
    ageMax: number,
    keyword: string,
    tasks: TaskTemplateTask[]
): Promise<string | null> {
    try {
        const newTemplate: Omit<TaskTemplate, 'id'> = {
            ageMin,
            ageMax,
            keyword,
            tasks,
            usageCount: 0,
            createdAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), newTemplate);
        return docRef.id;
    } catch (error) {
        console.error('Error adding template:', error);
        return null;
    }
}

/**
 * 批次匯入範本（用於初始化種子資料）
 */
export async function importTemplates(
    templates: Array<{
        ageMin: number;
        ageMax: number;
        keyword: string;
        tasks: TaskTemplateTask[];
    }>
): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const template of templates) {
        const result = await addTemplate(
            template.ageMin,
            template.ageMax,
            template.keyword,
            template.tasks
        );

        if (result) {
            success++;
        } else {
            failed++;
        }
    }

    return { success, failed };
}
