# Antigravity Fix Verification Guide

The backend AI logic has been updated to aggressively fallback to `gemini-1.5-pro` if the default `gemini-2.0-flash` fails for **ANY** reason (including 404, 500, or regional unavailability).

## 1. Direct Verification (Recommended)

1.  **Wait for Deployment**: Ensure the GitHub Action "Deploy to Firebase" has finished for the latest commit on the `fix/...` branch.
2.  **Refresh**: Open your Goodi App and hard refresh (Cmd+Shift+R or Ctrl+F5) to ensure you aren't using cached scripts (though the fix is backend-side).
3.  **Test**: Use the "Whisper Tree" (樹洞) feature or the Daily/Weekly report feature.
4.  **Confirm**:
    *   **Success**: You receive a warm, generated text response.
    *   **Failure**: You see the "Goodi is busy" (Goodi 有點忙碌) fallback message.

## 2. Debugging (If it still fails)

If you still see "Goodi is busy", please check the specific error:

1.  Open Chrome Developer Tools (F12 or Right Click -> Inspect).
2.  Go to the **Network** tab.
3.  Send a message in the app.
4.  Look for a network request named `generateSafeResponse` (or `generateSafeResponseV2`).
5.  Click on it and check the **Response** tab.
    *   **200 OK**: The backend executed, but the AI might have returned empty text (unlikely with fallback).
    *   **500 Internal Server Error**: Click on the "Preview" tab to see the error message. It might say "Quota exceeded" or something specific.

## 3. What Changed?

We modified `functions/src/geminiWrapper.ts` to:
- Catch **ALL** errors from `gemini-2.0-flash`.
- Automatically switch to `gemini-1.5-pro` and retry immediately.
- This bypasses any regional issues or deprecation problems with the 2.0 Flash model.
