import { GoogleGenAI } from "@google/genai";

async function run() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("No API key provided");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: key });
  const model = "gemini-2.0-flash";
  const prompt = "Say hello to Goodi!";

  console.log("Testing with model:", model);

  try {
    const params: any = {
      model,
      contents: prompt // Testing string directly as per current codebase
    };

    console.log("Calling generateContent with params:", JSON.stringify(params));
    const response = await ai.models.generateContent(params);

    console.log("Response text:", response.text);
    console.log("Full response:", JSON.stringify(response, null, 2));

  } catch (error: any) {
    console.error("Error:", error);
    if (error.response) {
        console.error("Error Response:", JSON.stringify(error.response, null, 2));
    }
  }
}

run();
