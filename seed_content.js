
const admin = require('firebase-admin');

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'goodi-5ec49'
    });
}
const db = admin.firestore();

async function seed() {
    const dates = ["2025-12-19", "2025-12-20"];
    const content = {
        historyEvent: "1945年12月20日，第二次世界大戰後的第一個聖誕節即將到來，世界各地的孩子們正期待著和平的慶祝活動。這是一個關於希望與重生的日子！",
        animalTrivia: "你知道嗎？恐龍 Goodi 的親戚——霸王龍，其實跑得並不像電影裡那麼快，但牠們的嗅覺可是非常靈敏的喔！就像 Goodi 能聞到小朋友進步的味道一樣！",
        generatedAt: new Date().toISOString(),
        status: 'completed'
    };

    for (const d of dates) {
        await db.collection('dailyContent').doc(d).set(content);
        console.log(`Seeded ${d}`);
    }
}

seed();
