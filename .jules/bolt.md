## 2025-05-20 - UserContext Performance Bottleneck
**Learning:** `UserContext` provides `isPointsAnimating` in its context value. This state updates frequently (start/end animation). Because the context value object is not memoized (and even if it was, `isPointsAnimating` changes), every animation toggle causes the entire application (43 consumers) to re-render.
**Action:** In future, split high-frequency UI state (like animations) from data state (like UserData) into separate contexts to prevent unnecessary re-renders of the entire app.
