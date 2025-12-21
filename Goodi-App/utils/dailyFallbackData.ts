
export interface DailyContent {
    todayInHistory: string;
    animalTrivia: string;
}

export const BASELINE_CONTENT: DailyContent[] = [
    {
        todayInHistory: "1903年12月17日，萊特兄弟成功進行了人類歷史上第一次有動力的飛行，開啟了航空時代的新紀元。",
        animalTrivia: "你知道嗎？長頸鹿的舌頭是深藍紫色的，而且長達45公分，這能保護牠們在進食高處樹葉時不被太陽曬傷喔！"
    },
    {
        todayInHistory: "1969年7月20日，阿波羅11號成功登陸月球，航太員尼爾·阿姆斯壯成為第一位踏上月球表面的人類。",
        animalTrivia: "章魚有三個心臟！其中兩個負責將血液輸送到鰓，另一個則負責將血液輸送到全身器官。"
    },
    {
        todayInHistory: "1886年10月28日，由法國贈送給美國的自由女神像在紐約港正式揭幕，象徵著自由與民主。",
        animalTrivia: "海獺在睡覺時會手牽著手，這樣牠們才不會在睡夢中被海流沖散，這是不是很溫馨呢？"
    },
    {
        todayInHistory: "1945年10月24日，《聯合國憲章》正式生效，聯合國正式成立，致力於維護世界和平與安全。",
        animalTrivia: "蜜蜂是世界上唯一會製造人類可以食用食物的昆蟲。一隻蜜蜂一輩子只能產出約十二分之一茶匙的蜂蜜。"
    },
    {
        todayInHistory: "1928年11月18日，世界第一部有聲動畫片《汽船威利號》在紐約上映，米老鼠正式誕生！",
        animalTrivia: "大象是唯一不會跳躍的哺乳動物。雖然牠們體型巨大，但牠們可是游泳高手喔！"
    },
    {
        todayInHistory: "1990年4月24日，哈伯太空望遠鏡由發現號太空梭發射升空，讓我們能看到百億光年外的星系影像。",
        animalTrivia: "企鵝其實有膝蓋喔！只是因為牠們的脂肪和羽毛太厚了，所以我們平時看不出來。"
    },
    {
        todayInHistory: "1867年3月30日，美國以720萬美元從俄羅斯手中購買了阿拉斯加，這被稱為人類歷史上最划算的土地交易之一。",
        animalTrivia: "蝸牛雖然走得很慢，但牠們可以連續睡覺長達三年之久，是動物界的神級瞌睡蟲！"
    },
    {
        todayInHistory: "1752年6月15日，班傑明·富蘭克林在雷雨中放風箏，證明了雷電就是電，並隨後發明了避雷針。",
        animalTrivia: "海馬是動物界中唯一由爸爸負責懷孕和生產的物種，海馬爸爸一次可以生出上千隻小海馬呢！"
    },
    {
        todayInHistory: "1895年12月28日，盧米埃兄弟在巴黎進行了世界上第一次商業電影放映，象徵著電影時代的開始。",
        animalTrivia: "北極熊的皮膚其實是黑色的！牠們看起來是白色是因為羽毛是透明細管，反射光線造成的偽裝。"
    },
    {
        todayInHistory: "1922年11月4日，英國考古學家霍華德·卡特在埃及發現了圖坦卡門法老的陵墓，震撼了全世界。",
        animalTrivia: "袋鼠在跳躍時不能倒退走路。牠們強壯的後腿和尾巴是專門為了向前跳躍而設計的。"
    }
];

export const getBaselineForDate = (dateStr: string): DailyContent => {
    // Use day of the year to pick a consistent baseline item
    const date = new Date(dateStr);
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
    return BASELINE_CONTENT[dayOfYear % BASELINE_CONTENT.length];
};

export const getLocalGoodiResponse = (topic: string): string => {
    const defaults: Record<string, string> = {
        "yesterday": "昨天你是個努力的孩子！Goodi 陪你一起紀錄進步的足跡。",
        "greeting": "嘿！今天也要開心地學習與遊戲喔！",
        "encouragement": "別忘了，每一小步都是通往大夢想的開始！"
    };
    return defaults[topic] || "Goodi 隨時都在這裡支持你喔！";
};
