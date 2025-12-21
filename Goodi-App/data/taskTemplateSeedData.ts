/**
 * 任務範本種子資料
 * 由 AI 生成，用於初始化 Firestore taskTemplates 集合
 */

import { TaskTemplateTask } from '../types/taskTemplate';

// 定義圖示映射（emoji -> URL）
const ICON_MAP: Record<string, string> = {
    '🎒': 'https://api.iconify.design/twemoji/school-backpack.svg',
    '🌱': 'https://api.iconify.design/twemoji/seedling.svg',
    '🧸': 'https://api.iconify.design/twemoji/teddy-bear.svg',
    '🍽️': 'https://api.iconify.design/twemoji/fork-and-knife-with-plate.svg',
    '👟': 'https://api.iconify.design/twemoji/running-shoe.svg',
    '🧹': 'https://api.iconify.design/twemoji/broom.svg',
    '📚': 'https://api.iconify.design/twemoji/books.svg',
    '🦷': 'https://api.iconify.design/twemoji/tooth.svg',
    '🛏️': 'https://api.iconify.design/twemoji/bed.svg',
    '🧺': 'https://api.iconify.design/twemoji/basket.svg',
    '📖': 'https://api.iconify.design/twemoji/open-book.svg',
    '✏️': 'https://api.iconify.design/twemoji/pencil.svg',
    '⏰': 'https://api.iconify.design/twemoji/alarm-clock.svg',
    '🏃': 'https://api.iconify.design/twemoji/person-running.svg',
    '🎨': 'https://api.iconify.design/twemoji/artist-palette.svg',
    '🎵': 'https://api.iconify.design/twemoji/musical-note.svg',
    '🐕': 'https://api.iconify.design/twemoji/dog-face.svg',
    '🌻': 'https://api.iconify.design/twemoji/sunflower.svg',
    '🧼': 'https://api.iconify.design/twemoji/soap.svg',
    '👕': 'https://api.iconify.design/twemoji/t-shirt.svg',
    '🚿': 'https://api.iconify.design/twemoji/shower.svg',
    '🪥': 'https://api.iconify.design/twemoji/toothbrush.svg',
    '🧽': 'https://api.iconify.design/twemoji/sponge.svg',
    '🗑️': 'https://api.iconify.design/twemoji/wastebasket.svg',
    '📝': 'https://api.iconify.design/twemoji/memo.svg',
    '🎯': 'https://api.iconify.design/twemoji/direct-hit.svg',
    '🏠': 'https://api.iconify.design/twemoji/house.svg',
    '🧥': 'https://api.iconify.design/twemoji/coat.svg',
};

export interface SeedTemplate {
    ageRange: [number, number];
    keyword: string;
    tasks: {
        text: string;
        points: number;
        category?: string;
        icon: string;
        description: string;
    }[];
}

/**
 * 轉換種子資料為正確格式
 */
export function convertSeedData(seed: SeedTemplate): {
    ageMin: number;
    ageMax: number;
    keyword: string;
    tasks: TaskTemplateTask[];
} {
    return {
        ageMin: seed.ageRange[0],
        ageMax: seed.ageRange[1],
        keyword: seed.keyword,
        tasks: seed.tasks.map(task => ({
            text: task.text,
            points: task.points,
            category: (task.category as '生活' | '家務' | '學習') || '生活',
            icon: ICON_MAP[task.icon] || 'https://api.iconify.design/twemoji/star.svg',
            description: task.description,
        })),
    };
}

// ===== 種子資料 =====

