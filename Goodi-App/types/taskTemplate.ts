/**
 * Task Template Types
 * 任務範本庫的型別定義
 */

export interface TaskTemplateTask {
    text: string;
    points: number;
    category: '生活' | '家務' | '學習';
    icon: string;
    description: string;
}

export interface TaskTemplate {
    id?: string;
    ageMin: number;
    ageMax: number;
    keyword: string;
    tasks: TaskTemplateTask[];
    usageCount: number;
    createdAt: Date;
}

/**
 * 用於匯入範本的 JSON 格式
 * 這是您用 AI 生成後應該得到的格式
 */
export interface TaskTemplateImport {
    ageRange: [number, number];  // [起始年齡, 結束年齡]
    keyword: string;
    tasks: {
        text: string;
        points: number;
        category: '生活' | '家務' | '學習';
        icon: string;
        description: string;
    }[];
}

/**
 * 將匯入格式轉換為 Firestore 儲存格式
 */
export function convertImportToTemplate(
    importData: TaskTemplateImport
): Omit<TaskTemplate, 'id' | 'createdAt'> {
    return {
        ageMin: importData.ageRange[0],
        ageMax: importData.ageRange[1],
        keyword: importData.keyword,
        tasks: importData.tasks,
        usageCount: 0
    };
}
