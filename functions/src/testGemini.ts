import { GoogleGenAI } from "@google/genai";

async function testModel(modelName: string) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found!");
        return;
    }

    console.log(`\n🔄 Testing model: ${modelName}...`);

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: modelName,
            contents: "Say 'Hello' in Traditional Chinese."
        });

        const text = response.text || (response as any).candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            console.log(`✅ ${modelName} SUCCESS! Response: ${text}`);
            return true;
        } else {
            console.error(`❌ ${modelName} returned empty text.`);
            return false;
        }

    } catch (error: any) {
        console.error(`❌ ${modelName} FAILED!`);
        console.error("Error message:", error.message);
        if (error.message.includes("429") || error.message.includes("quota")) {
            console.error("⚠️ Quota Exceeded (429) confirmed for this model.");
        }
        return false;
    }
}

async function runTests() {
    console.log("🚀 Starting Model Verification...");

    // Test the problematic one first to confirm it fails (optional, but good for verification)
    await testModel("gemini-2.0-flash");

    // Test the new default
    await testModel("gemini-1.5-flash");

    // Test the fallback
    await testModel("gemini-1.5-pro");
}

runTests();
