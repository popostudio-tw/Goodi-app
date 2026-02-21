## 2026-01-14 - Project Structure Confusion
**Learning:** The `Goodi-App` directory structure contains duplicate `App.tsx` files in both `Goodi-App/` and `Goodi-App/src/`. The active file used by `index.tsx` is `Goodi-App/App.tsx`; modifications to the `src/` version will not reflect in the built application.
**Action:** Always verify which file is actually imported by `index.tsx` or `main.tsx` before editing, especially when duplicate filenames exist.

## 2026-01-14 - Firebase Local Dev Environment
**Learning:** `UserContext` initialization fails in local development if `VITE_FIREBASE_*` environment variables are missing, even if not authenticating against real Firebase.
**Action:** Start the local server with dummy environment variables (e.g., `VITE_FIREBASE_API_KEY=dummy`) for UI verification tasks that don't require real backend connectivity.
