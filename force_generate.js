
const admin = require('firebase-admin');
const { GoogleGenAI } = require("@google/genai");

// Initialize Admin
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'goodi-5ec49'
    });
}
const db = admin.firestore();

// AI Setup (using the same key from environment or prompt)
const GEMINI_API_KEY = "PLACEHOLDER"; // I will replace this or use env

async function generateAndStoreDailyContent(dateStr) {
    console.log(`Generating for ${dateStr}...`);
    const dateObj = new Date(dateStr);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();

    const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Generate two pieces of fun and educational content for children aged 5-12 for the date ${month}/${day}.
Return the result in Traditional Chinese (繁體中文).
1. A historical event from this day in history.
2. A fun animal trivia fact.
Output must be in JSON format with keys: "historyEvent" and "animalTrivia".
Each should be 80-120 words long.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.match(/\{[\s\S]*\}/)[0];
    const content = JSON.parse(jsonStr);

    const docRef = db.collection('dailyContent').doc(dateStr);
    await docRef.set({
        ...content,
        generatedAt: new Date().toISOString(),
        status: 'completed'
    });
    console.log(`Saved ${dateStr}`);
}

async function main() {
    const dates = ["2025-12-19", "2025-12-20"];
    for (const d of dates) {
        try {
            await generateAndStoreDailyContent(d);
        } catch (e) {
            console.error(`Failed ${d}:`, e);
        }
    }
}

main();
