# Bolt's Journal

## 2025-05-20 - Project Structure Confusion
**Learning:** The `Goodi-App` directory has a confusing structure with files both in the root of `Goodi-App` and in `Goodi-App/src`. `Goodi-App/src` might be an abandoned or partial refactor. The real entry point seems to be defined in `index.html`.
**Action:** Always check `index.html` to find the true entry point in Vite projects. Do not assume `src/` is the only source directory.