export const SEED_TEMPLATES: SeedTemplate[] = [
    // ========== 5-6 歲 (15 組) ==========
    {
        "ageRange": [5, 6],
        "keyword": "責任感",
        "tasks": [
            { "text": "收好玩具", "points": 2, "category": "生活", "icon": "🧸", "description": "把玩具放回家，代表你是可靠的小隊長！" },
            { "text": "幫家人拿拖鞋", "points": 3, "category": "家務", "icon": "👟", "description": "主動幫家人準備，你是貼心的小幫手！" },
            { "text": "穿好外套", "points": 1, "category": "生活", "icon": "🧥", "description": "天氣變冷自己穿好外套，保護自己的身體！" },
            { "text": "照顧小植物", "points": 3, "category": "生活", "icon": "🌱", "description": "每天澆水一次，小生命會因你更茁壯！" },
            { "text": "擺好鞋子", "points": 2, "category": "生活", "icon": "👟", "description": "把鞋子排整齊，你正在成為值得信任的人！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "時間管理",
        "tasks": [
            { "text": "準時吃飯", "points": 2, "category": "生活", "icon": "🍽️", "description": "乖乖吃飯，讓身體有力氣一起成長！" },
            { "text": "準時關電視", "points": 2, "category": "生活", "icon": "📺", "description": "學會控制娛樂時間，你很自律！" },
            { "text": "收睡前玩具", "points": 1, "category": "生活", "icon": "🧸", "description": "在睡覺前收玩具，明天會開心再玩！" },
            { "text": "準時睡覺", "points": 3, "category": "生活", "icon": "🛏️", "description": "早睡讓大腦休息，你明天會更有精神！" },
            { "text": "五分鐘整理桌", "points": 2, "category": "生活", "icon": "🧹", "description": "用五分鐘整理小桌子，讓一天更清爽！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "整潔習慣",
        "tasks": [
            { "text": "洗手搓泡泡", "points": 2, "category": "生活", "icon": "🧼", "description": "雙手乾淨不生病，好習慣讓你更健康！" },
            { "text": "放好外套", "points": 2, "category": "生活", "icon": "🧥", "description": "把衣服掛好，你讓空間更舒服！" },
            { "text": "摺好小毛巾", "points": 3, "category": "生活", "icon": "🧺", "description": "摺好毛巾，讓小物住在整齊的家！" },
            { "text": "擺好清潔用品", "points": 3, "category": "生活", "icon": "🧴", "description": "把毋巾牙刷擺整齊，浴室更整潔！" },
            { "text": "丟垃圾入桶", "points": 1, "category": "生活", "icon": "🗑️", "description": "垃圾不落地，你是整潔小超人！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "自主性",
        "tasks": [
            { "text": "自己穿襪子", "points": 2, "category": "生活", "icon": "👟", "description": "自己完成一件事，就是很棒的成長！" },
            { "text": "選今天衣服", "points": 2, "category": "生活", "icon": "👕", "description": "今天穿什麼你來決定，你有自己的選擇！" },
            { "text": "吃飯不催促", "points": 2, "category": "生活", "icon": "🍽️", "description": "自己吃飯不拖延，是獨立的表現！" },
            { "text": "收玩具分類", "points": 3, "category": "生活", "icon": "🧸", "description": "把東西分好類，你的思考很清楚！" },
            { "text": "自己開書包", "points": 2, "category": "生活", "icon": "🎒", "description": "學會開拉鍊，你的雙手越來越靈活！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "生活規律",
        "tasks": [
            { "text": "起床整理衣服", "points": 2, "category": "生活", "icon": "👕", "description": "起床後整理衣物，讓一天從整齊開始！" },
            { "text": "嗝一杯温開水", "points": 2, "category": "生活", "icon": "🫖", "description": "早上先嗝水，身體更健康！" },
            { "text": "睡前洗澡", "points": 3, "category": "生活", "icon": "🚿", "description": "洗香香再睡，整個身體都放鬆！" },
            { "text": "用完桌面清", "points": 2, "category": "生活", "icon": "🧽", "description": "吃飯後擦桌子，環境更舒服！" },
            { "text": "衣服放洗籃", "points": 1, "category": "家務", "icon": "🧺", "description": "把髒衣放洗衣籃，你守住自己規律！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "專注力",
        "tasks": [
            { "text": "專心畫五分鐘", "points": 2, "category": "學習", "icon": "🎨", "description": "安靜畫畫，你的腦袋正在集中力量！" },
            { "text": "聽故事不插話", "points": 3, "category": "學習", "icon": "📖", "description": "認真聽故事，會聽到更多精彩內容！" },
            { "text": "寫字三行", "points": 3, "category": "學習", "icon": "✏️", "description": "慢慢寫字，大腦和手都變厲害了！" },
            { "text": "專心拼圖十分鐘", "points": 4, "category": "學習", "icon": "🎯", "description": "持續完成拼圖，你的思考很集中！" },
            { "text": "計時做一件事", "points": 2, "category": "生活", "icon": "⏰", "description": "專注做完一件小任務，很值得開心！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "閱讀習慣",
        "tasks": [
            { "text": "每天看繪本", "points": 3, "category": "學習", "icon": "📚", "description": "故事讓你更聰明，每天都很期待！" },
            { "text": "讀一本10分鐘", "points": 3, "category": "學習", "icon": "📖", "description": "坐下來讀書，你的腦袋正在吸收知識！" },
            { "text": "挑一本新書", "points": 2, "category": "學習", "icon": "📚", "description": "勇敢選新故事，你會發現更多驚喜！" },
            { "text": "講故事給家人聽", "points": 3, "category": "學習", "icon": "📖", "description": "分享故事，你的表達能力越來越好！" },
            { "text": "整理書本", "points": 1, "category": "生活", "icon": "🧹", "description": "排整齊書本，書會更想陪你學習！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "學習動機",
        "tasks": [
            { "text": "回答一個問題", "points": 2, "category": "學習", "icon": "📝", "description": "敢舉手回答，是最棒的勇氣！" },
            { "text": "抄寫五個字", "points": 3, "category": "學習", "icon": "✏️", "description": "抄字練習，你正在累積力量！" },
            { "text": "完成小作業", "points": 4, "category": "學習", "icon": "📖", "description": "把任務做完，你離成功更近！" },
            { "text": "專心聽老師說", "points": 2, "category": "學習", "icon": "📚", "description": "聽懂一步，你會走更遠！" },
            { "text": "自己收鉛筆盒", "points": 1, "category": "學習", "icon": "✏️", "description": "整理文具，你準備好開始學習！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "創造力",
        "tasks": [
            { "text": "畫一幅作品", "points": 3, "category": "學習", "icon": "🎨", "description": "用顏色表現想像，你的創意好精彩！" },
            { "text": "寫一句新句子", "points": 3, "category": "學習", "icon": "📝", "description": "寫下一句話，你正在創造新世界！" },
            { "text": "做一個摺紙", "points": 3, "category": "學習", "icon": "🎯", "description": "摺紙練手部能力，也訓練想像力！" },
            { "text": "唱一首歌", "points": 2, "category": "生活", "icon": "🎵", "description": "唱歌讓心情更快樂，你的聲音很棒！" },
            { "text": "畫角色表情", "points": 2, "category": "學習", "icon": "🎨", "description": "表情角色讓你更會觀察情緒！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "解決問題",
        "tasks": [
            { "text": "自己穿鞋扣", "points": 3, "category": "生活", "icon": "👟", "description": "慢慢來，你已經在學習解決問題！" },
            { "text": "拼圖完成一面", "points": 4, "category": "學習", "icon": "🎯", "description": "找到答案很棒，你的大腦在運動！" },
            { "text": "分類玩具", "points": 2, "category": "生活", "icon": "🧸", "description": "找出分類方法，你很會思考！" },
            { "text": "自己找到衣物", "points": 2, "category": "生活", "icon": "👕", "description": "能找到東西，是一個好能力！" },
            { "text": "想一個替代方案", "points": 3, "category": "學習", "icon": "📝", "description": "事情有其他辦法，你已經在解題了！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "同理心",
        "tasks": [
            { "text": "安慰同伴", "points": 3, "category": "生活", "icon": "🌻", "description": "給他一句溫暖，你是善良的小朋友！" },
            { "text": "分享玩具", "points": 3, "category": "生活", "icon": "🧸", "description": "一起玩更開心，你的分享很珍貴！" },
            { "text": "替家人倒水", "points": 2, "category": "家務", "icon": "🍽️", "description": "幫忙做一點小事，讓別人開心得笑！" },
            { "text": "摸摸寵物", "points": 2, "category": "生活", "icon": "🐕", "description": "溫柔對待小動物，它會很安心！" },
            { "text": "說一句謝謝", "points": 1, "category": "生活", "icon": "🌻", "description": "一句感謝會照亮別人的一天！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "情緒管理",
        "tasks": [
            { "text": "深呼吸三次", "points": 2, "category": "生活", "icon": "⏰", "description": "呼吸慢下來，你的心會更舒服！" },
            { "text": "生氣先停一下", "points": 3, "category": "生活", "icon": "🛏️", "description": "停一下再說，情緒就更能被照顧！" },
            { "text": "用語言表達", "points": 3, "category": "生活", "icon": "📝", "description": "說出心情，大人更懂你！" },
            { "text": "聽首音樂冷靜", "points": 2, "category": "生活", "icon": "🎵", "description": "音樂會幫你慢慢安定下來！" },
            { "text": "抱抱自己", "points": 2, "category": "生活", "icon": "🛏️", "description": "給自己力量，你值得被愛！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "團隊合作",
        "tasks": [
            { "text": "一起玩遊戲", "points": 2, "category": "生活", "icon": "🎯", "description": "一起完成挑戰，合作讓人更強！" },
            { "text": "一起收玩具", "points": 3, "category": "生活", "icon": "🧸", "description": "分工合作更快，每人都很重要！" },
            { "text": "合力拼圖", "points": 4, "category": "學習", "icon": "🎯", "description": "一起完成拼圖，彼此越來越厲害！" },
            { "text": "幫忙小隊排隊", "points": 2, "category": "生活", "icon": "🏃", "description": "排好隊讓大家一起前進！" },
            { "text": "互相稱讚", "points": 2, "category": "生活", "icon": "🌻", "description": "一句稱讚讓彼此心裡好溫暖！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "禮貌禮儀",
        "tasks": [
            { "text": "說請謝謝", "points": 1, "category": "生活", "icon": "🌻", "description": "一句好話讓你變得更討喜！" },
            { "text": "不搶玩具", "points": 2, "category": "生活", "icon": "🧸", "description": "等一下再玩，你很尊重別人！" },
            { "text": "排隊不推人", "points": 3, "category": "生活", "icon": "🏃", "description": "保持距離是友善和安全的表現！" },
            { "text": "吃飯不出聲", "points": 2, "category": "生活", "icon": "🍽️", "description": "安靜吃飯，讓用餐更舒服！" },
            { "text": "打招呼問好", "points": 2, "category": "生活", "icon": "🌻", "description": "一句問候讓每天都變亮！" }
        ]
    },
    {
        "ageRange": [5, 6],
        "keyword": "感恩惜福",
        "tasks": [
            { "text": "寫謝謝卡", "points": 3, "category": "學習", "icon": "📝", "description": "用卡片表達心意，讓愛被看見！" },
            { "text": "不浪費食物", "points": 3, "category": "生活", "icon": "🍽️", "description": "珍惜每一口，就是愛惜資源！" },
            { "text": "幫家人服務", "points": 2, "category": "家務", "icon": "🍽️", "description": "付出一點點，讓彼此更靠近！" },
            { "text": "珍惜玩具", "points": 2, "category": "生活", "icon": "🧸", "description": "愛護玩具，讓它陪你更久！" },
            { "text": "把舊衣放好", "points": 2, "category": "家務", "icon": "🧺", "description": "把衣服收好，就是感謝自己的擁有！" }
        ]
    },
    // ========== 7-8 歲 (15 組) ==========
    {
        "ageRange": [7, 8],
        "keyword": "責任感",
        "tasks": [
            { "text": "整理書桌區", "points": 3, "category": "生活", "icon": "🧹", "description": "乾淨的桌面讓你能更快找到需要的東西！" },
            { "text": "照顧家中植物", "points": 3, "category": "生活", "icon": "🌱", "description": "每天澆水一次，生命因你而茁壯！" },
            { "text": "紀錄家中用品消耗", "points": 3, "category": "家務", "icon": "📝", "description": "觀察和紀錄，你越來越懂生活！" },
            { "text": "協助收垃圾", "points": 2, "category": "家務", "icon": "🗑️", "description": "幫忙把垃圾集中，是家的小幫手！" },
            { "text": "按時餵寵物", "points": 4, "category": "生活", "icon": "🐕", "description": "照顧毛孩，你的責任感很讓人放心！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "時間管理",
        "tasks": [
            { "text": "準時起床", "points": 3, "category": "生活", "icon": "⏰", "description": "按時開始一天，你會有更多事情能完成！" },
            { "text": "吃飯不拖拉", "points": 2, "category": "生活", "icon": "🍽️", "description": "專心吃飯，身體會更有力量！" },
            { "text": "設定做事時段", "points": 4, "category": "生活", "icon": "⏰", "description": "抓住時間，你會懂得掌控生活！" },
            { "text": "先做作業再玩", "points": 5, "category": "學習", "icon": "✏️", "description": "先完成責任，再享受玩樂，你很成熟！" },
            { "text": "10分鐘整理房間", "points": 3, "category": "生活", "icon": "🧹", "description": "短短10分鐘就能創造整齊的空間！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "整潔習慣",
        "tasks": [
            { "text": "摺好自己的衣服", "points": 3, "category": "生活", "icon": "👕", "description": "摺好衣服讓房間變得更舒服！" },
            { "text": "用完擦桌上殘渣", "points": 2, "category": "生活", "icon": "🧽", "description": "用布擦一下，小地方讓生活更美好！" },
            { "text": "書本歸位", "points": 2, "category": "生活", "icon": "📚", "description": "讓書回到架上，你在為大腦整理知識！" },
            { "text": "衣物分洗衣籃", "points": 2, "category": "家務", "icon": "🧺", "description": "乾淨衣服從分類開始，你做得很棒！" },
            { "text": "房間地面簡掃", "points": 3, "category": "家務", "icon": "🧹", "description": "掃一下地板，就能讓房間更舒服！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "自主性",
        "tasks": [
            { "text": "自主完成早餐", "points": 4, "category": "生活", "icon": "🍽️", "description": "自己準備一份小早餐，感覺很自豪！" },
            { "text": "自己選今天服裝", "points": 2, "category": "生活", "icon": "👕", "description": "你的選擇展現風格，很有主見！" },
            { "text": "自己洗澡", "points": 3, "category": "生活", "icon": "🚿", "description": "學會清潔身體，是重要的自我照顧！" },
            { "text": "獨立做功課", "points": 4, "category": "學習", "icon": "✏️", "description": "不用提醒就完成，你靠自己做到了！" },
            { "text": "帶好出門用品", "points": 2, "category": "生活", "icon": "🎒", "description": "記得帶東西出門，代表你在成長！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "生活規律",
        "tasks": [
            { "text": "按時上床睡覺", "points": 4, "category": "生活", "icon": "🛏️", "description": "睡得好，身體和頭腦才能好好成長！" },
            { "text": "固定閱讀時段", "points": 3, "category": "學習", "icon": "📖", "description": "每天有一段讀書時間，你的知識在累積！" },
            { "text": "洗澡守流程", "points": 2, "category": "生活", "icon": "🚿", "description": "洗澡順序做對，你更有效率！" },
            { "text": "每日運動十分鐘", "points": 2, "category": "生活", "icon": "🏃", "description": "動一動身體，讓你更有精神！" },
            { "text": "用餐後清桌面", "points": 2, "category": "家務", "icon": "🧽", "description": "吃飽後整理桌面，你保持了規律！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "專注力",
        "tasks": [
            { "text": "15分鐘專心閱讀", "points": 4, "category": "學習", "icon": "📚", "description": "安靜讀書，你的大腦全速運轉中！" },
            { "text": "20分鐘寫功課", "points": 4, "category": "學習", "icon": "✏️", "description": "集中注意力，你的效率會越來越高！" },
            { "text": "不分心畫畫", "points": 3, "category": "學習", "icon": "🎨", "description": "保持專注，作品會更精彩！" },
            { "text": "計時完成任務", "points": 3, "category": "生活", "icon": "⏰", "description": "短時間集中，是訓練腦力的好方法！" },
            { "text": "安靜聽人說話", "points": 2, "category": "生活", "icon": "🌻", "description": "傾聽很重要，你展現出成熟與禮貌！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "閱讀習慣",
        "tasks": [
            { "text": "每天讀15分鐘", "points": 4, "category": "學習", "icon": "📖", "description": "固定讀書讓你累積詞彙，是一種力量！" },
            { "text": "大聲朗讀一段", "points": 3, "category": "學習", "icon": "📚", "description": "開口朗讀能訓練語感，自信大幅提升！" },
            { "text": "與家人共讀", "points": 3, "category": "學習", "icon": "📖", "description": "有人陪著讀書，會更享受文字的陪伴！" },
            { "text": "挑戰新故事", "points": 3, "category": "學習", "icon": "📚", "description": "閱讀不同內容，你的想像變得更廣！" },
            { "text": "整理書架排序", "points": 2, "category": "生活", "icon": "🧹", "description": "書有家，你才有更容易開始的地方！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "學習動機",
        "tasks": [
            { "text": "完成一課功課", "points": 4, "category": "學習", "icon": "✏️", "description": "你在挑戰學習，你的成果值得肯定！" },
            { "text": "問老師一問題", "points": 3, "category": "學習", "icon": "📝", "description": "敢發問代表你想進步，你很勇敢！" },
            { "text": "自己查字典", "points": 4, "category": "學習", "icon": "📚", "description": "自己找答案，是學習最好的方法！" },
            { "text": "紀錄今天學到", "points": 3, "category": "學習", "icon": "📝", "description": "將心得寫下，你會看見自己的成長！" },
            { "text": "整理鉛筆盒", "points": 2, "category": "生活", "icon": "✏️", "description": "工具整齊，學習的心也更堅定！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "創造力",
        "tasks": [
            { "text": "畫一幅主題畫", "points": 4, "category": "學習", "icon": "🎨", "description": "主題作品展現你的想像力！" },
            { "text": "寫三句新句子", "points": 4, "category": "學習", "icon": "📝", "description": "創作句子，你在建造自己的文字世界！" },
            { "text": "創造角色故事", "points": 5, "category": "學習", "icon": "📖", "description": "角色故事能拓展思考，你已經是小作家！" },
            { "text": "唱熟一首歌", "points": 3, "category": "生活", "icon": "🎵", "description": "音樂讓創意流動，你的聲音充滿力量！" },
            { "text": "做一份手工", "points": 4, "category": "生活", "icon": "🎨", "description": "從無到有，你讓想像成真！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "解決問題",
        "tasks": [
            { "text": "自己找答案", "points": 4, "category": "學習", "icon": "📚", "description": "靠自己解惑，比背答案還厲害！" },
            { "text": "完成拼圖任務", "points": 4, "category": "學習", "icon": "🎯", "description": "邏輯在啟動，你的腦袋在突破！" },
            { "text": "處理小失誤", "points": 3, "category": "生活", "icon": "🧼", "description": "先整理再處理，你展現成熟了！" },
            { "text": "試兩種方法", "points": 4, "category": "學習", "icon": "📝", "description": "方法越多，成功機會越高！" },
            { "text": "遇到難題不放棄", "points": 3, "category": "生活", "icon": "⏰", "description": "多嘗試一下，你的心會更強大！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "同理心",
        "tasks": [
            { "text": "傾聽朋友感受", "points": 4, "category": "生活", "icon": "🌻", "description": "願意聆聽就是在讓人覺得被理解！" },
            { "text": "與弟妹分享玩具", "points": 3, "category": "生活", "icon": "🧸", "description": "分享代表心裡有別人，你很貼心！" },
            { "text": "幫忙拿餐具", "points": 2, "category": "家務", "icon": "🍽️", "description": "小小幫忙會讓餐桌更溫暖！" },
            { "text": "撫摸寵物陪伴", "points": 2, "category": "生活", "icon": "🐕", "description": "小生命因你而覺得安心！" },
            { "text": "主動問句需要嗎", "points": 3, "category": "生活", "icon": "🌻", "description": "一句關心會讓人覺得被重視！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "情緒管理",
        "tasks": [
            { "text": "練五次深呼吸", "points": 3, "category": "生活", "icon": "⏰", "description": "呼吸能安撫身體，你越來越懂照顧自己！" },
            { "text": "生氣先停30秒", "points": 4, "category": "生活", "icon": "🛏️", "description": "停下來讓情緒更安全，也讓自己冷靜！" },
            { "text": "寫下心情一句", "points": 3, "category": "學習", "icon": "📝", "description": "用文字理解心情，是成熟的能力！" },
            { "text": "播放安靜音樂", "points": 2, "category": "生活", "icon": "🎵", "description": "音樂能安慰心，你值得放鬆！" },
            { "text": "說出困惑感受", "points": 3, "category": "生活", "icon": "🌻", "description": "表達情緒讓身邊的人能更懂你！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "團隊合作",
        "tasks": [
            { "text": "分工整理房間", "points": 3, "category": "家務", "icon": "🧹", "description": "團隊合作，速度更快也更開心！" },
            { "text": "一起完成拼圖", "points": 4, "category": "學習", "icon": "🎯", "description": "有人陪著思考，你的智力在升級！" },
            { "text": "幫同伴拿物品", "points": 2, "category": "生活", "icon": "🌻", "description": "一起完成任務，彼此能更信任！" },
            { "text": "排隊守秩序", "points": 3, "category": "生活", "icon": "🏃", "description": "等候是尊重，隊伍更順暢！" },
            { "text": "一起唱歌遊戲", "points": 2, "category": "生活", "icon": "🎵", "description": "合作的快樂永遠大於獨自完成！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "禮貌禮儀",
        "tasks": [
            { "text": "說請謝對不起", "points": 2, "category": "生活", "icon": "🌻", "description": "你的禮貌是社交最美的開始！" },
            { "text": "不打斷別人說話", "points": 3, "category": "生活", "icon": "🌻", "description": "尊重發言是成熟的表現！" },
            { "text": "吃飯不發出聲音", "points": 2, "category": "生活", "icon": "🍽️", "description": "安靜用餐能讓周圍更舒服！" },
            { "text": "看到長輩問好", "points": 2, "category": "生活", "icon": "🌻", "description": "一聲問候能讓對方一整天都愉快！" },
            { "text": "不搶東西", "points": 2, "category": "生活", "icon": "🧸", "description": "等待是尊重，別人會更喜歡和你相處！" }
        ]
    },
    {
        "ageRange": [7, 8],
        "keyword": "感恩惜福",
        "tasks": [
            { "text": "記下一件感謝", "points": 3, "category": "學習", "icon": "📝", "description": "寫下感恩，你會更珍惜今天！" },
            { "text": "不浪費食物", "points": 3, "category": "生活", "icon": "🍽️", "description": "珍惜每一份食物，是對資源的珍惜！" },
            { "text": "整理不要衣物", "points": 2, "category": "家務", "icon": "🧺", "description": "整理讓物品重新被需要！" },
            { "text": "向家人道謝", "points": 2, "category": "生活", "icon": "🌻", "description": "一句謝謝會照亮家人心裡的位置！" },
            { "text": "珍惜文具", "points": 2, "category": "生活", "icon": "✏️", "description": "文具有力量，愛惜才能陪你更久！" }
        ]
    },
    // ========== 9-10 歲 (15 組) ==========
    {
        "ageRange": [9, 10],
        "keyword": "責任感",
        "tasks": [
            { "text": "自己準備明日用品", "points": 4, "category": "生活", "icon": "🎒", "description": "提前準備能避免慌亂，你正在學習負責！" },
            { "text": "每週整理房間", "points": 4, "category": "生活", "icon": "🧹", "description": "保持整潔是自我管理的重要能力！" },
            { "text": "餵食寵物並紀錄", "points": 5, "category": "生活", "icon": "🐕", "description": "穩定照顧生命，是深刻的責任感！" },
            { "text": "督導弟妹收拾玩具", "points": 3, "category": "生活", "icon": "🧸", "description": "帶領他人建立習慣，你做到了榜樣角色！" },
            { "text": "洗餐後自己的碗", "points": 3, "category": "家務", "icon": "🍽️", "description": "自理餐具讓你成為家的好隊友！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "時間管理",
        "tasks": [
            { "text": "安排課後時段表", "points": 5, "category": "學習", "icon": "⏰", "description": "每一天的安排越清晰，效率越高！" },
            { "text": "功課前先列清單", "points": 4, "category": "學習", "icon": "📝", "description": "列清單能避免遺漏，也能更快完成！" },
            { "text": "玩前先完成一件任務", "points": 3, "category": "生活", "icon": "⏰", "description": "先努力再娛樂，讓快樂更踏實！" },
            { "text": "運用番茄鐘15分鐘", "points": 4, "category": "學習", "icon": "⏰", "description": "短時間集中能訓練耐力和效率！" },
            { "text": "每天睡前檢查明日待辦", "points": 3, "category": "生活", "icon": "📝", "description": "小檢查能讓你明天更沉著！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "整潔習慣",
        "tasks": [
            { "text": "週末整理衣物抽屜", "points": 4, "category": "生活", "icon": "👕", "description": "井然有序會提升你的品味與效率！" },
            { "text": "浴室用後擦乾地面", "points": 3, "category": "家務", "icon": "🧽", "description": "安全和整潔，你都照顧到了！" },
            { "text": "將文具排序分類", "points": 2, "category": "學習", "icon": "✏️", "description": "文具井然有序，學習才能順暢！" },
            { "text": "每日丟棄廢紙屑", "points": 2, "category": "生活", "icon": "🗑️", "description": "小動作能讓環境逐步變亮！" },
            { "text": "換季整理衣物", "points": 3, "category": "生活", "icon": "🧺", "description": "你在照顧自己的生活品質！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "自主性",
        "tasks": [
            { "text": "自己完成洗澡流程", "points": 3, "category": "生活", "icon": "🚿", "description": "洗澡順序清楚表示你能獨立照顧自己！" },
            { "text": "自行決定閱讀主題", "points": 3, "category": "學習", "icon": "📚", "description": "你開始主導自己的學習旅程！" },
            { "text": "自己配早餐內容", "points": 4, "category": "生活", "icon": "🍽️", "description": "營養組合讓你更懂身體需要什麼！" },
            { "text": "負責收拾自己的空間", "points": 3, "category": "生活", "icon": "🧹", "description": "收拾空間，就是整理自己內在！" },
            { "text": "為自己設定一週目標", "points": 4, "category": "學習", "icon": "📝", "description": "設定目標是成長的重要能力！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "生活規律",
        "tasks": [
            { "text": "睡眠固定時段", "points": 4, "category": "生活", "icon": "🛏️", "description": "規律作息讓你更聰明也更健康！" },
            { "text": "運動十五分鐘", "points": 3, "category": "生活", "icon": "🏃", "description": "運動激發大腦與體力，是好習慣！" },
            { "text": "每週整理文具盒", "points": 2, "category": "學習", "icon": "✏️", "description": "整齊的工具讓學習更順暢！" },
            { "text": "固定洗頭日", "points": 2, "category": "生活", "icon": "🚿", "description": "乾淨舒服，你也更自信！" },
            { "text": "維護自己的檢查清單", "points": 3, "category": "學習", "icon": "📝", "description": "建立自己的系統，讓生活更有條理！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "專注力",
        "tasks": [
            { "text": "設定學習專注時段", "points": 4, "category": "學習", "icon": "⏰", "description": "有計畫的學習，讓思考更敏銳！" },
            { "text": "無分心完成作業", "points": 5, "category": "學習", "icon": "✏️", "description": "一口氣完成是強大專注力的證明！" },
            { "text": "關閉桌面分心物", "points": 3, "category": "生活", "icon": "🧹", "description": "減少干擾，你掌握了自控能力！" },
            { "text": "一次只做一件事", "points": 3, "category": "生活", "icon": "⏰", "description": "專心是一種力量，你正在培養它！" },
            { "text": "聆聽五分鐘不插話", "points": 2, "category": "生活", "icon": "🌻", "description": "尊重與專注讓你更受歡迎！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "閱讀習慣",
        "tasks": [
            { "text": "每週完成一本書", "points": 5, "category": "學習", "icon": "📚", "description": "一本書就是一個世界，你在探索更多宇宙！" },
            { "text": "閱讀後寫心得", "points": 4, "category": "學習", "icon": "📝", "description": "反思內容讓學習變深度！" },
            { "text": "大聲朗讀一段", "points": 3, "category": "學習", "icon": "📖", "description": "語感越好，你的表達越自然！" },
            { "text": "推薦一本書給家人", "points": 3, "category": "生活", "icon": "🌻", "description": "分享知識是最棒的交流！" },
            { "text": "整理個人書目", "points": 2, "category": "生活", "icon": "🧹", "description": "紀錄閱讀成果，看見自己的累積！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "學習動機",
        "tasks": [
            { "text": "列出本週學習目標", "points": 4, "category": "學習", "icon": "📝", "description": "方向清晰，內在就更願意努力！" },
            { "text": "解一題挑戰題", "points": 5, "category": "學習", "icon": "🎯", "description": "挑戰會增加你的自信與能力！" },
            { "text": "寫三種筆記法", "points": 4, "category": "學習", "icon": "📚", "description": "筆記方式影響理解，你做到了應變！" },
            { "text": "固定學習桌時間", "points": 3, "category": "學習", "icon": "⏰", "description": "固定時間讓動力自然形成！" },
            { "text": "紀錄錯題並改善", "points": 4, "category": "學習", "icon": "✏️", "description": "改錯才是真正的進步！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "創造力",
        "tasks": [
            { "text": "寫一篇短文", "points": 5, "category": "學習", "icon": "📖", "description": "文字能創造世界，你的想像正在成形！" },
            { "text": "自製小手工品", "points": 4, "category": "生活", "icon": "🎨", "description": "從材料到作品，是創造者的冒險！" },
            { "text": "重新設計一角色", "points": 4, "category": "學習", "icon": "🎨", "description": "角色改編展現你的創作自由！" },
            { "text": "創作旋律五句", "points": 4, "category": "生活", "icon": "🎵", "description": "音符是情緒的語言，你做得真棒！" },
            { "text": "設計三個問題", "points": 3, "category": "學習", "icon": "📝", "description": "提問能力就是創造力量！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "解決問題",
        "tasks": [
            { "text": "遇難題找兩方法", "points": 4, "category": "學習", "icon": "📝", "description": "方法越多，成功率越高！" },
            { "text": "完成高難拼圖", "points": 5, "category": "學習", "icon": "🎯", "description": "過程就代表你在讓大腦升級！" },
            { "text": "整理心煩原因", "points": 3, "category": "生活", "icon": "🌻", "description": "理解情緒是解決事情的第一步！" },
            { "text": "獨立查資料", "points": 4, "category": "學習", "icon": "📚", "description": "越會查詢，越能掌控知識！" },
            { "text": "完成挑戰數學題", "points": 4, "category": "學習", "icon": "✏️", "description": "不怕挑戰是很了不起的能力！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "同理心",
        "tasks": [
            { "text": "聆聽朋友煩惱", "points": 4, "category": "生活", "icon": "🌻", "description": "真正的傾聽是一種溫柔與力量！" },
            { "text": "與弟妹分享點心", "points": 3, "category": "生活", "icon": "🍽️", "description": "一起吃會讓心更靠近！" },
            { "text": "替家人端餐具", "points": 2, "category": "家務", "icon": "🍽️", "description": "一份主動的協助會帶來微笑！" },
            { "text": "記住他人喜好", "points": 3, "category": "生活", "icon": "🌻", "description": "用心記住別人，就是在呵護關係！" },
            { "text": "照顧受傷小動物", "points": 4, "category": "生活", "icon": "🐕", "description": "善良是最難得的勇氣！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "情緒管理",
        "tasks": [
            { "text": "練習放慢語速", "points": 3, "category": "生活", "icon": "🌻", "description": "慢下來能讓你更理解自己要說什麼！" },
            { "text": "完成五分鐘冥想", "points": 4, "category": "生活", "icon": "⏰", "description": "專注呼吸讓心思更穩定！" },
            { "text": "寫三句情緒理解", "points": 3, "category": "學習", "icon": "📝", "description": "把情緒拆解，你更能掌控！" },
            { "text": "用音樂平緩情緒", "points": 3, "category": "生活", "icon": "🎵", "description": "你給自己一種更柔軟的方式！" },
            { "text": "先說我覺得句型", "points": 3, "category": "生活", "icon": "🌻", "description": "用語言表達心情是成熟的重要一步！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "團隊合作",
        "tasks": [
            { "text": "分工打掃房間", "points": 3, "category": "家務", "icon": "🧹", "description": "分工合作讓速度加倍！" },
            { "text": "與隊友完成任務", "points": 4, "category": "學習", "icon": "🎯", "description": "彼此依靠，挑戰更有成就！" },
            { "text": "協助隊友整理資料", "points": 4, "category": "學習", "icon": "📚", "description": "協助就是在成就整個團隊！" },
            { "text": "遵守隊伍秩序", "points": 2, "category": "生活", "icon": "🏃", "description": "井然有序讓每個人安全前進！" },
            { "text": "稱讚他人表現", "points": 2, "category": "生活", "icon": "🌻", "description": "一句肯定能建立互相信任！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "禮貌禮儀",
        "tasks": [
            { "text": "主動開口問候", "points": 2, "category": "生活", "icon": "🌻", "description": "問候是最簡單的尊重，卻很珍貴！" },
            { "text": "用請與謝字眼", "points": 2, "category": "生活", "icon": "🌻", "description": "禮貌表現你的成熟度與氣質！" },
            { "text": "排隊不推擠", "points": 2, "category": "生活", "icon": "🏃", "description": "安全始於禮貌！" },
            { "text": "餐桌輕聲細語", "points": 3, "category": "生活", "icon": "🍽️", "description": "安靜的用餐環境讓大家都很舒適！" },
            { "text": "不搶他人物品", "points": 2, "category": "生活", "icon": "🧸", "description": "尊重他人就是最美的禮儀！" }
        ]
    },
    {
        "ageRange": [9, 10],
        "keyword": "感恩惜福",
        "tasks": [
            { "text": "寫三件感謝事項", "points": 4, "category": "學習", "icon": "📝", "description": "感恩會讓心更柔軟，也更強大！" },
            { "text": "珍惜餐桌食物", "points": 3, "category": "生活", "icon": "🍽️", "description": "尊重食物就是尊重付出的人！" },
            { "text": "整理可捐贈物品", "points": 4, "category": "家務", "icon": "🧺", "description": "讓物品重新找到需要的人！" },
            { "text": "向家人道謝行動", "points": 2, "category": "生活", "icon": "🌻", "description": "感謝的力量會改變關係的溫度！" },
            { "text": "愛惜個人文具", "points": 2, "category": "生活", "icon": "✏️", "description": "珍惜身邊所有，就能擁有更多幸福！" }
        ]
    },
    // ========== 11-12 歲 (15 組) ==========
    {
        "ageRange": [11, 12],
        "keyword": "責任感",
        "tasks": [
            { "text": "制定個人學習計畫", "points": 4, "category": "學習", "icon": "📝", "description": "規劃自己的學習目標，是成熟的表現！" },
            { "text": "固定照顧寵物", "points": 5, "category": "生活", "icon": "🐕", "description": "按時餵食與清理環境，讓生命因你安心。" },
            { "text": "主動完成家務", "points": 4, "category": "家務", "icon": "🧹", "description": "不等提醒就動手，是成熟的責任表現。" },
            { "text": "維護個人空間", "points": 3, "category": "生活", "icon": "🛏️", "description": "房間整潔代表你也重視自己與生活。" },
            { "text": "長期堅持一任務", "points": 5, "category": "學習", "icon": "🎯", "description": "連續完成同一目標，訓練穩定與耐心。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "時間管理",
        "tasks": [
            { "text": "規劃一週行程", "points": 5, "category": "學習", "icon": "📝", "description": "安排讀書與休息時間，學會掌控步調。" },
            { "text": "每日檢視待辦", "points": 4, "category": "生活", "icon": "⏰", "description": "睡前看一次待辦，明天行程更清楚。" },
            { "text": "限制娛樂時數", "points": 3, "category": "生活", "icon": "🎯", "description": "適量玩樂，讓你有時間追求更多可能。" },
            { "text": "先難後易完成作業", "points": 4, "category": "學習", "icon": "✏️", "description": "先處理困難題目，訓練勇氣與效率。" },
            { "text": "為重要考試排程", "points": 5, "category": "學習", "icon": "📚", "description": "拆成小步驟準備，壓力會變得可管理。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "整潔習慣",
        "tasks": [
            { "text": "每晚整理書桌", "points": 3, "category": "生活", "icon": "🧹", "description": "清空桌面與紙屑，明天學習更專心。" },
            { "text": "衣物分類收納", "points": 3, "category": "生活", "icon": "🧺", "description": "將衣物依類放好，生活看起來更有序。" },
            { "text": "整理抽屜與文具", "points": 3, "category": "學習", "icon": "✏️", "description": "文具定位清楚，做事就不會手忙腳亂。" },
            { "text": "共用空間自覺整理", "points": 4, "category": "家務", "icon": "🧽", "description": "隨手整理客廳與桌面，家人都更舒服。" },
            { "text": "定期清理舊物", "points": 4, "category": "生活", "icon": "🗑️", "description": "丟掉不用的東西，為新的成長空間。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "自主性",
        "tasks": [
            { "text": "自己安排早晨流程", "points": 4, "category": "生活", "icon": "⏰", "description": "從起床到出門按表走，你就是行程主人。" },
            { "text": "獨立完成作業檢查", "points": 4, "category": "學習", "icon": "📖", "description": "寫完自己再檢查一遍，負責又可靠。" },
            { "text": "主動規劃興趣時間", "points": 3, "category": "生活", "icon": "🎨", "description": "安排喜歡的活動，是對自己人生的選擇。" },
            { "text": "制定自我要求規則", "points": 5, "category": "生活", "icon": "🎯", "description": "寫下想堅持的標準，並努力實踐它們。" },
            { "text": "自行準備簡單餐點", "points": 4, "category": "家務", "icon": "🍽️", "description": "自己動手做一餐，能力與自信都在成長。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "生活規律",
        "tasks": [
            { "text": "固定就寢起床時刻", "points": 4, "category": "生活", "icon": "🛏️", "description": "穩定作息讓大腦與身體都更有精神。" },
            { "text": "建立每日運動習慣", "points": 4, "category": "生活", "icon": "🏃", "description": "每天活動一下身體，讓自己更有活力。" },
            { "text": "三餐定時不亂吃", "points": 3, "category": "生活", "icon": "🍽️", "description": "規律飲食是長高與健康的重要基礎。" },
            { "text": "洗澡流程不跳步驟", "points": 2, "category": "生活", "icon": "🚿", "description": "從洗頭到沖乾淨，學會完整照顧自己。" },
            { "text": "每日固定閱讀時段", "points": 4, "category": "學習", "icon": "📚", "description": "在同一時間讀書，規律會讓你更專心。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "專注力",
        "tasks": [
            { "text": "單次專心讀書三十分", "points": 5, "category": "學習", "icon": "📖", "description": "長時間不分心閱讀，是很強大的能力。" },
            { "text": "寫功課不滑手機", "points": 4, "category": "學習", "icon": "✏️", "description": "把注意力留給題目，進步會明顯加快。" },
            { "text": "番茄鐘專注寫題目", "points": 4, "category": "學習", "icon": "⏰", "description": "短暫專心加休息，讓大腦持續有精神。" },
            { "text": "上課全程專心聽講", "points": 5, "category": "學習", "icon": "📚", "description": "不插話不東張西望，學習效率大升級。" },
            { "text": "專心完成一幅畫作", "points": 3, "category": "學習", "icon": "🎨", "description": "從開始畫到結束，練習把心放在當下。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "閱讀習慣",
        "tasks": [
            { "text": "每週閱讀兩本書籍", "points": 5, "category": "學習", "icon": "📚", "description": "持續閱讀會讓你的想法與詞彙變更豐富。" },
            { "text": "讀後寫短篇心得文", "points": 4, "category": "學習", "icon": "📝", "description": "把想法寫下來，讓思考變得更清楚。" },
            { "text": "與家人分享書內容", "points": 3, "category": "生活", "icon": "🌻", "description": "說出重點與感受，是很棒的表達練習。" },
            { "text": "主動借新主題書籍", "points": 4, "category": "學習", "icon": "📖", "description": "嘗試不同題材，幫自己打開更大世界。" },
            { "text": "整理個人閱讀清單", "points": 3, "category": "學習", "icon": "📝", "description": "列出已讀與想讀，看到自己的累積。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "學習動機",
        "tasks": [
            { "text": "設定本月學習目標", "points": 5, "category": "學習", "icon": "🎯", "description": "把目標寫清楚，努力方向就更明確。" },
            { "text": "主動複習薄弱科目", "points": 4, "category": "學習", "icon": "📚", "description": "不逃避弱項，是成長很重要的一步。" },
            { "text": "主動向師長請教", "points": 4, "category": "學習", "icon": "📝", "description": "願意問問題，代表你真的想變得更好。" },
            { "text": "每日完成一個進步點", "points": 3, "category": "學習", "icon": "✏️", "description": "哪怕小小一步，只要持續就是大改變。" },
            { "text": "記錄今日學到亮點", "points": 3, "category": "學習", "icon": "📖", "description": "回想一天收穫，會看到自己越來越強。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "創造力",
        "tasks": [
            { "text": "寫一篇原創短故事", "points": 5, "category": "學習", "icon": "📖", "description": "讓角色與世界從腦中跑到紙上。" },
            { "text": "設計一幅主題海報", "points": 4, "category": "學習", "icon": "🎨", "description": "用圖像與文字傳達訊息，訓練設計思維。" },
            { "text": "編寫一小段歌詞", "points": 4, "category": "生活", "icon": "🎵", "description": "把心情寫成歌，讓情緒有新的出口。" },
            { "text": "為日常物品想新用途", "points": 3, "category": "生活", "icon": "🎯", "description": "試著跳脫原本用法，訓練創意思考。" },
            { "text": "提出三個有趣問題", "points": 3, "category": "學習", "icon": "📝", "description": "好問題往往比答案更重要也更有創意。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "解決問題",
        "tasks": [
            { "text": "為困難題寫思考步驟", "points": 4, "category": "學習", "icon": "✏️", "description": "拆解步驟能讓看起來困難的事變簡單。" },
            { "text": "遇挫折先自我檢視", "points": 4, "category": "生活", "icon": "🌻", "description": "先想想哪裡出錯，是成熟又冷靜的做法。" },
            { "text": "查資料找三種解法", "points": 5, "category": "學習", "icon": "📚", "description": "不同方法比較後，選一個最適合的。" },
            { "text": "跟家人討論解決方案", "points": 3, "category": "生活", "icon": "📝", "description": "一起討論會讓你看到更多角度與可能。" },
            { "text": "記錄一次成功解決經驗", "points": 3, "category": "學習", "icon": "🎯", "description": "寫下過去的成功，讓以後遇事更有信心。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "同理心",
        "tasks": [
            { "text": "主動關心同學近況", "points": 3, "category": "生活", "icon": "🌻", "description": "一句問候能讓別人感覺被看見與在乎。" },
            { "text": "聽完再回應他人意見", "points": 3, "category": "生活", "icon": "🌻", "description": "先聽完再說，是對他人很大的尊重。" },
            { "text": "幫忙家人分擔工作", "points": 4, "category": "家務", "icon": "🧹", "description": "看到別人辛苦時，願意伸手一起完成。" },
            { "text": "設身處地想別人感受", "points": 4, "category": "生活", "icon": "📝", "description": "試著用對方的角度想，理解會加深關係。" },
            { "text": "溫和表達不同立場", "points": 4, "category": "生活", "icon": "🌻", "description": "不同意時仍保持尊重，是成熟的溝通方式。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "情緒管理",
        "tasks": [
            { "text": "不順時先深呼吸十下", "points": 3, "category": "生活", "icon": "⏰", "description": "給自己一些時間冷靜，再決定怎麼反應。" },
            { "text": "寫情緒日記三行", "points": 3, "category": "學習", "icon": "📝", "description": "把感受寫下來，比悶在心裡更健康。" },
            { "text": "找到讓自己放鬆方式", "points": 4, "category": "生活", "icon": "🎵", "description": "聽音樂或靜坐，找到適合你的安靜角落。" },
            { "text": "用我感到句型溝通", "points": 4, "category": "生活", "icon": "🌻", "description": "說出我感到而不是你怎樣，能減少衝突。" },
            { "text": "生氣時避免說重話", "points": 4, "category": "生活", "icon": "🛏️", "description": "先讓情緒降溫，再決定要說的內容。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "團隊合作",
        "tasks": [
            { "text": "在小組中主動分工", "points": 4, "category": "學習", "icon": "🎯", "description": "看見工作就幫忙分配，是領導的重要一步。" },
            { "text": "完成一次小組報告", "points": 5, "category": "學習", "icon": "📚", "description": "把大家的想法整合，是很難得的能力。" },
            { "text": "協助隊友補上進度", "points": 4, "category": "學習", "icon": "📝", "description": "拉隊友一把，同時也讓整個團隊更完整。" },
            { "text": "尊重不同意見表達", "points": 3, "category": "生活", "icon": "🌻", "description": "不急著反駁，先理解對方在想什麼。" },
            { "text": "共同完成家庭打掃", "points": 3, "category": "家務", "icon": "🧹", "description": "一起掃地與整理，感覺就像小小團隊任務。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "禮貌禮儀",
        "tasks": [
            { "text": "向長輩主動問候寒暄", "points": 3, "category": "生活", "icon": "🌻", "description": "有禮貌的問候會讓人覺得被尊重與重視。" },
            { "text": "公共場合音量控制", "points": 3, "category": "生活", "icon": "🍽️", "description": "注意說話音量，是對周圍人的貼心。" },
            { "text": "接受提醒不頂嘴", "points": 4, "category": "生活", "icon": "🛏️", "description": "先聽完提醒再回應，是成熟的反應方式。" },
            { "text": "使用請謝對不起語", "points": 2, "category": "生活", "icon": "🌻", "description": "這些簡單的詞，會讓你顯得很有教養。" },
            { "text": "尊重他人物品界線", "points": 3, "category": "生活", "icon": "🧸", "description": "借用前先詢問，是對他人最基本的尊重。" }
        ]
    },
    {
        "ageRange": [11, 12],
        "keyword": "感恩惜福",
        "tasks": [
            { "text": "每日寫下一件感謝事", "points": 4, "category": "學習", "icon": "📝", "description": "練習看見好事，心裡會變得更穩定。" },
            { "text": "珍惜使用學習資源", "points": 3, "category": "學習", "icon": "📚", "description": "書本與課程都是資源，要好好把握。" },
            { "text": "不浪費家中食物", "points": 3, "category": "生活", "icon": "🍽️", "description": "想到有人沒有吃飽，就更願意珍惜。" },
            { "text": "整理可捐給別人的物品", "points": 4, "category": "家務", "icon": "🧺", "description": "把用不到的東西，變成他人的幫助。" },
            { "text": "主動向家人表達感謝", "points": 3, "category": "生活", "icon": "🌻", "description": "說出謝謝，你也會感覺自己被愛著。" }
        ]
    }
];



