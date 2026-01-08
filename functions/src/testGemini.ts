import { GoogleGenAI } from "@google/genai";

async function testBasicCall() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found!");
        return;
    }

    console.log("✅ API Key found");
    console.log("🔄 Initializing GoogleGenAI...");

    try {
        const ai = new GoogleGenAI({ apiKey });
        console.log("✅ GoogleGenAI initialized");

        console.log("🔄 Calling generateContent...");
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: "Say hello in Chinese"
        });

        console.log("✅ Response received!");
        console.log("📦 Response keys:", Object.keys(response));
        console.log("📄 Response.text type:", typeof response.text);
        console.log("📝 Response.text value:", response.text);
        console.log("🎉 Test SUCCESS!");

    } catch (error: any) {
        console.error("❌ Test FAILED!");
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
    }
}

testBasicCall();
