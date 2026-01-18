
import { generateSafeResponse } from './index';
// Using default import for compatibility with esModuleInterop
import fft from 'firebase-functions-test';

// Initialize the test SDK
const test = fft();

async function runVerification() {
  console.log("=== Verifying Tree Hole Fix (V2 Logic) ===");

  if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠️  GEMINI_API_KEY not found in environment.");
      console.warn("   To verify with real AI, run with: GEMINI_API_KEY=your_key_here npx ts-node src/verify_treehole.ts");
      console.warn("   Without a key, the internal API call will fail, but we can verify the function structure.");
  }

  // Wrap the Cloud Function
  const wrappedFunc = test.wrap(generateSafeResponse);

  // 1. Test Safe Message
  console.log("\n--- Test 1: Safe Message ---");
  const safeData = {
    userMessage: "我今天去公園玩，好開心！",
    userNickname: "小明"
  };
  try {
    // wrappedFunc expects (data, context) for v1, or (request) for v2.
    // firebase-functions-test wrapper for V2 onCall typically takes (data, context-like-options) or constructs the request.
    // However, the types are mismatching. Let's cast it or provide a simpler mock.
    // For V2 onCall, wrappedFunc takes a CallableRequest-like object or data.
    // Let's try passing data directly with context options if supported, or constructing a mock request.

    // Attempting to pass as a Mock Request
    const resSafe = await wrappedFunc({
        data: safeData,
        auth: { uid: "test-user-123" }
    } as any);

    console.log("Input: ", safeData.userMessage);
    console.log("Response:", resSafe);

    // Check basic success structure
    if (resSafe.response) {
       console.log("✅ Passed: Safe message handled correctly.");
    } else {
       console.log("❌ Failed: Unexpected response for safe message.");
    }
  } catch (e: any) {
    console.error("❌ Error in Safe Message test:", e.message);
  }

  // 2. Test Sensitive Message (Trust Mode Trigger)
  console.log("\n--- Test 2: Sensitive Message (Checking Fix) ---");
  const sensitiveData = {
      userMessage: "我覺得很難過，沒有人喜歡我。",
      userNickname: "小明"
  };
  try {
    const resSensitive = await wrappedFunc({
        data: sensitiveData,
        auth: { uid: "test-user-123" }
    } as any);

    console.log("Input: ", sensitiveData.userMessage);
    console.log("Response:", resSensitive);

    // Verification Logic for the Fix:
    // Old Logic: needsAttention=true, response="" (EMPTY) -> User sees nothing/error
    // New Logic (V2): needsAttention=true, response="Trust Mode Message" (NOT EMPTY) -> User sees warm support

    if (resSensitive.response && resSensitive.response.length > 0) {
       console.log("✅ Passed: Sensitive message returned a response (Fix confirmed).");
       console.log(`   Needs Attention: ${resSensitive.needsAttention}`);
       console.log(`   Risk Level: ${resSensitive.riskLevel || 'N/A'}`);

       if (resSensitive.needsAttention) {
           console.log("   (Correctly identified as needing attention, but provided a response)");
       }
    } else {
       console.log("❌ Failed: Sensitive message returned empty response (Old buggy behavior).");
    }
  } catch (e: any) {
    console.error("❌ Error in Sensitive Message test:", e.message);
  }

  test.cleanup();
  console.log("\n=== Verification Complete ===");
}

runVerification();
